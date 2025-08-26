#!/bin/bash

echo "🚀 Deploying fixes to Railway..."

# Navigate to server directory
cd server

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the server directory."
    exit 1
fi

echo "✅ Server directory found"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "🔗 Check your Railway dashboard for deployment status"
echo "🌐 Your app should be available at: https://mafqoudat-production.up.railway.app"
