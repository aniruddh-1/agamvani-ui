#!/bin/bash

# Cleanup script to remove temporary GitHub Actions firewall rules
# Run this after successful deployment to improve security

set -e

HETZNER_API_TOKEN="${HETZNER_API_TOKEN:-}"
FIREWALL_ID="${FIREWALL_ID:-2415963}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }

if [ -z "$HETZNER_API_TOKEN" ]; then
    echo "⚠️  HETZNER_API_TOKEN not provided - skipping cleanup"
    exit 0
fi

echo_info "🧹 Cleaning up temporary GitHub Actions UI firewall rules..."

# Get current rules and remove GitHub Actions UI rules only
CURRENT_RULES_RESPONSE=$(curl -s \
    -H "Authorization: Bearer $HETZNER_API_TOKEN" \
    "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID")

# Remove only GitHub Actions UI rules (preserve API rules)
CLEANED_RULES=$(echo "$CURRENT_RULES_RESPONSE" | jq '.firewall.rules | map(select((.description // "") | test("^github-actions-ssh-ui") | not))')

# Update firewall
FIREWALL_PAYLOAD=$(jq -n --argjson rules "$CLEANED_RULES" '{"rules": $rules}')
RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $HETZNER_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIREWALL_PAYLOAD" \
    "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID/actions/set_rules")

if echo "$RESPONSE" | jq -e '.actions[0].status' > /dev/null; then
    ACTION_STATUS=$(echo "$RESPONSE" | jq -r '.actions[0].status')
    if [ "$ACTION_STATUS" = "success" ]; then
        echo_success "Temporary GitHub Actions UI firewall rules removed"
        echo_info "🔒 Server is now secured with original firewall rules only"
    fi
fi