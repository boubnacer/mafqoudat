const axios = require('axios');

async function testCountriesWithPosts() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Testing countries with posts...');
    console.log('API URL:', apiUrl);
    
    // First, get all countries
    const countriesResponse = await axios.get(`${apiUrl}/countries`);
    console.log('Countries API Status:', countriesResponse.status);
    
    const countries = countriesResponse.data.data || countriesResponse.data;
    console.log('Total countries found:', countries.length);
    
    // Test each country for posts
    for (const country of countries.slice(0, 5)) { // Test first 5 countries
      console.log(`\nTesting country: ${country.code} (${country.names?.en || country.name})`);
      console.log('Country ID:', country._id);
      
      try {
        const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${country._id}`);
        const data = dashboardResponse.data;
        
        console.log(`  Total Posts: ${data.totalPosts}`);
        console.log(`  Total Founds: ${data.totalFounds}`);
        console.log(`  Total Losts: ${data.totalLosts}`);
        console.log(`  Recent Founds: ${data.recentFounds?.length || 0}`);
        console.log(`  Recent Losts: ${data.recentLosts?.length || 0}`);
        
        if (data.totalPosts > 0) {
          console.log(`  ✅ This country has posts!`);
        }
      } catch (error) {
        console.log(`  ❌ Error testing country ${country.code}:`, error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.error('Error testing countries:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCountriesWithPosts();
