#!/bin/bash

# Simple tunnel startup script
echo "🌐 Starting Cloudflare Tunnel..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    echo "Please install it first:"
    echo "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb"
    echo "sudo dpkg -i cloudflared.deb"
    exit 1
fi

# Start tunnel with the configuration
cd /home/vscode/kubota-rental-platform
echo "🚇 Starting tunnel to expose localhost:3000..."
cloudflared tunnel run --config tunnel-config.yml

echo "✅ Tunnel started! Access your app at: https://editor.udigitai.io"
echo "🔗 API available at: https://api.udigitai.io"
