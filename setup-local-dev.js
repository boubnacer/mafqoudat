const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up local development environment...\n');

// Generate secure JWT secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

// Create .env file content
const envContent = `# Local Development Environment Variables
# Generated on ${new Date().toISOString()}

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000

# MongoDB Connection String
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secrets (Generated securely)
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=du0tmvxhu
CLOUDINARY_API_KEY=593667419254217
CLOUDINARY_API_SECRET=HyNgn7OcNYUAFIENfnDVvbqQnis
CLOUDINARY_UPLOAD_PRESET=mafqoudat

# Instructions:
# 1. Replace MONGODB_URI with your actual MongoDB connection string
# 2. Update CLOUDINARY_* values if needed
# 3. Keep JWT secrets secure and don't commit them to version control
`;

// Write .env file
const envPath = path.join(__dirname, 'server', '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ Created server/.env file with secure JWT secrets');
console.log('📝 Please update the following in server/.env:');
console.log('   - MONGODB_URI: Your actual MongoDB connection string');
console.log('   - CLOUDINARY_*: Your Cloudinary credentials (if different)');
console.log('\n🔐 Generated JWT Secrets:');
console.log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
console.log(`   JWT_REFRESH_SECRET: ${jwtRefreshSecret.substring(0, 20)}...`);
console.log('\n🚀 To start development:');
console.log('   cd server && npm run dev');
