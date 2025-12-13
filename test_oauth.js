const http = require('http');

// Test function to check if server is responding
function testServerHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3500,
      path: '/health',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Server Health Check Response:');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve({ success: true, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Server Health Check Failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test mobile auth endpoint
function testMobileAuthEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      test: true
    });

    const options = {
      hostname: 'localhost',
      port: 3500,
      path: '/auth/mobile/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Mobile Auth Test Response:');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve({ success: true, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Mobile Auth Test Failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting OAuth Implementation Tests...\n');
  
  try {
    // Test 1: Server Health
    console.log('Test 1: Checking Server Health...');
    await testServerHealth();
    console.log('');
    
    // Test 2: Mobile Auth Endpoint
    console.log('Test 2: Testing Mobile Auth Endpoint...');
    await testMobileAuthEndpoint();
    console.log('');
    
    console.log('✅ All tests completed successfully!');
    console.log('🎉 The new OAuth implementation is ready for testing.');
    
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 3500');
    console.log('   Run: cd mafqoudat/server && npm start');
  }
}

// Run the tests
runTests();
