const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function checkDeploymentPosts() {
  console.log('🔍 Checking Deployment Posts...\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Test 1: Check all posts without country filter
    console.log('\n1. Checking all posts (no country filter)...');
    try {
      const allPostsResponse = await axios.get(`${DEPLOYMENT_URL}/posts`);
      console.log('✅ All posts endpoint working');
      console.log('All posts count:', allPostsResponse.data?.postsWithUser?.length || 0);
      if (allPostsResponse.data?.postsWithUser?.length > 0) {
        console.log('Sample post:', {
          _id: allPostsResponse.data.postsWithUser[0]._id,
          user: allPostsResponse.data.postsWithUser[0].user,
          country: allPostsResponse.data.postsWithUser[0].country,
          foundLost: allPostsResponse.data.postsWithUser[0].foundLost
        });
      }
    } catch (error) {
      console.log('❌ All posts endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Check posts with Morocco filter
    console.log('\n2. Checking posts with Morocco filter...');
    try {
      const moroccoPostsResponse = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=10`);
      console.log('✅ Morocco posts endpoint working');
      console.log('Morocco posts count:', moroccoPostsResponse.data?.postsWithUser?.length || 0);
      if (moroccoPostsResponse.data?.postsWithUser?.length > 0) {
        console.log('Sample Morocco post:', {
          _id: moroccoPostsResponse.data.postsWithUser[0]._id,
          user: moroccoPostsResponse.data.postsWithUser[0].user,
          country: moroccoPostsResponse.data.postsWithUser[0].country,
          foundLost: moroccoPostsResponse.data.postsWithUser[0].foundLost
        });
      }
    } catch (error) {
      console.log('❌ Morocco posts endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test 3: Check countries
    console.log('\n3. Checking countries...');
    try {
      const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/countries`);
      console.log('✅ Countries endpoint working');
      console.log('Countries count:', countriesResponse.data?.length || 0);
      const morocco = countriesResponse.data?.find(c => c.code === 'MA');
      if (morocco) {
        console.log('Morocco found:', morocco._id);
      } else {
        console.log('❌ Morocco not found in countries');
      }
    } catch (error) {
      console.log('❌ Countries endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test 4: Check posts with different country codes
    console.log('\n4. Checking posts with different country codes...');
    const countryCodes = ['MA', 'US', 'FR', 'CA', 'GB'];
    for (const code of countryCodes) {
      try {
        const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${code}&page=0&pageSize=5`);
        const count = response.data?.postsWithUser?.length || 0;
        if (count > 0) {
          console.log(`✅ Found ${count} posts in country ${code}`);
        }
      } catch (error) {
        console.log(`❌ Error checking country ${code}:`, error.response?.status);
      }
    }
    
    console.log('\n🎉 Deployment posts check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the check
checkDeploymentPosts();
