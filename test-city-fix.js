const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testCityFix() {
  try {
    console.log('Testing city name fix...');
    
    // First, get the countries to find UAE
    const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/countries`, {
      params: { language: 'en' },
      timeout: 15000
    });
    
    console.log('✅ Countries endpoint working');
    console.log('Countries found:', countriesResponse.data?.data?.length || 0);
    
    // Find UAE
    const uae = countriesResponse.data.data.find(c => c.code === 'AE');
    if (!uae) {
      console.log('❌ UAE not found in countries list');
      return;
    }
    
    console.log('\n🇦🇪 UAE found:');
    console.log('  ID:', uae._id);
    console.log('  Code:', uae.code);
    console.log('  Label:', uae.label);
    
    // Test dashboard with UAE
    console.log('\nTesting dashboard with UAE...');
    const dashboardResponse = await axios.get(`${DEPLOYMENT_URL}/dashboard`, {
      params: {
        currentCountry: uae._id,
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
      console.log('  Region field exists:', 'region' in post);
    }
    
    if (dashboardResponse.data.trendingPost?.length > 0) {
      const post = dashboardResponse.data.trendingPost[0];
      console.log('\n📄 Sample trending post data:');
      console.log('  City ID:', post.city);
      console.log('  City Name:', post.cityName);
      console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
      console.log('  Category:', post.categoryName);
      console.log('  Country:', post.countryname);
      console.log('  Region field exists:', 'region' in post);
    }
    
    // Test posts API with UAE
    console.log('\nTesting posts API with UAE...');
    const postsResponse = await axios.get(`${DEPLOYMENT_URL}/posts`, {
      params: {
        currentCountry: uae._id,
        page: 1,
        pageSize: 3,
        language: 'en'
      },
      timeout: 15000
    });
    
    console.log('✅ Posts API working!');
    console.log('Posts found:', postsResponse.data.postsWithUser?.length || 0);
    
    if (postsResponse.data.postsWithUser?.length > 0) {
      postsResponse.data.postsWithUser.forEach((post, index) => {
        console.log(`\n📄 Post ${index + 1}:`);
        console.log('  City ID:', post.city);
        console.log('  City Name:', post.cityName);
        console.log('  City Labels:', JSON.stringify(post.cityLabels, null, 2));
        console.log('  Category:', post.categoryname);
        console.log('  Country:', post.countryname);
        console.log('  Region field exists:', 'region' in post);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testCityFix();
