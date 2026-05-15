#!/usr/bin/env python3
"""Validate Figma-downloaded PNG assets against an expected manifest.

Paired with the Framelink Figma MCP. Reads PNG headers directly so it has no
third-party dependencies (no PIL / Pillow needed).

Modes
-----
Strict validation against a manifest:
    python3 validate_figma_assets.py path/to/figma_manifest.json

Quick listing (just print dimensions of every PNG in a directory):
    python3 validate_figma_assets.py --list path/to/dir

Manifest format
---------------
A JSON array of objects:

    [
      {
        "file": "small_bubble.png",     # relative to manifest dir
        "node_id": "1:5",               # informational
        "source_w": 112, "source_h": 112,
        "scale": 3,
        "expected_w": 336, "expected_h": 336,   # optional; defaults to source*scale
        "kind": "icon"                  # informational ("icon" | "full-screen")
      }
    ]

Exit codes
----------
0 = all files pass
1 = one or more files failed
2 = bad CLI input (missing manifest, not a directory, etc.)
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path
from typing import Iterable

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
# Allow a couple of pixels of slack — Figma's PNG exporter occasionally lands on
# a sub-pixel boundary that rounds asymmetrically across scales.
DIMENSION_TOLERANCE_PX = 2


def read_png_size(path: Path) -> tuple[int, int]:
    """Return (width, height) by reading the IHDR chunk of a PNG.

    Raises ValueError if the file isn't a valid PNG.
    """
    with path.open("rb") as f:
        head = f.read(24)
    if len(head) < 24:
        raise ValueError("file too short to be a PNG")
    if head[:8] != PNG_SIGNATURE:
        raise ValueError("not a PNG (bad signature)")
    if head[12:16] != b"IHDR":
        raise ValueError("malformed PNG: IHDR not at expected offset")
    width, height = struct.unpack(">II", head[16:24])
    return width, height


def expected_dims(entry: dict) -> tuple[int | None, int | None]:
    """Pull expected dimensions from the manifest entry.

    Prefer explicit `expected_w` / `expected_h`; otherwise derive from
    `source_w * scale` when both are present.
    """
    if "expected_w" in entry and "expected_h" in entry:
        return entry["expected_w"], entry["expected_h"]
    scale = entry.get("scale")
    src_w = entry.get("source_w")
    src_h = entry.get("source_h")
    if scale is not None and src_w is not None and src_h is not None:
        return src_w * scale, src_h * scale
    return None, None


def cmd_validate(manifest_path: Path) -> int:
    if not manifest_path.is_file():
        print(f"manifest not found: {manifest_path}", file=sys.stderr)
        return 2
    try:
        manifest = json.loads(manifest_path.read_text())
    except json.JSONDecodeError as e:
        print(f"manifest is not valid JSON: {e}", file=sys.stderr)
        return 2
    if not isinstance(manifest, list):
        print("manifest must be a JSON array", file=sys.stderr)
        return 2

    base = manifest_path.parent
    print(f"validating {len(manifest)} entries against {manifest_path}")
    ok = fail = 0

    for entry in manifest:
        name = entry.get("file")
        if not name:
            print("  ✗ entry missing 'file' key:", entry)
            fail += 1
            continue
        # Path() / absolute_path → absolute_path (pathlib semantics), so absolute
        # entries in the manifest override the base. Keeps the manifest in /tmp
        # while assets live in the project tree.
        fp = base / name
        display = Path(name).name  # show just the basename; full path on failure
        scale = entry.get("scale")
        kind = entry.get("kind") or "?"
        exp_w, exp_h = expected_dims(entry)

        if not fp.exists():
            print(f"  ✗ {display}: file missing ({fp})")
            fail += 1
            continue

        try:
            w, h = read_png_size(fp)
        except ValueError as e:
            print(f"  ✗ {display}: {e}")
            fail += 1
            continue

        scale_lbl = f"{scale}x" if scale else "?x"
        if exp_w is None or exp_h is None:
            # No expected dims to compare against — accept and just report.
            print(f"  ? {display}: {w}x{h} (no expected dims) [{kind} @ {scale_lbl}]")
            ok += 1
            continue

        if abs(w - exp_w) > DIMENSION_TOLERANCE_PX or abs(h - exp_h) > DIMENSION_TOLERANCE_PX:
            print(
                f"  ✗ {display}: got {w}x{h}, expected {exp_w}x{exp_h} "
                f"(scale={scale_lbl}, kind={kind})"
            )
            fail += 1
        else:
            print(f"  ✓ {display}: {w}x{h} [{kind} @ {scale_lbl}]")
            ok += 1

    print()
    print(f"{ok} ok, {fail} failed")
    return 0 if fail == 0 else 1


def cmd_list(dir_path: Path) -> int:
    if not dir_path.is_dir():
        print(f"not a directory: {dir_path}", file=sys.stderr)
        return 2
    pngs: Iterable[Path] = sorted(dir_path.glob("*.png"))
    pngs = list(pngs)
    if not pngs:
        print(f"(no PNGs in {dir_path})")
        return 0
    for fp in pngs:
        try:
            w, h = read_png_size(fp)
            print(f"{fp.name}: {w}x{h}")
        except ValueError as e:
            print(f"{fp.name}: ERROR {e}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate Figma-downloaded PNG assets.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--list",
        metavar="DIR",
        help="just print PNG dimensions for every file in DIR (no manifest)",
    )
    parser.add_argument(
        "manifest",
        nargs="?",
        help="path to figma_manifest.json (omit if using --list)",
    )
    args = parser.parse_args(argv)

    if args.list:
        return cmd_list(Path(args.list))
    if not args.manifest:
        parser.error("provide either --list DIR or a manifest path")
    return cmd_validate(Path(args.manifest))


if __name__ == "__main__":
    sys.exit(main())
