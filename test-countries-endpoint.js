const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testCountriesEndpoint() {
  try {
    console.log('Testing countries endpoint...');
    
    // Test countries endpoint directly
    const response = await axios.get(`${DEPLOYMENT_URL}/countries`, {
      params: { 
        language: 'en',
        active: 'true'
      },
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Countries endpoint working!');
    console.log('Status:', response.status);
    console.log('Countries found:', response.data?.data?.length || 0);
    
    if (response.data?.data?.length > 0) {
      const morocco = response.data.data.find(c => c.code === 'MA');
      if (morocco) {
        console.log('\n🇲🇦 Morocco found:');
        console.log('  ID:', morocco._id);
        console.log('  Code:', morocco.code);
        console.log('  Label:', morocco.label);
        console.log('  Labels:', JSON.stringify(morocco.labels, null, 2));
        
        // Now test dashboard with this Morocco ID
        console.log('\nTesting dashboard with Morocco...');
        const dashboardResponse = await axios.get(`${DEPLOYMENT_URL}/dashboard`, {
          params: {
            currentCountry: morocco._id,
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
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
  }
}

testCountriesEndpoint();
