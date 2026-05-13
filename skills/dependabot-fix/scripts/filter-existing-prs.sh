#!/bin/bash
#
# filter-existing-prs.sh
# Filter out manifests that are already covered by open PRs
#
# Usage: ./filter-existing-prs.sh [base-directory]

set -e

BASE_DIR=${1:-.}
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)

if [ -z "$REPO" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "🔍 Checking for open PRs that might cover dependabot fixes..."
echo ""

# Get all open PRs
OPEN_PRS=$(gh pr list --state open --json headRefName,title,body --jq '.[]')

if [ -z "$OPEN_PRS" ]; then
    echo "ℹ️  No open PRs found"
    exit 0
fi

# Find all package.json files
MANIFESTS=$(find "$BASE_DIR" -name "package.json" -not -path "*/node_modules/*" -not -path "*/tree/*" | sort)

echo "📋 Open PRs related to dependencies or security:"
echo "$OPEN_PRS" | jq -r '
    select(.title | test("dependabot|security|dependencies|deps|audit|vulnerability"; "i")) |
    "  [\(.headRefName)] \(.title)"
'

echo ""
echo "⚠️  Manifests that might be covered by existing PRs:"

for manifest in $MANIFESTS; do
    manifest_dir=$(dirname "$manifest")
    project_name=$(basename "$manifest_dir")
    
    # Check if any PR mentions this project
    MATCHING_PRS=$(echo "$OPEN_PRS" | jq --arg project "$project_name" '
        select(.title | test($project; "i")) or
        select(.body | test($project; "i")) or
        select(.headRefName | test($project; "i"))
    ')
    
    if [ -n "$MATCHING_PRS" ] && [ "$MATCHING_PRS" != "null" ]; then
        echo "  ⚠️  $project_name - Found matching PR(s):"
        echo "$MATCHING_PRS" | jq -r '"     - [\(.headRefName)] \(.title)"'
    fi
done

echo ""
echo "💡 To see details of a specific PR: gh pr view <branch-name>"
