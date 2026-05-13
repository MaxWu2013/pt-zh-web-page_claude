---
name: pt-zh-web-page
description: Answers questions about the pt-zh-web-page repository's architecture, structure, tech stack, build/deployment, i18n, and conventions. Use when the user asks how the repo is organized, where subprojects live, what the tech stack is, how CI/Kort builds work, how translations flow, or any "where is X / how does X work" question about this monorepo.
license: Proprietary
---

# pt-zh-web-page Architecture

This skill answers architecture and structure questions about the **pt-zh-web-page** monorepo (H5 pages for the "Partying" social app).

## How to use

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) — it is the authoritative reference for:
   - Top-level directory layout (`act/`, `tools/`, `h5/`, `h5-template/`, `.scripts/`, `docs/`)
   - Tech stack (modern Vite/React projects vs. legacy Webpack/CRA projects)
   - Subproject internal structure (`src/` layout, `service/`, `context/`, `hooks/`, etc.)
   - Application architecture (entry flow, data flow, native bridge, styling layers)
   - Translation / i18n system (text + image translation)
   - Build & deployment (per-subproject builds, Kort/Korthub CI, environments)
   - Branching & commit conventions
   - Private package installation (`@ola/*`, `@partying/*` via git+ssh)
   - Key design decisions and their rationale

2. Answer the question grounded in that document. Quote file paths as `path:line` where helpful.

3. If the question goes beyond the document (specific code behavior, a particular subproject's implementation), pair this with the actual source — start from the relevant `src/` path the doc points to, and verify before asserting.

## Notes

- The doc records a "Last validated" date near the top — if the repo has changed substantially since then, say so rather than treating it as current truth.
- For conventions enforced in code (commit format, AI conventions, build commands), `CLAUDE.md` at the repo root is the operative source; ARCHITECTURE.md is the explanatory companion.
