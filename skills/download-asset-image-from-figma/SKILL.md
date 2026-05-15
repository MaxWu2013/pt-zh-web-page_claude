---
name: download-asset-image-from-figma
description: Download images from a Figma URL via the Framelink Figma MCP. Auto-picks export scale — 3x for icons (small source assets), 2x for full-screen artwork (large source assets like a 1500x3248 page background). Uses English filenames and validates output via a paired Python script. Trigger when the user gives a Figma file/design URL and asks to download images/assets/icons, or asks to fetch assets from Figma.
---

# Download Assets from Figma

Pull SVG/PNG assets from a Figma node at the correct scale, with English
filenames, then validate the downloaded files against expected dimensions.

## When to use

- User provides a `figma.com/(file|design)/...` URL and asks to download images.
- User says "grab the assets/icons from Figma" or similar.
- User wants assets at a specific scale (icons vs. screens).

## Workflow

### 0. Confirm the target path (SCAN repo, then ASK to confirm)

Before any MCP call, you must know **where** the downloaded images should
land. The MCP's `localPath` is mandatory and resolves relative to the
project root.

If the user already specified a path (e.g. "into `src/assets/bg/`"), use it
and skip the rest of this step.

Otherwise, **scan the repo first** to discover real asset directories — do
not invent a path or pick a generic default. The scan should run from the
active working directory or the nearest project subdirectory (e.g. the
monorepo subproject the user is editing, not the monorepo root).

#### Scan commands

Run these via Bash, in this order, until you have a useful set of candidates:

```bash
# 1. Top PNG-heavy directories — these are almost always asset dirs.
find . -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' -o -name '*.svg' \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' \
  2>/dev/null \
  | sed 's|/[^/]*$||' \
  | sort | uniq -c | sort -rn \
  | head -15

# 2. Conventional asset folder names — catches empty/new subdirs the first scan misses.
find . -type d \( -name 'assets' -o -name 'images' -o -name 'img' -o -name 'icons' -o -name 'static' \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  2>/dev/null | head -20

# 3. Subdirs of assets/ that suggest a naming convention (bg/, btn/, ic/, etc.).
find . -type d -path '*/assets/*' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  2>/dev/null | head -20
```

#### Picking candidates

From the scan output, build a shortlist of 2–4 paths to offer:

- **Prefer a directory matching the asset's purpose.** Match the Figma node
  to an existing convention dir in the project:
  - background / full-screen artwork → `assets/bg/`
  - icons → `assets/ic/` (or `icons/`)
  - buttons → `assets/btn/`
  - decorative / shared art → `assets/common/`
- **Fall back to the parent `assets/` directory** when no themed subdir is a
  good fit. Do NOT suggest creating a new `figma/` subdir as a default
  quarantine — let the user decide whether to nest the downloads.
- **Match scope to the active project.** If the cwd is inside a monorepo
  subproject (`monorepo/tools/<sub>/...`), pick paths under that subproject.
  Never offer a sibling project's asset dir unless the user asked for it.
- **Skip directories that obviously belong to other features** — read enough
  of the existing filenames to make sure the new assets belong there.

#### Confirm with the user

Use `AskUserQuestion` (or a plain question if the tool isn't available) to
confirm. Phrase it concretely with the discovered paths, e.g.:

> "Where should I save the downloaded assets? I scanned the repo and found
> these existing dirs:
> 1. `src/assets/bg/` (9 backgrounds — fits if these are full-screen)
> 2. `src/assets/btn/` (existing buttons)
> 3. `src/assets/` (parent — pick if none of the themed subdirs fit)
> Or somewhere else?"

Always include the "Other" escape hatch so the user can type their own path.

Once chosen, remember the resolved `localPath` for step 6.

### 1. Parse the URL

Extract `fileKey` and `nodeId` from the URL:

```
https://www.figma.com/design/<fileKey>/...?node-id=<nodeId>
```

Convert the URL's `node-id=1-8` to the API's `1:8` format.

### 2. Inspect the node

Call `mcp__Framelink_MCP_for_Figma__get_figma_data` with the `fileKey` and
`nodeId`. Read the returned tree.

### 3. Identify exportable nodes

- `SLICE` nodes — always exportable (the final flattened graphic).
- Nodes with `imageRef` fills — raw image content. Note `imageDownloadArguments`
  (carries `cropTransform`, `filenameSuffix`, etc.).
- Component/instance vector groups can be exported by their node IDs.
- Skip plain `TEXT` nodes.

### 4. Classify scale per node

Use the source dimensions from the Figma `layout.dimensions`:

| `max(width, height)` of source | Treat as     | Scale |
|--------------------------------|--------------|-------|
| ≤ 300 px                       | Icon         | **3×** |
| > 300 px                       | Full-screen  | **2×** |

Reasoning:

- Icons (buttons, badges, bubbles) are typically < 200 px wide in the design.
- Full-screen artwork (page backgrounds) is usually ≥ 750 px wide — at 2× that
  becomes the production 1500-wide asset (`bg_demo.png` at 1500×3248 came from
  a 750×1624 Figma source).

This rule is intentional — do NOT fall back to the MCP default scale (2).

### 5. English filenames

- Translate Chinese node names to English (e.g. `小气泡` → `small_bubble`).
- Use snake_case.
- When downloading into an existing project, follow its asset prefix
  convention (`bg_*` for backgrounds, `ic_*` for icons, `btn_*` for buttons).
- No Chinese characters in any file path.

### 6. Download via MCP

Call `mcp__Framelink_MCP_for_Figma__download_figma_images`. Group nodes by
scale so each scale uses a single MCP call (`pngScale: 3` for icons,
`pngScale: 2` for full-screen).

For nodes with `needsCropping: true`, pass the `imageRef`, `cropTransform`,
and `filenameSuffix` from `imageDownloadArguments` — the MCP needs them to
produce the cropped variant.

### 6a. Strip the crop-variant hash suffix

The MCP appends `-<6-char-hex>` to filenames it produces from cropped image
fills (e.g. `small_bubble_photo.png` → `small_bubble_photo-4eb6da.png`). The
hash exists to disambiguate multiple crop variants of the same source image —
when only one variant was downloaded for a given base name, the hash is
useless noise and the asset should be renamed.

After the MCP call returns, for each downloaded file matching
`<base>-<hex>.png`:

- If no other file in the destination shares the same `<base>` (with or
  without a different hash), `mv <base>-<hex>.png <base>.png`.
- If multiple variants exist (rare — same imageRef referenced by sibling
  nodes with different crops), keep all hashes so they don't collide.

Use the cleaned-up names when writing the manifest in step 7.

### 7. Write a manifest — in /tmp, never in the project tree

The manifest is build-time scaffolding for the validator; it must NOT be
committed alongside the downloaded assets. Write it under:

```
/tmp/figma-downloads/<project>/<node-or-name>/figma_manifest.json
```

`<project>` is a slug derived from the destination project (e.g.
`newbie-jump-rewards` when downloading into
`pt-zh-web-page/tools/newbie-jump-rewards/...`). `<node-or-name>` can be the
Figma node id (e.g. `1-8`) or a short label for the batch.

Because the manifest's `file` paths are resolved relative to the manifest's
own directory, use ABSOLUTE paths for `file` so the manifest can live in /tmp
while the assets live in the project tree:

```json
[
  {
    "file": "/Users/.../tools/newbie-jump-rewards/src/assets/figma/small_bubble.png",
    "node_id": "1:5",
    "source_w": 112, "source_h": 112,
    "scale": 3,
    "expected_w": 336, "expected_h": 336,
    "kind": "icon"
  },
  {
    "file": "/Users/.../tools/newbie-jump-rewards/src/assets/bg/bg_demo.png",
    "node_id": "1:20",
    "source_w": 750, "source_h": 1624,
    "scale": 2,
    "expected_w": 1500, "expected_h": 3248,
    "kind": "full-screen"
  }
]
```

`expected_w` / `expected_h` are optional — when omitted, the validator
derives them from `source_w * scale`. Omit them entirely for cropped-image
fills whose actual dimensions aren't predictable.

### 8. Validate

Run the paired Python validator (zero deps, just stdlib). Path is relative
to the repo root:

```bash
python3 .claude/skills/download-asset-image-from-figma/scripts/validate_figma_assets.py \
  /tmp/figma-downloads/<project>/<node-or-name>/figma_manifest.json
```

Exit code 0 = all files OK. Non-zero = at least one file failed (missing,
malformed, or wrong dimensions). The script prints per-file pass/fail.

Quick-list mode (no manifest needed) is also available — point it at the
destination project directory:

```bash
python3 .claude/skills/download-asset-image-from-figma/scripts/validate_figma_assets.py --list <directory>
```

### 8a. Clean up

After reporting the result, optionally `rm -rf /tmp/figma-downloads/<project>/<node-or-name>/`
since the manifest only needed to exist for the validation pass.

### 9. Report

Tell the user the final list of files, their dimensions, the chosen scale per
file, and the overall validation result.

## Important constraints

- **Always** 3× for icons and **always** 2× for full-screen. Never use the
  MCP default scale.
- **Always** English filenames. Translate Chinese node names.
- **Always confirm the target path** before downloading. If the user didn't
  state where the assets should land, ASK — never guess silently. Asset
  placement is hard to undo because the MCP writes directly into the project
  tree.
- **Never** write `figma_manifest.json` (or any other build-time scaffolding)
  into the project tree — it would land in git. Use
  `/tmp/figma-downloads/<project>/<node-or-name>/` instead, with absolute
  `file` paths in the manifest.
- The MCP's `localPath` is relative to the project root configured on the
  MCP server side — you don't need to construct absolute paths for it.
- The validator uses pure Python stdlib (reads PNG headers directly) — it
  does NOT require Pillow / PIL. It resolves each manifest `file` against
  the manifest's parent directory by default, but absolute paths override
  the base — that's how we keep the manifest in /tmp while pointing at
  assets in the project.
