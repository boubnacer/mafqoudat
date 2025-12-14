// Detailed login test to debug the 500 error
// Run this with: node test_detailed_login.js

const axios = require('axios');

const API_BASE_URL = "https://mafqoudat-production.up.railway.app";

console.log('🔍 Testing Detailed Login...\n');

async function testDetailedLogin() {
  try {
    console.log('📍 Testing with exact mobile app headers...');
    
    // Test with headers similar to mobile app
    const response = await axios.post(`${API_BASE_URL}/auth`, {
      emailOrPhone: 'test@test.com',
      password: 'test123'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ExpoGo/1.0.0',
        'X-Platform': 'ios',
        'X-App-Version': '1.0.0'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Status Text:', error.response.statusText);
      console.log('📄 Headers:', error.response.headers);
      console.log('📄 Data:', error.response.data);
      
      // Try to parse the error details
      if (error.response.data) {
        console.log('\n🔍 Error Analysis:');
        console.log('- Message:', error.response.data.message);
        console.log('- Code:', error.response.data.code);
        console.log('- Timestamp:', error.response.data.timestamp);
        
        if (error.response.data.error) {
          console.log('- Error Details:', error.response.data.error);
        }
      }
    } else if (error.request) {
      console.log('📡 No response received');
      console.log('Request:', error.request);
    } else {
      console.log('⚙️ Request setup error:', error.message);
    }
    
    console.log('\n🔧 Full Error:', error);
  }
}

// Test with different credentials
async function testWithValidCredentials() {
  console.log('\n🔍 Testing with different credentials...');
  
  const testCases = [
    { emailOrPhone: 'admin@test.com', password: 'admin123' },
    { emailOrPhone: 'user@test.com', password: 'password' },
    { emailOrPhone: 'test@example.com', password: 'test' },
    { emailOrPhone: 'demo@demo.com', password: 'demo' }
  ];
  
  for (const credentials of testCases) {
    try {
      console.log(`\n🧪 Testing: ${credentials.emailOrPhone}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth`, credentials, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mobile-App-Test'
        }
      });
      
      console.log('✅ Success with:', credentials.emailOrPhone);
      console.log('📄 Response:', response.data);
      break; // Stop on first success
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('⚠️ Invalid credentials (expected for test)');
      } else if (error.response?.status === 500) {
        console.log('❌ Server error with:', credentials.emailOrPhone);
        console.log('Error:', error.response.data?.message);
      } else {
        console.log('❌ Other error:', error.response?.status, error.response?.data?.message);
      }
    }
  }
}

async function main() {
  await testDetailedLogin();
  await testWithValidCredentials();
}

main();
