#!/bin/bash

# Script to rebuild Docker containers with locale fixes
# This script rebuilds the backend and postgres containers with proper locale configuration

set -e

echo "🔧 Fixing Docker locale configuration..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker compose down

# Remove existing images to force rebuild
echo "🗑️  Removing existing images..."
docker compose rm -f
docker rmi kubota-rental-platform_postgres kubota-rental-platform_backend 2>/dev/null || true

# Rebuild containers with locale fixes
echo "🏗️  Rebuilding containers with locale configuration..."
docker compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker compose up -d

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check locale configuration in postgres container
echo "🔍 Checking PostgreSQL locale configuration..."
docker exec kubota-postgres locale

echo ""
echo "✅ Locale fix applied successfully!"
echo ""
echo "📋 To verify the fix worked:"
echo "   docker exec kubota-postgres locale"
echo ""
echo "🔧 If you still see warnings, you may need to:"
echo "   1. Drop and recreate your databases to use the new locale"
echo "   2. Check your application logs for any remaining issues"
echo ""
echo "📖 For more information about locale configuration:"
echo "   https://wiki.postgresql.org/wiki/Locale_Support"
