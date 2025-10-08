// Test password reset on production server
const axios = require('axios');

const testProductionPasswordReset = async () => {
  try {
    console.log('==================================================');
    console.log('Testing Password Reset on PRODUCTION');
    console.log('==================================================\n');
    
    const productionUrl = 'https://www.mafqoudat.com/api/password-reset/request';
    
    console.log('Step 1: Testing production server...');
    console.log('URL:', productionUrl);
    console.log('Method: POST');
    console.log('Body:', JSON.stringify({ contactInfo: 'test@example.com' }, null, 2));
    console.log('\nSending request...\n');
    
    const response = await axios.post(productionUrl, {
      contactInfo: 'test@example.com'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Password reset is working on production!\n');
    
  } catch (error) {
    console.log('❌ ERROR\n');
    console.log('Error type:', error.constructor.name);
    
    if (error.code === 'ENOTFOUND') {
      console.log('⚠️  Domain not found');
      console.log('Cannot reach www.mafqoudat.com');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('⚠️  Request Timeout');
      console.log('Server took too long to respond');
    } else if (error.response) {
      console.log('HTTP Status:', error.response.status, error.response.statusText);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 405) {
        console.log('\n⚠️  405 METHOD NOT ALLOWED');
        console.log('\nThis means the route is NOT available on production.');
        console.log('\nPossible reasons:');
        console.log('1. ❌ Server was not restarted after deployment');
        console.log('2. ❌ New files were not deployed to production');
        console.log('3. ❌ Route file has an error preventing it from loading');
        console.log('\nFiles that MUST exist on production server:');
        console.log('  - server/models/PasswordResetRequest.js');
        console.log('  - server/controllers/passwordResetController.js');
        console.log('  - server/routes/passwordResetRoutes.js');
        console.log('\nAnd server.js MUST have this line:');
        console.log('  app.use("/api/password-reset", require("./routes/passwordResetRoutes"));');
        console.log('\nAfter verifying files, RESTART THE SERVER:');
        console.log('  pm2 restart all');
        console.log('  # or');
        console.log('  railway restart');
        console.log('  # or whatever restart command you use');
      } else if (error.response.status === 404) {
        console.log('\n⚠️  404 NOT FOUND');
        console.log('The route does not exist on production');
      } else if (error.response.status === 500) {
        console.log('\n⚠️  500 SERVER ERROR');
        console.log('The route exists but there\'s an error in the code');
      }
    } else if (error.request) {
      console.log('⚠️  No response from server');
      console.log('Request sent but no response received');
      console.log('Message:', error.message);
    } else {
      console.log('⚠️  Error setting up request');
      console.log('Message:', error.message);
    }
    
    console.log('\n--- Debug Info ---');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    if (error.config) {
      console.log('Request URL:', error.config.url);
      console.log('Request method:', error.config.method);
    }
    console.log('\n');
  }
};

testProductionPasswordReset();

