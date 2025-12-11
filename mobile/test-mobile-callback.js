/**
 * Test script to verify mobile callback endpoint
 * This simulates what happens when the server redirects to mobile-callback
 */

const https = require('https');

console.log('🧪 Testing Mobile Callback Endpoint');
console.log('====================================\n');

// Test with a sample token
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const testUrl = `https://mafqoudat-production.up.railway.app/auth/mobile-callback?token=${encodeURIComponent(testToken)}`;

console.log('1. Testing mobile callback with token:');
console.log('   URL:', testUrl);
console.log('   Expected: Should return HTML with token injected\n');

const options = {
  headers: {
    'User-Agent': 'Expo Go'
  }
};

const req = https.get(testUrl, options, (res) => {
  console.log('2. Response received:');
  console.log('   Status:', res.statusCode);
  console.log('   Headers:', res.headers);
  console.log('');
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('3. HTML Response Analysis:');
    console.log('   Response length:', data.length, 'characters');
    
    // Check if token is in the HTML
    const hasTokenInUrl = data.includes(`token=${testToken}`);
    const hasTokenInjection = data.includes('window.serverToken');
    const hasTokenValue = data.includes(testToken);
    
    console.log('   Token in URL parameter:', hasTokenInUrl ? '✅ YES' : '❌ NO');
    console.log('   Server token injection:', hasTokenInjection ? '✅ YES' : '❌ NO');
    console.log('   Token value in HTML:', hasTokenValue ? '✅ YES' : '❌ NO');
    
    // Check for debug logs
    const hasDebugLogs = data.includes('console.log');
    console.log('   Debug logs present:', hasDebugLogs ? '✅ YES' : '❌ NO');
    
    // Check for key elements
    const hasTokenDisplay = data.includes('id="tokenDisplay"');
    const hasDisplayToken = data.includes('displayToken()');
    console.log('   Token display element:', hasTokenDisplay ? '✅ YES' : '❌ NO');
    console.log('   Display token function:', hasDisplayToken ? '✅ YES' : '❌ NO');
    
    console.log('\n4. Sample HTML (first 500 chars):');
    console.log('   ' + data.substring(0, 500).replace(/\n/g, '\n   '));
    
    console.log('\n5. Expected Behavior:');
    console.log('   - Page should load with "Loading token..."');
    console.log('   - JavaScript should extract token from URL');
    console.log('   - Token should appear in textarea');
    console.log('   - Status should change to "✅ Token loaded! Opening app..."');
    console.log('   - Deep link should be attempted automatically');
    
    if (hasTokenInUrl && hasTokenDisplay && hasDisplayToken) {
      console.log('\n✅ Mobile callback endpoint appears to be working correctly!');
      console.log('   The issue might be in the mobile app deep linking or timing.');
    } else {
      console.log('\n❌ Mobile callback endpoint has issues.');
      console.log('   Check server logs for more details.');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.setTimeout(10000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});

console.log('\n6. Manual Testing Instructions:');
console.log('   ===========================');
console.log('   1. Open this URL in your browser:');
console.log('      ' + testUrl);
console.log('   2. Open browser developer tools (F12)');
console.log('   3. Check Console tab for debug logs');
console.log('   4. Check Network tab for any errors');
console.log('   5. Verify token appears in the textarea');
console.log('   6. Check if deep link is attempted');
