---
description: Guide for updating the monthly recharge activity (recharge-v4) for new themes or versions.
---

# Recharge V4 Update Guide

This skill guides you through the process of updating the `recharge-v4` activity for monthly refreshes.

## General Instruction

Use `git diff` or revision history to identify specific changes between previous versions if needed.

## Scenario A: Change Theme (New Version)

Use this workflow when a new visual theme is required (e.g., new assets, new color scheme).

1.  **Create Assets & Components**
    - Add new folders (e.g., `v14` or `NewTheme`) in:
      - `src/assets/`
      - `src/components/`
      - `src/pages/`

2.  **Update Config**
    - Update `activity_id` in `constant.ts`.

3.  **Update Router**
    - Add routes for the new version in `src/router.tsx`.
    - Update the default redirect route to point to the new version.

4.  **Update App**
    - Import and add the new version's Modals in `src/App.tsx`.

## Scenario B: Reuse Theme (Same Version)

Use this workflow when reusing an existing theme for a new month.

1.  **Update Config**
    - Update `activity_id` in `constant.ts`.

2.  **Update Router**
    - Ensure the default redirect in `src/router.tsx` points to the correct version.
