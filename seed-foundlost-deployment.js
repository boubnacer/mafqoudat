const axios = require('axios');

async function seedFoundLostDeployment() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Seeding FoundLost options in deployment...');
    console.log('API URL:', apiUrl);
    
    // First, try to get FoundLost options to see if they exist
    console.log('\n1. Checking existing FoundLost options...');
    try {
      const checkResponse = await axios.get(`${apiUrl}/dependencies/foundlost-options`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('FoundLost options exist:', checkResponse.data);
      return;
    } catch (error) {
      console.log('FoundLost options not found or unauthorized, proceeding with seeding...');
    }
    
    // Try to seed FoundLost options using the admin endpoint
    console.log('\n2. Seeding FoundLost options...');
    const foundLostData = [
      {
        code: "FOUND",
        label: "Found",
        labels: {
          en: "Found",
          fr: "Trouvé",
          ar: "تم العثور عليه"
        },
        color: "#4CAF50",
        icon: "🔍",
        isActive: true,
        description: "Items that have been found and are being returned to their owners"
      },
      {
        code: "LOST",
        label: "Lost",
        labels: {
          en: "Lost",
          fr: "Perdu",
          ar: "مفقود"
        },
        color: "#F44336",
        icon: "❓",
        isActive: true,
        description: "Items that have been lost and are being searched for"
      }
    ];
    
    try {
      const seedResponse = await axios.post(`${apiUrl}/dependencies/foundlost-options`, foundLostData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ FoundLost options seeded successfully:', seedResponse.data);
    } catch (seedError) {
      console.error('❌ Failed to seed FoundLost options:', seedError.response?.data || seedError.message);
      
      // Try alternative seeding method
      console.log('\n3. Trying alternative seeding method...');
      try {
        const altResponse = await axios.post(`${apiUrl}/admin/seed-foundlost`, foundLostData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ FoundLost options seeded via admin endpoint:', altResponse.data);
      } catch (altError) {
        console.error('❌ Alternative seeding also failed:', altError.response?.data || altError.message);
      }
    }
    
    // Test dashboard after seeding
    console.log('\n4. Testing dashboard after seeding...');
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`);
      console.log('✅ Dashboard working:', dashboardResponse.data);
    } catch (dashboardError) {
      console.error('❌ Dashboard still failing:', dashboardError.response?.data || dashboardError.message);
    }
    
  } catch (error) {
    console.error('General error:', error.message);
  }
}

seedFoundLostDeployment();
