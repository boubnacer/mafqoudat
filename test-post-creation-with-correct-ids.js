const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

// Test data with the IDs we know exist
const testData = {
  user: '68adafcbfbee01557b7f5bf6', // This exists
  country: '68a4b54ab46524c54c553ca9', // Need to verify this
  category: '68a4b54ab46524c54c553cc9', // Need to verify this
  foundLost: '68a4b54ab46524c54c553cc3', // FOUND - this exists
  city: '68a9d9bb6bbbb3b407a5bdce', // Need to verify this
  exactLocation: 'Test Location',
  exactDate: '2025-08-27',
  contact: '0654597065',
  description: 'Test post creation',
  contactPreferences: JSON.stringify({
    phone: true,
    email: false,
    whatsapp: false
  }),
  additionalContact: JSON.stringify({
    phone: '',
    email: '',
    whatsapp: ''
  })
};

async function testPostCreation() {
  try {
    console.log('🧪 Testing post creation with Railway API...\n');
    
    // First, let's check what's actually available
    console.log('📊 Checking available data...\n');
    
    // Check countries
    console.log('🌍 Checking countries...');
    try {
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries`);
      const countries = countriesResponse.data;
      console.log(`Found ${countries.length} countries:`);
      countries.forEach(country => {
        console.log(`  - ID: ${country._id} | Code: ${country.code} | Name: ${country.names?.en || country.code}`);
      });
      
      // Update test data with correct country ID
      if (countries.length > 0) {
        testData.country = countries[0]._id;
        console.log(`✅ Using country ID: ${testData.country}`);
      }
    } catch (error) {
      console.log('❌ Could not fetch countries:', error.message);
    }
    
    // Check categories
    console.log('\n📂 Checking categories...');
    try {
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      const categories = categoriesResponse.data;
      console.log(`Found ${categories.length} categories:`);
      categories.forEach(category => {
        console.log(`  - ID: ${category._id} | Code: ${category.code} | Name: ${category.labels?.en || category.code}`);
      });
      
      // Update test data with correct category ID
      if (categories.length > 0) {
        testData.category = categories[0]._id;
        console.log(`✅ Using category ID: ${testData.category}`);
      }
    } catch (error) {
      console.log('❌ Could not fetch categories:', error.message);
    }
    
    // Check found/lost options
    console.log('\n🔍 Checking found/lost options...');
    try {
      const flOptionsResponse = await axios.get(`${API_BASE_URL}/floptions`);
      const flOptions = flOptionsResponse.data;
      console.log(`Found ${flOptions.length} found/lost options:`);
      flOptions.forEach(option => {
        console.log(`  - ID: ${option._id} | Code: ${option.code} | Name: ${option.labels?.en || option.code}`);
      });
      
      // Update test data with correct foundLost ID
      if (flOptions.length > 0) {
        testData.foundLost = flOptions[0]._id;
        console.log(`✅ Using foundLost ID: ${testData.foundLost}`);
      }
    } catch (error) {
      console.log('❌ Could not fetch found/lost options:', error.message);
    }
    
    console.log('\n📋 Final test data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Now test post creation
    console.log('\n🚀 Testing post creation...');
    try {
      const formData = new FormData();
      Object.keys(testData).forEach(key => {
        formData.append(key, testData[key]);
      });
      
      const response = await axios.post(`${API_BASE_URL}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      console.log('✅ Post created successfully!');
      console.log('Response:', response.data);
      
    } catch (error) {
      console.log('❌ Post creation failed:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPostCreation();
