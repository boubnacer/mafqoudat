const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function debugReportIssueDetailed() {
  console.log('🔍 Detailed Report Issue Debug...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check server health
    console.log('\\n1. Server Health Check...');
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/`);
    console.log('✅ Server is healthy');
    
    // Step 2: Check all collections to see what data exists
    console.log('\\n2. Database Collections Check...');
    
    const collections = [
      { name: 'Countries', endpoint: '/countries' },
      { name: 'Categories', endpoint: '/categories' },
      { name: 'Cities', endpoint: '/cities' },
      { name: 'FoundLost Options', endpoint: '/floptions' },
      { name: 'Posts', endpoint: '/posts?currentCountry=MA&page=0&pageSize=5' }
    ];
    
    for (const collection of collections) {
      try {
        const response = await axios.get(`${DEPLOYMENT_URL}${collection.endpoint}`);
        const data = response.data;
        let count = 0;
        
        if (Array.isArray(data)) {
          count = data.length;
        } else if (data?.postsWithUser) {
          count = data.postsWithUser.length;
        } else if (data?.data) {
          count = data.data.length;
        }
        
        console.log(`${collection.name}: ${count} items`);
        
        // If it's posts and there are some, show details
        if (collection.name === 'Posts' && count > 0) {
          console.log('  Sample post:', {
            _id: data.postsWithUser[0]._id,
            user: data.postsWithUser[0].user,
            foundLost: data.postsWithUser[0].foundLost
          });
        }
      } catch (error) {
        console.log(`${collection.name}: Error - ${error.response?.status || error.message}`);
      }
    }
    
    // Step 3: Test report endpoint with different scenarios
    console.log('\\n3. Report Endpoint Testing...');
    
    // Test 3a: Without authentication
    console.log('\\n3a. Testing without authentication...');
    try {
      await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: '507f1f77bcf86cd799439011',
        reason: 'Test reason'
      });
      console.log('❌ Should have failed - endpoint accessible without auth');
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
    }
    
    // Test 3b: With invalid post ID but proper auth format
    console.log('\\n3b. Testing with invalid post ID...');
    try {
      await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: 'invalid-post-id',
        reason: 'Test reason'
      }, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Should have failed - invalid token accepted');
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
    }
    
    // Step 4: Check if there are any posts to get a real post ID
    console.log('\\n4. Looking for real posts...');
    const postsResponse = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=10`);
    const posts = postsResponse.data?.postsWithUser || [];
    
    if (posts.length > 0) {
      console.log(`✅ Found ${posts.length} posts`);
      console.log('Sample post IDs:');
      posts.slice(0, 3).forEach((post, index) => {
        console.log(`  ${index + 1}. ${post._id}`);
      });
    } else {
      console.log('❌ No posts found in database');
      console.log('💡 This explains the 403 error - client is trying to report non-existent posts');
    }
    
    console.log('\\n🎉 Detailed debug completed!');
    
    // Summary
    console.log('\\n📋 SUMMARY:');
    if (posts.length === 0) {
      console.log('❌ The issue is: NO POSTS IN DATABASE');
      console.log('💡 Solution: Create some posts first, then test reporting');
    } else {
      console.log('✅ Posts exist, the issue might be with authentication or post ID format');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugReportIssueDetailed();
