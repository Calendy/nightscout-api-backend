#!/bin/bash

echo "🔄 Resetting Docker environment..."

# Stop all containers
echo "🛑 Stopping containers..."
docker compose down

# Remove any existing database file
echo "🗄️  Removing local database file..."
rm -f database.sqlite

# Remove Docker volumes (this clears any persistent data)
echo "🧹 Cleaning Docker volumes..."
docker compose down -v

# Remove any dangling images
echo "🖼️  Cleaning up Docker images..."
docker system prune -f

# Rebuild and start fresh
echo "🚀 Starting fresh containers..."
docker compose up -d --build

echo "✅ Reset complete!"
echo "📊 Access the application at: http://localhost:3000"
echo "🔍 Check logs with: docker compose logs app"
