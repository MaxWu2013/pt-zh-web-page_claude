#!/usr/bin/env python3
"""Validate that a newly-scaffolded H5 module matches the bundled template.

Paired with the `create-new-h5-module` skill. Compares a target module dir
against the canonical layout — required root files, required `src/`
subdirectories, required `src/` files — and confirms `package.json#name`
was rewritten from the template default (`h5-template`).

The template lives at `<skill>/template/`, bundled inside the skill itself
rather than read from `pt-zh-web-page/h5-template/`. That keeps the skill
self-contained and immune to upstream drift.

Usage:
    python3 validate_module.py <path/to/new/module>

Exit codes:
    0 = module looks good (template-matched)
    1 = one or more required pieces are missing
    2 = bad CLI input (path doesn't exist, etc.)

Has no third-party dependencies (stdlib only).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Top-level files expected in every H5 subproject (drawn from h5-template/).
REQUIRED_ROOT_FILES = [
    "babel.config.js",
    "hammer.yaml",
    "index.html",
    "jest.config.ts",
    "package.json",
    "README.md",
    "tsconfig.json",
    "vite.config.ts",
]

# Required `src/` subdirectories — the conventional folder split documented
# in `pt-zh-web-page/CLAUDE.md` under "Subproject File Structure".
REQUIRED_SRC_DIRS = [
    "assets",
    "common",
    "components",
    "context",
    "hooks",
    "locale",
    "native",
    "ola",
    "pages",
    "service",
]

# Required `src/` files.
REQUIRED_SRC_FILES = [
    "App.tsx",
    "main.tsx",
    "router.tsx",
    "index.scss",
]

# Convention dirs — not in h5-template/, but every mature module has them.
# When missing, the validator emits a WARNING (not a failure) — fix with
# `scaffold_module.py --complete-only`. (`hooks/ReactQuery/` is intentionally NOT here —
# the template already ships it with example hooks.)
CONVENTION_DIRS = [
    "service/dummy_data",
]

# Markers that say `service/API.ts` is still the template stub rather than
# the production mock/dispatch pattern. Warning, not failure.
TEMPLATE_API_MARKERS = ("GetSampleApi", "ExampleInfo_Request", "ExampleInfo_Response")

# Default name of the template's `package.json#name` — if the scaffolder
# didn't rewrite this, the project will collide with the template.
TEMPLATE_PACKAGE_NAME = "h5-template"


def validate(module_dir: Path) -> int:
    if not module_dir.exists():
        print(f"path does not exist: {module_dir}", file=sys.stderr)
        return 2
    if not module_dir.is_dir():
        print(f"not a directory: {module_dir}", file=sys.stderr)
        return 2

    print(f"validating module: {module_dir}")
    fail = 0
    warn = 0

    # 1) Root files.
    for fname in REQUIRED_ROOT_FILES:
        p = module_dir / fname
        if not p.is_file():
            print(f"  ✗ missing root file: {fname}")
            fail += 1

    # 2) src/ directory must exist before checking its contents.
    src = module_dir / "src"
    if not src.is_dir():
        print("  ✗ missing src/ directory")
        return 1  # nothing else we can check

    # 3) Required `src/` subdirs.
    for d in REQUIRED_SRC_DIRS:
        p = src / d
        if not p.is_dir():
            print(f"  ✗ missing src/{d}/")
            fail += 1

    # 4) Required `src/` files.
    for f in REQUIRED_SRC_FILES:
        p = src / f
        if not p.is_file():
            print(f"  ✗ missing src/{f}")
            fail += 1

    # 5) package.json#name must be rewritten from the template default.
    pkg_path = module_dir / "package.json"
    if pkg_path.is_file():
        try:
            pkg = json.loads(pkg_path.read_text())
        except json.JSONDecodeError as e:
            print(f"  ✗ package.json is not valid JSON: {e}")
            fail += 1
        else:
            name = pkg.get("name", "")
            if not name:
                print("  ✗ package.json has no `name` field")
                fail += 1
            elif name == TEMPLATE_PACKAGE_NAME:
                print(
                    f"  ✗ package.json name is still '{TEMPLATE_PACKAGE_NAME}' "
                    "(scaffolder didn't rewrite it — manual copy?)"
                )
                fail += 1
            else:
                print(f"  ✓ package.json name: {name}")

    # 6) Convention check — warnings, not failures. Run scaffold_module.py --complete-only
    #    to fix.
    for relpath in CONVENTION_DIRS:
        if not (src / relpath).is_dir():
            print(f"  ⚠ convention missing: src/{relpath}/ (run scaffold_module.py --complete-only)")
            warn += 1

    api_ts = src / "service" / "API.ts"
    if api_ts.is_file():
        api_src = api_ts.read_text()
        if any(m in api_src for m in TEMPLATE_API_MARKERS):
            print(
                "  ⚠ service/API.ts still uses the template stub "
                "(GetSampleApi/ExampleInfo_*) — run scaffold_module.py --complete-only to "
                "switch to the production mock/dispatch pattern"
            )
            warn += 1

    print()
    if fail == 0 and warn == 0:
        print("✓ module matches h5-template structure + project conventions")
        return 0
    if fail == 0:
        print(f"✓ template structure OK ({warn} convention warning(s) — fixable)")
        return 0
    print(f"✗ {fail} issue(s), {warn} warning(s)")
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate a new H5 module against h5-template.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("module_dir", help="path to the new module directory")
    args = parser.parse_args(argv)
    return validate(Path(args.module_dir))


if __name__ == "__main__":
    sys.exit(main())
