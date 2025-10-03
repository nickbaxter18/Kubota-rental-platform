#!/bin/bash

# Start tunnel using provided token
echo "🌐 Starting Cloudflare Tunnel with token..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    exit 1
fi

# Token provided by user
TUNNEL_TOKEN="_sarsmi5PXspeoWoAjr2IcLbnW5iCgLnzIg28lgZ_sarsmi5PXspeoWoAjr2IcLbnW5iCgLnzIg28lgZ"

echo "🚀 Starting tunnel with token..."
echo "📍 Frontend will be available at: https://editor.udigitai.io"
echo "🔗 API will be available at: https://api.udigitai.io"

# Stop any existing tunnels
pkill -f cloudflared || true
sleep 2

# Start tunnel with token
cloudflared tunnel --config tunnel-config.yml run --token "$TUNNEL_TOKEN" &

TUNNEL_PID=$!

echo "✅ Tunnel started with PID: $TUNNEL_PID"
echo ""
echo "🎉 SUCCESS! Your application should now be available at:"
echo "🌐 Frontend: https://editor.udigitai.io"
echo "🔗 API:      https://api.udigitai.io"
echo ""
echo "📝 Note: It may take 30-60 seconds for DNS to propagate"
echo ""
echo "🛑 To stop the tunnel, run: kill $TUNNEL_PID"

# Wait for tunnel process
wait $TUNNEL_PID
