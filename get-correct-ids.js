const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

async function getCorrectIds() {
  try {
    console.log('🔍 Fetching correct IDs from Railway API...\n');
    
    // Fetch countries
    console.log('🌍 Fetching countries...');
    const countriesResponse = await axios.get(`${API_BASE_URL}/countries`);
    const countries = countriesResponse.data;
    console.log(`Found ${countries.length} countries:`);
    countries.forEach(country => {
      console.log(`  - ID: ${country._id} | Code: ${country.code} | Name: ${country.names?.en || country.code}`);
    });
    
    // Fetch categories
    console.log('\n📂 Fetching categories...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
    const categories = categoriesResponse.data;
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`  - ID: ${category._id} | Code: ${category.code} | Name: ${category.labels?.en || category.code}`);
    });
    
    // Fetch found/lost options
    console.log('\n🔍 Fetching found/lost options...');
    const flOptionsResponse = await axios.get(`${API_BASE_URL}/floptions`);
    const flOptions = flOptionsResponse.data;
    console.log(`Found ${flOptions.length} found/lost options:`);
    flOptions.forEach(option => {
      console.log(`  - ID: ${option._id} | Code: ${option.code} | Name: ${option.labels?.en || option.code}`);
    });
    
    // Fetch cities for Morocco
    console.log('\n🏙️ Fetching cities for Morocco...');
    const morocco = countries.find(c => c.code === 'MA');
    if (morocco) {
      const citiesResponse = await axios.get(`${API_BASE_URL}/cities-public?countryId=${morocco._id}`);
      const cities = citiesResponse.data.data || [];
      console.log(`Found ${cities.length} cities for Morocco:`);
      cities.forEach(city => {
        console.log(`  - ID: ${city._id} | Code: ${city.code} | Name: ${city.labels?.en || city.code}`);
      });
    }
    
    console.log('\n✅ Correct IDs fetched successfully!');
    console.log('\n📋 Use these IDs in your client application:');
    console.log('==========================================');
    
    if (countries.length > 0) {
      console.log(`\n🌍 Default Country ID: ${countries[0]._id} (${countries[0].names?.en || countries[0].code})`);
    }
    
    if (categories.length > 0) {
      console.log(`📂 Default Category ID: ${categories[0]._id} (${categories[0].labels?.en || categories[0].code})`);
    }
    
    if (flOptions.length > 0) {
      console.log(`🔍 Default Found/Lost ID: ${flOptions[0]._id} (${flOptions[0].labels?.en || flOptions[0].code})`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

getCorrectIds();
