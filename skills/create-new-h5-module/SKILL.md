---
name: create-new-h5-module
description: Scaffold a new H5 subproject in the pt-zh-web-page monorepo (React 17 + Vite + TypeScript + UnoCSS + scoped SCSS). Uses a self-contained Python scaffolder that copies a BUNDLED template (`<skill>/template/`) into the chosen parent directory and rewires `package.json#name` — no pnpm / private-registry / network dependency, and no reliance on `pt-zh-web-page/h5-template/`. Asks the user where to put the module (default `pt-zh-web-page/tools/`), applies project conventions (`service/dummy_data/`, production `API.ts` pattern), then validates the result. Trigger when the user asks to create a new H5 page / module / activity / subproject under pt-zh-web-page, or wants a fresh React+Vite app scaffolded with the project's standard structure (App.tsx, Home.tsx, Rule.tsx, router.tsx, common/, components/, context/, hooks/, etc.).
---

# Create a new H5 module

Scaffold a new subproject under `pt-zh-web-page/` by copying the
**bundled template** (`<skill>/template/`) into the chosen path and
rewriting `package.json#name`. Done entirely with a stdlib Python script
— no `pnpm create-page`, no private npm package, no `pt-zh-web-page/h5-template/`
lookup, no network required.

The skill is fully self-contained: the template is shipped inside the
skill itself, so the scaffolder works the same regardless of what
`pt-zh-web-page/h5-template/` happens to look like at the time.

## When to use

- User says "create a new H5 module/page/activity/subproject" inside the
  `pt-zh-web-page` monorepo.
- User wants a fresh React 17 + Vite + TS + UnoCSS app with the standard
  file tree:
  - root: `babel.config.js`, `hammer.yaml`, `index.html`, `jest.config.ts`,
    `package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`
  - `src/`: `App.tsx`, `main.tsx`, `router.tsx`, `index.scss`,
    `assets/`, `common/`, `components/`, `context/`, `hooks/`, `locale/`,
    `native/`, `ola/`, `pages/`, `service/`

## Workflow

### 0. Verify environment

Confirm we're in the right repo. The scaffolder needs a destination
directory — `pt-zh-web-page/` containing `tools/`, `act/`, and `h5/`:

```bash
find . -maxdepth 3 -name 'pt-zh-web-page' -type d 2>/dev/null | head -1
```

If empty, ask the user to `cd` into the H5 monorepo and re-run. The
scaffolder finds `pt-zh-web-page/` automatically by walking up from `cwd`.
The **template** comes from inside the skill (`<skill>/template/`), so
there's no longer any dependency on `pt-zh-web-page/h5-template/`.

### 1. Pick the parent directory (ASK if not specified)

The monorepo has three top-level homes for subprojects:

| Parent    | Use for                                                                         |
|-----------|---------------------------------------------------------------------------------|
| `tools/`  | persistent feature pages (default — e.g. `checkin`, `vip-room`, `taskcenter`)   |
| `act/`    | time-limited activity / event pages (e.g. `recharge-v4`, `valentine-love-song-2026`) |
| `h5/`     | shared assets / cross-cutting components — usually NOT a new standalone project |

If the user didn't say which one, ASK via `AskUserQuestion`. Pre-select
`tools/` as the default.

### 2. Pick the module name (ASK if not specified)

Constraints:

- kebab-case only — `my-new-activity`, not `MyNewActivity` or `my_new_activity`.
- No spaces, no Chinese characters.
- Must not collide with an existing directory under the chosen parent.

Check for collision before scaffolding:

```bash
test -d pt-zh-web-page/<parent>/<name> && echo "ALREADY EXISTS — ask user before overwriting"
```

If it exists, stop and ask the user how to proceed. Do NOT overwrite.

### 3. Run the scaffolder

Single script that copies, rewires `package.json`, and applies project
conventions in one call:

```bash
python3 .claude/skills/create-new-h5-module/scripts/scaffold_module.py <parent>/<base>
# e.g.
python3 .claude/skills/create-new-h5-module/scripts/scaffold_module.py tools/hello-world
```

What the script does (three phases, in order):

1. **Copy** `<skill>/template/` (bundled) → `pt-zh-web-page/<parent>/<base>/`.
   Refuses to overwrite an existing target. Skips junk dirs (`node_modules`,
   `.DS_Store`, `dist`, `build`).
2. **Rewire** `package.json#name` from `"h5-template"` → `"<parent>-<base>"`
   (slashes → dashes). Preserves the template's tab indentation.
3. **Apply conventions** — three things the raw template doesn't ship with
   but every mature module ends up adding:
   - creates `src/service/dummy_data/` with a README explaining its
     purpose;
   - rewrites `src/service/API.ts` from the toy `GetSampleApi` example to
     the production "mock-or-real dispatch" pattern;
   - deletes `src/hooks/ReactQuery/useSampleReq.ts` (orphaned sample hook
     that would fail to compile against the new API.ts).

Behavior matches the previous `make create-page` / `@partying/create-page`
workflow for the copy + name rewrite, then layers the conventions on top.
Fully self-contained: pure-stdlib Python, no `pnpm`, no network, no SSH
to the private registry.

Use `--dry-run` to preview without writing.

#### Applying conventions to a legacy scaffold

If a module was scaffolded the legacy way (`make create-page` /
`@partying/create-page` only) and never had the conventions applied, you
can run just the convention phase against an existing directory:

```bash
python3 .claude/skills/create-new-h5-module/scripts/scaffold_module.py \
  --complete-only pt-zh-web-page/<parent>/<base>
```

Idempotent: re-running on an already-complete module is a no-op.

### 4. Validate with the paired script

```bash
python3 .claude/skills/create-new-h5-module/scripts/validate_module.py \
  pt-zh-web-page/<parent>/<name>
```

The script compares the new module against the bundled template layout
and flags:

- **Failures** (exit 1):
  - Missing root config files (`package.json`, `vite.config.ts`, etc.).
  - Missing required `src/` subfolders (`assets/`, `common/`, `components/`,
    `context/`, `hooks/`, `locale/`, `native/`, `ola/`, `pages/`, `service/`).
  - Missing required `src/` files (`App.tsx`, `main.tsx`, `router.tsx`,
    `index.scss`).
  - `package.json` `name` not customized away from `h5-template`.
- **Warnings** (exit 0, but flagged):
  - Missing `src/service/dummy_data/` (run
    `scaffold_module.py --complete-only <path>`).
  - `service/API.ts` still using the template stub.

Exit 0 = no failures. A fresh `scaffold_module.py` run clears any
convention warnings (since step 3 of the scaffolder applies them inline);
if the validator still warns after a clean scaffold, something is wrong.

### 5. Post-create checklist (REPORT to user — don't do silently)

After validation passes, list these so the user can decide what to do next:

1. `src/pages/Home/Home.tsx` and `src/pages/Rule/Rule.tsx` are template
   placeholders — customize for the actual feature.
2. Update `activity_id` in `src/common/utils/constant.ts` (per the project's
   `AI_CONVENTIONS.md` — required for activity tracking).
3. If the module needs proto-defined API, run
   `make generate-initial project=<parent>/<name>` from `pt-zh-web-page/`.
4. Add a `.proto` file under `src/service/` if you'll use generated API/RPC.
5. Boot the dev server to confirm:
   ```bash
   cd pt-zh-web-page/<parent>/<name>
   pnpm install
   pnpm run dev
   # then open http://localhost:5173/<parent>/<name>/
   ```

## Important constraints

- **Always** use `scaffold_module.py` — do NOT hand-copy the bundled
  template. The scaffolder also rewires `package.json` names AND applies
  project conventions (`service/dummy_data/`, the real `API.ts` pattern,
  removal of the orphaned `useSampleReq.ts`), which a manual copy would miss.
- The template under `<skill>/template/` is the canonical source. If
  `pt-zh-web-page/h5-template/` evolves upstream, the skill won't pick
  that up automatically — sync it manually (`cp -R` followed by a fresh
  scaffold + diff test) when you want to absorb upstream changes.
- **Always ask** for the parent directory if the user didn't say (`tools/` /
  `act/` / `h5/`). Default to `tools/`.
- **Never overwrite** an existing subproject. If `<parent>/<base>` already
  exists, the scaffolder exits 1 — confirm with the user before removing
  the existing dir.
- Module names must be kebab-case. The scaffolder rejects `PascalCase`,
  `snake_case`, names containing whitespace, or Chinese characters.
- Do NOT modify `@vitejs/plugin-legacy` or `@vitejs/plugin-react` versions
  in the generated `package.json` (per `AI_CONVENTIONS.md`).
- The legacy `make create-page` / `pnpm create-page` workflow still works
  but is NOT what this skill calls — use the Python scaffolder for
  reproducibility (no network, no private registry, no version drift).
