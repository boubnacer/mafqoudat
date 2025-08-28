const axios = require('axios');

// Test both local and deployment URLs
const LOCAL_URL = 'http://localhost:3500';
const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testCityData(url, label) {
  try {
    console.log(`\n=== Testing ${label} ===`);
    console.log(`URL: ${url}`);
    
    // Test dashboard API
    const dashboardResponse = await axios.get(`${url}/dashboard`, {
      params: {
        currentCountry: '68a4b54ab46524c54c553ca9', // Morocco
        language: 'en'
      },
      timeout: 15000
    });
    
    console.log('\nDashboard API Response:');
    console.log('Trending Post:');
    if (dashboardResponse.data.trendingPost && dashboardResponse.data.trendingPost.length > 0) {
      const trending = dashboardResponse.data.trendingPost[0];
      console.log('  City ID:', trending.city);
      console.log('  City Name:', trending.cityName);
      console.log('  City Labels:', JSON.stringify(trending.cityLabels, null, 2));
    } else {
      console.log('  No trending posts found');
    }
    
    console.log('\nRecent Founds:');
    if (dashboardResponse.data.recentFounds && dashboardResponse.data.recentFounds.length > 0) {
      const found = dashboardResponse.data.recentFounds[0];
      console.log('  City ID:', found.city);
      console.log('  City Name:', found.cityName);
      console.log('  City Labels:', JSON.stringify(found.cityLabels, null, 2));
    } else {
      console.log('  No recent founds');
    }
    
    console.log('\nRecent Losts:');
    if (dashboardResponse.data.recentLosts && dashboardResponse.data.recentLosts.length > 0) {
      const lost = dashboardResponse.data.recentLosts[0];
      console.log('  City ID:', lost.city);
      console.log('  City Name:', lost.cityName);
      console.log('  City Labels:', JSON.stringify(lost.cityLabels, null, 2));
    } else {
      console.log('  No recent losts');
    }
    
    // Test posts API
    console.log('\nPosts API Response:');
    const postsResponse = await axios.get(`${url}/posts`, {
      params: {
        currentCountry: '68a4b54ab46524c54c553ca9', // Morocco
        page: 1,
        pageSize: 3,
        language: 'en'
      },
      timeout: 15000
    });
    
    if (postsResponse.data.postsWithUser && postsResponse.data.postsWithUser.length > 0) {
      postsResponse.data.postsWithUser.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log('  City ID:', post.city);
        console.log('  City Name:', post.cityName);
        console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
      });
    } else {
      console.log('  No posts found');
    }
    
  } catch (error) {
    console.error(`Error testing ${label}:`, error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

async function main() {
  console.log('Testing city data in deployment environment...');
  
  // Test deployment only
  await testCityData(DEPLOYMENT_URL, 'DEPLOYMENT');
}

main();
