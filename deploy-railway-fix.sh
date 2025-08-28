#!/bin/bash

echo "🚀 Deploying to Railway..."

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
    echo "❌ railway.json not found. Make sure you're in the project root."
    exit 1
fi

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ server directory not found."
    exit 1
fi

# Check if server.js exists
if [ ! -f "server/server.js" ]; then
    echo "❌ server/server.js not found."
    exit 1
fi

echo "✅ Project structure looks good"

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "⚠️ Railway CLI not found. Please install it: npm install -g @railway/cli"
    echo "Then run: railway login"
    exit 1
fi

echo "🚂 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "🔗 Check your Railway dashboard for the deployment status"
