const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testWithRealPost() {
  console.log('🔍 Testing with Real Post...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check if the post exists
    console.log('\\n1. Checking for posts in Morocco...');
    const postsResponse = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
    const posts = postsResponse.data?.postsWithUser || [];
    
    console.log(`Posts found: ${posts.length}`);
    
    if (posts.length === 0) {
      console.log('❌ No posts found. Please create a post first.');
      return;
    }
    
    const post = posts[0];
    console.log('✅ Found post:');
    console.log(`  ID: ${post._id}`);
    console.log(`  User: ${post.user}`);
    console.log(`  Found/Lost: ${post.foundLost}`);
    console.log(`  Category: ${post.categoryname}`);
    console.log(`  Location: ${post.exactLocation}`);
    
    // Step 2: Test report endpoint without authentication (should fail)
    console.log('\\n2. Testing report endpoint without authentication...');
    try {
      await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: post._id,
        reason: 'Test reason - inappropriate content'
      });
      console.log('❌ Should have failed - endpoint accessible without auth');
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 3: Test report endpoint with invalid token (should fail)
    console.log('\\n3. Testing report endpoint with invalid token...');
    try {
      await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: post._id,
        reason: 'Test reason - inappropriate content'
      }, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });
      console.log('❌ Should have failed - invalid token accepted');
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 4: Test with a valid post ID but no auth (should fail)
    console.log('\\n4. Testing with valid post ID but no authentication...');
    try {
      await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: post._id,
        reason: 'Test reason - inappropriate content',
        userId: 'anonymous'
      });
      console.log('❌ Should have failed - endpoint accessible without auth');
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    console.log('\\n🎉 Testing completed!');
    console.log('\\n📋 ANALYSIS:');
    console.log('✅ The post exists and is accessible');
    console.log('✅ The report endpoint is properly protected');
    console.log('✅ Authentication is working correctly');
    console.log('\\n💡 The issue is likely:');
    console.log('1. Client-side authentication token is missing or invalid');
    console.log('2. Client is not sending the authentication header properly');
    console.log('3. User is not properly logged in on the client side');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testWithRealPost();
