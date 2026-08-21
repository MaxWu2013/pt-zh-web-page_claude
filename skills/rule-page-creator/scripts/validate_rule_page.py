#!/usr/bin/env python3
"""Validate a titleQA rule / notice page against the skill contract.

Checks the kebab-case layout, plugin paths, locale files, and (with --build)
that a clean dist/ copy contains the same files.

Examples:
  python3 validate_rule_page.py --repo pt-zh-web-page --name my-notice
  python3 validate_rule_page.py --repo pt-zh-web-page --name my-notice --build
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
LOCALES = ("en", "zh_cn", "zh_tw")
KEY_RE = re.compile(r"^\s*([a-z0-9_]+):", re.MULTILINE)
EMPTY_VAL_RE = re.compile(r"^[ \t]*([a-z0-9_]+):\s*(?:''|\"\")", re.MULTILINE)
FROM_RE = re.compile(r"""from\s+(['"])(\./[^'"]+)\1""")
# HTML/template src="./..." — does not match `script.src = './...'` (spaces / dot).
SRC_ATTR_RE = re.compile(r"""src=(['"])(\./[^'"]+)\1""")
LOCALE_LOADER_RE = re.compile(
    r"""script\.src\s*=\s*(['"])(\./[^'"]+-locale/)\1\s*\+\s*lan"""
)


class Report:
    def __init__(self, quiet: bool = False) -> None:
        self.quiet = quiet
        self.failed = 0
        self.warned = 0

    def pass_(self, msg: str) -> None:
        if not self.quiet:
            print(f"PASS  {msg}")

    def fail(self, msg: str) -> None:
        print(f"FAIL  {msg}")
        self.failed += 1

    def warn(self, msg: str) -> None:
        print(f"WARN  {msg}")
        self.warned += 1


def die(msg: str, code: int = 1) -> int:
    print(f"error: {msg}", file=sys.stderr)
    return code


def resolve_src(repo: Path) -> Path | str:
    src = repo / "tools" / "titleQA" / "src"
    if not src.is_dir():
        return (
            f"{src} is missing. Pass --repo pointing at the pt-zh-web-page "
            f"checkout (the directory that contains tools/titleQA/src)."
        )
    return src


def strip_query(path: str) -> str:
    return path.split("?", 1)[0]


def locale_files(locale_dir: Path) -> dict[str, Path]:
    return {lang: locale_dir / f"{lang}.js" for lang in LOCALES}


def extract_keys(text: str) -> list[str]:
    return KEY_RE.findall(text)


def check_layout(src: Path, slug: str, report: Report) -> None:
    html = src / f"{slug}.html"
    locale_dir = src / f"{slug}-locale"
    problems: list[str] = []
    if not html.is_file():
        problems.append(f"missing {html}")
    if not locale_dir.is_dir():
        problems.append(f"missing locale dir {locale_dir}")
    else:
        found_js = sorted(p.name for p in locale_dir.iterdir() if p.suffix == ".js")
        expected = [f"{lang}.js" for lang in LOCALES]
        if found_js != expected:
            problems.append(
                f"{locale_dir} should contain exactly {', '.join(expected)}; "
                f"found: {', '.join(found_js) or '(none)'}"
            )
        else:
            for lang, path in locale_files(locale_dir).items():
                if not path.is_file():
                    problems.append(f"missing {path}")
    if problems:
        report.fail("(1) page files: " + "; ".join(problems))
    else:
        report.pass_(
            f"(1) {slug}.html exists; {slug}-locale/ has en.js, zh_cn.js, zh_tw.js"
        )


def check_nested_dir(src: Path, slug: str, report: Report) -> None:
    snake = src / slug.replace("-", "_")
    if snake.is_dir():
        report.fail(
            f"(2) deprecated nested directory exists: {snake} "
            "(kebab-case src/<name>.html is required)"
        )
    else:
        report.pass_(f"(2) no deprecated nested directory {snake.name}/")


def check_plugin_prefix(page_text: str, report: Report) -> None:
    if "../plugin/" in page_text:
        report.fail("(3) page contains '../plugin/' (must be './plugin/')")
    else:
        report.pass_("(3) no '../plugin/' references")


def iter_local_refs(page_text: str) -> list[tuple[str, str]]:
    refs: list[tuple[str, str]] = []
    for match in FROM_RE.finditer(page_text):
        refs.append(("import", strip_query(match.group(2))))
    for match in SRC_ATTR_RE.finditer(page_text):
        raw = match.group(2)
        if "${" in raw:
            continue
        refs.append(("src", strip_query(raw)))
    return refs


def resolve_ref(root: Path, rel: str) -> Path:
    return (root / rel).resolve()


def check_local_refs(
    page_text: str, root: Path, slug: str, report: Report, label: str
) -> None:
    missing: list[str] = []
    seen: set[str] = set()
    for kind, rel in iter_local_refs(page_text):
        if rel in seen:
            continue
        seen.add(rel)
        target = resolve_ref(root, rel)
        if not target.is_file():
            missing.append(f"{kind} {rel} -> {target}")

    loader = LOCALE_LOADER_RE.search(page_text)
    if loader is None:
        missing.append(
            "locale loader not found (expected script.src = './"
            f"{slug}-locale/' + lan + '.js')"
        )
    else:
        prefix = loader.group(2)
        expected_prefix = f"./{slug}-locale/"
        if prefix != expected_prefix:
            missing.append(
                f"locale loader prefix is {prefix!r}, expected {expected_prefix!r}"
            )
        for lang in LOCALES:
            rel = f"{prefix}{lang}.js"
            target = resolve_ref(root, rel)
            if not target.is_file():
                missing.append(f"locale {rel} -> {target}")

    tag = f"(4) local refs resolve under {label}"
    if missing:
        report.fail(f"{tag}: " + "; ".join(missing))
    else:
        report.pass_(tag)


def check_node_syntax(locale_dir: Path, report: Report) -> None:
    node = shutil.which("node")
    if node is None:
        report.warn("(5) node not on PATH; skipped syntax check")
        return
    failures: list[str] = []
    for lang, path in locale_files(locale_dir).items():
        if not path.is_file():
            failures.append(f"{lang}.js missing")
            continue
        proc = subprocess.run(
            [node, "--check", str(path)],
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout).strip() or f"exit {proc.returncode}"
            failures.append(f"{path.name}: {err}")
    if failures:
        report.fail("(5) node --check failed: " + "; ".join(failures))
    else:
        report.pass_("(5) all three locale files pass node --check")


def check_locale_keys(locale_dir: Path, report: Report) -> None:
    per_file: dict[str, list[str]] = {}
    for lang, path in locale_files(locale_dir).items():
        if not path.is_file():
            report.fail(f"(6) cannot read {path} to compare keys")
            return
        per_file[lang] = extract_keys(path.read_text(encoding="utf-8"))

    sets = {lang: set(keys) for lang, keys in per_file.items()}
    union = set().union(*sets.values()) if sets else set()
    problems: list[str] = []
    for lang, keyset in sets.items():
        missing = sorted(union - keyset)
        if missing:
            problems.append(f"{lang}.js missing {', '.join(missing)}")
    if problems:
        report.fail("(6) locale key sets differ: " + "; ".join(problems))
    else:
        report.pass_("(6) locale files declare identical key sets")


def check_body_id(page_text: str, report: Report) -> None:
    loads_dark = bool(re.search(r"plugin/dark-mode\.js", page_text))
    if not loads_dark:
        report.pass_("(7) dark-mode.js not loaded (body id not required)")
        return
    if re.search(r"<body\b[^>]*\bid=['\"]body['\"]", page_text):
        report.pass_("(7) dark-mode.js loaded and <body id=\"body\"> is present")
    else:
        report.fail(
            "(7) page loads plugin/dark-mode.js but <body> has no id=\"body\""
        )


def check_empty_values(locale_dir: Path, report: Report) -> None:
    unfinished: list[str] = []
    for lang, path in locale_files(locale_dir).items():
        if not path.is_file():
            continue
        empty = EMPTY_VAL_RE.findall(path.read_text(encoding="utf-8"))
        if empty:
            unfinished.append(f"{lang}.js ({', '.join(empty)})")
    if unfinished:
        report.warn("(8) unfinished locale values: " + "; ".join(unfinished))
    else:
        report.pass_("(8) no empty locale string values")


def run_build(titleqa: Path, report: Report) -> bool:
    dist = titleqa / "dist"
    try:
        if dist.exists():
            shutil.rmtree(dist)
    except OSError as exc:
        report.fail(f"(9) could not clear dist/: {exc}")
        return False
    pnpm = shutil.which("pnpm")
    if pnpm is None:
        report.fail("(9) pnpm not on PATH; cannot --build")
        return False
    proc = subprocess.run(
        [pnpm, "build"],
        cwd=str(titleqa),
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout).strip() or f"exit {proc.returncode}"
        report.fail(f"(9) pnpm build failed: {err}")
        return False
    report.pass_("(9a) pnpm build succeeded after clearing dist/")
    return True


def check_dist(
    dist: Path, src_page_text: str, slug: str, report: Report
) -> None:
    html = dist / f"{slug}.html"
    locale_dir = dist / f"{slug}-locale"
    problems: list[str] = []
    if not html.is_file():
        problems.append(f"missing {html}")
    for lang in LOCALES:
        path = locale_dir / f"{lang}.js"
        if not path.is_file():
            problems.append(f"missing {path}")
    if problems:
        report.fail("(9b) dist layout: " + "; ".join(problems))
    else:
        report.pass_(
            f"(9b) dist/{slug}.html and dist/{slug}-locale/"
            "{en,zh_cn,zh_tw}.js exist"
        )

    if html.is_file():
        page_text = html.read_text(encoding="utf-8")
    else:
        page_text = src_page_text
    check_local_refs(page_text, dist, slug, report, "dist/")

    snake = slug.replace("-", "_")
    survivors: list[str] = []
    if dist.is_dir():
        for path in dist.rglob("*"):
            rel = path.relative_to(dist)
            if snake in rel.parts or snake in path.name:
                survivors.append(str(rel))
    if survivors:
        report.fail(
            "(9d) dist still contains snake_case path(s): "
            + ", ".join(survivors)
        )
    else:
        report.pass_(f"(9d) no dist path contains {snake!r}")


def validate(repo: Path, slug: str, *, do_build: bool, quiet: bool) -> int:
    src = resolve_src(repo)
    if isinstance(src, str):
        return die(src)

    report = Report(quiet=quiet)
    html_path = src / f"{slug}.html"
    locale_dir = src / f"{slug}-locale"
    page_text = html_path.read_text(encoding="utf-8") if html_path.is_file() else ""

    check_layout(src, slug, report)
    check_nested_dir(src, slug, report)
    if page_text:
        check_plugin_prefix(page_text, report)
        check_local_refs(page_text, src, slug, report, "src/")
    else:
        report.fail("(3) skipped — page html missing")
        report.fail("(4) skipped — page html missing")
    check_node_syntax(locale_dir, report)
    check_locale_keys(locale_dir, report)
    if page_text:
        check_body_id(page_text, report)
    else:
        report.fail("(7) skipped — page html missing")
    check_empty_values(locale_dir, report)

    if do_build:
        titleqa = src.parent
        if run_build(titleqa, report):
            check_dist(titleqa / "dist", page_text, slug, report)

    print()
    if report.failed:
        print(f"FAILED  {report.failed} check(s), {report.warned} warning(s)")
        return 1
    print(f"OK  all checks passed ({report.warned} warning(s))")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate a titleQA rule page: kebab-case layout, ./plugin/ imports, "
            "locale key parity, and optional dist/ copy."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--repo",
        default="pt-zh-web-page",
        help=(
            "path to the pt-zh-web-page checkout (default: pt-zh-web-page "
            "relative to cwd)"
        ),
    )
    parser.add_argument(
        "--name",
        required=True,
        metavar="SLUG",
        help="kebab-case page slug to validate",
    )
    parser.add_argument(
        "--build",
        action="store_true",
        help=(
            "clear tools/titleQA/dist, run pnpm build, and repeat path checks "
            "against dist/"
        ),
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="print only FAIL/WARN lines and the final summary",
    )
    args = parser.parse_args(argv)

    if not SLUG_RE.fullmatch(args.name):
        return die(
            f"name {args.name!r} is not kebab-case "
            "(required pattern ^[a-z0-9]+(-[a-z0-9]+)*$)"
        )

    repo = Path(args.repo).expanduser().resolve()
    return validate(repo, args.name, do_build=args.build, quiet=args.quiet)


if __name__ == "__main__":
    sys.exit(main())
