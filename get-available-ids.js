const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

async function getAvailableIds() {
  try {
    console.log('🔍 Fetching available IDs from Railway API...\n');
    
    // Check countries
    console.log('🌍 Checking countries...');
    try {
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries`);
      console.log('Countries response structure:', typeof countriesResponse.data);
      console.log('Countries response:', JSON.stringify(countriesResponse.data, null, 2));
      
      // Try different possible structures
      let countries = [];
      if (Array.isArray(countriesResponse.data)) {
        countries = countriesResponse.data;
      } else if (countriesResponse.data && Array.isArray(countriesResponse.data.data)) {
        countries = countriesResponse.data.data;
      } else if (countriesResponse.data && countriesResponse.data.ids) {
        // This might be the RTK Query structure
        countries = countriesResponse.data.ids.map(id => countriesResponse.data.entities[id]);
      }
      
      console.log(`\nFound ${countries.length} countries:`);
      countries.forEach(country => {
        console.log(`  - ID: ${country._id} | Code: ${country.code} | Name: ${country.names?.en || country.code}`);
      });
      
    } catch (error) {
      console.log('❌ Could not fetch countries:', error.message);
    }
    
    // Check categories
    console.log('\n📂 Checking categories...');
    try {
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      console.log('Categories response structure:', typeof categoriesResponse.data);
      console.log('Categories response:', JSON.stringify(categoriesResponse.data, null, 2));
      
      let categories = [];
      if (Array.isArray(categoriesResponse.data)) {
        categories = categoriesResponse.data;
      } else if (categoriesResponse.data && Array.isArray(categoriesResponse.data.data)) {
        categories = categoriesResponse.data.data;
      } else if (categoriesResponse.data && categoriesResponse.data.ids) {
        categories = categoriesResponse.data.ids.map(id => categoriesResponse.data.entities[id]);
      }
      
      console.log(`\nFound ${categories.length} categories:`);
      categories.forEach(category => {
        console.log(`  - ID: ${category._id} | Code: ${category.code} | Name: ${category.labels?.en || category.code}`);
      });
      
    } catch (error) {
      console.log('❌ Could not fetch categories:', error.message);
    }
    
    // Check found/lost options
    console.log('\n🔍 Checking found/lost options...');
    try {
      const flOptionsResponse = await axios.get(`${API_BASE_URL}/floptions`);
      console.log('Found/Lost response structure:', typeof flOptionsResponse.data);
      console.log('Found/Lost response:', JSON.stringify(flOptionsResponse.data, null, 2));
      
      let flOptions = [];
      if (Array.isArray(flOptionsResponse.data)) {
        flOptions = flOptionsResponse.data;
      } else if (flOptionsResponse.data && Array.isArray(flOptionsResponse.data.data)) {
        flOptions = flOptionsResponse.data.data;
      } else if (flOptionsResponse.data && flOptionsResponse.data.ids) {
        flOptions = flOptionsResponse.data.ids.map(id => flOptionsResponse.data.entities[id]);
      }
      
      console.log(`\nFound ${flOptions.length} found/lost options:`);
      flOptions.forEach(option => {
        console.log(`  - ID: ${option._id} | Code: ${option.code} | Name: ${option.labels?.en || option.code}`);
      });
      
    } catch (error) {
      console.log('❌ Could not fetch found/lost options:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getAvailableIds();
