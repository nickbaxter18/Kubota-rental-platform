#!/bin/bash

# Simple Cloudflare Tunnel startup
echo "🌐 Starting Cloudflare Tunnel..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    echo "Please install it first:"
    echo "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb"
    echo "sudo dpkg -i cloudflared.deb"
    exit 1
fi

echo "🚀 Starting tunnel to localhost:3000..."
echo "📍 Will be available at: https://editor.udigitai.io"
echo "🔗 API at: https://api.udigitai.io"
echo ""

# Stop any existing tunnels
pkill -f cloudflared || true
sleep 2

# Start tunnel with simple configuration
cloudflared tunnel --config tunnel-config.yml run

echo "✅ Tunnel process started!"
echo "📝 Check tunnel status with: cloudflared tunnel list"
echo "🛑 Stop tunnel with: pkill -f cloudflared"
