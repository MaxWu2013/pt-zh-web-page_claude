# Dependabot Fix Skill

Automated dependency vulnerability resolution for JavaScript/Node.js projects.

## Overview

This skill automates the process of:
1. Discovering dependabot security alerts via GitHub CLI
2. Identifying the most critical vulnerabilities across every reported manifest
3. Creating git worktrees for isolated fixes
4. Updating dependencies and resolutions
5. Verifying vulnerable versions are gone from the baseline alert scope
6. Creating comprehensive pull requests

## Usage

When a user asks to:
- "fix dependabot issues"
- "update dependencies for security"
- "resolve security vulnerabilities"
- "fix npm audit issues"

The skill will:
1. Ask which project to fix (or auto-detect)
2. Analyze vulnerabilities and prioritize
3. Create a git worktree
4. Fix dependencies
5. Run the repo's alert-driven lockfile verifier
6. Create a PR with detailed documentation

## Directory Structure

```
dependabot-fix/
├── SKILL.md                          # Main skill instructions
├── scripts/
│   ├── analyze-dependabot.sh         # Analyze dependabot alerts
│   ├── find-target-manifest.sh       # Find manifest with most vulnerabilities
│   └── filter-existing-prs.sh        # Filter out manifests covered by PRs
├── references/
│   ├── vulnerability-patterns.md     # Common vulnerabilities and fixes
│   ├── resolutions-reference.md      # Package manager resolution syntax
│   ├── troubleshooting.md            # Common issues and solutions
│   └── worktree-management.md        # Git worktree best practices
└── examples/
    ├── package-yarn.json             # Example package.json with yarn resolutions
    ├── package-npm.json              # Example package.json with npm overrides
    └── pr-description.md             # Example PR description template
```

## Scripts

### analyze-dependabot.sh

Analyzes open dependabot alerts and generates a prioritized report.

```bash
./scripts/analyze-dependabot.sh [owner/repo]
```

Output includes:
- Severity breakdown
- Top vulnerable packages
- Critical and high alerts
- Summary statistics

### find-target-manifest.sh

Finds the package.json with the most critical vulnerabilities.

```bash
./scripts/find-target-manifest.sh [base-directory]
```

Scans all manifests and scores them by vulnerability count, recommending the most critical one to fix first.

### filter-existing-prs.sh

Filters out manifests already covered by open PRs.

```bash
./scripts/filter-existing-prs.sh [base-directory]
```

Identifies which manifests might already be addressed by existing dependency update PRs.

## References

### vulnerability-patterns.md

Documents common vulnerability patterns:
- Prototype Pollution (lodash, minimist, etc.)
- Remote Code Execution (ejs, serialize-javascript)
- ReDoS (semver, path-to-regexp)
- XSS (react-router, sanitize-html)
- DoS (axios, qs, braces)
- SSRF (axios, follow-redirects)

### resolutions-reference.md

Complete reference for forcing secure dependency versions:
- Yarn (v1) resolutions
- NPM overrides
- Yarn 2/3 packageExtensions
- PNPM overrides

### troubleshooting.md

Common issues and solutions:
- Installation errors
- Build failures
- Resolution issues
- Runtime errors
- Git/worktree issues
- Testing issues

### worktree-management.md

Git worktree best practices:
- Why use worktrees
- Basic commands
- Naming conventions
- Workflow patterns
- Automation scripts

## Examples

### package-yarn.json

Example package.json demonstrating yarn resolutions for 40+ vulnerable packages.

### package-npm.json

Example package.json demonstrating npm overrides for 40+ vulnerable packages.

### pr-description.md

Template for comprehensive PR descriptions including:
- Summary of changes
- Security fixes list
- CVE references
- Testing checklist
- Breaking changes documentation

## Key Features

### Automatic Target Selection

If user doesn't specify a project, the skill will:
1. Scan all package.json files
2. Query dependabot alerts for each
3. Filter out manifests covered by open PRs
4. Sort by: Critical > High > Medium severity
5. Recommend the most critical manifest

### Comprehensive Security Fixes

The skill addresses:
- Direct dependency updates
- Transitive dependency resolutions
- Build configuration updates
- Breaking change mitigations
- Alert-driven verification for `act/`, `tools/`, `h5/`, `h5-template/`, `.scripts/`, and root manifests
- PNPM, NPM, Yarn v1, and `package.json` alerts with sibling lockfiles

### Baseline Verification

For this repo, use Dependabot alert JSON as the source of truth:

```bash
bash .scripts/dependabot/fetch-open-alerts.sh olachat pt-zh-web-page /tmp/dependabot-open-before.json open
node .scripts/dependabot/summarize-alerts.mjs --input /tmp/dependabot-open-before.json --format table --out-ids /tmp/all-alert-ids-before.txt
node .scripts/dependabot/check-alert-locks.mjs --alerts /tmp/dependabot-open-before.json
```

Use `--include-prefix tools/taskcenter/` or `--manifest tools/taskcenter/yarn.lock` only when intentionally verifying a scoped fix.

### Isolated Development

All fixes are performed in git worktrees:
- No disruption to main branch
- Easy to discard if needed
- Clean separation of concerns
- Supports multiple simultaneous fixes

### Detailed Documentation

PRs include:
- Complete list of updated packages
- All fixed CVEs with descriptions
- Testing checklist
- Migration notes
- Breaking changes documentation

## Integration

This skill integrates with:
- GitHub CLI (`gh`) for PR operations
- Git worktrees for isolated development
- Yarn/NPM for dependency management
- Node.js for build testing

## Requirements

- GitHub CLI (`gh`) installed and authenticated
- Git with worktree support
- Node.js and npm/yarn
- Write access to target repository

## Version History

### 1.0.0
- Initial release
- Automatic target selection
- Git worktree workflow
- Comprehensive PR creation
- 40+ vulnerability patterns documented
