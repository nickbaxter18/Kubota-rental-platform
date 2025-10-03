#!/bin/bash

# Start essential services for tunnel
echo "🚀 Starting U-Dig It Rentals Services..."

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill -TERM $backend_pid 2>/dev/null
    kill -TERM $frontend_pid 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the kubota-rental-platform root directory"
    exit 1
fi

# Start backend first (it will fail without database, but that's ok for tunnel)
echo "🔧 Starting backend server..."
cd backend
pnpm start:dev &
backend_pid=$!

# Wait a moment
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
cd ../frontend
pnpm dev &
frontend_pid=$!

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend running on port: 3001"
else
    echo "⚠️  Backend health check failed (this is normal without database)"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend running on port: 3000"
else
    echo "❌ Frontend failed to start"
    cleanup
fi

echo ""
echo "🎉 SERVICES ARE RUNNING!"
echo "🔧 Backend:   http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Now you can start the tunnel in a separate terminal:"
echo "cd /home/vscode/kubota-rental-platform"
echo "./start-tunnel.sh"
echo ""
echo "Press Ctrl+C to stop services"

# Wait for processes
wait $backend_pid $frontend_pid
