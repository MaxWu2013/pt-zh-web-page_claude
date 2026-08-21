## Split Large cursor-agent Tasks Before Delegating

* **Before** running `/runner:sub-agents Run cursor-agent on <task>` (required by `CLAUDE.md` for all coding work), assess the task's size. If it bundles a **larger restructure** (e.g. reworking a page's component tree, extracting shared components, rewiring many call sites) **plus a full verification pass** (e.g. `pnpm build` across a subproject, a full typecheck, a lint sweep), do not hand it to a single sub-agent run as one prompt.
* Split it into a small sequence of narrower sub-agent runs instead, each with a scope small enough to finish well inside a normal turn:
  1. **Implement** the structural change alone (no test-writing, no full build bundled in).
  2. **Add/adjust tests or stories** for the change, as a separate run.
  3. **Verify** (`pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`) — either as its own run, or folded into step 2 if the change is small and the build is fast.
* Between steps, read the actual diff yourself (`git diff`, `Read`) before moving to the next step — don't chain sub-agent calls blind. Catch problems (e.g. a botched import path, UnoCSS classes that don't exist, scope creep into a sibling subproject) between steps rather than after a single large run has already touched everything.
* A single sub-agent run is fine for small-to-medium tasks (one new component file, one modal, a handful of i18n keys, a `service/dummy_data` stub). Splitting is specifically for when a **restructure** and a **full build** are bundled together — that combination is what tends to blow past a normal turn's time budget and forces the call into the background, where you lose the ability to course-correct mid-task.

### Why It Matters

A single cursor-agent invocation that both restructured a widget's entire layout *and* ran the package's full test suite exceeded the foreground timeout and had to move to the background — losing the ability to catch a problem (like a formatter mismatch, or scope creep) until the whole thing was already done. Smaller, sequential runs keep each step fast enough to review in real time and cheap enough to redo if one step goes wrong, instead of re-running an entire bundled task.

In this monorepo the same failure mode shows up as a cold `pnpm install` plus a first-time Vite build on top of a multi-file refactor: the install/build tail alone can eat the turn.

## Scope

Applies whenever delegating implementation work to cursor-agent via the `runner:sub-agents` skill, per the delegation rule in `CLAUDE.md`. Judgment call on "larger" — a good rule of thumb is: if the prompt you're about to send describes more than one of {structural rewrite, new tests, full build/typecheck, multi-file i18n/asset wiring, touching more than one subproject} in the same request, split it.
