const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

async function testRailwayHealth() {
  try {
    console.log('🏥 Testing Railway server health...\n');
    
    // Test basic connectivity
    console.log('🔍 Testing basic connectivity...');
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
      console.log('✅ Health endpoint response:', response.status, response.data);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
      if (error.response) {
        console.log('  Status:', error.response.status);
        console.log('  Data:', error.response.data);
      }
    }
    
    // Test root endpoint
    console.log('\n🔍 Testing root endpoint...');
    try {
      const response = await axios.get(`${API_BASE_URL}/`, { timeout: 10000 });
      console.log('✅ Root endpoint response:', response.status);
    } catch (error) {
      console.log('❌ Root endpoint failed:', error.message);
      if (error.response) {
        console.log('  Status:', error.response.status);
      }
    }
    
    // Test with different timeout
    console.log('\n🔍 Testing with longer timeout...');
    try {
      const response = await axios.get(`${API_BASE_URL}/countries`, { timeout: 30000 });
      console.log('✅ Countries endpoint response:', response.status);
      console.log('  Data length:', response.data?.data?.length || response.data?.length || 0);
    } catch (error) {
      console.log('❌ Countries endpoint failed:', error.message);
      if (error.response) {
        console.log('  Status:', error.response.status);
        console.log('  Data:', error.response.data);
      }
    }
    
    console.log('\n✅ Railway health test completed!');
    
  } catch (error) {
    console.error('❌ Health test failed:', error.message);
  }
}

testRailwayHealth();
