#!/bin/bash

# Direct Cloudflare Tunnel setup using provided credentials
echo "🌐 Setting up Cloudflare Tunnel with direct authentication..."

# Your provided credentials
ZONE_ID="59f08c23485b5c6bac0bf2af6930c538"
ACCOUNT_ID="28fc8324a6330105e25d74dafe1fa4cd"
TUNNEL_TOKEN="_sarsmi5PXspeoWoAjr2IcLbnW5iCgLnzIg28lgZ_sarsmi5PXspeoWoAjr2IcLbnW5iCgLnzIg28lgZ"

echo "🔑 Using provided credentials:"
echo "  Zone ID: $ZONE_ID"
echo "  Account ID: $ACCOUNT_ID"
echo "  Token: ${TUNNEL_TOKEN:0:20}..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    exit 1
fi

# Clean up any existing tunnel
echo "🧹 Cleaning up existing tunnel..."
cloudflared tunnel delete udigit-rentals 2>/dev/null || true
pkill -f cloudflared || true
sleep 2

# Create tunnel first (without token)
echo "🏗️ Creating tunnel..."
cloudflared tunnel create udigit-rentals

if [ $? -ne 0 ]; then
    echo "❌ Failed to create tunnel"
    exit 1
fi

echo "✅ Tunnel created successfully"

# Get the tunnel UUID
TUNNEL_UUID=$(cloudflared tunnel list | grep udigit-rentals | awk '{print $2}')

if [ -z "$TUNNEL_UUID" ]; then
    echo "❌ Could not get tunnel UUID"
    exit 1
fi

echo "🔍 Tunnel UUID: $TUNNEL_UUID"

# Update tunnel configuration with the UUID
sed -i.bak "s|tunnel: udigit-rentals|tunnel: $TUNNEL_UUID|" tunnel-config.yml

echo "✅ Tunnel configuration updated"

# Stop any existing tunnels
pkill -f cloudflared || true
sleep 2

# Start tunnel with token
echo "🚀 Starting Cloudflare Tunnel with token..."
echo "📍 Frontend: https://editor.udigitai.io"
echo "🔗 API: https://api.udigitai.io"

cloudflared tunnel run \
  --token "$TUNNEL_TOKEN" \
  --config tunnel-config.yml &

TUNNEL_PID=$!

# Wait for tunnel to initialize
sleep 15

# Test tunnel connectivity
echo "🔍 Testing tunnel connectivity..."

if curl -s "https://editor.udigitai.io/api/health" > /dev/null; then
    echo "✅ Tunnel is working!"
    echo ""
    echo "🎉 SUCCESS! Your application is now available at:"
    echo "🌐 Frontend: https://editor.udigitai.io"
    echo "🔗 API:      https://api.udigitai.io"
    echo ""
    echo "📝 Note: It may take a few more minutes for DNS to fully propagate"
    echo ""
    echo "📊 Tunnel process ID: $TUNNEL_PID"
    echo "🛑 To stop the tunnel, run: kill $TUNNEL_PID"
else
    echo "⚠️  Tunnel may still be initializing..."
    echo "🔄 Wait 30-60 seconds and try: curl https://editor.udigitai.io/api/health"
    echo ""
    echo "📊 Tunnel process ID: $TUNNEL_PID"
    echo "📄 Check logs with: cloudflared tunnel list"
fi

echo ""
echo "✅ Tunnel setup complete!"

# Wait for tunnel process
wait $TUNNEL_PID
