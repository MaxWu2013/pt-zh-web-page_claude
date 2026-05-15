#!/usr/bin/env python3
"""Scaffold a new H5 module from the bundled template and apply conventions.

Replaces the previous `make create-page` / `pnpm create-page` workflow with a
pure-stdlib Python script. The template is bundled in the skill itself
(`<skill>/template/`), so this script does NOT read from the upstream
`pt-zh-web-page/h5-template/` directory — it's fully self-contained and
won't drift if upstream changes.

What it does (in one call):
  1. Copies `<skill>/template/` → `pt-zh-web-page/<parent>/<base>/`
  2. Rewrites `<new>/package.json#name` from `"h5-template"` to
     `"<parent>-<base>"` (slashes → dashes, e.g. `tools/hello-world` →
     `tools-hello-world`)
  3. Applies project conventions that `h5-template/` doesn't ship with:
       - creates `src/service/dummy_data/` (with a README)
       - rewrites `src/service/API.ts` from the toy `GetSampleApi` example to
         the production "mock-or-real dispatch" pattern
       - deletes `src/hooks/ReactQuery/useSampleReq.ts` (orphaned sample hook
         that would break compilation against the new API.ts)

Refuses to overwrite an existing target directory.

Usage:
    # Full scaffold (most common):
    python3 scaffold_module.py <parent>/<base>
    python3 scaffold_module.py tools/hello-world
    python3 scaffold_module.py act/my-event --dry-run

    # Apply conventions only, to an existing module scaffolded the legacy way:
    python3 scaffold_module.py --complete-only pt-zh-web-page/tools/legacy-mod

Exit codes:
    0 = success (or dry-run preview)
    1 = bad name / target already exists / source module missing
    2 = environment broken (not in repo / template missing)
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

REPO_NAME = "pt-zh-web-page"
ALLOWED_PARENTS = ("tools", "act", "h5")

# Bundled template lives next to this script (../template/ relative to scripts/).
SCRIPT_DIR = Path(__file__).resolve().parent
BUNDLED_TEMPLATE = SCRIPT_DIR.parent / "template"
NAME_PATTERN = re.compile(r"^[a-z][a-z0-9-]*$")
TEMPLATE_PACKAGE_NAME = "h5-template"

# Patterns excluded when copying — avoids dragging junk if the template ever
# gets polluted. `node_modules/` is the main concern; `.DS_Store` and editor
# crud are belt-and-braces.
EXCLUDE_GLOBS = ("node_modules", ".DS_Store", ".vite", "dist", "build")

# Production API.ts pattern — mock dispatch on localhost, real request
# otherwise. Mirrors newbie-jump-rewards/src/service/API.ts but with generic
# placeholders the user fills in once their proto is ready. The header
# walks through every wiring step the developer still has to do.
API_TS_TEMPLATE = """/* eslint-disable */
/* ──────────────────────────────────────────────────────────────────────────
 * API.ts — module entrypoint for backend calls.
 *
 * This file ships as a compile-clean PLACEHOLDER. To turn it into a real
 * module API, walk through the steps below in order.
 *
 * ── 1. Write your proto ────────────────────────────────────────────────────
 * Create `src/service/<module>.proto` (replace <module> with your real
 * module slug). Define each request/response message your backend expects.
 *
 * ── 2. Generate types + mocks + ReactQuery hooks from the proto ────────────
 * From the monorepo root (pt-zh-web-page/), run:
 *
 *     make generate-initial project=<parent>/<base>
 *
 * That alias runs four things:
 *     make protoc-gen          → src/service/<module>.ts (types)
 *     make generate-mock       → mocks
 *     make generate-api        → API client
 *     make generate-react-query → ReactQuery hook scaffolds
 *
 * ── 3. Wire the generated types into this file ─────────────────────────────
 * Uncomment + adjust the imports below; replace `unknown` in the return
 * type with the actual response type (e.g. HomeInfoResponse).
 *
 * ── 4. Add local mock data (optional but recommended) ──────────────────────
 * Create `src/service/dummy_data/homeInfo.ts` that `export default`s a
 * value matching the response shape — see dummy_data/README.md. The
 * `isMock` branch below will use it automatically on localhost.
 *
 * ── 5. Wire a ReactQuery hook ──────────────────────────────────────────────
 * Add an entry to `src/hooks/ReactQuery/queryKeys.ts`:
 *     HomeInfo: ['HomeInfo'],
 * Then write `src/hooks/ReactQuery/useHomeInfo.ts`:
 *     import { useQuery } from '@tanstack/react-query';
 *     import queryKeys from '/src/hooks/ReactQuery/queryKeys';
 *     import { GetHomeInfo } from '/src/service/API';
 *     export function useHomeInfo() {
 *         return useQuery(queryKeys.HomeInfo, GetHomeInfo, {
 *             select: (res) => res.data,
 *         });
 *     }
 * Reference implementation: tools/newbie-jump-rewards/src/hooks/ReactQuery/
 * useHomeInfo.ts (also shows an optimistic-update mutation).
 *
 * ── 6. Add more endpoints ──────────────────────────────────────────────────
 * Duplicate the `GetHomeInfo` function for each additional endpoint. Keep
 * the mock-or-real dispatch pattern.
 * ────────────────────────────────────────────────────────────────────────── */

import { getQuery } from '@ola/utils';
import ola from '../ola';
import { request } from '/src/service/instance';
// Step 3 — uncomment + rename once `<module>.ts` exists:
// import type { HomeInfoResponse } from '/src/service/<module>';
// Step 4 — uncomment once you have local mock data:
// import dummyHomeInfo from '/src/service/dummy_data/homeInfo';

const Lan = getQuery('lan');
const isMock = window.location.hostname.includes('localhost');

// Step 1 — replace `<module>` with the real backend path your team owns.
const BASE_URL = '/go/activity/<module>';

// Step 3 — replace `unknown` with the proto-generated response type, e.g.
//     export function GetHomeInfo(): Promise<HomeInfoResponse> { ... }
export function GetHomeInfo(): Promise<unknown> {
\tif (isMock) {
\t\t// Step 4 — swap the empty data object for the imported `dummyHomeInfo`.
\t\treturn Promise.resolve({ success: true, msg: '', data: {} });
\t}
\treturn request({
\t\tmethod: 'post',
\t\turl: `${BASE_URL}/home-info`,
\t\tdata: {},
\t\theaders: {
\t\t\t'user-token': ola.user.token,
\t\t\t'User-Language': Lan || ola.user.lan,
\t\t},
\t});
}
"""

DUMMY_DATA_README = """# dummy_data/

Local-dev fallback data, consumed by `src/service/API.ts` when
`window.location.hostname` contains `localhost`. Lets the page run
without a real backend during development and previews.

## How it fits together

```
API.ts                  hooks/ReactQuery/useXxx.ts        pages/Xxx.tsx
   ↑                              ↓
   ├── if isMock → dummy_data/xxx.ts (default export)
   └── if !isMock → request(...) hits BASE_URL
```

## Adding a new mock

1. Create one file per response shape, e.g. `homeInfo.ts`, `rewardList.ts`.
2. `export default` a value matching the proto-generated response type.
3. Import it in `service/API.ts` and reference it inside the `if (isMock)`
   branch of the corresponding function.

## Example

After running `make generate-initial project=<parent>/<base>`,
proto-generated types are available under `src/service/<module>.ts`.
Build the mock against them:

```ts
import type { HomeInfoResponse } from '/src/service/<module>';

const dummyHomeInfo: HomeInfoResponse['data'] = {
\t// ...fields matching the proto definition
};

export default dummyHomeInfo;
```

Then in `service/API.ts`:

```ts
import dummyHomeInfo from '/src/service/dummy_data/homeInfo';

export function GetHomeInfo(): Promise<HomeInfoResponse> {
\tif (isMock) {
\t\treturn Promise.resolve({ success: true, msg: '', data: dummyHomeInfo });
\t}
\t// ...real request
}
```

Reference: `tools/newbie-jump-rewards/src/service/dummy_data/homeInfo.ts`.
"""

# Markers in scaffolded API.ts that tell us it's still the template stub
# (rather than something the user already customized).
TEMPLATE_API_MARKERS = ("GetSampleApi", "ExampleInfo_Request", "ExampleInfo_Response")


# --- Helpers ---------------------------------------------------------------


def find_pt_zh_web_page(start: Path) -> Path | None:
    """Walk up from `start` looking for the pt-zh-web-page directory. The
    template no longer lives there (it's bundled with this skill), but we
    still need the repo path as the destination root for the new module.
    Recognised by having `tools/`, `act/`, and `h5/` as subdirectories
    (the three parents this skill recognises)."""
    cur = start.resolve()
    for p in (cur, *cur.parents):
        if p.name == REPO_NAME and all((p / d).is_dir() for d in ALLOWED_PARENTS):
            return p
        candidate = p / REPO_NAME
        if candidate.is_dir() and all(
            (candidate / d).is_dir() for d in ALLOWED_PARENTS
        ):
            return candidate
    return None


def parse_name(spec: str) -> tuple[str, str] | str:
    """Split `tools/hello-world` into (`tools`, `hello-world`).

    Returns an error message (str) on failure, or a (parent, base) tuple
    on success.
    """
    if "/" not in spec:
        return (
            f"name must be in the form <parent>/<base>, got {spec!r}. "
            f"Pick a parent from {ALLOWED_PARENTS}, e.g. tools/hello-world."
        )
    parent, _, base = spec.partition("/")
    if "/" in base:
        return f"only one '/' allowed in name (got {spec!r})"
    if parent not in ALLOWED_PARENTS:
        return (
            f"parent dir must be one of {ALLOWED_PARENTS} (got: {parent!r}). "
            "tools/ for persistent features, act/ for time-limited activities, "
            "h5/ for shared assets."
        )
    if not NAME_PATTERN.fullmatch(base):
        return (
            f"name {base!r} must be kebab-case: lowercase letters, digits, and "
            "hyphens, must start with a letter. No underscores, uppercase, or "
            "Chinese characters."
        )
    return (parent, base)


def copy_template(src: Path, dst: Path, dry_run: bool) -> int:
    """Copy `src` → `dst`, skipping EXCLUDE_GLOBS. Returns file count copied."""

    def ignore(_dir: str, names: list[str]) -> list[str]:
        return [n for n in names if n in EXCLUDE_GLOBS]

    if dry_run:
        count = 0
        for entry in src.rglob("*"):
            rel = entry.relative_to(src)
            if any(part in EXCLUDE_GLOBS for part in rel.parts):
                continue
            if entry.is_file():
                count += 1
        return count

    shutil.copytree(src, dst, ignore=ignore, dirs_exist_ok=False)
    return sum(1 for _ in dst.rglob("*") if _.is_file())


def rewrite_package_name(pkg_path: Path, new_name: str, dry_run: bool) -> str:
    """Rewrite `package.json#name`. Returns the OLD name for reporting."""
    if not pkg_path.is_file():
        return ""
    text = pkg_path.read_text()
    data = json.loads(text)
    old_name = data.get("name", "")
    data["name"] = new_name
    if not dry_run:
        # Preserve the template's indentation style (tabs vs. spaces).
        indent = "\t" if text.startswith("{\n\t") else 2
        out = json.dumps(data, indent=indent, ensure_ascii=False)
        if text.endswith("\n"):
            out += "\n"
        pkg_path.write_text(out)
    return old_name


def apply_conventions(module_dir: Path, dry_run: bool) -> int:
    """Bring an h5-template scaffold up to the conventions used by mature
    modules (e.g. newbie-jump-rewards):

    - creates `src/service/dummy_data/` with a README
    - rewrites `src/service/API.ts` from the toy `GetSampleApi` example to
      the production "mock-or-real dispatch" pattern
    - deletes `src/hooks/ReactQuery/useSampleReq.ts` (orphaned sample that
      depends on the removed API)

    Idempotent — running twice does nothing on the second pass.
    """
    src = module_dir / "src"
    if not src.is_dir():
        print(f"  ⚠ no src/ under {module_dir} — skipping conventions")
        return 0

    dummy = src / "service" / "dummy_data"
    api_ts = src / "service" / "API.ts"
    sample_hook = src / "hooks" / "ReactQuery" / "useSampleReq.ts"

    actions: list[tuple[str, Path, str]] = []

    if not dummy.exists():
        actions.append(("mkdir", dummy, DUMMY_DATA_README))

    rewriting_api = False
    if api_ts.is_file():
        if any(m in api_ts.read_text() for m in TEMPLATE_API_MARKERS):
            actions.append(("rewrite", api_ts, API_TS_TEMPLATE))
            rewriting_api = True
    else:
        actions.append(("write", api_ts, API_TS_TEMPLATE))
        rewriting_api = True

    # If we're rewriting API.ts, the template's `useSampleReq.ts` (which
    # imports `GetSampleApi`) will fail to compile — drop it.
    if rewriting_api and sample_hook.is_file():
        actions.append(("delete", sample_hook, ""))

    if not actions:
        print("  (conventions already applied — nothing to do)")
        return 0

    for kind, path, content in actions:
        rel = path.relative_to(module_dir)
        if kind == "mkdir":
            print(f"  + create dir: {rel}/")
            if not dry_run:
                path.mkdir(parents=True, exist_ok=True)
                (path / "README.md").write_text(content)
        elif kind == "rewrite":
            print(f"  ~ rewrite:    {rel}")
            if not dry_run:
                path.write_text(content)
        elif kind == "write":
            print(f"  + create:     {rel}")
            if not dry_run:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
        elif kind == "delete":
            print(f"  - delete:     {rel} (depends on removed API.ts)")
            if not dry_run:
                path.unlink()

    return len(actions)


# --- Modes ---------------------------------------------------------------


def cmd_scaffold(spec: str, dry_run: bool) -> int:
    parsed = parse_name(spec)
    if isinstance(parsed, str):
        print(f"error: {parsed}", file=sys.stderr)
        return 1
    parent, base = parsed

    if not BUNDLED_TEMPLATE.is_dir():
        print(
            f"error: bundled template missing at {BUNDLED_TEMPLATE}. "
            "The skill should include a `template/` directory next to `scripts/`.",
            file=sys.stderr,
        )
        return 2

    repo = find_pt_zh_web_page(Path.cwd())
    if repo is None:
        print(
            f"error: could not locate the pt-zh-web-page repo from {Path.cwd()}. "
            f"Run from inside the H5 monorepo (must contain {ALLOWED_PARENTS}).",
            file=sys.stderr,
        )
        return 2

    target = repo / parent / base

    print(f"template: {BUNDLED_TEMPLATE} (bundled)")
    print(f"repo:     {repo}")
    print(f"target:   {target.relative_to(repo)}/")

    if target.exists():
        print(
            f"\nerror: target already exists — refusing to overwrite. "
            f"Remove {target} first or pick a different name.",
            file=sys.stderr,
        )
        return 1

    new_pkg_name = f"{parent}-{base}"
    print(f"new package.json name: {new_pkg_name}")
    print()

    print("[1/3] copying template")
    file_count = copy_template(BUNDLED_TEMPLATE, target, dry_run)
    verb = "would copy" if dry_run else "copied"
    print(f"  {verb} {file_count} file(s)")

    print("\n[2/3] rewriting package.json#name")
    if dry_run:
        try:
            old = json.loads(
                (BUNDLED_TEMPLATE / "package.json").read_text()
            ).get("name", "?")
        except Exception:
            old = "?"
        print(f"  would rewrite: {old!r} → {new_pkg_name!r}")
    else:
        old = rewrite_package_name(target / "package.json", new_pkg_name, dry_run=False)
        print(f"  rewrote:  {old!r} → {new_pkg_name!r}")

    print("\n[3/3] applying project conventions")
    if dry_run:
        # Can't introspect a non-existent target in dry-run, so describe what
        # the apply step would do at full effort.
        print("  + create dir: src/service/dummy_data/")
        print("  ~ rewrite:    src/service/API.ts")
        print("  - delete:     src/hooks/ReactQuery/useSampleReq.ts")
    else:
        apply_conventions(target, dry_run=False)

    if dry_run:
        print("\n(dry-run — nothing written)")
    else:
        print(f"\n✓ scaffolded {parent}/{base}")
        print("  next: validate, then run dev server")
        print(
            f"    python3 .claude/skills/create-new-h5-module/scripts/"
            f"validate_module.py pt-zh-web-page/{parent}/{base}"
        )
        print(f"    cd pt-zh-web-page/{parent}/{base} && pnpm install && pnpm run dev")
    return 0


def cmd_complete_only(module_path: str, dry_run: bool) -> int:
    module = Path(module_path).resolve()
    if not module.exists():
        print(f"error: path does not exist: {module}", file=sys.stderr)
        return 1
    if not module.is_dir():
        print(f"error: not a directory: {module}", file=sys.stderr)
        return 1
    print(f"applying conventions to: {module}")
    changed = apply_conventions(module, dry_run=dry_run)
    if dry_run:
        print(f"\n(dry-run — {changed} change(s) NOT applied)")
    elif changed:
        print(f"\n✓ applied {changed} convention change(s)")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Scaffold a new H5 module from h5-template/ + apply conventions.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "name",
        nargs="?",
        help="<parent>/<base> — parent is one of "
        + "/".join(ALLOWED_PARENTS)
        + ". Omit when using --complete-only.",
    )
    parser.add_argument(
        "--complete-only",
        metavar="MODULE_PATH",
        help="skip scaffolding, just apply conventions to an existing module dir",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="show what would happen without writing anything",
    )
    args = parser.parse_args(argv)

    if args.complete_only:
        if args.name:
            print(
                "error: pass either <parent>/<base> OR --complete-only, not both",
                file=sys.stderr,
            )
            return 1
        return cmd_complete_only(args.complete_only, args.dry_run)

    if not args.name:
        parser.error("provide <parent>/<base>, or use --complete-only <path>")
    return cmd_scaffold(args.name, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
