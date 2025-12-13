// Test script to verify deep linking configuration
// Run this with: node test_deep_link.js

const { execSync } = require('child_process');

console.log('🔍 Testing Deep Link Configuration...\n');

// Check app.json configuration
try {
  const fs = require('fs');
  const appConfig = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  
  console.log('✅ App Configuration:');
  console.log(`   Name: ${appConfig.expo.name}`);
  console.log(`   Slug: ${appConfig.expo.slug}`);
  console.log(`   Scheme: ${appConfig.expo.scheme}`);
  console.log(`   Package: ${appConfig.expo.android?.package}`);
  console.log(`   Bundle ID: ${appConfig.expo.ios?.bundleIdentifier}\n`);
  
  if (appConfig.expo.scheme !== 'mafqoudat') {
    console.log('❌ Scheme should be "mafqoudat"');
  } else {
    console.log('✅ Scheme is correct');
  }
} catch (error) {
  console.log('❌ Error reading app.json:', error.message);
}

// Test deep link URL format
const testUrls = [
  'mafqoudat://auth/callback?token=test123',
  'mafqoudat://auth/callback?pendingToken=test456',
  'mafqoudat://home'
];

console.log('\n🔗 Test Deep Link URLs:');
testUrls.forEach(url => {
  console.log(`   ${url}`);
});

console.log('\n📱 Testing Instructions:');
console.log('1. Start the app: npm start');
console.log('2. Open Expo Go app on your device');
console.log('3. Scan the QR code');
console.log('4. Try opening one of these URLs in your browser:');
console.log('   - These should prompt to open the app');
console.log('   - If not, deep linking is not configured properly');

console.log('\n🔧 Debugging Steps:');
console.log('1. Check if the app scheme is registered in Android/iOS');
console.log('2. Ensure expo install has been run');
console.log('3. Test with Expo Development build vs Expo Go');
console.log('4. Check console logs for deep link events');

console.log('\n📊 Expected Flow:');
console.log('1. User taps "Continue with Google"');
console.log('2. Browser opens to Google OAuth');
console.log('3. User authenticates');
console.log('4. Server redirects to mobile-callback page');
console.log('5. HTML page triggers deep link: mafqoudat://auth/callback?token=...');
console.log('6. App receives deep link and processes token');
