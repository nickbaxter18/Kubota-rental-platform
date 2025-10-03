#!/bin/bash

# Stop Test Redis Script
# Stops and removes the Redis test container

echo "🛑 Stopping Redis test container..."

# Check if container exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^test-redis$"; then
    echo "🔄 Stopping Redis container..."
    docker stop test-redis

    echo "🗑️  Removing Redis container..."
    docker rm test-redis

    echo "✅ Redis test container stopped and removed"
else
    echo "ℹ️  Redis test container not found"
fi

echo "🔌 Redis test container cleanup complete"
