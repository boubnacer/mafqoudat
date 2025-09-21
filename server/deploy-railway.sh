#!/bin/bash

# Railway Deployment Script for Cloudinary Optimization
# This script ensures proper installation of Sharp and other dependencies

echo "🚀 Starting Railway deployment with Cloudinary optimizations..."

# Set environment variables for production
export NODE_ENV=production

# Install dependencies with proper Sharp installation
echo "📦 Installing dependencies..."
npm install

# Check if Sharp was installed successfully
if npm list sharp > /dev/null 2>&1; then
    echo "✅ Sharp installed successfully"
else
    echo "⚠️ Sharp installation failed, will use fallback mode"
fi

# Start the server
echo "🎯 Starting server..."
npm start
