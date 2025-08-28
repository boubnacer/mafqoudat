const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testUAEDashboard() {
  try {
    console.log('Testing dashboard with UAE (which has posts)...');
    
    // Test dashboard with UAE
    const dashboardResponse = await axios.get(`${DEPLOYMENT_URL}/dashboard`, {
      params: {
        currentCountry: '68a4b54ab46524c54c553cae', // UAE
        language: 'en'
      },
      timeout: 15000
    });
    
    console.log('✅ Dashboard endpoint working!');
    console.log('Trending posts:', dashboardResponse.data.trendingPost?.length || 0);
    console.log('Recent founds:', dashboardResponse.data.recentFounds?.length || 0);
    console.log('Recent losts:', dashboardResponse.data.recentLosts?.length || 0);
    
    if (dashboardResponse.data.recentFounds?.length > 0) {
      const post = dashboardResponse.data.recentFounds[0];
      console.log('\n📄 Sample post data:');
      console.log('  City ID:', post.city);
      console.log('  City Name:', post.cityName);
      console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
      console.log('  Category:', post.categoryname);
      console.log('  Country:', post.countryname);
    }
    
    if (dashboardResponse.data.recentLosts?.length > 0) {
      const post = dashboardResponse.data.recentLosts[0];
      console.log('\n📄 Sample lost post data:');
      console.log('  City ID:', post.city);
      console.log('  City Name:', post.cityName);
      console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
      console.log('  Category:', post.categoryname);
      console.log('  Country:', post.countryname);
    }
    
    if (dashboardResponse.data.trendingPost?.length > 0) {
      const post = dashboardResponse.data.trendingPost[0];
      console.log('\n📄 Sample trending post data:');
      console.log('  City ID:', post.city);
      console.log('  City Name:', post.cityName);
      console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
      console.log('  Category:', post.categoryName);
      console.log('  Country:', post.countryname);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testUAEDashboard();
