const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('https://mafqoudat-api.onrender.com/auth', {
      emailOrPhone: 'different@test.com',
      password: 'different123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestClient/1.0.0'
      }
    });
    
    console.log('✅ Success:', response.status);
    console.log('📄 Data:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
  }
}

testLogin();
