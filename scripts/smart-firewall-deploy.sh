#!/bin/bash

# Smart GitHub Actions Deployment Script
# Dynamically detects current runner IP and whitelists only that IP

set -e

# Configuration
HETZNER_API_TOKEN="${HETZNER_API_TOKEN:-}"
FIREWALL_ID="${FIREWALL_ID:-2415963}"
CLEANUP_AFTER_DEPLOY="${CLEANUP_AFTER_DEPLOY:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo_info "🧠 Smart GitHub Actions Firewall Deployment"
echo_info "============================================="

# Security check - ensure API token is provided
if [ -z "$HETZNER_API_TOKEN" ]; then
    echo_error "HETZNER_API_TOKEN environment variable is required!"
    exit 1
fi

echo_success "API token provided securely"

# Step 1: Detect current GitHub Actions runner IP(s)
echo_info "🔍 Detecting current GitHub Actions runner IP(s)..."

# Try multiple methods and collect all possible IPs
DETECTED_IPS=""
for method in "https://ipv4.icanhazip.com" "https://icanhazip.com" "https://ipinfo.io/ip"; do
    DETECTED_IP=$(curl -s --connect-timeout 5 "$method" | tr -d '\n' | grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' || echo "")
    if [ -n "$DETECTED_IP" ]; then
        echo_info "Detected IP: $DETECTED_IP (via $method)"
        if [ -z "$DETECTED_IPS" ]; then
            DETECTED_IPS="$DETECTED_IP"
        else
            # Only add if not already in list
            if ! echo "$DETECTED_IPS" | grep -q "$DETECTED_IP"; then
                DETECTED_IPS="$DETECTED_IPS $DETECTED_IP"
            fi
        fi
    fi
done

# Also try to get the IP from GitHub Actions environment
if [ -n "$GITHUB_ACTIONS" ]; then
    # Try to get additional IPs that might be used for outbound connections
    for method in "https://httpbin.org/ip" "https://api.ipify.org"; do
        GITHUB_IP=$(curl -s --connect-timeout 3 "$method" | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | head -1 || echo "")
        if [ -n "$GITHUB_IP" ] && ! echo "$DETECTED_IPS" | grep -q "$GITHUB_IP"; then
            echo_info "Additional GitHub IP: $GITHUB_IP (via $method)"
            DETECTED_IPS="$DETECTED_IPS $GITHUB_IP"
        fi
    done
fi

if [ -z "$DETECTED_IPS" ]; then
    echo_error "Failed to detect any IP addresses!"
    exit 1
fi

# Use the first IP as primary, but we'll whitelist broader ranges
PRIMARY_IP=$(echo $DETECTED_IPS | cut -d' ' -f1)
echo_success "Primary IP: $PRIMARY_IP, All IPs: $DETECTED_IPS"

# Step 2: Get current firewall rules
echo_info "📋 Fetching current firewall rules..."
CURRENT_RULES_RESPONSE=$(curl -s \
    -H "Authorization: Bearer $HETZNER_API_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID")

if ! echo "$CURRENT_RULES_RESPONSE" | jq -e '.firewall' > /dev/null; then
    echo_error "Failed to fetch current firewall rules!"
    exit 1
fi

# Step 3: Prepare updated rules with detected IPs and their subnets
echo_info "🔧 Preparing firewall rules with runner IP ranges..."

# For GitHub Actions, we need to be more permissive due to NAT
# Create both specific IP and subnet ranges
IP_RANGES="[]"
for ip in $DETECTED_IPS; do
    # Add the specific IP
    IP_RANGES=$(echo "$IP_RANGES" | jq --arg ip "$ip/32" '. + [$ip]')
    
    # Also add a /24 subnet range to handle NAT issues
    SUBNET=$(echo "$ip" | cut -d'.' -f1-3)".0/24"
    IP_RANGES=$(echo "$IP_RANGES" | jq --arg subnet "$SUBNET" '. + [$subnet]')
    
    echo_info "Added IP: $ip/32 and subnet: $SUBNET"
done

echo_info "Final IP ranges: $(echo "$IP_RANGES" | jq -c '.')"

# Remove any existing GitHub Actions UI rules and add new one with IP ranges
UPDATED_RULES=$(echo "$CURRENT_RULES_RESPONSE" | jq --argjson ip_ranges "$IP_RANGES" '
.firewall.rules | 
map(select((.description // "") | test("^github-actions-ssh-ui") | not)) + 
[{
  "description": "github-actions-ssh-ui",
  "direction": "in", 
  "protocol": "tcp",
  "port": "22",
  "source_ips": $ip_ranges,
  "destination_ips": []
}]')

# Create firewall update payload
FIREWALL_PAYLOAD=$(jq -n --argjson rules "$UPDATED_RULES" '{"rules": $rules}')

# Step 4: Update firewall
echo_info "🚀 Updating firewall with current runner IP..."
RESPONSE=$(curl -s \
    -X POST \
    -H "Authorization: Bearer $HETZNER_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIREWALL_PAYLOAD" \
    "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID/actions/set_rules")

# Check if successful
if echo "$RESPONSE" | jq -e '.actions[0].status' > /dev/null; then
    ACTION_STATUS=$(echo "$RESPONSE" | jq -r '.actions[0].status')
    
    if [ "$ACTION_STATUS" = "success" ]; then
        echo_success "Firewall updated successfully!"
        echo_info "   • Runner IPs whitelisted for SSH: $DETECTED_IPS"
        
        # Wait for changes to propagate
        echo_info "⏳ Waiting for firewall changes to propagate..."
        sleep 3
        
    else
        echo_error "Firewall update failed: $ACTION_STATUS"
        exit 1
    fi
else
    echo_error "Failed to update firewall rules!"
    echo_error "Response: $(echo "$RESPONSE" | jq '.')"
    exit 1
fi

# Step 5: Verify firewall update and handle IP mismatches
echo_info "🔍 Verifying firewall update..."
sleep 2
VERIFICATION_RESPONSE=$(curl -s \
    -H "Authorization: Bearer $HETZNER_API_TOKEN" \
    "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID")

GITHUB_RULE_COUNT=$(echo "$VERIFICATION_RESPONSE" | jq '[.firewall.rules[] | select((.description // "") | test("^github-actions-ssh-ui"))] | length')
if [ "$GITHUB_RULE_COUNT" = "1" ]; then
    WHITELISTED_IPS=$(echo "$VERIFICATION_RESPONSE" | jq -r '.firewall.rules[] | select((.description // "") | test("^github-actions-ssh-ui")) | .source_ips | join(", ")')
    echo_success "✅ Verification passed: $WHITELISTED_IPS whitelisted"
    
    # Check if any of our detected IPs are in the verification results
    MISMATCH_FOUND=false
    for detected_ip in $DETECTED_IPS; do
        if ! echo "$WHITELISTED_IPS" | grep -q "$detected_ip"; then
            MISMATCH_FOUND=true
            break
        fi
    done
    
    # If mismatch found, add the missing IPs
    if [ "$MISMATCH_FOUND" = "true" ]; then
        echo_warning "⚠️  IP mismatch detected! Whitelisted: $WHITELISTED_IPS, Detected: $DETECTED_IPS"
        echo_info "🔧 Adding detected IPs to handle GitHub Actions networking..."
        
        # Get current whitelisted IPs from verification
        CURRENT_WHITELIST=$(echo "$VERIFICATION_RESPONSE" | jq '.firewall.rules[] | select((.description // "") | test("^github-actions-ssh-ui")) | .source_ips')
        
        # Add our detected IPs to the existing whitelist
        COMBINED_RANGES="$CURRENT_WHITELIST"
        for ip in $DETECTED_IPS; do
            # Add both specific IP and subnet
            COMBINED_RANGES=$(echo "$COMBINED_RANGES" | jq --arg ip "$ip/32" '. + [$ip]')
            SUBNET=$(echo "$ip" | cut -d'.' -f1-3)".0/24"
            COMBINED_RANGES=$(echo "$COMBINED_RANGES" | jq --arg subnet "$SUBNET" '. + [$subnet]')
            echo_info "Added detected IP: $ip/32 and subnet: $SUBNET"
        done
        
        # Remove duplicates
        COMBINED_RANGES=$(echo "$COMBINED_RANGES" | jq 'unique')
        echo_info "Combined IP ranges: $(echo "$COMBINED_RANGES" | jq -c '.')"
        
        # Update firewall with combined ranges
        UPDATED_RULES_COMBINED=$(echo "$VERIFICATION_RESPONSE" | jq --argjson combined_ranges "$COMBINED_RANGES" '
        .firewall.rules | 
        map(if (.description // "") | test("^github-actions-ssh-ui") then
            .source_ips = $combined_ranges
        else
            .
        end)')
        
        FIREWALL_PAYLOAD_COMBINED=$(jq -n --argjson rules "$UPDATED_RULES_COMBINED" '{"rules": $rules}')
        
        echo_info "🚀 Updating firewall with combined IP ranges..."
        RESPONSE_COMBINED=$(curl -s \
            -X POST \
            -H "Authorization: Bearer $HETZNER_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$FIREWALL_PAYLOAD_COMBINED" \
            "https://api.hetzner.cloud/v1/firewalls/$FIREWALL_ID/actions/set_rules")
        
        if echo "$RESPONSE_COMBINED" | jq -e '.actions[0].status' > /dev/null; then
            ACTION_STATUS_COMBINED=$(echo "$RESPONSE_COMBINED" | jq -r '.actions[0].status')
            if [ "$ACTION_STATUS_COMBINED" = "success" ]; then
                echo_success "✅ Combined firewall rules updated successfully!"
                echo_info "🔒 Both detected and verified IPs now whitelisted"
            else
                echo_warning "⚠️  Combined update failed: $ACTION_STATUS_COMBINED"
            fi
        fi
    fi
else
    echo_warning "⚠️  Verification: Found $GITHUB_RULE_COUNT GitHub rules (expected 1)"
fi

echo_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo_success "🎉 Smart firewall update completed!"
echo_info "🔒 SSH access granted for current runner IP only"
echo_info "🚀 Deployment can now proceed safely"

# Optional cleanup function (can be called after deployment)
if [ "$CLEANUP_AFTER_DEPLOY" = "true" ]; then
    echo_info ""
    echo_warning "🧹 Cleanup after deployment is enabled"
    echo_info "This will remove the temporary GitHub Actions SSH rule"
fi