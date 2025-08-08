#!/bin/bash

echo "🚀 Starting Railway deployment..."

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Start the server
echo "🚀 Starting server..."
npm start
