#!/bin/bash
#
# analyze-dependabot.sh
# Analyze dependabot alerts and generate a prioritized report
#
# Usage: ./analyze-dependabot.sh [owner/repo]

set -e

REPO=${1:-$(gh repo view --json nameWithOwner -q '.nameWithOwner')}

echo "🔍 Analyzing dependabot alerts for: $REPO"
echo ""

# Fetch all open dependabot alerts
echo "📊 Fetching open dependabot alerts..."
ALERTS=$(gh api repos/$REPO/dependabot/alerts --paginate --jq '[.[] | select(.state == "open")]')

if [ -z "$ALERTS" ] || [ "$ALERTS" = "[]" ]; then
    echo "✅ No open dependabot alerts found!"
    exit 0
fi

# Count by severity
echo "📈 Severity Breakdown:"
echo "$ALERTS" | jq -r '
    group_by(.security_advisory.severity) |
    map({severity: .[0].security_advisory.severity, count: length}) |
    sort_by(.severity) |
    reverse |
    .[] |
    "  \(.severity | ascii_upcase): \(.count)"
'

echo ""

# Group by package
echo "📦 Top Vulnerable Packages:"
echo "$ALERTS" | jq -r '
    group_by(.dependency.package.name) |
    map({
        package: .[0].dependency.package.name,
        count: length,
        max_severity: (map(.security_advisory.severity) | max_by(if . == "critical" then 4 elif . == "high" then 3 elif . == "medium" then 2 else 1 end))
    }) |
    sort_by(-.count) |
    .[0:10] |
    .[] |
    "  \(.package): \(.count) alerts (max severity: \(.max_severity))"
'

echo ""

# List critical and high
echo "🚨 Critical & High Severity Alerts:"
echo "$ALERTS" | jq -r '
    map(select(.security_advisory.severity | test("critical|high"))) |
    sort_by(.security_advisory.severity) |
    .[0:20] |
    .[] |
    "  [\(.security_advisory.severity | ascii_upcase)] \(.dependency.package.name): \(.security_advisory.summary) (CVE: \(.security_advisory.cve_id // "N/A"))"
'

echo ""

# Summary
echo "📋 Summary:"
echo "$ALERTS" | jq -r '
    {
        total: length,
        critical: map(select(.security_advisory.severity == "critical")) | length,
        high: map(select(.security_advisory.severity == "high")) | length,
        medium: map(select(.security_advisory.severity == "medium")) | length,
        low: map(select(.security_advisory.severity == "low")) | length
    } |
    "  Total open alerts: \(.total)
  Critical: \(.critical)
  High: \(.high)
  Medium: \(.medium)
  Low: \(.low)"
'
