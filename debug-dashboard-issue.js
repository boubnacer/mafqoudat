const axios = require('axios');

async function debugDashboardIssue() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Debugging dashboard issue...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    // Test 1: Check if server is responding
    console.log('\n1️⃣ Testing server health...');
    try {
      const healthResponse = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
      console.log('✅ Server is responding');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    
    // Test 2: Check if posts endpoint works
    console.log('\n2️⃣ Testing posts endpoint...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=${moroccoCountryId}&page=1&pageSize=1`, { timeout: 5000 });
      console.log('✅ Posts endpoint working, count:', postsResponse.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Posts endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 3: Check if countries endpoint works
    console.log('\n3️⃣ Testing countries endpoint...');
    try {
      const countriesResponse = await axios.get(`${apiUrl}/dependencies/countries`, { timeout: 5000 });
      console.log('✅ Countries endpoint working, count:', countriesResponse.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Countries endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 4: Check if categories endpoint works
    console.log('\n4️⃣ Testing categories endpoint...');
    try {
      const categoriesResponse = await axios.get(`${apiUrl}/dependencies/categories`, { timeout: 5000 });
      console.log('✅ Categories endpoint working, count:', categoriesResponse.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Categories endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 5: Try dashboard with different country
    console.log('\n5️⃣ Testing dashboard with different country...');
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=68a4b54ab46524c54c553ca9`, { timeout: 10000 });
      console.log('✅ Dashboard working with Morocco');
    } catch (error) {
      console.log('❌ Dashboard failed with Morocco:', error.response?.data || error.message);
    }
    
    // Test 6: Check if there are any posts in the database
    console.log('\n6️⃣ Checking for posts in database...');
    try {
      const allPostsResponse = await axios.get(`${apiUrl}/posts?page=1&pageSize=10`, { timeout: 5000 });
      const totalPosts = allPostsResponse.data?.ids?.length || 0;
      console.log(`📊 Total posts in database: ${totalPosts}`);
      
      if (totalPosts > 0) {
        const firstPost = allPostsResponse.data.entities[allPostsResponse.data.ids[0]];
        console.log('📝 First post details:');
        console.log('- ID:', firstPost._id);
        console.log('- Country:', firstPost.country);
        console.log('- FoundLost:', firstPost.foundLost);
        console.log('- Category:', firstPost.category);
        console.log('- Created:', firstPost.createdAt);
      }
    } catch (error) {
      console.log('❌ Failed to get posts:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

debugDashboardIssue();
