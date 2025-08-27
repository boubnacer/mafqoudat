const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

async function testRailwayValidation() {
  try {
    console.log('🧪 Testing Railway validation...\n');
    
    // Test the exact IDs that the client is sending
    const testIds = {
      user: '68adafcbfbee01557b7f5bf6',
      country: '68a4b54ab46524c54c553ca9',
      category: '68a4b54ab46524c54c553cc9',
      foundLost: '68a4b54ab46524c54c553cc3'
    };
    
    console.log('📋 Testing IDs that client is sending:');
    console.log('User ID:', testIds.user);
    console.log('Country ID:', testIds.country);
    console.log('Category ID:', testIds.category);
    console.log('FoundLost ID:', testIds.foundLost);
    
    // Test each endpoint individually
    console.log('\n🔍 Testing individual endpoints...');
    
    // Test countries endpoint
    try {
      console.log('\n🌍 Testing /countries endpoint...');
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries`);
      const countries = countriesResponse.data.data || countriesResponse.data;
      console.log(`Found ${countries.length} countries`);
      
      // Check if our country ID exists
      const morocco = countries.find(c => c._id === testIds.country);
      console.log(`Morocco (${testIds.country}) found: ${morocco ? '✅' : '❌'}`);
      if (morocco) {
        console.log(`  Code: ${morocco.code}, Name: ${morocco.names?.en || morocco.labels?.en}`);
      }
    } catch (error) {
      console.log('❌ Countries endpoint failed:', error.message);
    }
    
    // Test categories endpoint
    try {
      console.log('\n📂 Testing /categories endpoint...');
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      const categories = categoriesResponse.data.data || categoriesResponse.data;
      console.log(`Found ${categories.length} categories`);
      
      // Check if our category ID exists
      const clothing = categories.find(c => c._id === testIds.category);
      console.log(`CLOTHING (${testIds.category}) found: ${clothing ? '✅' : '❌'}`);
      if (clothing) {
        console.log(`  Code: ${clothing.code}, Name: ${clothing.labels?.en}`);
      }
    } catch (error) {
      console.log('❌ Categories endpoint failed:', error.message);
    }
    
    // Test found/lost endpoint
    try {
      console.log('\n🔍 Testing /floptions endpoint...');
      const flOptionsResponse = await axios.get(`${API_BASE_URL}/floptions`);
      const flOptions = flOptionsResponse.data.data || flOptionsResponse.data;
      console.log(`Found ${flOptions.length} found/lost options`);
      
      // Check if our foundLost ID exists
      const found = flOptions.find(f => f._id === testIds.foundLost);
      console.log(`FOUND (${testIds.foundLost}) found: ${found ? '✅' : '❌'}`);
      if (found) {
        console.log(`  Code: ${found.code}, Name: ${found.labels?.en}`);
      }
    } catch (error) {
      console.log('❌ Found/Lost endpoint failed:', error.message);
    }
    
    // Test users endpoint (might require auth)
    try {
      console.log('\n👤 Testing /users endpoint...');
      const usersResponse = await axios.get(`${API_BASE_URL}/users`);
      const users = usersResponse.data.data || usersResponse.data;
      console.log(`Found ${users.length} users`);
      
      // Check if our user ID exists
      const user = users.find(u => u._id === testIds.user);
      console.log(`User (${testIds.user}) found: ${user ? '✅' : '❌'}`);
      if (user) {
        console.log(`  Username: ${user.username}`);
      }
    } catch (error) {
      console.log('❌ Users endpoint failed:', error.message);
      if (error.response?.status === 403) {
        console.log('  (This is expected - users endpoint requires authentication)');
      }
    }
    
    console.log('\n✅ Railway validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRailwayValidation();
