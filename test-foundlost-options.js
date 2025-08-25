const axios = require('axios');

async function testFoundLostOptions() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Testing FoundLost options...');
    
    // Get FoundLost options
    const flOptionsResponse = await axios.get(`${apiUrl}/floptions`);
    console.log('FL Options API Status:', flOptionsResponse.status);
    console.log('FL Options:', JSON.stringify(flOptionsResponse.data, null, 2));
    
    const flOptions = flOptionsResponse.data.data || flOptionsResponse.data;
    
    // Find FOUND and LOST options
    const foundOption = flOptions.find(option => option.code === 'FOUND');
    const lostOption = flOptions.find(option => option.code === 'LOST');
    
    console.log('\nFound Option:', foundOption ? foundOption._id : 'NOT FOUND');
    console.log('Lost Option:', lostOption ? lostOption._id : 'NOT FOUND');
    
    // Test dashboard with explicit found/lost IDs
    if (foundOption) {
      console.log('\nTesting dashboard with explicit FOUND ID...');
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=68a4b54ab46524c54c553ca9&foundId=${foundOption._id}&lostId=${lostOption?._id || 'none'}`);
      console.log('Dashboard with explicit IDs:', JSON.stringify(dashboardResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFoundLostOptions();
