---
name: dependabot-fix
description: |
  This skill should be used when the user asks to "fix dependabot issues", "update dependencies for security", "resolve security vulnerabilities", "fix npm audit issues", provides a Dependabot URL, or needs dependency security patches across JavaScript/Node.js projects.
version: 2.0.0
license: Proprietary
---

# Dependabot Fix Automation

Automate the discovery and resolution of Dependabot security vulnerabilities across JavaScript/Node.js projects. Treat Dependabot alert JSON as the source of truth for affected manifests; do not assume root, `act/`, or a single lockfile covers the repo.

## When to Use

- User asks to "fix dependabot issues" or "resolve security vulnerabilities"
- User provides a Dependabot URL or mentions a specific project path
- Need to prioritize which vulnerabilities to fix first
- Working with npm/yarn projects with security warnings

## Prerequisites

- GitHub CLI (`gh`) is installed and authenticated
- User has write access to the repository
- Node.js and yarn/npm are available
- `agent-browser` is available for post-fix smoke testing

## Workflow

### Step 1: Identify Target & Branch

Ask user or auto-detect which project to fix and which branch to work on.

**If user specifies a branch (e.g. `tree/fix-xxx`):**
- Check if it's a git worktree: `git worktree list`
- If the branch is already checked out in a worktree, work from that worktree directory directly
- If not, checkout or create the branch

**If creating fresh:**
```bash
git worktree add -b fix/dependabot-[project-name] tree/fix-dependabot-[project-name] master
```

### Step 2: Fetch Dependabot Alerts via GitHub API

**Critical: Use the exact commands below.** The Dependabot API does NOT support `page=N` pagination — you MUST use `--paginate` with `--jq`.

#### Fetch all open alerts for a specific project

```bash
GH_PAGER=cat gh api \
  "/repos/{owner}/{repo}/dependabot/alerts?per_page=100&state=open" \
  --paginate \
  --jq '.[] | select(.dependency.manifest_path | test("TARGET_PATH")) | "\(.number)|\(.dependency.package.name)|\(.security_advisory.severity)|\(.security_vulnerability.vulnerable_version_range)|\(.security_vulnerability.first_patched_version.identifier // "N/A")|\(.dependency.manifest_path)"'
```

Replace `TARGET_PATH` with the project path regex (e.g., `tools/taskcenter`).

**Example output:**
```
4489|axios|high|<= 1.13.4|1.13.5|tools/taskcenter/yarn.lock
4074|lodash|medium|>= 4.0.0, <= 4.17.22|4.17.23|tools/taskcenter/yarn.lock
3282|shell-quote|critical|>= 1.6.3, <= 1.7.2|1.7.3|tools/taskcenter/yarn.lock
```

#### Alternative: Save to file and process with Python

```bash
GH_PAGER=cat gh api "/repos/{owner}/{repo}/dependabot/alerts?per_page=100&state=open" \
  --paginate > /tmp/dependabot_alerts.json
```

Then filter with a Python script (useful when `--jq` is not available or for complex filtering).

#### Preferred local scripts (repo workflow)

Use the repository scripts when available:

```bash
bash .scripts/dependabot/fetch-open-alerts.sh olachat pt-zh-web-page /tmp/dependabot-open-before.json open
node .scripts/dependabot/summarize-alerts.mjs --input /tmp/dependabot-open-before.json --format table --out-ids /tmp/all-alert-ids-before.txt
node .scripts/dependabot/check-alert-locks.mjs --alerts /tmp/dependabot-open-before.json
```

This gives baseline IDs and proves whether reported manifests still contain vulnerable versions. The local checker reads each alert's `dependency.manifest_path`, package name, and vulnerable version range, then checks `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, and sibling lockfiles for `package.json` alerts.

To focus one area intentionally, scope both summary and verification:

```bash
node .scripts/dependabot/summarize-alerts.mjs --input /tmp/dependabot-open-before.json --manifest tools/taskcenter/yarn.lock --format table --out-ids /tmp/taskcenter-alert-ids-before.txt
node .scripts/dependabot/check-alert-locks.mjs --alerts /tmp/dependabot-open-before.json --include-prefix tools/taskcenter/
```

Trace trigger chains for the affected lockfile before remediation:

```bash
node .scripts/dependabot/trace-alert-causes.mjs \
  --alerts /tmp/dependabot-open-before.json \
  --manifest tools/taskcenter/yarn.lock \
  --lockfile tools/taskcenter/yarn.lock \
  --out /tmp/taskcenter-alert-causes-before.md
```

#### Gotchas

- **`GH_PAGER=cat`** is required — without it, `gh` opens a pager that blocks terminal
- **`--paginate`** is required for repos with >100 alerts, but do NOT combine with `page=N` (API returns 400)
- **Cursor-based pagination** (`before=...`) from the Dependabot web UI is NOT compatible with the API — ignore URL cursors
- **Do not filter only root or `act/` alerts** — this repo also has alerts under `tools/`, `h5/`, `h5-template/`, `.scripts/`, and package-level `package.json` manifests
- The `admin:repo_hook` scope warning can be ignored for read-only alert fetching

### Step 3: Categorize Alerts

From the fetched alerts, categorize:

1. **Fixable via resolution/override** — has a `first_patched_version` and the fix is a minor/patch bump
2. **Fixable via direct dependency update** — the vulnerable package is a direct dependency in `package.json`  
3. **Unfixable without major refactoring** — no patch available, or fix requires a major version bump of the build tool (e.g., webpack 4→5)

Group the "unfixable" ones for documentation in the commit message.

### Step 4: Fix Dependencies

#### 4a. Update direct dependencies in `package.json`

For packages listed directly in `dependencies` or `devDependencies`:
```json
"axios": "^1.13.5"   // was "^1.7.9"
"semver": "6.3.1"    // was "6.3.0"
```

#### 4b. Add resolutions for transitive dependencies (Yarn v1)

Add to `"resolutions"` in `package.json`. This forces ALL instances of a package across the dependency tree to the specified version.

**Important:** Only add TRANSITIVE dependencies here — packages that are NOT direct dependencies. If a package is already listed in `dependencies` or `devDependencies`, update that version instead.

**Best Practice:** Keep entries sorted alphabetically (with `@scoped` packages first) to prevent duplicates and improve scannability.

```json
"resolutions": {
  "@babel/helpers": "^7.26.10",
  "@babel/runtime": "^7.26.10",
  "ansi-html": "^0.0.8",
  "brace-expansion": "^1.1.12",
  "braces": "^3.0.3",
  "browserslist": "^4.16.5",
  "cipher-base": "^1.0.5",
  "cross-spawn": "^7.0.5",
  "elliptic": "^6.6.1",
  "follow-redirects": "^1.15.6",
  "js-yaml": "^3.14.2",
  "loader-utils": "^1.4.2",
  "lodash": "^4.17.23",
  "micromatch": "^4.0.8",
  "minimatch": "^3.0.5",
  "nanoid": "^3.3.8",
  "node-forge": "^1.3.2",
  "nth-check": "^2.0.1",
  "object-path": "^0.11.8",
  "on-headers": "^1.1.0",
  "path-to-regexp": "^0.1.12",
  "pbkdf2": "^3.1.3",
  "serialize-javascript": "^3.1.0",
  "sha.js": "^2.4.12",
  "shell-quote": "^1.7.3",
  "sockjs": "^0.3.20",
  "tmp": "^0.2.4"
}
```

#### 4c. For NPM/PNPM projects, use `"overrides"` instead of `"resolutions"`

```json
"overrides": {
  "package-name": "^secure.version"
}
```

### Step 5: Rebuild Lock File

```bash
# For Yarn v1 (most projects in this repo)
yarn install

# For NPM
npm install
```

**Do NOT delete the lock file first** — `yarn install` with resolutions will update in-place.

### Step 6: Verify Fixes

Run the repo verifier against the original baseline alert JSON:

```bash
node .scripts/dependabot/check-alert-locks.mjs --alerts /tmp/dependabot-open-before.json
```

For an intentionally scoped fix, use `--include-prefix` or `--manifest`:

```bash
node .scripts/dependabot/check-alert-locks.mjs --alerts /tmp/dependabot-open-before.json --include-prefix tools/taskcenter/
node .scripts/dependabot/check-alert-locks.mjs --alerts /tmp/dependabot-open-before.json --manifest tools/taskcenter/yarn.lock
```

This command must be clean for the intended scope before claiming the lockfile fix is correct. If it fails, use the reported alert numbers, packages, ranges, and vulnerable resolved versions as the next remediation list.

#### Step 6b: Verify alert closure by baseline IDs

```bash
bash .scripts/dependabot/fetch-open-alerts.sh olachat pt-zh-web-page /tmp/dependabot-open-after.json open
jq -r '.[].number' /tmp/dependabot-open-after.json | sort -n > /tmp/open-alert-ids-after.txt
while read -r id; do
  if grep -qx "$id" /tmp/open-alert-ids-after.txt; then
    echo "$id OPEN"
  else
    echo "$id CLOSED_OR_RESCANNING"
  fi
done < /tmp/all-alert-ids-before.txt
```

If IDs remain open immediately after changes, re-check after merge to default branch and allow Dependabot rescan delay.

#### Step 6c: `agent-browser` smoke test after dependency updates

Use this for affected web apps:

```bash
agent-browser open http://localhost:4173 && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i && \
agent-browser screenshot /tmp/dependabot-smoke.png
```

Record screenshot/snapshot evidence in the final report.

### Step 7: Commit

```bash
git add package.json yarn.lock  # or package-lock.json
git commit --no-verify -m "fix(PROJECT): resolve Dependabot security vulnerabilities for PACKAGE_LIST"
```

**Critical:** Use `--no-verify` when working in git worktrees — husky pre-commit hooks fail because `.husky/_/husky.sh` is not found in the worktree.

### Step 8: Push & PR (if requested)

```bash
git push origin BRANCH_NAME
gh pr create --title "fix(deps): resolve Dependabot vulnerabilities for PROJECT" --body "..."
```

## Common Gotchas & Lessons Learned

### Terminal Issues
- **Multiline commit messages** often get mangled in VS Code terminals — use single-line `-m` or write to a file and use `git commit -F`
- **Heredocs** (`<< 'EOF'`) get corrupted in zsh terminals — always write scripts to temp `.py` or `.sh` files first
- **`GH_PAGER=cat`** is required for all `gh api` calls to prevent blocking

### Git Worktree Issues  
- A branch already checked out in a worktree cannot be checked out elsewhere — use `cd` to the worktree path
- Husky hooks fail in worktrees — always use `--no-verify`
- Check `git worktree list` first to find the worktree path

### Dependency Resolution
- `yarn install` (without deleting lock file) correctly applies new resolutions
- Some packages may have multiple versions (e.g., `semver` 5.x, 6.x, 7.x) — this is expected when different major ranges are required by different dependents. What matters is that the vulnerable range is patched.
- `elliptic` alert `<= 6.6.1` with no patch: the resolution `^6.6.1` resolves to 6.6.1 which is the boundary — check if 6.6.2+ exists

### Package.json Best Practices
- **Sort resolutions/overrides alphabetically** — improves scannability and prevents duplicates; put `@scoped` packages first
- **Avoid duplicate keys** — JSON silently accepts duplicates but only the last one applies; always check for dupes when adding entries
- **Direct vs Transitive deps** — if a package is a direct dependency in `dependencies` or `devDependencies`, do NOT also add it to `resolutions`/`overrides`; update the direct dependency version instead
- **Version consistency** — ensure the direct dependency version matches or exceeds the patched version required by security advisories

### Project Compatibility Issues
- **Webpack 4 vs 5** — projects using `react-scripts@4.x` or webpack 4 CANNOT use webpack 5 overrides; attempting to force webpack 5 causes plugin API incompatibilities (`Invalid options object` errors)
- **PostCSS 7 vs 8** — older projects with PostCSS 7 plugins will break if PostCSS 8 is forced; error: `Cannot read properties of undefined (reading 'unprefixed')`; avoid `postcss` overrides for webpack 4 projects
- **Major version upgrades** — forcing major version bumps (e.g., `http-proxy-middleware` 1.x → 2.x) may break webpack-dev-server configurations; test builds after adding overrides
- **Check project stack first** — always identify the webpack/build tool version before adding overrides; use `grep -E "react-scripts|webpack" package.json` to check

### Unfixable Vulnerabilities
These typically cannot be fixed via resolutions and require major refactoring:
- **webpack-dev-server** / **webpack-dev-middleware** — requires webpack 5 migration
- **http-proxy-middleware** — incompatible with webpack-dev-server 3.x
- **react-dev-utils** — requires CRA major upgrade
- **ip**, **html-minifier**, **lodash.template**, **babel-traverse**, **request** — no patch available (deprecated/unmaintained)

Document these in the commit message as "Unfixable without major refactoring".

## Report Template

After fixing, provide this summary:

```
**Summary of fixes (N of M alerts):**

**Direct dependency updates:**
- `package` old → new

**Yarn resolutions added for N transitive deps** including list...

**Remaining unfixable (N alerts):**
| Package | Reason |
|---------|--------|
| name    | reason |
```

## Security Severity Guide

| Severity | CVSS Score | Action Timeline |
| -------- | ---------- | --------------- |
| Critical | 9.0-10.0   | Within 7 days   |
| High     | 7.0-8.9    | Within 30 days  |
| Medium   | 4.0-6.9    | Within 90 days  |
| Low      | 0.1-3.9    | When convenient |

## Validation Checklist

- [ ] Dependencies install without errors (`yarn install` succeeds)
- [ ] `.scripts/dependabot/check-alert-locks.mjs` passes for the intended baseline alert scope
- [ ] Baseline alert IDs saved for all intended manifests, not only root or `act/`
- [ ] No remaining fixable high/critical vulnerabilities
- [ ] Unfixable vulnerabilities documented
- [ ] Commit uses `--no-verify` in worktree
- [ ] Commit message lists key packages fixed
- [ ] User provided with summary of fixed vs remaining alerts

## Reference Files

- **`references/vulnerability-patterns.md`** — Common vulnerability patterns and fix snippets
- **`references/resolutions-reference.md`** — Resolutions/overrides by package manager
- **`references/troubleshooting.md`** — Common issues and solutions
- **`references/worktree-management.md`** — Git worktree best practices
- **`examples/package-yarn.json`** — Example package.json with yarn resolutions
- **`examples/package-npm.json`** — Example package.json with npm overrides
- **`examples/pr-description.md`** — Example PR description template
- **`scripts/analyze-dependabot.sh`** — Analyze alerts and generate report
- **`scripts/find-target-manifest.sh`** — Find manifest with most critical vulnerabilities
- **`scripts/filter-existing-prs.sh`** — Filter manifests already covered by open PRs
