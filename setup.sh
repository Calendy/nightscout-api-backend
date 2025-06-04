#!/bin/bash

echo "🩸 Nightscout API Backend - Setup Script"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    echo "Or use Docker with: docker compose up -d"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "Please install npm or use Docker"
    exit 1
fi

echo "✅ npm $(npm --version) detected"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if SQLite database exists
if [ ! -f database.sqlite ]; then
    echo "🗄️  SQLite database will be created on first run"
else
    echo "✅ SQLite database already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📊 Access points:"
echo "   Dashboard: http://localhost:3000"
echo "   API: http://localhost:3000/api/v1"
echo "   API Docs: http://localhost:3000/api-docs"
echo ""
echo "📱 For production deployment, see DEPLOYMENT.md"
