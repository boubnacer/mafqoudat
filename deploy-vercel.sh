#!/bin/bash

# Vercel Deployment Script with Cache Busting
echo "🚀 Starting Vercel deployment with cache busting..."

# Remove the test change from WelcomePage.jsx
echo "🧹 Cleaning up test changes..."
sed -i 's/{t('\''signup'\'')}fuck/{t('\''signup'\'')}/g' client/src/components/WelcomePage.jsx

# Clear any existing build
echo "🗑️  Clearing previous build..."
rm -rf client/build

# Install dependencies
echo "📦 Installing dependencies..."
cd client && npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Go back to root
cd ..

# Deploy to Vercel with force flag
echo "🚀 Deploying to Vercel..."
vercel --prod --force

echo "✅ Deployment complete!"
echo "🌐 Your changes should now be live on Vercel"
echo "💡 If you still see cached content, try:"
echo "   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   - Clear browser cache"
echo "   - Wait 5-10 minutes for CDN propagation"
