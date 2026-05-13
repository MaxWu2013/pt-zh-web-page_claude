---
description: Guide for updating and aligning internationalization (i18n) assets, specifically syncing zh_tw with zh_cn.
---

# Assets Update & Internationalization Guide

This skill handles the alignment and synchronization of assets between different locales, specifically focusing on `zh_tw` and `zh_cn`.

## Trigger Prompts & Keywords

- **Trigger Prompt:** "Align zh_tw assets with zh_cn" or "Sync i18n assets".
- **Keywords:** `zh_tw assets`, `zh_cn assets`, `i18n assets`, `asset alignment`, `missing assets`.

## Rules for Updating `zh_tw` Assets

When updating `zh_tw` assets based on `zh_cn`, follow these strict conventions:

1. **Folder Structure:**

- Maintain the exact same folder structure as `zh_cn` (e.g., `dialog_title`, `tabs`, `text_title`).

2. **File Naming:**

- Ensure `zh_tw` files have the exact same names as their `zh_cn` counterparts.

3. **Comparison & Sync:**

- Proactively identify and list any missing items in `zh_tw` when compared to the `zh_cn` directory.
- Ensure all assets present in `zh_cn` are accounted for in `zh_tw`.

## Manifest-Driven Replacement Workflow (Project-Specific)

Use this when source image filenames differ from target naming convention.

1. Build or reuse a CSV manifest (`source_file,target_file,reason`).
2. Validate manifest with `scripts/validate_manifest.py`.
3. Apply mapping with `scripts/apply_manifest.sh --mode dry-run|apply`.
4. Run project build and compare missing-asset errors before/after.

### Example Invocation (spring-tournament-2026)

```bash
bash .claude/skills/assets-update/scripts/apply_manifest.sh \
  --project-root /Users/dylansalim-ola/Documents/REPO/duplicate-web/pt-zh-web-page/act/spring-tournament-2026 \
  --source-dir /Users/dylansalim-ola/Downloads/繁体_slices \
  --manifest /Users/dylansalim-ola/Documents/REPO/duplicate-web/pt-zh-web-page/.claude/skills/assets-update/templates/spring-tournament-2026-zh_tw-manifest.csv \
  --mode dry-run
```
