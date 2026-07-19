// Test script to verify API connection
// Run this with: node test_api_connection.js

const axios = require('axios');

const API_BASE_URL = "https://mafqoudat-api.onrender.com";

console.log('🔍 Testing API Connection...\n');

async function testAPI() {
  try {
    console.log('📍 Testing base URL:', API_BASE_URL);
    
    // Test basic connectivity
    const response = await axios.get(API_BASE_URL, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mobile-App-Test'
      }
    });
    
    console.log('✅ Server is reachable');
    console.log('📊 Status:', response.status);
    console.log('📄 Response type:', typeof response.data);
    
    // Test login endpoint (should fail with validation, not 500)
    console.log('\n🔐 Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth`, {
        emailOrPhone: 'test@test.com',
        password: 'test'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mobile-App-Test'
        }
      });
      
      console.log('📊 Login Status:', loginResponse.status);
      console.log('📄 Login Response:', loginResponse.data);
    } catch (loginError) {
      if (loginError.response) {
        console.log('📊 Login Status:', loginError.response.status);
        console.log('📄 Login Error:', loginError.response.data);
        
        if (loginError.response.status === 400) {
          console.log('✅ Login endpoint is working (validation error is expected)');
        } else if (loginError.response.status === 500) {
          console.log('❌ Server error - check server logs');
        }
      } else {
        console.log('❌ Network error:', loginError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server is not running or blocking connections');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Domain not found - check URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timeout - server might be slow');
    }
  }
}

testAPI();
