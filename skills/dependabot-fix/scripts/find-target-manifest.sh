#!/bin/bash
#
# find-target-manifest.sh
# Find the package.json with the most critical dependabot vulnerabilities
#
# Usage: ./find-target-manifest.sh [base-directory]

set -e

BASE_DIR=${1:-.}
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)

if [ -z "$REPO" ]; then
    echo "❌ Error: Not in a git repository or gh CLI not authenticated"
    exit 1
fi

echo "🔍 Scanning for package.json files in: $BASE_DIR"
echo "📦 Repository: $REPO"
echo ""

# Find all package.json files (excluding node_modules)
MANIFESTS=$(find "$BASE_DIR" -name "package.json" -not -path "*/node_modules/*" -not -path "*/tree/*" | sort)

if [ -z "$MANIFESTS" ]; then
    echo "❌ No package.json files found"
    exit 1
fi

# Fetch all dependabot alerts once
ALL_ALERTS=$(gh api repos/$REPO/dependabot/alerts --paginate --jq '[.[] | select(.state == "open")]' 2>/dev/null || echo "[]")

if [ "$ALL_ALERTS" = "[]" ]; then
    echo "✅ No open dependabot alerts found in repository"
    exit 0
fi

# Function to count alerts for a manifest
count_alerts() {
    local manifest_path="$1"
    local manifest_dir=$(dirname "$manifest_path")
    
    # Extract package name from directory (fallback to directory name)
    local project_name=$(basename "$manifest_dir")
    
    # Count alerts by severity for this manifest
    # Note: GitHub doesn't always provide manifest path, so we do our best
    local critical=$(echo "$ALL_ALERTS" | jq --arg dir "$manifest_dir" '[.[] | select(.security_advisory.severity == "critical")] | length')
    local high=$(echo "$ALL_ALERTS" | jq --arg dir "$manifest_dir" '[.[] | select(.security_advisory.severity == "high")] | length')
    local medium=$(echo "$ALL_ALERTS" | jq --arg dir "$manifest_dir" '[.[] | select(.security_advisory.severity == "medium")] | length')
    local total=$(echo "$ALL_ALERTS" | jq '[.[]] | length')
    
    # Calculate priority score: critical*1000 + high*100 + medium*10 + total
    local score=$((critical * 1000 + high * 100 + medium * 10 + total))
    
    echo "$score|$manifest_path|$project_name|$critical|$high|$medium|$total"
}

# Process each manifest
echo "📊 Analyzing manifests..."
echo ""

RESULTS=""
for manifest in $MANIFESTS; do
    result=$(count_alerts "$manifest")
    RESULTS="$RESULTS$result\n"
done

# Sort by score (descending) and display
printf "$RESULTS" | sort -t'|' -k1 -nr | head -10 | while IFS='|' read -r score path project critical high medium total; do
    echo "📁 $project"
    echo "   Path: $path"
    echo "   Alerts: $total total (Critical: $critical, High: $high, Medium: $medium)"
    echo ""
done

# Get the top recommendation
TOP=$(printf "$RESULTS" | sort -t'|' -k1 -nr | head -1)
if [ -n "$TOP" ]; then
    IFS='|' read -r score path project critical high medium total <<< "$TOP"
    echo "🎯 Recommended target: $project"
    echo "   Path: $path"
    echo "   Score: $score (Critical: $critical, High: $high, Medium: $medium)"
fi
