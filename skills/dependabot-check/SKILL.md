---
name: dependabot-check
description: |
  This skill should be used when the user says "dependabot check", asks to "compare the dependabot issue with master", "compare dependabot issues before merge", "check if this branch increases dependabot issues", or wants a before/after Dependabot alert comparison against origin/master.
version: 1.0.0
license: Proprietary
---

# Dependabot Check

Compare the current branch or worktree against `origin/master` using the repository's current Dependabot alert snapshot. Use this as a pre-merge safety check to answer:

- Does this branch reduce known Dependabot alert hits?
- Does this branch introduce any alert IDs that were not present on `origin/master`?
- Which top-level folders improved or regressed?

This skill is read-only except for temporary files and temporary detached worktrees under `/tmp`.

## Trigger Phrases

Use this skill for:

- `dependabot check`
- `compare the dependabot issue with master`
- `compare dependabot issues before merge`
- `check if this branch adds dependabot issues`
- `did this branch increase dependabot alerts`

## Required Assumptions

- Compare against `origin/master` unless the user explicitly names another base.
- Evaluate the current working tree as the head state when there are uncommitted changes.
- If the worktree is dirty, state that the result includes uncommitted changes.
- Use Dependabot alert JSON as the source of truth for package names and vulnerable ranges.
- Do not use GitHub Dependency Review API as the primary path; it may return `403` for private repos without the required security feature.

## Workflow

### 1. Fetch the Base Branch

Run:

```bash
git fetch origin master --prune
```

Record:

```bash
git branch --show-current
git rev-parse HEAD
git rev-parse origin/master
git status --short
```

### 2. Fetch Current Open Dependabot Alerts

Run:

```bash
bash .scripts/dependabot/fetch-open-alerts.sh \
  olachat pt-zh-web-page /tmp/dependabot-open-before-current-branch.json open
```

This snapshot is the advisory/range source used for both base and head.

### 3. Create a Temporary Base Worktree

Run:

```bash
git worktree add --detach /tmp/dep-current-base-origin-master origin/master
```

If that path already exists, remove or choose a unique `/tmp/dep-current-base-<suffix>` path.

### 4. Replay Alerts Against Base and Head

Base:

```bash
node /absolute/path/to/repo/.scripts/dependabot/check-alert-locks.mjs \
  --alerts /tmp/dependabot-open-before-current-branch.json \
  2> /tmp/dep-current-base-failures.txt || true
```

Run the base command from the temporary worktree.

Head:

```bash
node .scripts/dependabot/check-alert-locks.mjs \
  --alerts /tmp/dependabot-open-before-current-branch.json \
  2> /tmp/dep-current-head-failures.txt || true
```

Run the head command from the user's current repository worktree.

For a scoped check, add one or more `--include-prefix` arguments to both base and head commands:

```bash
--include-prefix tools/ --include-prefix h5/
```

Only scope the check when the user explicitly asks for a folder scope. Otherwise check all current open alerts.

### 5. Compare Alert Hits

Run:

```bash
node - <<'NODE'
const fs = require('fs');

function parse(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.startsWith(' - '));
  const ids = [...new Set(lines.map((line) => (line.match(/alert #(\d+)/) || [])[1]).filter(Boolean))];
  const byTop = {};
  for (const line of lines) {
    const match = line.match(/^ - ([^:]+):/);
    if (!match) continue;
    const top = match[1].split('/')[0];
    byTop[top] = (byTop[top] || 0) + 1;
  }
  return { lines, ids, byTop };
}

const base = parse('/tmp/dep-current-base-failures.txt');
const head = parse('/tmp/dep-current-head-failures.txt');
const baseIds = new Set(base.ids);
const headIds = new Set(head.ids);
const added = [...headIds].filter((id) => !baseIds.has(id)).sort((a, b) => Number(a) - Number(b));
const removed = [...baseIds].filter((id) => !headIds.has(id)).sort((a, b) => Number(a) - Number(b));

console.log(JSON.stringify({
  base: {
    failureLines: base.lines.length,
    uniqueAlertIds: base.ids.length,
  },
  head: {
    failureLines: head.lines.length,
    uniqueAlertIds: head.ids.length,
  },
  newInHeadCount: added.length,
  removedFromHeadCount: removed.length,
  newInHead: added,
  removedFromHead: removed,
  byTop: [...new Set([...Object.keys(base.byTop), ...Object.keys(head.byTop)])]
    .sort()
    .map((key) => ({
      area: key,
      base: base.byTop[key] || 0,
      head: head.byTop[key] || 0,
      delta: (head.byTop[key] || 0) - (base.byTop[key] || 0),
    })),
}, null, 2));
NODE
```

### 6. Clean Up Temporary Worktree

Always remove the temporary worktree before reporting:

```bash
git worktree remove /tmp/dep-current-base-origin-master
```

If a unique temporary path was used, remove that path instead.

## Interpretation

Report the result as:

- `PASS`: head alert count is lower or equal to base, and `newInHeadCount` is `0`.
- `REGRESSION`: `newInHeadCount` is greater than `0`, even if the total count decreases.
- `WORSE`: head alert count is higher than base.

Use precise wording:

- "projected vulnerable alert hits" for local replay counts.
- "new alert IDs introduced by this branch" for IDs present in head but not base.
- "projected alert IDs fixed by this branch" for IDs present in base but not head.

Do not claim GitHub alerts are closed before merge. Final closure requires GitHub to rescan `master` after merge.

## Final Response Format

Use this concise structure:

```text
I ran `dependabot check` against <branch> vs origin/master.

Result: PASS/REGRESSION/WORSE

origin/master projected vulnerable alert hits: N
this branch projected vulnerable alert hits: N
new alert IDs introduced by this branch: N
projected alert IDs fixed by this branch: N

Breakdown by area:
area: base=N head=N delta=N

Notes:
- Includes uncommitted changes: yes/no
- Current open alert snapshot: /tmp/dependabot-open-before-current-branch.json
- Base failures: /tmp/dep-current-base-failures.txt
- Head failures: /tmp/dep-current-head-failures.txt
```

If there are new alert IDs, list them with manifest/package details by filtering `/tmp/dep-current-head-failures.txt`.

## Write Result to File

After reporting to the user, append the result to `dependabot-result.md` in the repo root.

Get the timestamp first:

```bash
date -u '+%Y-%m-%d %H:%M:%S UTC'
```

Then write/append using this format:

```markdown
## <TIMESTAMP>

**Branch:** <branch> vs origin/master
**Result:** PASS / REGRESSION / WORSE

| Metric                       | Value |
| ---------------------------- | ----- |
| origin/master projected hits | N     |
| this branch projected hits   | N     |
| new alert IDs introduced     | N     |
| projected alert IDs fixed    | N     |

**Breakdown by area:**

| Area | Base | Head | Delta |
| ---- | ---- | ---- | ----- |
| area | N    | N    | ±N    |

**Notes:**

- Includes uncommitted changes: yes/no
- Alert snapshot: `/tmp/dependabot-open-before-current-branch.json`

<details>
<summary>New alert IDs introduced (if any)</summary>

List each new alert ID with its manifest/package details here, or "None".

</details>

---
```

Always append — never overwrite the file. If `dependabot-result.md` does not exist, create it with this header first:

```markdown
# Dependabot Check Results

<!-- Results are appended automatically each time `dependabot check` is run. -->

---
```
