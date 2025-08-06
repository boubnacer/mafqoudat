#!/bin/bash

echo "🚀 Mafkoudat Deployment Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi
cd ..

# Build client
echo "🔨 Building client..."
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi
cd ..

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up MongoDB Atlas database"
echo "2. Deploy backend to Railway/Render"
echo "3. Deploy frontend to Vercel"
echo "4. Configure domain DNS settings"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions" 