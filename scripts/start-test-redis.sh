#!/bin/bash

# Start Test Redis Script
# Starts a Redis container for local testing

echo "🐳 Starting Redis test container..."

# Check if container already exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^test-redis$"; then
    echo "✅ Test Redis container already exists"

    # Check if it's running
    if docker ps --format 'table {{.Names}}' | grep -q "^test-redis$"; then
        echo "✅ Test Redis container is already running"
        echo "🔗 Redis available at: localhost:6379"
        exit 0
    else
        echo "🔄 Starting existing Redis container..."
        docker start test-redis
    fi
else
    echo "🚀 Creating new Redis test container..."
    docker run --name test-redis -p 6379:6379 -d redis:7-alpine
fi

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 2

# Test connection
if redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis test container started successfully!"
    echo "🔗 Redis available at: localhost:6379"
    echo ""
    echo "🛑 To stop Redis later, run: docker stop test-redis"
    echo "🗑️  To remove Redis later, run: docker rm test-redis"
else
    echo "❌ Failed to start Redis container"
    exit 1
fi
