#!/usr/bin/env python3
"""Scaffold a titleQA rule / notice page from the bundled skill template.

Writes a kebab-case HTML page at tools/titleQA/src/<name>.html, a sibling
<name>-locale/{en,zh_cn,zh_tw}.js trio, and (optionally) src/imgs/<name>/.

The source layout *is* the URL layout — there is no bundler — so this
script refuses snake_case names and the deprecated nested-directory shape.

Examples:
  python3 scaffold_rule_page.py --name my-notice --dry-run
  python3 scaffold_rule_page.py --repo pt-zh-web-page --name my-notice \\
      --sections declaration,size --close-button --with-image \\
      --title '审核须知'
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
TEMPLATE_DIR = SKILL_DIR / "template"

SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SECTION_RE = re.compile(r"^[a-z][a-z0-9_]*$")
DEFAULT_SECTIONS = "declaration,upload_count,size"
LOCALES = ("en", "zh_cn", "zh_tw")

# 1x1 transparent PNG. Used only when --with-image is set and the canonical
# sample asset is missing from the titleQA checkout, so the template <img>
# src resolves for the validator.
MINIMAL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

# When a marker is the only non-whitespace on its line, consume the indent and
# trailing newline so removal cannot leave a whitespace-only line. Inline
# markers (e.g. import { …/*#IF CLOSE_BUTTON*/, navigateBack/*#ENDIF*/ }) still
# splice in place because ^ / trailing-newline branches fail mid-line.
FOREACH_HTML_RE = re.compile(
    r"(?:^[ \t]*)?<!--#FOREACH\s+SECTION\s*-->(?:[ \t]*\n)?(.*?)(?:^[ \t]*)?<!--#ENDFOREACH\s*-->(?:[ \t]*\n)?",
    re.DOTALL | re.MULTILINE,
)
FOREACH_LINE_RE = re.compile(
    r"(?m)^[ \t]*//#FOREACH\s+SECTION[ \t]*\n(.*?)^[ \t]*//#ENDFOREACH[ \t]*\n?",
    re.DOTALL,
)
IF_HTML_RE = re.compile(
    r"(?:^([ \t]*\n))?(?:^[ \t]*)?<!--#IF\s+(!?)([A-Z][A-Z0-9_]*)\s*-->(?:[ \t]*\n)?(.*?)(?:^[ \t]*)?<!--#ENDIF\s*-->(?:[ \t]*\n)?",
    re.DOTALL | re.MULTILINE,
)
IF_BLOCK_RE = re.compile(
    r"(?:^([ \t]*\n))?(?:^[ \t]*)?/\*#IF\s+(!?)([A-Z][A-Z0-9_]*)\s*\*/(?:[ \t]*\n)?(.*?)(?:^[ \t]*)?/\*#ENDIF\s*\*/(?:[ \t]*\n)?",
    re.DOTALL | re.MULTILINE,
)
LINE_IF_RE = re.compile(
    r"^([ \t]*)//#IF\s+(!?)([A-Z][A-Z0-9_]*)[ \t]*(.*)$"
)
LEFTOVER_MARKERS = (
    "<!--#IF",
    "<!--#ENDIF",
    "<!--#FOREACH",
    "<!--#ENDFOREACH",
    "/*#IF",
    "/*#ENDIF",
    "//#IF",
    "//#FOREACH",
    "//#ENDFOREACH",
    "__PAGE_SLUG__",
    "__SECTION_KEY__",
    "__DOCUMENT_TITLE__",
    "__TITLE__",
)


def die(msg: str, code: int = 1) -> int:
    print(f"error: {msg}", file=sys.stderr)
    return code


def parse_sections(raw: str) -> list[str] | str:
    keys = [part.strip() for part in raw.split(",")]
    if not keys or any(not k for k in keys):
        return f"invalid --sections {raw!r}: empty key"
    seen: set[str] = set()
    for key in keys:
        if not SECTION_RE.fullmatch(key):
            return (
                f"section key {key!r} is invalid. Each --sections value must "
                f"be snake_case matching ^[a-z][a-z0-9_]*$ "
                f"(e.g. declaration,upload_count,size)."
            )
        if key in seen:
            return f"duplicate section key {key!r}"
        seen.add(key)
    return keys


def validate_slug(name: str) -> str | None:
    if SLUG_RE.fullmatch(name):
        return None
    extra = ""
    if "_" in name:
        extra = (
            " Underscores mean snake_case, which is the deprecated nested "
            "layout (src/<name>/index.html) — kebab-case with hyphens is required."
        )
    elif any(c.isupper() for c in name):
        extra = " CamelCase / uppercase letters are not allowed."
    return (
        f"name {name!r} is not kebab-case. titleQA page slugs must match "
        f"^[a-z0-9]+(-[a-z0-9]+)*$ (e.g. room-background-image-upload).{extra}"
    )


def resolve_src(repo: Path) -> Path | str:
    src = repo / "tools" / "titleQA" / "src"
    if not src.is_dir():
        return (
            f"{src} is missing. Pass --repo pointing at the pt-zh-web-page "
            f"checkout (the directory that contains tools/titleQA/src)."
        )
    return src


def js_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")


def expand_foreach(inner: str, sections: list[str]) -> str:
    leading_nl = inner.startswith("\n")
    trailing_nl = inner.endswith("\n")
    core = inner[1:] if leading_nl else inner
    if trailing_nl:
        core = core[:-1]
    copies = [core.replace("__SECTION_KEY__", key) for key in sections]
    out = "\n".join(copies)
    if leading_nl:
        out = "\n" + out
    if trailing_nl:
        out = out + "\n"
    return out


def process_foreach(text: str, sections: list[str]) -> str:
    def _html(match: re.Match[str]) -> str:
        return expand_foreach(match.group(1), sections)

    def _line(match: re.Match[str]) -> str:
        return expand_foreach(match.group(1), sections)

    text = FOREACH_HTML_RE.sub(_html, text)
    text = FOREACH_LINE_RE.sub(_line, text)
    return text


def flag_enabled(neg: str, flag: str, enabled: set[str]) -> bool:
    is_on = flag in enabled
    return (not is_on) if neg == "!" else is_on


def process_block_ifs(text: str, enabled: set[str]) -> str:
    def _sub(match: re.Match[str]) -> str:
        pre, neg, flag, body = match.group(1), match.group(2), match.group(3), match.group(4)
        if flag_enabled(neg, flag, enabled):
            return (pre or "") + body
        return ""

    text = IF_HTML_RE.sub(_sub, text)
    text = IF_BLOCK_RE.sub(_sub, text)
    return text


def process_line_ifs(text: str, enabled: set[str]) -> str:
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    while i < len(lines):
        raw = lines[i]
        stripped = raw.rstrip("\r\n")
        newline = raw[len(stripped) :]
        match = LINE_IF_RE.match(stripped)
        if not match:
            out.append(raw)
            i += 1
            continue
        _indent, neg, flag, rest = match.groups()
        keep = flag_enabled(neg, flag, enabled)
        if rest.strip():
            if keep:
                out.append(rest + newline)
            i += 1
            continue
        i += 1
        if i < len(lines):
            if keep:
                out.append(lines[i])
            i += 1
    return "".join(out)


def leftover_markers(text: str) -> list[str]:
    return [token for token in LEFTOVER_MARKERS if token in text]


def render_text(
    text: str,
    *,
    slug: str,
    title: str,
    sections: list[str],
    enabled: set[str],
) -> str:
    text = process_foreach(text, sections)
    text = process_block_ifs(text, enabled)
    text = process_line_ifs(text, enabled)
    text = text.replace("__PAGE_SLUG__", slug)
    escaped = js_escape(title)
    text = text.replace("__DOCUMENT_TITLE__", escaped)
    text = text.replace("__TITLE__", escaped)
    leftover = leftover_markers(text)
    if leftover:
        raise RuntimeError(
            "template render left unprocessed markers: " + ", ".join(leftover)
        )
    return text


def render_page(slug: str, title: str, sections: list[str], enabled: set[str]) -> str:
    path = TEMPLATE_DIR / "page.html"
    if not path.is_file():
        raise FileNotFoundError(f"bundled template missing: {path}")
    return render_text(
        path.read_text(encoding="utf-8"),
        slug=slug,
        title=title,
        sections=sections,
        enabled=enabled,
    )


def render_locale(
    lang: str, slug: str, title: str, sections: list[str], enabled: set[str]
) -> str:
    path = TEMPLATE_DIR / "locale" / f"{lang}.js"
    if not path.is_file():
        raise FileNotFoundError(f"bundled locale template missing: {path}")
    return render_text(
        path.read_text(encoding="utf-8"),
        slug=slug,
        title=title,
        sections=sections,
        enabled=enabled,
    )


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)


def planned_paths(
    src: Path, slug: str, close_button: bool, with_image: bool
) -> list[Path]:
    paths = [src / f"{slug}.html"]
    locale_dir = src / f"{slug}-locale"
    paths.extend(locale_dir / f"{lang}.js" for lang in LOCALES)
    if close_button or with_image:
        img_dir = src / "imgs" / slug
        paths.append(img_dir / ".gitkeep")
        if close_button:
            paths.append(img_dir / "icon_close.svg")
        if with_image:
            paths.append(img_dir / "bg-size-sample.png")
    return paths


def ensure_images(
    src: Path,
    slug: str,
    *,
    close_button: bool,
    with_image: bool,
    dry_run: bool,
) -> list[str]:
    notes: list[str] = []
    if not (close_button or with_image):
        return notes
    img_dir = src / "imgs" / slug
    canonical = src / "imgs" / "room-background-image-upload"
    if not dry_run:
        img_dir.mkdir(parents=True, exist_ok=True)
        (img_dir / ".gitkeep").write_text("", encoding="utf-8")

    if close_button:
        close_src = canonical / "icon_close.svg"
        close_dst = img_dir / "icon_close.svg"
        if close_src.is_file():
            if not dry_run:
                shutil.copy2(close_src, close_dst)
        else:
            notes.append(
                f"warning: {close_src} not found — add icon_close.svg to "
                f"{img_dir} yourself"
            )

    if with_image:
        sample_src = canonical / "bg-size-sample.png"
        sample_dst = img_dir / "bg-size-sample.png"
        if sample_src.is_file():
            if not dry_run:
                shutil.copy2(sample_src, sample_dst)
        else:
            notes.append(
                f"warning: {sample_src} not found — writing a 1x1 PNG "
                f"placeholder at {sample_dst}; replace it with the real asset"
            )
            if not dry_run:
                sample_dst.write_bytes(MINIMAL_PNG)
    return notes


def print_next_steps(slug: str) -> None:
    print()
    print(f"Local preview: http://127.0.0.1:8099/{slug}.html?lan=zh_cn")
    print("Next steps:")
    print(f"  1. Fill the locale copy in {slug}-locale/{{zh_cn,zh_tw,en}}.js")
    print(f"  2. Add images under src/imgs/{slug}/ (if the design needs any)")
    print(
        "  3. python3 .claude/skills/rule-page-creator/scripts/"
        f"validate_rule_page.py --repo pt-zh-web-page --name {slug}"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Scaffold a titleQA static rule/notice page from the bundled template. "
            "Page slug is kebab-case; locale keys are snake_case."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--repo",
        default="pt-zh-web-page",
        help=(
            "path to the pt-zh-web-page checkout (default: pt-zh-web-page "
            "relative to cwd). Must contain tools/titleQA/src."
        ),
    )
    parser.add_argument(
        "--name",
        required=True,
        metavar="SLUG",
        help="kebab-case page slug, e.g. room-background-image-upload",
    )
    parser.add_argument(
        "--sections",
        default=DEFAULT_SECTIONS,
        help=(
            "comma-separated snake_case section keys (default: "
            f"{DEFAULT_SECTIONS}). Each becomes an <h2>+<p> pair and "
            "{key}_title / {key}_content locale entries."
        ),
    )
    parser.add_argument(
        "--title",
        default="",
        help="optional seed for document_title / title in every locale file",
    )
    parser.add_argument(
        "--close-button",
        action="store_true",
        help="keep the sticky title bar, close icon, navigateBack wiring",
    )
    parser.add_argument(
        "--with-image",
        action="store_true",
        help="keep the trailing sample <img> in _dom and create src/imgs/<name>/",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print the planned file list and rendered page; write nothing",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="overwrite src/<name>.html and src/<name>-locale/ if they exist",
    )
    args = parser.parse_args(argv)

    slug_err = validate_slug(args.name)
    if slug_err:
        return die(slug_err)

    parsed = parse_sections(args.sections)
    if isinstance(parsed, str):
        return die(parsed)
    sections = parsed

    repo = Path(args.repo).expanduser().resolve()
    src = resolve_src(repo)
    if isinstance(src, str):
        return die(src)

    slug: str = args.name
    html_path = src / f"{slug}.html"
    locale_dir = src / f"{slug}-locale"
    snake_dir = src / slug.replace("-", "_")

    if snake_dir.is_dir():
        return die(
            f"deprecated nested directory exists: {snake_dir}. "
            "That layout was refactored out — a page with this name already "
            "exists in the old snake_case shape. Remove or migrate it before "
            "scaffolding the kebab-case page."
        )

    if not args.force and (html_path.exists() or locale_dir.exists()):
        existing = html_path if html_path.exists() else locale_dir
        return die(
            f"{existing} already exists (use --force to overwrite)"
        )

    enabled: set[str] = set()
    if args.close_button:
        enabled.add("CLOSE_BUTTON")
    if args.with_image:
        enabled.add("WITH_IMAGE")

    if not TEMPLATE_DIR.is_dir():
        return die(f"bundled template missing at {TEMPLATE_DIR}")

    try:
        page = render_page(slug, args.title, sections, enabled)
        locales = {
            lang: render_locale(lang, slug, args.title, sections, enabled)
            for lang in LOCALES
        }
    except (FileNotFoundError, RuntimeError) as exc:
        return die(str(exc))

    paths = planned_paths(src, slug, args.close_button, args.with_image)

    if args.dry_run:
        print("Would write:")
        for path in paths:
            try:
                rel = path.relative_to(repo)
            except ValueError:
                rel = path
            print(f"  {rel}")
        print()
        print("--- rendered page ---")
        print(page, end="" if page.endswith("\n") else "\n")
        print_next_steps(slug)
        print("\n(dry-run — nothing written)")
        return 0

    write_text(html_path, page)
    locale_dir.mkdir(parents=True, exist_ok=True)
    for lang, content in locales.items():
        write_text(locale_dir / f"{lang}.js", content)

    notes = ensure_images(
        src,
        slug,
        close_button=args.close_button,
        with_image=args.with_image,
        dry_run=False,
    )

    print("Wrote:")
    written = planned_paths(src, slug, args.close_button, args.with_image)
    for path in written:
        exists = path.exists()
        try:
            rel = path.relative_to(repo)
        except ValueError:
            rel = path
        mark = "" if exists else " (missing)"
        print(f"  {rel}{mark}")
    for note in notes:
        print(note, file=sys.stderr)
    print_next_steps(slug)
    return 0


if __name__ == "__main__":
    sys.exit(main())
