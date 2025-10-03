#!/bin/bash

# Quick fix for Cloudflare tunnel using credentials file approach
echo "🌐 Quick Cloudflare Tunnel Fix..."

# Your provided credentials
TUNNEL_TOKEN="_sarsmi5PXspeoWoAjr2IcLbnW5iCgLnzIg28lgZ_sarsmi5PXspeoWoAjr2IcLbnW5iCgLnzIg28lgZ"

echo "🔑 Using your tunnel token..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    exit 1
fi

# Stop any existing tunnels
echo "🛑 Stopping existing tunnels..."
pkill -f cloudflared || true
sleep 3

# Create credentials file directly
echo "📝 Creating tunnel credentials file..."
mkdir -p /home/vscode/.cloudflared

cat > /home/vscode/.cloudflared/credentials.json << EOF
{
  "AccountTag": "28fc8324a6330105e25d74dafe1fa4cd",
  "TunnelID": "udigit-rentals",
  "TunnelSecret": "$TUNNEL_TOKEN"
}
EOF

echo "✅ Credentials file created"

# Update tunnel configuration to use credentials file
sed -i.bak 's|credentials-file:.*|credentials-file: /home/vscode/.cloudflared/credentials.json|' tunnel-config.yml

echo "✅ Tunnel configuration updated"

# Start tunnel
echo "🚀 Starting Cloudflare Tunnel..."
echo "📍 Frontend: https://editor.udigitai.io"
echo "🔗 API: https://api.udigitai.io"

cloudflared tunnel --config tunnel-config.yml run &

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
    echo "📄 Check status with: cloudflared tunnel list"
fi

echo ""
echo "✅ Tunnel setup complete!"

# Wait for tunnel process
wait $TUNNEL_PID
