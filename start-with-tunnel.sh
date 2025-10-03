#!/bin/bash

# U-Dig It Rentals - Startup Script with Cloudflare Tunnel
echo "🚀 Starting U-Dig It Rentals Platform with Cloudflare Tunnel..."

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill -TERM $backend_pid 2>/dev/null
    kill -TERM $frontend_pid 2>/dev/null
    kill -TERM $tunnel_pid 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start backend in background first
echo "🔧 Starting backend server..."
cd backend && pnpm start:dev &
backend_pid=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Check if backend is running on port 3001
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend running on port: 3001"
else
    echo "❌ Backend failed to start properly"
    cleanup
fi

# Start frontend in background
echo "🌐 Starting frontend server..."
cd ../frontend && pnpm dev &
frontend_pid=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check if frontend is running on port 3003
if curl -s http://localhost:3003 > /dev/null; then
    echo "✅ Frontend running on port: 3003"
else
    echo "❌ Frontend failed to start properly"
    cleanup
fi

# Update tunnel configuration to point to frontend port 3002
echo "🌐 Starting Cloudflare Tunnel..."
cd .. && ./cloudflared tunnel run --token eyJhIjoiMjhmYzgzMjRhNjMzMDEwNWUyNWQ3NGRhZmUxZmE0Y2QiLCJ0IjoiNjA2MmFiNDUtNjBiNi00MDMzLTkzYzctYmUwMDc3ZDI0NTk2IiwicyI6ImZHVUtZL0xlL1ZwaWlNdHMvdnFES0Y1T3dFS1VIK1B1WWx3RVM2Q2l6QkE9In0= --url http://localhost:3002 &
tunnel_pid=$!

# Wait a moment for tunnel to initialize
sleep 5

echo "✅ Tunnel started!"
echo ""
echo "🎉 ALL SERVICES ARE NOW RUNNING!"
echo "🔧 Backend:   http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"
echo "🌐 Tunnel:    https://editor.udigitai.io"
echo ""
echo "📝 Note: If you see a 503 error, the tunnel may still be initializing"
echo "📝 Wait 30-60 seconds and try https://editor.udigitai.io again"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait $backend_pid $frontend_pid $tunnel_pid
