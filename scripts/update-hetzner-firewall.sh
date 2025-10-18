#!/bin/bash

# Script to update Hetzner Cloud firewall with GitHub Actions IP ranges
# SECURE VERSION - No hardcoded API tokens!

set -e

# Configuration - API token must be provided via environment variable
HETZNER_API_TOKEN="${HETZNER_API_TOKEN:-}"
FIREWALL_ID="${FIREWALL_ID:-2415963}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo_info "🔥 Starting Hetzner Cloud Firewall update for GitHub Actions"
echo_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Security check - ensure API token is provided
if [ -z "$HETZNER_API_TOKEN" ]; then
    echo_error "HETZNER_API_TOKEN environment variable is required!"
    echo_info "Usage: HETZNER_API_TOKEN=your_token ./update-hetzner-firewall.sh"
    echo_info "   or: export HETZNER_API_TOKEN=your_token && ./update-hetzner-firewall.sh"
    exit 1
fi

echo_success "API token provided securely via environment variable"

# Get GitHub Actions IP ranges
echo_info "📡 Fetching ALL GitHub Actions IP ranges..."
GITHUB_IPS=$(curl -s https://api.github.com/meta | jq -r '.actions[]')

if [ -z "$GITHUB_IPS" ]; then
    echo_error "Failed to fetch GitHub IP ranges"
    exit 1
fi

IP_COUNT=$(echo "$GITHUB_IPS" | wc -l | tr -d ' ')
echo_success "Fetched $IP_COUNT GitHub Actions IP ranges"
echo_info "   • IPv4 ranges: $(echo "$GITHUB_IPS" | grep -v ':' | wc -l | tr -d ' ')"
echo_info "   • IPv6 ranges: $(echo "$GITHUB_IPS" | grep ':' | wc -l | tr -d ' ')"

echo_info "🔧 Creating firewall rules payload with IP chunking..."
echo_warning "⚠️  Hetzner limit: Maximum 100 IPs per rule. Creating multiple GitHub rules..."

# Split IPs into chunks of 100 (Hetzner's limit)
echo "$GITHUB_IPS" | split -l 100 - /tmp/github_ips_chunk_

# Count chunks
CHUNK_COUNT=$(ls /tmp/github_ips_chunk_* | wc -l | tr -d ' ')
echo_info "   • Creating $CHUNK_COUNT GitHub Actions rules (100 IPs each)"

# Start building the rules JSON
cat > /tmp/firewall-rules.json << 'EOF'
{
  "rules": [
    {
      "description": "personal-ips-ssh-access",
      "direction": "in",
      "protocol": "tcp",
      "port": "22",
      "source_ips": [
        "152.57.0.0/16",
        "157.50.200.147/32",
        "180.151.196.170/32",
        "202.83.16.3/32"
      ],
      "destination_ips": []
    },
    {
      "description": "public-http-traffic",
      "direction": "in",
      "protocol": "tcp",
      "port": "80",
      "source_ips": [
        "0.0.0.0/0",
        "::/0"
      ],
      "destination_ips": []
    },
    {
      "description": "public-https-traffic",
      "direction": "in",
      "protocol": "tcp",
      "port": "443",
      "source_ips": [
        "0.0.0.0/0",
        "::/0"
      ],
      "destination_ips": []
    }
EOF

# Add GitHub rules for each chunk
CHUNK_NUM=1
for chunk_file in /tmp/github_ips_chunk_*; do
    if [ -f "$chunk_file" ]; then
        CHUNK_IPS=$(cat "$chunk_file" | jq -R . | jq -s .)
        
        # Add comma if not the first GitHub rule
        echo '    ,' >> /tmp/firewall-rules.json
        
        # Add the GitHub rule for this chunk
        cat >> /tmp/firewall-rules.json << EOF
    {
      "description": "github-actions-ssh-ui-$CHUNK_NUM",
      "direction": "in",
      "protocol": "tcp",
      "port": "22",
      "source_ips": $CHUNK_IPS,
      "destination_ips": []
    }
EOF
        CHUNK_NUM=$((CHUNK_NUM + 1))
    fi
done

# Close the JSON
cat >> /tmp/firewall-rules.json << 'EOF'
  ]
}
EOF

echo_success "Firewall rules payload created with $IP_COUNT GitHub Actions IPs"

echo_info "🚀 Updating firewall rules (ID: $FIREWALL_ID)..."

# Update the firewall using SET RULES action endpoint
RESPONSE=$(curl -s \
  -X POST \
  -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/firewall-rules.json \
  "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID/actions/set_rules")

# Check if successful (SET RULES returns actions, not firewall object)
if echo "$RESPONSE" | jq -e '.actions[0].status' > /dev/null; then
  ACTION_STATUS=$(echo "$RESPONSE" | jq -r '.actions[0].status')
  
  if [ "$ACTION_STATUS" = "success" ]; then
    echo_success "Firewall rules updated successfully!"
    
    # Get updated firewall to show summary
    sleep 2  # Wait for changes to propagate
    UPDATED_FIREWALL=$(curl -s \
      -H "Authorization: Bearer $HETZNER_API_TOKEN" \
      "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID")
    
    RULE_COUNT=$(echo "$UPDATED_FIREWALL" | jq '.firewall.rules | length')
    
    # Count all GitHub Actions UI rules and their IPs
    GITHUB_RULES_COUNT=$(echo "$UPDATED_FIREWALL" | jq '[.firewall.rules[] | select(.description | startswith("github-actions-ssh-ui"))] | length')
    GITHUB_RULE_IPS=$(echo "$UPDATED_FIREWALL" | jq '[.firewall.rules[] | select(.description | startswith("github-actions-ssh-ui")) | .source_ips[]] | length')
    
    # Detailed IP verification
    ACTUAL_IPV4=$(echo "$UPDATED_FIREWALL" | jq -r '.firewall.rules[] | select(.description | startswith("github-actions-ssh-ui")) | .source_ips[]' | grep -v ':' | wc -l | tr -d ' ')
    ACTUAL_IPV6=$(echo "$UPDATED_FIREWALL" | jq -r '.firewall.rules[] | select(.description | startswith("github-actions-ssh-ui")) | .source_ips[]' | grep ':' | wc -l | tr -d ' ')
    
    echo_info "📊 Summary:"
    echo_info "   • Total firewall rules: $RULE_COUNT"
    echo_info "   • GitHub Actions UI rules created: $GITHUB_RULES_COUNT"
    echo_info "   • GitHub Actions UI IPs added: $GITHUB_RULE_IPS"
    echo_info "   • IPv4 ranges in firewall: $ACTUAL_IPV4"
    echo_info "   • IPv6 ranges in firewall: $ACTUAL_IPV6"
    echo_info "   • Firewall ID: $FIREWALL_ID"
    
    # Verification check
    if [ "$GITHUB_RULE_IPS" = "$IP_COUNT" ]; then
        echo_success "✅ VERIFICATION: All $IP_COUNT GitHub IPs successfully added!"
    else
        echo_warning "⚠️  VERIFICATION: Expected $IP_COUNT IPs, but firewall has $GITHUB_RULE_IPS"
    fi
  else
    echo_error "Firewall update action failed: $ACTION_STATUS"
    exit 1
  fi
  
else
  echo_error "Failed to update firewall rules!"
  echo_error "Response: $(echo "$RESPONSE" | jq '.')"
  rm -f /tmp/firewall-rules.json
  exit 1
fi

# Cleanup
rm -f /tmp/firewall-rules.json
rm -f /tmp/github_ips_chunk_*

echo_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo_success "🎉 Firewall update completed!"
echo_info "🔒 Your server now allows SSH access from GitHub Actions runners"
echo_warning "⚠️  IMPORTANT: Test your GitHub Actions deployment now!"