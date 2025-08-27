const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function testRailwayDatabase() {
  console.log('🔍 Testing Railway deployment database...\n');
  
  // Test the specific IDs that are failing
  const testIds = {
    user: '68af89bb30464c5a97ca8fcf',
    country: '68a4b54ab46524c54c553cae',
    category: '68a4b54ab46524c54c553cc9',
    foundLost: '68a4b54ab46524c54c553cc3',
    city: '68a9d9be6bbbb3b407a5be07'
  };

  console.log('📊 Testing specific IDs that are failing in post creation...');
  
  // Test each ID by trying to fetch them individually
  for (const [type, id] of Object.entries(testIds)) {
    try {
      let endpoint = '';
      switch (type) {
        case 'user':
          endpoint = `/users/${id}`;
          break;
        case 'country':
          endpoint = `/countries/${id}`;
          break;
        case 'category':
          endpoint = `/categories/${id}`;
          break;
        case 'foundLost':
          endpoint = `/floptions/${id}`;
          break;
        case 'city':
          endpoint = `/cities/${id}`;
          break;
      }
      
      if (endpoint) {
        const response = await axios.get(`${RAILWAY_URL}${endpoint}`);
        console.log(`✅ ${type}: ${id} - EXISTS in Railway database`);
        console.log(`   Data:`, JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`❌ ${type}: ${id} - NOT FOUND in Railway database`);
      } else {
        console.log(`❌ ${type}: ${id} - ERROR: ${error.message}`);
      }
    }
  }

  console.log('\n🌍 Checking what countries exist in Railway database...');
  try {
    const countriesResponse = await axios.get(`${RAILWAY_URL}/countries`);
    const countries = countriesResponse.data.data || countriesResponse.data;
    console.log(`Found ${countries.length} countries in Railway database:`);
    countries.forEach(country => {
      console.log(`  - ID: ${country._id} | Code: ${country.code} | Name: ${country.names?.en || country.code}`);
    });
  } catch (error) {
    console.log('❌ Could not fetch countries from Railway:', error.message);
  }

  console.log('\n📂 Checking what categories exist in Railway database...');
  try {
    const categoriesResponse = await axios.get(`${RAILWAY_URL}/categories`);
    const categories = categoriesResponse.data.data || categoriesResponse.data;
    console.log(`Found ${categories.length} categories in Railway database:`);
    categories.forEach(category => {
      console.log(`  - ID: ${category._id} | Code: ${category.code} | Name: ${category.labels?.en || category.code}`);
    });
  } catch (error) {
    console.log('❌ Could not fetch categories from Railway:', error.message);
  }

  console.log('\n🔍 Checking what found/lost options exist in Railway database...');
  try {
    const flOptionsResponse = await axios.get(`${RAILWAY_URL}/floptions`);
    const flOptions = flOptionsResponse.data.data || flOptionsResponse.data;
    console.log(`Found ${flOptions.length} found/lost options in Railway database:`);
    flOptions.forEach(option => {
      console.log(`  - ID: ${option._id} | Code: ${option.code} | Name: ${option.labels?.en || option.code}`);
    });
  } catch (error) {
    console.log('❌ Could not fetch found/lost options from Railway:', error.message);
  }

  console.log('\n🔧 Testing a simple post creation with Railway data...');
  try {
    // Get the first available country, category, and foundLost option
    const countriesResponse = await axios.get(`${RAILWAY_URL}/countries`);
    const categoriesResponse = await axios.get(`${RAILWAY_URL}/categories`);
    const flOptionsResponse = await axios.get(`${RAILWAY_URL}/floptions`);
    
    const countries = countriesResponse.data.data || countriesResponse.data;
    const categories = categoriesResponse.data.data || categoriesResponse.data;
    const flOptions = flOptionsResponse.data.data || flOptionsResponse.data;
    
    if (countries.length > 0 && categories.length > 0 && flOptions.length > 0) {
      const testPostData = {
        user: testIds.user, // Use the user ID from the error
        country: countries[0]._id,
        category: categories[0]._id,
        foundLost: flOptions[0]._id,
        contact: '0000000000',
        exactLocation: 'Test Location',
        exactDate: '2025-01-27',
        description: 'Test post'
      };
      
      console.log('Test post data:', JSON.stringify(testPostData, null, 2));
      
      // Note: We can't actually create a post without authentication, but this shows the structure
      console.log('✅ Railway database has valid data for post creation');
    }
  } catch (error) {
    console.log('❌ Error testing Railway data:', error.message);
  }
}

testRailwayDatabase().catch(console.error);
