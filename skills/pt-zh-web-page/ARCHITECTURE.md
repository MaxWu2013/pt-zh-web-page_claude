# Repository Architecture & Structure

> **Last validated:** 2026-05-11, against commit HEAD of `dev` branch.

## Overview

**pt-zh-web-page** is a monorepo of H5 (mobile web) pages for the "Partying" social app. Each subproject is an independent React application with its own `package.json` and build configuration. A shared CI system (Kort/Korthub) rebuilds any subproject that has changes, producing per-subproject build output. The root `package.json` provides shared linting, formatting, and `.scripts/` tooling — it does NOT build subprojects.

**URLs:**
- Dev: `https://page.partying.dev/<PROJECT_NAME>`
- Prod: `https://page.partying.tw/<PROJECT_NAME>`

---

## Top-Level Directory Structure

```
pt-zh-web-page/
├── act/                # Time-limited activity/event pages (36 projects)
├── tools/              # Persistent app feature pages (24 projects)
├── h5/                 # Shared assets + custom-components deployable app
│   ├── assets/         # Shared image assets (own package.json)
│   └── custom-components/  # Deployable React 18 / RR v5 subproject
├── h5-template/        # Template project for scaffolding new subprojects
├── .scripts/           # Build tools, code generators, CI utilities (22 tools)
├── docs/               # Development guides and best practices
├── Makefile            # Central orchestrator for build/lint/deploy/generate
├── package.json        # Root: linting, formatting, ts-proto, @crowdin/cli, .scripts/ deps
├── eslint.config.ts    # Flat ESLint config
├── tsconfig.json       # Root TypeScript config
├── .prettierrc         # Prettier config
├── AGENTS.md           # AI assistant conventions
├── CLAUDE.md           # Claude Code conventions
└── .husky/             # Git hooks (pre-commit: lint-staged)
```

### `act/` — Activity/Event Pages (36 projects)

Time-limited event pages that typically run for 1-4 weeks. Examples:
- `recharge-v4` — Monthly recharge activity (recurring, theme-based)
- `recharge-capsule-machine` — Monthly capsule machine (recurring)
- `valentine-love-song-2026` — Valentine's event
- `golden-horse-cny-2026` — Chinese New Year event
- `annual-event-2025-2nd` — Annual gala with leaderboards
- `foodie-order-battle-2026` — Gifting battle event

### `tools/` — Persistent Feature Pages (24 projects)

Long-lived app features embedded in the Partying app. Examples:
- `checkin` — Daily check-in (legacy Webpack/CRA stack)
- `vip-room` — VIP room features
- `ai-fortune-teller` — AI fortune telling feature
- `taskcenter` — Task center
- `titleQA` — Title Q&A feature
- `cp-rule` — CP rule pages

### `h5/` — Shared Assets & Legacy Deployable

- `assets/` — Shared image assets with its own `package.json` and `hammer.yaml` for translation sync
- `custom-components/` — A **deployable subproject** running React 18 + react-router-dom v5 + antd 4.20 (an older stack than the `act/` projects). Has its own `vite.config.ts`, `index.html`, `src/App.tsx`, `src/router.tsx`, `src/native/`, `src/ola/`, and `src/service/`. Despite its name, it is a full standalone app, not a shared component library.

### `h5-template/` — Project Template

Used by `make create-page` to scaffold new subprojects with the standard structure.

### `.scripts/` — Build & Generation Tools (22 tools)

| Script | Purpose |
|--------|---------|
| `protoc_gen/` | Generate TypeScript from `.proto` files |
| `api_ts_generator/` | Generate API client code |
| `mock_generator/` | Generate mock data from proto |
| `react_query_generator/` | Generate React Query hooks |
| `translation_sync/` | Sync translations via Crowdin |
| `image-compression/` | Compress image assets |
| `deploy_dev/` | Fast dev deployment |
| `token_generator/` | Generate auth tokens for testing |
| `hook_generator/` | Generate hook boilerplate |
| `dependabot/` | Security vulnerability tooling |
| `merge-dev/` | Merge feature branch to dev |
| `halves_css_px/` | Halve CSS px values |
| `verdaccio_config/` | Private registry config |
| `nginx/` | Nginx configuration templates |
| `static_site_tools/` | Static site utilities |
| `page_spy/` | Page debugging spy tool |
| `generate_links/` | Link generation utility |
| `generate_salt/` | Salt generation for security |
| `github_auto_close/` | Auto-close GitHub issues |
| `md_to_array/` | Convert markdown to TS string arrays |
| `domain_file_replacement/` | Domain file replacement |
| `translation_script_replacement/` | Translation script replacement |

---

## Tech Stack

### Modern Projects (most `act/` projects, newer `tools/`)

| Layer | Technology |
|-------|-----------|
| UI Framework | React 17 + TypeScript |
| Build Tool | Vite 6 (^6.4.2); one exception: tools/newbie-growth-system on Vite 5 |
| Styling | UnoCSS (utility-first, Tailwind-like) + Scoped SCSS |
| Data Fetching | @tanstack/react-query v4 |
| API Protocol | Protobuf + Twirp RPC |
| Routing | react-router-dom v6 |
| Date Handling | date-fns-tz |
| Error Reporting | Sentry |
| i18n | @ola/zh-scanner + babel-plugin-zh-replacer |
| Compatibility | @vitejs/plugin-legacy ^2.0.0 (iOS 11, Android 4.4) |
| CSS Units | PostCSS px-to-viewport (375px base → vw) |
| Package Manager | pnpm 8.6.10 (documented convention, not enforced via packageManager field) |
| Analytics | ThinkingData |

### Legacy Projects (older `tools/`)

| Layer | Technology |
|-------|-----------|
| UI Framework | React 16/17 + JavaScript or TypeScript |
| Build Tool | Raw Webpack 4 or Create React App (react-scripts 3.4–5) |
| Package Manager | yarn |

Examples: `checkin` (CRA + react-scripts 5), `partying-invite` (CRA + react-scripts 3.4), `taskcenter`/`pt-invite` (raw Webpack 4.41), `back-stage` (raw Webpack 4.44).

---

## Subproject Internal Structure

Every modern subproject follows this standard layout:

```
<project>/
├── package.json          # Independent dependencies
├── pnpm-lock.yaml        # Lock file (or yarn.lock for legacy)
├── .npmrc                # @ola:registry=http://tsp.aopacloud.net/verdaccio/ (fallback)
├── hammer.yaml           # Crowdin translation sync config
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── babel.config.js       # Babel config (for jest transforms)
├── jest.config.ts        # Jest test config
├── index.html            # HTML entry point
└── src/
    ├── main.tsx          # App entry point
    ├── App.tsx           # Root component (providers + router + modals)
    ├── router.tsx        # react-router-dom routes with lazy loading
    ├── index.scss        # Global styles
    ├── assets/           # Image assets
    │   ├── bg/           # Background images
    │   ├── btn/          # Button images (zh_cn/zh_tw for text buttons)
    │   ├── ic/           # Icons
    │   ├── text/         # Text images
    │   │   ├── zh_cn/    # Simplified Chinese
    │   │   └── zh_tw/    # Traditional Chinese
    │   ├── common/       # Shared images within the project
    │   ├── anim/         # Animation assets (SVGA, etc.)
    │   └── font/         # Custom fonts
    ├── common/           # Global utilities & shared components
    │   ├── 404/          # NotFound page
    │   ├── Loading/      # Loading spinner
    │   ├── NoContent/    # Empty state
    │   ├── Navigation/   # Navigation bar
    │   ├── Toast/        # Toast notifications
    │   ├── ErrorBoundary/# Error boundary wrapper
    │   ├── constant.ts   # Activity ID, event URLs, enums
    │   ├── getDomain.ts  # API/OSS domain resolution
    │   ├── setConsole.ts # Console utilities
    │   ├── setLocale.ts  # Locale setup
    │   ├── setReport.ts  # Report utilities
    │   ├── setSentry.ts  # Sentry initialization
    │   └── utils/        # Shared utility functions
    ├── components/       # Project-specific reusable components
    │   ├── DisplayImg/   # Image display with WebP fallback
    │   ├── Modal/        # Modal system (Blocking + NonBlocking)
    │   ├── ProgressLine/ # Progress bar (with/without milestones)
    │   ├── Reward/       # Reward display component
    │   ├── SectionContainer/ # Layout container (Top/Middle/Bottom)
    │   └── SingleAutoscrollText/ # Auto-scrolling overflow text
    ├── context/          # React context providers
    │   ├── GlobalContext/    # Global state (event info, user data)
    │   ├── ReactQueryProvider/ # React Query client setup
    │   └── Tabs/         # Tab state management
    ├── hooks/            # Custom hooks
    │   ├── ReactQuery/   # Data fetching hooks (generated)
    │   ├── useNavigateWithQuery.ts
    │   ├── useBackButtonDetection.ts
    │   └── useCapsuleScreenAnimation.ts
    ├── locale/           # Translation files
    │   ├── zh_cn.json    # Simplified Chinese (auto-generated by scanner)
    │   ├── zh_tw.json    # Traditional Chinese (from Crowdin)
    │   └── index.js      # Locale loader
    ├── native/           # Native app bridge
    │   ├── index.ts      # Native API interface
    │   └── native.ts     # Native method implementations
    ├── ola/              # App configuration
    │   ├── index.ts      # Ola instance + login (token/uid/lan for testing)
    │   ├── Ola.ts        # Ola class definition
    │   └── types.ts      # Type definitions
    ├── pages/            # Page components
    │   ├── Home/         # Main page
    │   │   ├── Home.tsx
    │   │   ├── Home.scoped.scss
    │   │   ├── Tabs/     # Tab components
    │   │   ├── ExchangeTab/
    │   │   ├── VoucherTab/
    │   │   └── ...       # Nested page-specific components
    │   └── Rule/         # Rules page
    │       ├── Rule.tsx
    │       └── Rule.scoped.scss
    └── service/          # API layer
        ├── *.proto       # Protobuf definition file
        ├── *.ts          # Generated TypeScript types
        ├── *_API.ts      # Generated API client
        ├── instance.ts   # API instance configuration
        ├── useService.ts # Service hooks
        ├── myProtobuf-client.ts # Twirp RPC client
        └── dummy_data/   # Mock data for development
```

---

## Application Architecture

### Entry Flow

```
index.html
  └── main.tsx (entry)
        └── setup()
              ├── setSentry()       → error reporting init
              ├── setConsole()      → vconsole for debugging
              ├── setReport()       → analytics init
              ├── await setOla()    → app config (token, uid, lan) from native bridge
              └── setLocale()       → language/locale setup, adds CSS class to root
                    └── dynamic import('./App')
                          └── App.tsx
                                ├── ErrorBoundary (catches React errors)
                                ├── Toast (global notifications)
                                └── ReactQueryProvider
                                      └── GlobalContextProvider (event state, user data)
                                            ├── Router (BrowserRouter + lazy routes)
                                            ├── NonBlockingModal (rewards, records)
                                            └── BlockingModal (event state blocks)
```

### Data Flow

```
Proto Definition (.proto)
    │
    ├── make protoc-gen → Generated TypeScript types (.ts)
    ├── make generate-api → API client (*_API.ts)
    ├── make generate-mock → Mock data (dummy_data/)
    └── make generate-react-query → React Query hooks
                                        │
                                        ▼
                              useQuery/useMutation hooks
                                        │
                                        ▼
                              Components render data
```

### Native Bridge

The H5 pages run inside the Partying mobile app via WebView. The `src/native/` layer provides:
- Token/user authentication from native app
- Navigation between pages
- Native feature access (share, camera, etc.)
- Event communication (app ↔ webview)

### Styling Architecture

```
UnoCSS (utility classes)     →  Layout, spacing, typography, colors
  + PostCSS (px → vw)       →  Responsive mobile design (375px base)
  + Scoped SCSS (.scoped.scss) → Image backgrounds, animations, complex styles
  + Language CSS classes     →  zh_cn/zh_tw image switching
```

---

## Translation / i18n System

### Text Translation (automatic)

1. `@ola/zh-scanner` scans Chinese characters in JSX/TSX → `src/locale/zh_cn.json`
2. Upload to Crowdin via `hammer.yaml` config
3. Crowdin translates (Simplified → Traditional Chinese, plus other languages)
4. `make translation-sync` downloads translations → `src/locale/zh_tw.json`
5. `babel-plugin-zh-replacer` replaces Chinese characters at build time based on user language

### Image Translation (manual)

Images containing Chinese text are stored in parallel directories:
- `src/assets/text/zh_cn/` — Simplified Chinese
- `src/assets/text/zh_tw/` — Traditional Chinese

Switched via CSS class based on `lan` query parameter:
```scss
.text-title {
    &.zh_cn { background: url("@src/assets/text/zh_cn/text-title") ... }
    background: url("@src/assets/text/zh_tw/text-title") ... ;
}
```

---

## Build & Deployment

### Build System

Each subproject builds independently. The `Makefile` auto-detects the package manager:
1. `pnpm-lock.yaml` → uses pnpm
2. `yarn.lock` → uses yarn
3. `package.json` only → uses npm

### CI/CD via Kort (a.k.a. Korthub)

**Kort** (the CLI tool; the web dashboard is called **Korthub**) is a lightweight Node.js CI service that:
1. Watches the git repo for changes (GitHub push webhook or cron every 5 min)
2. Detects which subprojects changed (via git-diff selector)
3. Installs dependencies using the detected package manager (pnpm/yarn/npm) and runs the project's `build` script
4. Outputs to `dist/` directory served by nginx
5. Sends build notifications via webhook

### Deployment Flow

```
Developer → Push to branch → Create PR → Merge to dev → Kort builds → Dev deployed
                                        → Merge to master → Kort builds → Prod deployed

Fast path: make deploy-dev project=act/<name> (bypasses CI for dev)
```

### Environments

| Environment | Branch | Server | URL |
|------------|--------|--------|-----|
| Development | `dev` | pt-dev | page.partying.dev |
| Production | `master` | pt-h5-001 | page.partying.tw |

---

## Branching & Commit Conventions

### Branch Types

- `master` — Production-ready code (protected, no direct commits)
- `dev` — Development integration branch (protected, no direct commits)
- `feature/<name>` — New feature development
- `bugfix/<name>` — Bug fixes
- Release branches for stabilization

### Commit Format

```
<type>(<scope>): <subject>
```

Valid types: `feat`, `fix`, `docs`, `dx`, `refactor`, `perf`, `test`, `workflow`, `build`, `ci`, `chore`, `types`, `wip`, `release`, `deps`

Enforced by husky `commit-msg` hook via `verifyCommit.cjs`.

---

## Private Package Installation

`@ola/*` and `@partying/*` packages are installed **directly from private GitHub repos via SSH** at pinned tags. Each subproject's `package.json` specifies explicit `git+ssh://` URLs:

```json
"@ola/utils": "git+ssh://git@github.com:olachat/pt-h5-utils.git#v1.2.3",
"@ola/zh-scanner": "git+ssh://git@github.com:olachat/zh-scanner.git#v1.0.2",
"@ola/babel-plugin-react-scoped-css": "git+ssh://git@github.com:olachat/babel-plugin-react-scoped-css.git#v1.1.2",
"@ola/rollup-plugin-scoped-css": "git+ssh://git@github.com:olachat/rollup-plugin-scoped-css.git#v1.0.2",
"@partying/create-page": "git+ssh://git@github.com:olachat/partying-create-page.git#v1.2.3"
```

The `.npmrc` in each subproject also declares `@ola:registry=http://tsp.aopacloud.net/verdaccio/` as a fallback/legacy mirror, but the explicit `git+ssh` specs in `package.json` take precedence for all actively-used `@ola` packages.

Key private packages:
- `@ola/zh-scanner` — Chinese character scanner for i18n
- `@ola/babel-plugin-react-scoped-css` — Scoped CSS babel plugin
- `@ola/rollup-plugin-scoped-css` — Scoped CSS rollup plugin
- `@ola/utils` — Shared utilities (pt-h5-utils)
- `@partying/create-page` — Project scaffolding CLI

---

## Key Design Decisions

1. **Monorepo of independent apps** — Each event has a short lifecycle; isolating dependencies prevents cascading breaks across unrelated projects.

2. **No shared node_modules** — Each subproject manages its own dependencies. This avoids version conflicts between projects of different ages.

3. **Protobuf-first API** — Proto files define the contract; all client code (types, API, mocks, hooks) is generated from them.

4. **px units everywhere** — Developers write `px` naturally; PostCSS converts to `vw` at build time for responsive mobile design.

5. **Scoped CSS** — Prevents style leaks between components without CSS modules or CSS-in-JS overhead.

6. **Legacy support** — `@vitejs/plugin-legacy` ensures pages work on iOS 11+ and Android 4.4+, supporting the app's wide user base.

7. **Native bridge** — H5 pages are embedded in the native app; the bridge layer handles authentication, navigation, and native feature access without the web page needing to know about the native implementation.
