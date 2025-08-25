const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testPaginationFix() {
  console.log('🔍 Testing Pagination Fix...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Test with page=0 (this was causing the issue)
    console.log('\\n1. Testing with page=0 (should not cause negative skip)...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      
      if (response.data.isError) {
        console.log('❌ Still getting error:', response.data.message);
      } else {
        console.log('✅ Pagination fix working!');
        console.log('Posts found:', response.data.postsWithUser?.length || 0);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.response?.status || error.message);
    }
    
    // Step 2: Test with page=1
    console.log('\\n2. Testing with page=1...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=1&pageSize=5`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      
      if (response.data.isError) {
        console.log('❌ Still getting error:', response.data.message);
      } else {
        console.log('✅ Pagination working with page=1!');
        console.log('Posts found:', response.data.postsWithUser?.length || 0);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.response?.status || error.message);
    }
    
    // Step 3: Test without page parameter
    console.log('\\n3. Testing without page parameter...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&pageSize=5`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      
      if (response.data.isError) {
        console.log('❌ Still getting error:', response.data.message);
      } else {
        console.log('✅ Pagination working without page parameter!');
        console.log('Posts found:', response.data.postsWithUser?.length || 0);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.response?.status || error.message);
    }
    
    console.log('\\n🎉 Pagination test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPaginationFix();
