const axios = require('axios');

async function testDashboardAPI() {
  try {
    // Test with the correct Morocco country ID
    const testCountryId = '68a4b54ab46524c54c553ca9';
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Testing deployed dashboard API...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', testCountryId);
    console.log('Country: Morocco (MA)');
    
    // Test the dashboard endpoint
    const response = await axios.get(`${apiUrl}/dashboard?currentCountry=${testCountryId}`);
    
    console.log('Dashboard API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Check specific fields
    const data = response.data;
    console.log('\nData Analysis:');
    console.log('Total Posts:', data.totalPosts);
    console.log('Total Founds:', data.totalFounds);
    console.log('Total Losts:', data.totalLosts);
    console.log('Recent Founds Count:', data.recentFounds?.length || 0);
    console.log('Recent Losts Count:', data.recentLosts?.length || 0);
    console.log('Trending Post:', data.trendingPost ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('Error testing dashboard API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testDashboardAPI();
