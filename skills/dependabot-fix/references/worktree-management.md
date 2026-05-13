# Git Worktree Best Practices

This guide covers effective use of git worktrees for isolated dependency fixing.

## Why Use Worktrees?

**Benefits:**

- Isolate changes from main development branch
- Work on multiple fixes simultaneously
- No stashing/unstashing needed when switching tasks
- Clean separation of concerns
- Easy to discard if needed

## Basic Worktree Commands

### List Worktrees

```bash
git worktree list
```

Output:

```
/path/to/main/repo        19f0411c1 [main]
/path/to/tree/fix-axios   a1b2c3d4e [fix/axios-update]
/path/to/tree/fix-webpack b2c3d4e5f [fix/webpack-config]
```

### Create Worktree from Existing Branch

```bash
git worktree add tree/fix-dependabot fix/dependabot-security-updates
```

### Create Worktree with New Branch

```bash
git worktree add -b fix/new-branch tree/fix-new-branch master
```

### Remove Worktree

```bash
# Safe remove (fails if uncommitted changes)
git worktree remove tree/fix-branch

# Force remove
git worktree remove -f tree/fix-branch
```

### Prune Stale Worktrees

```bash
git worktree prune
```

## Worktree Naming Convention

Recommended pattern:

```
tree/fix-[project]-[description]
```

Examples:

- `tree/fix-statical2021-dependabot`
- `tree/fix-pt-invite-security`
- `tree/fix-main-deps`

## Directory Structure

```
project-root/
├── .git/                 # Main git directory
├── src/                  # Main source code
├── tree/                 # Worktrees directory
│   ├── fix-project1/
│   │   ├── package.json
│   │   └── ...
│   └── fix-project2/
│       ├── package.json
│       └── ...
└── package.json          # Root package.json
```

## Workflow with Worktrees

### Step 1: Create Worktree

```bash
# From main repo
cd /path/to/main/repo

# Create tree directory
mkdir -p tree

# Add worktree
git worktree add tree/fix-deps fix/dependabot-branch
```

### Step 2: Navigate and Work

```bash
# Enter worktree
cd tree/fix-deps

# Verify branch
git branch

# Make changes
# Edit package.json, update dependencies
```

### Step 3: Commit and Push

```bash
# In worktree
git add -A
git commit -m "fix(deps): address security vulnerabilities"
git push origin fix/dependabot-branch
```

### Step 4: Create PR

```bash
gh pr create --title "fix(deps): address security vulnerabilities" --body "..."
```

### Step 5: Cleanup (after merge)

```bash
# Return to main repo
cd /path/to/main/repo

# Remove worktree
git worktree remove tree/fix-deps

# Delete branch (optional)
git branch -D fix/dependabot-branch
```

## Advanced Worktree Patterns

### Multiple Fixes Simultaneously

```bash
# Create worktrees for different projects
git worktree add tree/fix-project1 fix/project1-deps
git worktree add tree/fix-project2 fix/project2-deps
git worktree add tree/fix-project3 fix/project3-deps

# Work on each independently
cd tree/fix-project1 && yarn install
cd tree/fix-project2 && yarn install
cd tree/fix-project3 && yarn install
```

### Temporary Experimental Worktree

```bash
# Create temporary worktree for testing
git worktree add -b experiment/test tree/temp-test master

# Do experimental work
cd tree/temp-test
# Make changes...

# If successful, merge or cherry-pick
# If not, just remove
git worktree remove -f tree/temp-test
```

### Worktree for Review

```bash
# Checkout PR branch in worktree
git worktree add tree/pr-123 origin/pr-branch

# Review changes
cd tree/pr-123
# Test, review code...

# Clean up when done
git worktree remove tree/pr-123
```

## Common Worktree Issues

### Issue: "is already checked out"

```
fatal: 'tree/fix-branch' is already checked out
```

**Solution:**

```bash
# Remove existing
git worktree remove tree/fix-branch

# Or force remove if corrupted
git worktree remove -f tree/fix-branch
rm -rf tree/fix-branch  # Manual cleanup
git worktree prune
```

### Issue: Uncommitted Changes

```
fatal: 'tree/fix-branch' contains modified or untracked files
```

**Solution:**

```bash
# In worktree, commit or stash changes
cd tree/fix-branch
git add -A
git stash

# Now remove
cd /path/to/main/repo
git worktree remove tree/fix-branch
```

### Issue: Lock Files

Node.js lock files (yarn.lock, package-lock.json) can cause issues across worktrees.

**Best Practice:**

```bash
# In worktree, always regenerate lock file
rm -f yarn.lock
yarn install

# Don't copy lock files between worktrees
```

## Worktree Best Practices

### 1. Always Work in Worktrees for Dependency Fixes

- Prevents pollution of main branch
- Easy to start over if things go wrong
- Clean git history

### 2. Use Descriptive Names

```bash
# Good
tree/fix-statical2021-axios-cve
tree/fix-main-react-scripts-v5

# Bad
tree/fix1
tree/temp
```

### 3. Clean Up Regularly

```bash
# List all worktrees
git worktree list

# Remove merged/obsolete worktrees
git worktree remove tree/fix-merged-branch

# Prune stale entries
git worktree prune
```

### 4. Keep Worktrees Independent

- Don't share node_modules between worktrees
- Each worktree should have its own lock file
- Don't reference files outside worktree

### 5. Document Worktree Purpose

```bash
# Create README in worktree
cd tree/fix-deps
echo "# Fix: axios CVE-2021-3749" > WORKTREE_README.md
echo "Branch: fix/axios-security" >> WORKTREE_README.md
echo "Created: $(date)" >> WORKTREE_README.md
git add WORKTREE_README.md
```

## Worktree + Dependency Fix Workflow

Complete example workflow:

```bash
# 1. From main repo
cd /path/to/main/repo

# 2. Check existing worktrees
git worktree list

# 3. Create worktree for fix
mkdir -p tree
git worktree add -b fix/dependabot-security tree/fix-dependabot master

# 4. Enter worktree
cd tree/fix-dependabot

# 5. Navigate to target project
cd tools/target-project

# 6. Fix dependencies
# - Update package.json
# - Add resolutions
# - etc.

# 7. Test
rm -f yarn.lock
yarn install
yarn build

# 8. Commit
git add -A
git commit -m "fix(deps): address dependabot vulnerabilities"

# 9. Push
git push origin fix/dependabot-security

# 10. Create PR
gh pr create --title "fix(deps): ..." --body "..."

# 11. Return to main repo
cd /path/to/main/repo

# 12. Clean up (after PR merged)
git worktree remove tree/fix-dependabot
git branch -D fix/dependabot-security
```

## Automation Script

```bash
#!/bin/bash
# create-fix-worktree.sh

PROJECT=$1
BRANCH_NAME="fix/dependabot-${PROJECT}"
WORKTREE_PATH="tree/fix-${PROJECT}"

# Create worktree
mkdir -p tree
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" master

# Create README
cat > "$WORKTREE_PATH/WORKTREE_README.md" << EOF
# Dependabot Fix Worktree

Project: $PROJECT
Branch: $BRANCH_NAME
Created: $(date)
Purpose: Fix dependabot security vulnerabilities

## Commands

\`\`\`bash
# Install dependencies
cd tools/$PROJECT && rm -f yarn.lock && yarn install

# Test build
yarn build

# Commit changes
git add -A
git commit -m "fix(deps): address dependabot vulnerabilities"

# Push
git push origin $BRANCH_NAME

# Create PR
gh pr create --title "fix(deps): ..." --body "..."
\`\`\`

## Cleanup
\`\`\`bash
git worktree remove $WORKTREE_PATH
git branch -D $BRANCH_NAME
\`\`\`
EOF

echo "Worktree created at: $WORKTREE_PATH"
echo "Branch: $BRANCH_NAME"
echo ""
echo "Next steps:"
echo "  cd $WORKTREE_PATH"
echo "  # Make your changes"
echo "  # Commit and push"
```

## Summary

**Key Takeaways:**

1. Always use worktrees for dependency fixes
2. Name worktrees descriptively
3. Don't share dependencies between worktrees
4. Clean up after merge
5. Document purpose in worktree

Worktrees provide a clean, isolated environment for making changes without affecting main development. They're especially valuable for dependency updates where multiple attempts might be needed.
