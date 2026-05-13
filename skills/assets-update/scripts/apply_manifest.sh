#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=""
SOURCE_DIR=""
MANIFEST=""
MODE="apply"

usage() {
  cat <<USAGE
Usage: $(basename "$0") --project-root <path> --source-dir <path> --manifest <path> [--mode dry-run|apply]
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root)
      PROJECT_ROOT="$2"; shift 2 ;;
    --source-dir)
      SOURCE_DIR="$2"; shift 2 ;;
    --manifest)
      MANIFEST="$2"; shift 2 ;;
    --mode)
      MODE="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

[[ -n "$PROJECT_ROOT" && -n "$SOURCE_DIR" && -n "$MANIFEST" ]] || { usage; exit 1; }
[[ "$MODE" == "dry-run" || "$MODE" == "apply" ]] || { echo "mode must be dry-run or apply" >&2; exit 1; }

while IFS=, read -r source_file target_file reason; do
  [[ "$source_file" == "source_file" ]] && continue
  src="$SOURCE_DIR/$source_file"
  dst="$PROJECT_ROOT/$target_file"

  [[ -f "$src" ]] || { echo "missing source: $src" >&2; exit 1; }
  mkdir -p "$(dirname "$dst")"

  echo "$source_file -> $target_file ($reason)"
  if [[ "$MODE" == "apply" ]]; then
    cp "$src" "$dst"
  fi
done < "$MANIFEST"
