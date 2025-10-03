#!/bin/bash

# Cloudflare Tunnel Setup and Startup Script
echo "🌐 Setting up Cloudflare Tunnel for U-Dig It Rentals..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    echo "Please install it first:"
    echo "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb"
    echo "sudo dpkg -i cloudflared.deb"
    exit 1
fi

# Check if tunnel already exists
echo "🔍 Checking tunnel status..."
cd /home/vscode/kubota-rental-platform

if ! cloudflared tunnel list | grep -q "udigit-rentals"; then
    echo "🆕 Creating new tunnel..."

    # Create tunnel
    echo "Creating tunnel: udigit-rentals"
    cloudflared tunnel create udigit-rentals

    if [ $? -ne 0 ]; then
        echo "❌ Failed to create tunnel"
        exit 1
    fi

    echo "✅ Tunnel created successfully"
else
    echo "✅ Tunnel already exists"
fi

# Get the tunnel credentials file path
CREDENTIALS_FILE="$HOME/.cloudflared/$(cloudflared tunnel list | grep udigit-rentals | awk '{print $2}').json"

if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Tunnel credentials file not found at: $CREDENTIALS_FILE"
    exit 1
fi

echo "🔑 Tunnel credentials found at: $CREDENTIALS_FILE"

# Update tunnel configuration with correct credentials path
sed -i.bak "s|credentials-file:.*|credentials-file: $CREDENTIALS_FILE|" tunnel-config.yml

echo "✅ Tunnel configuration updated"

# Check if tunnel is already running
if pgrep -f "cloudflared.*tunnel.*run" > /dev/null; then
    echo "🛑 Stopping existing tunnel..."
    pkill -f "cloudflared.*tunnel.*run"
    sleep 2
fi

echo "🚀 Starting Cloudflare Tunnel..."
echo "📍 Tunnel will be available at: https://editor.udigitai.io"
echo "🔗 API will be available at: https://api.udigitai.io"
echo ""
echo "⏳ Starting tunnel (this may take 30-60 seconds)..."

# Start tunnel in background with proper error handling
nohup cloudflared tunnel --config tunnel-config.yml run > tunnel.log 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel to initialize
sleep 10

# Check if tunnel is working
if curl -s "https://editor.udigitai.io/api/health" > /dev/null; then
    echo "✅ Tunnel is working!"
    echo ""
    echo "🎉 SUCCESS! Your application is now available at:"
    echo "🌐 Frontend: https://editor.udigitai.io"
    echo "🔗 API:      https://api.udigitai.io"
    echo ""
    echo "📝 Note: If you see a 503 error initially, wait 30-60 seconds for full initialization"
    echo ""
    echo "📊 Tunnel process ID: $TUNNEL_PID"
    echo "📄 Tunnel logs: tunnel.log"
else
    echo "⚠️  Tunnel may still be initializing..."
    echo "📄 Check tunnel.log for details"
    echo "🔄 Try accessing https://editor.udigitai.io in 30-60 seconds"
fi

echo ""
echo "🛑 To stop the tunnel, run: kill $TUNNEL_PID"
