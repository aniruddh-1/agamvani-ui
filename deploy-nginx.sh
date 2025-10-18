#!/bin/bash

# ANBHE Platform Nginx Deployment Script
# Applies nginx configurations with environment variable substitution

set -e

# Load environment variables
if [ -f "nginx.env" ]; then
    set -a  # automatically export all variables
    source nginx.env
    set +a  # disable automatic export
    echo "Loaded configuration from nginx.env"
else
    echo "Error: nginx.env file not found. Copy nginx.env.example to nginx.env and configure."
    exit 1
fi

# Validate required variables
required_vars=("SERVER_IP" "BACKEND_HOST" "BACKEND_PORT" "STATIC_FILES_PATH")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Function to substitute environment variables in config files
substitute_vars() {
    local input_file=$1
    local output_file=$2
    
    echo "Processing $input_file -> $output_file"
    
    # Use envsubst to substitute only our environment variables, leave nginx variables alone
    envsubst '$SERVER_IP,$DOMAIN_NAME,$STATIC_FILES_PATH,$BACKEND_HOST,$BACKEND_PORT,$UI_CONTAINER_HOST,$UI_CONTAINER_PORT,$DEPLOYMENT_TYPE,$SSL_CERT_PATH,$SSL_KEY_PATH,$SSL_CHAIN_PATH' < "$input_file" > "$output_file"
}

# Create output directory
mkdir -p nginx-configs

echo "Generating nginx configurations with environment variables..."

# Generate IP-based server config
substitute_vars "nginx-ip-server.conf" "nginx-configs/agamvani-ip"

# Generate domain-based server config
substitute_vars "nginx-server.conf" "nginx-configs/agamvani-domain"

# Generate main nginx config
substitute_vars "nginx-main.conf" "nginx-configs/nginx.conf"

# Generate container config (doesn't need env vars but copy for completeness)
cp "nginx-container.conf" "nginx-configs/nginx-container.conf"

echo "Generated nginx configurations in nginx-configs/ directory"
echo ""
echo "To deploy to server:"
echo "  scp -i ~/.ssh/your_key nginx-configs/agamvani-ip root@\$SERVER_IP:/etc/nginx/sites-available/"
echo "  scp -i ~/.ssh/your_key nginx-configs/nginx.conf root@\$SERVER_IP:/etc/nginx/"
echo "  ssh -i ~/.ssh/your_key root@\$SERVER_IP 'nginx -t && systemctl reload nginx'"
echo ""
echo "Configuration summary:"
echo "  Server IP: $SERVER_IP"
echo "  Backend: $BACKEND_HOST:$BACKEND_PORT"
echo "  Static files: $STATIC_FILES_PATH"