const axios = require('axios');

const API_BASE_URL = 'http://localhost:3500';

async function testCityData() {
  try {
    console.log('Testing city data from dashboard API...');
    
    // Test dashboard API
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      params: {
        currentCountry: '68a4b54ab46524c54c553ca9', // Morocco
        language: 'en'
      }
    });
    
    console.log('\n=== Dashboard API Response ===');
    console.log('Trending Post:');
    if (dashboardResponse.data.trendingPost && dashboardResponse.data.trendingPost.length > 0) {
      const trending = dashboardResponse.data.trendingPost[0];
      console.log('  City:', trending.city);
      console.log('  City Name:', trending.cityName);
      console.log('  City Labels:', trending.cityLabels);
    }
    
    console.log('\nRecent Founds:');
    if (dashboardResponse.data.recentFounds && dashboardResponse.data.recentFounds.length > 0) {
      const found = dashboardResponse.data.recentFounds[0];
      console.log('  City:', found.city);
      console.log('  City Name:', found.cityName);
      console.log('  City Labels:', found.cityLabels);
    }
    
    console.log('\nRecent Losts:');
    if (dashboardResponse.data.recentLosts && dashboardResponse.data.recentLosts.length > 0) {
      const lost = dashboardResponse.data.recentLosts[0];
      console.log('  City:', lost.city);
      console.log('  City Name:', lost.cityName);
      console.log('  City Labels:', lost.cityLabels);
    }
    
    // Test posts API
    console.log('\n=== Posts API Response ===');
    const postsResponse = await axios.get(`${API_BASE_URL}/posts`, {
      params: {
        currentCountry: '68a4b54ab46524c54c553ca9', // Morocco
        page: 1,
        pageSize: 3,
        language: 'en'
      }
    });
    
    if (postsResponse.data.postsWithUser && postsResponse.data.postsWithUser.length > 0) {
      postsResponse.data.postsWithUser.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log('  City:', post.city);
        console.log('  City Name:', post.cityName);
        console.log('  City Labels:', post.cityLabels);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testCityData();
