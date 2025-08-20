const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting build test...');

// Check if we're in the right directory
console.log('📁 Current directory:', process.cwd());
console.log('📁 Expected client directory:', path.join(process.cwd(), 'client'));

// Check if client directory exists
if (!fs.existsSync('client')) {
  console.error('❌ Client directory not found!');
  process.exit(1);
}

// Check if package.json exists in client
if (!fs.existsSync('client/package.json')) {
  console.error('❌ client/package.json not found!');
  process.exit(1);
}

console.log('✅ Client directory and package.json found');

// Check node version
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log('📦 Node version:', nodeVersion);
} catch (error) {
  console.error('❌ Error checking node version:', error.message);
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log('📦 NPM version:', npmVersion);
} catch (error) {
  console.error('❌ Error checking npm version:', error.message);
}

// Try to install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Try to build
console.log('🔨 Starting build...');
try {
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('🎉 All tests passed!');
