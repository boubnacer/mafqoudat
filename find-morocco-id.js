const axios = require('axios');

async function findMoroccoId() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Finding Morocco country ID...');
    
    // Get all countries
    const countriesResponse = await axios.get(`${apiUrl}/countries`);
    const countries = countriesResponse.data.data || countriesResponse.data;
    
    // Find Morocco
    const morocco = countries.find(country => 
      country.code === 'MA' || 
      country.names?.en === 'Morocco' ||
      country.name === 'Morocco'
    );
    
    if (morocco) {
      console.log('Found Morocco:');
      console.log('ID:', morocco._id);
      console.log('Code:', morocco.code);
      console.log('Name:', morocco.names?.en || morocco.name);
      
      // Test if Morocco has posts
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${morocco._id}`);
      const data = dashboardResponse.data;
      
      console.log('\nMorocco posts:');
      console.log('Total Posts:', data.totalPosts);
      console.log('Total Founds:', data.totalFounds);
      console.log('Total Losts:', data.totalLosts);
    } else {
      console.log('Morocco not found in countries list');
      
      // List all countries to see what's available
      console.log('\nAvailable countries:');
      countries.slice(0, 10).forEach(country => {
        console.log(`${country.code}: ${country.names?.en || country.name} (ID: ${country._id})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

findMoroccoId();
