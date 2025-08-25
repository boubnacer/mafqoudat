const axios = require('axios');

const BASE_URL = 'http://localhost:3500';

async function testReportFunctionality() {
  console.log('🔧 Testing Report Functionality...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Checking server status...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running');
    
    // Test 2: Get posts to see what's available
    console.log('\n2. Getting posts...');
    const postsResponse = await axios.get(`${BASE_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
    console.log('Posts response status:', postsResponse.status);
    console.log('Posts count:', postsResponse.data?.postsWithUser?.length || 0);
    
    if (postsResponse.data?.postsWithUser?.length > 0) {
      const post = postsResponse.data.postsWithUser[0];
      console.log('Sample post data:', {
        _id: post._id,
        user: post.user,
        categoryname: post.categoryname,
        countryname: post.countryname,
        foundLost: post.foundLost
      });
      
      // Test 3: Test report endpoint with real post data
      console.log('\n3. Testing report endpoint...');
      const reportData = {
        postId: post._id,
        reason: 'Test reason for debugging',
        userId: post.user || 'anonymous'
      };
      
      console.log('Sending report data:', reportData);
      
      try {
        const reportResponse = await axios.post(`${BASE_URL}/posts/report`, reportData);
        console.log('✅ Report submitted successfully!');
        console.log('Response:', reportResponse.data);
      } catch (error) {
        console.log('❌ Report submission failed:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Error message:', error.message);
      }
    } else {
      console.log('No posts found in database');
      console.log('You need to create some posts first to test the report functionality');
    }
    
    // Test 4: Test with invalid post ID
    console.log('\n4. Testing with invalid post ID...');
    try {
      const invalidReportResponse = await axios.post(`${BASE_URL}/posts/report`, {
        postId: 'invalid-post-id',
        reason: 'Test reason',
        userId: 'anonymous'
      });
      console.log('Unexpected success with invalid post ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly got 404 for invalid post ID');
      } else {
        console.log('❌ Unexpected error for invalid post ID:', error.response?.status);
      }
    }
    
    console.log('\n🎉 Report functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3500');
    }
  }
}

// Run the test
testReportFunctionality();
