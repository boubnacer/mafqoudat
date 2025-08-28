const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testDeployment() {
  try {
    console.log('Testing deployment...');
    
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${DEPLOYMENT_URL}/health`, { timeout: 10000 });
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }
    
    // Test countries endpoint
    try {
      const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/dependencies/countries`, { 
        params: { language: 'en' },
        timeout: 10000 
      });
      console.log('\n✅ Countries endpoint working');
      console.log('Countries found:', countriesResponse.data?.data?.length || 0);
      
      if (countriesResponse.data?.data?.length > 0) {
        const morocco = countriesResponse.data.data.find(c => c.code === 'MA');
        if (morocco) {
          console.log('🇲🇦 Morocco found:', morocco._id);
          
          // Test dashboard with Morocco
          const dashboardResponse = await axios.get(`${DEPLOYMENT_URL}/dashboard`, {
            params: {
              currentCountry: morocco._id,
              language: 'en'
            },
            timeout: 15000
          });
          
          console.log('\n✅ Dashboard endpoint working');
          console.log('Trending posts:', dashboardResponse.data.trendingPost?.length || 0);
          console.log('Recent founds:', dashboardResponse.data.recentFounds?.length || 0);
          console.log('Recent losts:', dashboardResponse.data.recentLosts?.length || 0);
          
          if (dashboardResponse.data.recentFounds?.length > 0) {
            const post = dashboardResponse.data.recentFounds[0];
            console.log('\n📄 Sample post data:');
            console.log('  City ID:', post.city);
            console.log('  City Name:', post.cityName);
            console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
          }
        }
      }
    } catch (error) {
      console.log('❌ Countries endpoint failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeployment();
