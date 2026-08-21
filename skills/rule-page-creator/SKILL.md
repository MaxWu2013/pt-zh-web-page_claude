---
name: rule-page-creator
description: Create a new static rule / notice page under `pt-zh-web-page/tools/titleQA` following the repo's established titleQA page pattern — a single kebab-case `<page-name>.html` at `src/` root, a sibling `<page-name>-locale/{en,zh_cn,zh_tw}.js`, and images under `src/imgs/<page-name>/`. Bundles a scaffolder that writes the correct skeleton and a validator that proves every path resolves and the page renders. Trigger when the user asks to create/add a rule page, notice page, agreement page, protocol page, 规则页 / 须知 / 协议 / 说明 page, a titleQA page, or a static H5 text page with zh_cn/zh_tw/en locales.
license: Proprietary
---

# titleQA rule page creator

`tools/titleQA` is **not** a React/Vite subproject. It is a flat pile of
standalone static HTML pages sharing a few plugins. Its build is literally
`mkdir -p dist && cp -r src/* dist/`, so **the source layout *is* the URL
layout** — a wrong path is a 404 in production, and there is no bundler to
catch it. That is why this skill leans on a scaffolder plus a validator
instead of hand-writing files.

## The pattern (non-negotiable)

Three pieces, all named from the same kebab-case slug. For a page named
`room-background-image-upload`:

```
tools/titleQA/src/room-background-image-upload.html            ← page, at src/ ROOT
tools/titleQA/src/room-background-image-upload-locale/         ← locale dir, SIBLING of the page
    en.js  zh_cn.js  zh_tw.js
tools/titleQA/src/imgs/room-background-image-upload/           ← images, under the SHARED imgs/
    icon_close.svg  bg-size-sample.png
```

Reference implementations already in the repo — read one before you start:

| Page | Shape |
| --- | --- |
| `room-background-image-upload.html` | structured sections + close button + image. **The canonical example; copy this one.** |
| `host-rule.html` | one `locale.html` blob rendered as-is. Use when the design is a wall of rich text. |

### Rules that are easy to get wrong

- **Never create a nested module directory** (`room_background_image_upload/index.html`).
  Exactly one page once did, and it had to be refactored out. Slug is
  **kebab-case**, never snake_case.
- The locale directory suffix is **`-locale`**. (`aliyun-captcha-local` is a
  single legacy outlier — do not copy it.)
- Because the page sits at `src/` root, plugin imports are **`./plugin/…`**,
  never `../plugin/…`.
- Images go in the **shared** `src/imgs/<page-name>/`, not next to the page.
- `<body>` needs **`id="body"`** or dark mode silently does nothing —
  `plugin/dark-mode.js` calls `document.getElementById('body')`.
- Any copy that names the platform must be wrapped in
  **`replacePlatformName(...)`** (from `plugin/replace.min.js`); the platform
  name is per-brand and swapped at runtime.
- Prettier for this repo is **tabs, single quotes, trailing commas,
  printWidth 100** (`.prettierrc`). The scaffolder already emits this.

## Available plugins

Import from `./plugin/native.js`: `isInApp`, `setTitle`, `getUserInfo`,
`navigateBack`. From `./plugin/replace.min.js`: `replacePlatformName`.
Load `./plugin/dark-mode.js` and `./plugin/vconsole.js` as
`<script type="module">` / `<script>` tags at the end of the file.

Dark mode activates via `?darkMode=1` or the native `isDarkTheme` flag, and
pulls the shared `theme-css/dark-theme.css`. That stylesheet only recolors
`h5/h6/p`, so **any `h1`/`h2` on the page needs its own `.dark` rule.**

## Steps

### 1. Collect the inputs

Ask only for what you cannot infer:

- **Page slug** — kebab-case, e.g. `room-background-image-upload`.
- **Content** — the section titles and body copy, in **zh_cn** (the source
  language for this repo). A Figma link or screenshot is fine.
- **Close button?** — yes if the design has a title bar with an ✕. Adds a
  sticky `#pageTitleBar` and wires `navigateBack`.
- **Images?** — any non-text assets the design needs.

### 2. Scaffold

```bash
python3 .claude/skills/rule-page-creator/scripts/scaffold_rule_page.py \
  --repo pt-zh-web-page \
  --name <page-slug> \
  --sections declaration,upload_count,size \
  --close-button --with-image
```

`--sections` takes snake_case keys; each becomes an `<h2>` + `<p>` pair and a
`{key}_title` / `{key}_content` pair in every locale file. Run with
`--dry-run` first to see the file list. `--help` documents the rest.

> Per the repo's `CLAUDE.md`, this session must not edit source directly —
> delegate the scaffolder run and any follow-up content edits to cursor-agent.

### 3. Fill in the copy

Write **zh_cn first**, then derive the other two:

- `zh_tw.js` — traditional-Chinese conversion of zh_cn, same keys, same order.
- `en.js` — English translation.

All three files must have **identical key sets**; a missing key renders
`undefined` on the page. `document_title` and `title` are usually the same
string. Keep the `const locale = { … };` shape — the page loads these as
plain scripts that assign a global, not as modules.

### 4. Images

Use the `download-asset-image-from-figma` skill to pull assets, then place
them in `src/imgs/<page-slug>/`. Reuse `imgs/btn/btn_black_back.svg` and
`btn_white_back.svg` for back arrows rather than exporting new ones.

If an icon's glyph is dark, it disappears on the `#1c1c1e` dark background —
add a `.dark #someBtn img { filter: invert(1); }` rule, as
`room-background-image-upload.html` does for its close icon.

### 5. Verify

```bash
python3 .claude/skills/rule-page-creator/scripts/validate_rule_page.py \
  --repo pt-zh-web-page --name <page-slug>
```

It rebuilds `tools/titleQA` from a clean `dist`, then checks: the three
files/dirs exist with the right names, no `../plugin/` reference survives, no
snake_case leftover directory, every local `src=`/`import` in the page
resolves on disk **and** in `dist/`, all three locale files pass
`node --check` and declare identical key sets, and `<body>` carries
`id="body"` whenever `dark-mode.js` is loaded.

Then load it for real — this is the step that catches a broken relative path:

```bash
cd pt-zh-web-page/tools/titleQA && pnpm build
python3 -m http.server 8099 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8099/<page-slug>.html?lan=zh_cn&darkMode=1` and
confirm **zero console errors** and that every request is a 200. Check all
three `lan` values. A missing `favicon.ico` 404 is expected and harmless.

Note `pnpm build` copies over `dist/` without wiping it, so stale files from
a previous build linger — always clear `dist` before trusting what you see.

### 6. Ship

Open the PR against **`master`** (that is what deploys to production; `dev`
deploys to the dev environment). Once merged the page is at:

```
dev   https://page.partying.dev/tools/titleQA/<page-slug>.html?lan=zh_cn
prod  https://page.partying.tw/tools/titleQA/<page-slug>.html?lan=zh_cn
```

`lan` accepts `zh_cn`, `zh_tw`, `en`; anything else falls back to `zh_cn`.
Add `&darkMode=1` to preview dark mode.

**Tell whoever owns the client the exact URL** — these pages are opened from
hardcoded links in the app, so the slug is a public contract. Renaming a live
page breaks it.

### 7. Crowdin (usually skip)

`tools/titleQA/hammer.yaml` registers locale dirs for translation sync, but
only 4 of ~20 do it. Add an entry **only if** the user wants the copy managed
in Crowdin rather than hand-written.
