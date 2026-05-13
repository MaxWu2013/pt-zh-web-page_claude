#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from pathlib import Path


def dimensions(path: Path) -> tuple[int, int]:
    out = subprocess.check_output(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], text=True
    )
    width = height = None
    for line in out.splitlines():
        if "pixelWidth:" in line:
            width = int(line.split(":", 1)[1].strip())
        if "pixelHeight:" in line:
            height = int(line.split(":", 1)[1].strip())
    if width is None or height is None:
        raise AssertionError(f"cannot read dimensions: {path}")
    return (width, height)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate asset mapping manifest")
    parser.add_argument("--project-root", required=True)
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--require-destination-files", action="store_true")
    parser.add_argument("--expected-rows", type=int, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    source_dir = Path(args.source_dir).resolve()
    manifest = Path(args.manifest).resolve()

    if not manifest.exists():
        raise AssertionError(f"missing manifest: {manifest}")

    rows = list(csv.DictReader(manifest.open(newline="", encoding="utf-8")))
    if rows and set(rows[0].keys()) != {"source_file", "target_file", "reason"}:
        raise AssertionError("manifest headers must be: source_file,target_file,reason")
    if args.expected_rows is not None and len(rows) != args.expected_rows:
        raise AssertionError(f"expected {args.expected_rows} rows, got {len(rows)}")

    for row in rows:
        src = source_dir / row["source_file"]
        dst = project_root / row["target_file"]

        if not src.exists():
            raise AssertionError(f"missing source: {src}")
        if not dst.parent.exists():
            raise AssertionError(f"missing target directory: {dst.parent}")

        if args.require_destination_files and not dst.exists():
            raise AssertionError(f"missing destination file: {dst}")

        if dst.exists():
            if dimensions(src) != dimensions(dst):
                raise AssertionError(
                    f"dimension mismatch: {src.name} -> {row['target_file']}"
                )

    print("manifest validation passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
