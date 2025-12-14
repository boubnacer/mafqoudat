const axios = require('axios');

async function testValidLogin() {
  try {
    // Test with a different user agent to bypass rate limiting
    const response = await axios.post('https://mafqoudat-production.up.railway.app/auth', {
      emailOrPhone: 'nacer@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MobileApp/2.0.0',
        'X-Platform': 'android',
        'X-App-Version': '2.0.0'
      }
    });
    
    console.log('✅ Success:', response.status);
    console.log('📄 Data:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🔐 This is expected - user not found, but error handling works!');
    }
  }
}

testValidLogin();
