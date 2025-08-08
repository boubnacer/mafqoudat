#!/bin/bash

echo "🚀 Mafqoudat Deployment Setup Script"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies for both client and server
echo "📦 Installing dependencies..."

echo "Installing server dependencies..."
cd server
npm install
cd ..

echo "Installing client dependencies..."
cd client
npm install
cd ..

echo "✅ Dependencies installed successfully"

# Build the client
echo "🔨 Building client..."
cd client
npm run build
cd ..

echo "✅ Client built successfully"

# Generate secure JWT secrets
echo "🔐 Generating secure JWT secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "Generated JWT_SECRET: $JWT_SECRET"
echo "Generated JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"

echo ""
echo "📋 Next Steps:"
echo "1. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
echo "2. Set up MongoDB Atlas database"
echo "3. Set up Cloudinary for image storage"
echo "4. Deploy backend to Render"
echo "5. Deploy frontend to Vercel"
echo "6. Configure your domain (mafqoudat.com)"
echo ""
echo "🔑 Save these JWT secrets for your environment variables:"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "🎉 Setup complete! Good luck with your deployment!" 