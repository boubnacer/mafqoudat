// Test script to verify the new OAuth implementation
// Run this with: node test_new_auth.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing New OAuth Implementation...\n');

// Check if all required files exist
const requiredFiles = [
  'src/utils/googleAuthNew.js',
  'src/context/AuthContextNew.js',
  'src/screens/LoginScreenNew.js',
  'App.js'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check package.json for new dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const requiredDeps = ['expo-auth-session', 'expo-crypto'];
  let allDepsInstalled = true;
  
  requiredDeps.forEach(dep => {
    const installed = dependencies[dep];
    console.log(`  ${installed ? '✅' : '❌'} ${dep}: ${installed || 'NOT INSTALLED'}`);
    if (!installed) allDepsInstalled = false;
  });
  
  if (!allDepsInstalled) {
    console.log('\n⚠️  Some dependencies are missing. Run: npm install expo-auth-session expo-crypto');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check app.json configuration
console.log('\n⚙️  Checking app.json configuration...');
try {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
  const expo = appJson.expo || {};
  
  console.log(`  📱 Scheme: ${expo.scheme || 'NOT SET'}`);
  console.log(`  🌐 Web bundler: ${expo.web?.bundler || 'NOT SET'}`);
  
  if (!expo.scheme) {
    console.log('⚠️  Scheme not set in app.json. Add "scheme": "mafqoudat"');
  }
} catch (error) {
  console.log('❌ Error reading app.json:', error.message);
}

// Check constants file
console.log('\n🔧 Checking constants configuration...');
try {
  const constantsPath = path.join(__dirname, 'src/config/api.js');
  if (fs.existsSync(constantsPath)) {
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    
    const hasGoogleClientId = constantsContent.includes('GOOGLE_WEB_CLIENT_ID');
    const hasApiBaseUrl = constantsContent.includes('API_BASE_URL');
    
    console.log(`  🔑 Google Web Client ID: ${hasGoogleClientId ? '✅ DEFINED' : '❌ NOT DEFINED'}`);
    console.log(`  🌐 API Base URL: ${hasApiBaseUrl ? '✅ DEFINED' : '❌ NOT DEFINED'}`);
    
    if (!hasGoogleClientId || !hasApiBaseUrl) {
      console.log('\n⚠️  Update src/config/api.js with your Google credentials and API URL');
    }
  } else {
    console.log('❌ src/config/api.js not found');
  }
} catch (error) {
  console.log('❌ Error checking constants:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('1. Make sure server is running: cd ../server && npm start');
console.log('2. Start the mobile app: npm start');
console.log('3. Test the OAuth flow in Expo Go');
console.log('4. Check console logs for debugging information');

console.log('\n✅ New OAuth Implementation Test Complete!');
