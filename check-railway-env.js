const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function checkRailwayEnvironment() {
  console.log('🔍 Checking Railway deployment environment...\n');
  
  // Test the health endpoint to see if the app is running
  try {
    const healthResponse = await axios.get(`${RAILWAY_URL}/health`);
    console.log('✅ Railway app is running');
    console.log('Health response:', JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Railway app health check failed:', error.message);
    return;
  }

  // Test database connection by checking if we can access the data
  console.log('\n🗄️ Testing database connection...');
  
  try {
    const countriesResponse = await axios.get(`${RAILWAY_URL}/countries`);
    console.log('✅ Database connection successful');
    console.log(`Found ${countriesResponse.data.data?.length || countriesResponse.data.length} countries`);
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }

  // Test the specific post creation endpoint
  console.log('\n📝 Testing post creation endpoint...');
  
  const testPostData = {
    user: '68af89bb30464c5a97ca8fcf',
    country: '68a4b54ab46524c54c553cae',
    category: '68a4b54ab46524c54c553cc9',
    foundLost: '68a4b54ab46524c54c553cc3',
    contact: '0000000000',
    exactLocation: 'Test Location',
    exactDate: '2025-01-27',
    description: 'Test post'
  };

  try {
    const postResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Post creation successful');
    console.log('Response:', JSON.stringify(postResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Post creation failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Check if there are any authentication issues
  console.log('\n🔐 Checking authentication requirements...');
  
  try {
    const authResponse = await axios.get(`${RAILWAY_URL}/auth/status`);
    console.log('Auth status:', JSON.stringify(authResponse.data, null, 2));
  } catch (error) {
    console.log('Auth check failed:', error.message);
  }
}

checkRailwayEnvironment().catch(console.error);
