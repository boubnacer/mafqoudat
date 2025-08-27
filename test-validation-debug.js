const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function testValidationDebug() {
  console.log('🔍 Testing validation logic debug...\n');
  
  // Step 1: Login to get fresh token
  console.log('1️⃣ Logging in...');
  try {
    const loginResponse = await axios.post(`${RAILWAY_URL}/auth`, {
      emailOrPhone: '0000000000',
      password: '0000'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const freshToken = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    
    // Step 2: Test post creation with detailed logging
    console.log('\n2️⃣ Testing post creation with validation debug...');
    
    const testPostData = {
      user: '68af89bb30464c5a97ca8fcf',
      country: '68a4b54ab46524c54c553cae', // United Arab Emirates
      category: '68a4b54ab46524c54c553cc9', // Clothing
      foundLost: '68a4b54ab46524c54c553cc3', // Found
      contact: '0000000000',
      exactLocation: 'Test Location',
      exactDate: '2025-01-27',
      description: 'Test post for validation debug'
    };
    
    console.log('Sending post data:', JSON.stringify(testPostData, null, 2));
    
    const postResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });
    
    console.log('✅ Post creation successful!');
    console.log('Response:', JSON.stringify(postResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Post creation failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Analyze the error response
      const errorData = error.response.data;
      if (errorData.details) {
        console.log('\n🔍 Error Analysis:');
        console.log('- Missing references:', errorData.details.missingReferences);
        console.log('- User exists:', errorData.details.userExists);
        console.log('- Country exists:', errorData.details.countryExists);
        console.log('- Category exists:', errorData.details.categoryExists);
        console.log('- FoundLost exists:', errorData.details.foundLostExists);
        
        // Check if the IDs we're sending match the available options
        if (errorData.details.availableOptions) {
          console.log('\n📊 Available Options Analysis:');
          
          const availableCountries = errorData.details.availableOptions.countries;
          const availableCategories = errorData.details.availableOptions.categories;
          const availableFoundLost = errorData.details.availableOptions.foundLost;
          
                     const ourCountry = availableCountries.find(c => c.id === '68a4b54ab46524c54c553cae');
           const ourCategory = availableCategories.find(c => c.id === '68a4b54ab46524c54c553cc9');
           const ourFoundLost = availableFoundLost.find(f => f.id === '68a4b54ab46524c54c553cc3');
          
          console.log('- Our country in available options:', ourCountry ? '✅ YES' : '❌ NO');
          console.log('- Our category in available options:', ourCategory ? '✅ YES' : '❌ NO');
          console.log('- Our foundLost in available options:', ourFoundLost ? '✅ YES' : '❌ NO');
          
          if (ourCountry) console.log('  Country details:', ourCountry);
          if (ourCategory) console.log('  Category details:', ourCategory);
          if (ourFoundLost) console.log('  FoundLost details:', ourFoundLost);
        }
      }
    }
  }
}

testValidationDebug().catch(console.error);
