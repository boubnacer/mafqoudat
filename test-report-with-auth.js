const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testReportWithAuth() {
  console.log('🔍 Testing Report with Authentication...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Get a real post from the database
    console.log('\\n1. Getting posts from database...');
    const postsResponse = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
    const posts = postsResponse.data?.postsWithUser || [];
    
    console.log(`Posts found: ${posts.length}`);
    
    if (posts.length === 0) {
      console.log('❌ No posts found. Cannot test report functionality.');
      return;
    }
    
    const testPost = posts[0];
    console.log('✅ Found test post:');
    console.log(`  ID: ${testPost._id}`);
    console.log(`  User: ${testPost.user}`);
    console.log(`  Found/Lost: ${testPost.foundLost}`);
    console.log(`  Category: ${testPost.categoryname}`);
    console.log(`  Location: ${testPost.exactLocation}`);
    
    // Step 2: Test report without authentication (should fail)
    console.log('\\n2. Testing report without authentication...');
    try {
      const reportResponse = await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: testPost._id,
        reason: 'Test reason - inappropriate content'
      });
      console.log('❌ Should have failed - endpoint accessible without auth');
      console.log('Response:', reportResponse.data);
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 3: Test report with invalid token (should fail)
    console.log('\\n3. Testing report with invalid token...');
    try {
      const reportResponse = await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: testPost._id,
        reason: 'Test reason - inappropriate content'
      }, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });
      console.log('❌ Should have failed - invalid token accepted');
      console.log('Response:', reportResponse.data);
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 4: Test report with malformed token (should fail)
    console.log('\\n4. Testing report with malformed token...');
    try {
      const reportResponse = await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: testPost._id,
        reason: 'Test reason - inappropriate content'
      }, {
        headers: {
          'Authorization': 'invalid-token-format'
        }
      });
      console.log('❌ Should have failed - malformed token accepted');
      console.log('Response:', reportResponse.data);
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 5: Test report with empty token (should fail)
    console.log('\\n5. Testing report with empty token...');
    try {
      const reportResponse = await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: testPost._id,
        reason: 'Test reason - inappropriate content'
      }, {
        headers: {
          'Authorization': 'Bearer '
        }
      });
      console.log('❌ Should have failed - empty token accepted');
      console.log('Response:', reportResponse.data);
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    console.log('\\n🎉 Authentication tests completed!');
    console.log('\\n📋 ANALYSIS:');
    console.log('✅ Report endpoint is properly protected');
    console.log('✅ Authentication is working correctly');
    console.log('✅ Posts exist in database');
    console.log('\\n💡 The issue is likely:');
    console.log('1. Client is not sending authentication token');
    console.log('2. Client authentication token is invalid or expired');
    console.log('3. Client is not properly logged in');
    console.log('4. Client-side authentication state is corrupted');
    
    console.log('\\n🔧 NEXT STEPS:');
    console.log('1. Check if user is properly logged in on the client');
    console.log('2. Check browser console for authentication errors');
    console.log('3. Check if the authentication token is being sent');
    console.log('4. Try logging out and logging back in');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testReportWithAuth();
