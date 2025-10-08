// Quick test script to verify the password reset route is working
const axios = require('axios');

const testPasswordResetRoute = async () => {
  try {
    console.log('Testing password reset route...\n');
    
    // Test 1: Check if server is running
    console.log('Step 1: Checking if server is running...');
    try {
      const healthCheck = await axios.get('http://localhost:3500/', { timeout: 5000 });
      console.log('✅ Server is running');
    } catch (err) {
      console.log('❌ Server is not responding at http://localhost:3500');
      console.log('   Error:', err.message);
      console.log('\nPlease start your server:');
      console.log('   cd server');
      console.log('   npm start\n');
      return;
    }
    
    // Test 2: Submit a password reset request
    console.log('\nStep 2: Submitting password reset request...');
    console.log('URL: http://localhost:3500/api/password-reset/request');
    console.log('Method: POST');
    console.log('Body:', JSON.stringify({ contactInfo: 'test@example.com' }, null, 2));
    
    const response = await axios.post('http://localhost:3500/api/password-reset/request', {
      contactInfo: 'test@example.com'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Password reset route is working correctly!');
    
  } catch (error) {
    console.log('\n❌ Error occurred');
    console.log('Error type:', error.constructor.name);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Connection Refused');
      console.log('Server is not running on http://localhost:3500');
      console.log('\nPlease start your server:');
      console.log('   cd server');
      console.log('   npm start');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('\n⚠️  Request Timeout');
      console.log('Server is taking too long to respond');
    } else if (error.response) {
      // The request was made and the server responded with a status code
      console.log('\nHTTP Status:', error.response.status, error.response.statusText);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 405) {
        console.log('\n⚠️  405 Method Not Allowed');
        console.log('This usually means:');
        console.log('1. Route is not defined on the server');
        console.log('2. Server needs to be restarted');
        console.log('3. Route file is not being loaded');
        console.log('\nPlease check:');
        console.log('- server/routes/passwordResetRoutes.js exists');
        console.log('- server/server.js has: app.use("/api/password-reset", require("./routes/passwordResetRoutes"));');
        console.log('- Server was restarted after adding the route');
      } else if (error.response.status === 404) {
        console.log('\n⚠️  404 Not Found');
        console.log('The route /api/password-reset/request does not exist on the server');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('\n⚠️  No response received from server');
      console.log('Request was sent but server did not respond');
      console.log('Error message:', error.message);
    } else {
      // Something happened in setting up the request
      console.log('\n⚠️  Error setting up request');
      console.log('Message:', error.message);
    }
    
    console.log('\n--- Full Error Object ---');
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    if (error.config) {
      console.log('URL:', error.config.url);
      console.log('Method:', error.config.method);
    }
  }
};

console.log('='.repeat(50));
console.log('Password Reset Route Test');
console.log('='.repeat(50));
testPasswordResetRoute();

