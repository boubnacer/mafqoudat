const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function checkRailwayDatabaseConnection() {
  console.log('🔍 Checking Railway database connection...\n');
  
  // Test 1: Check if we can access the data that exists in your main database
  console.log('1️⃣ Testing access to your main database data...');
  
  try {
    // Test the specific IDs that should exist in your main database
    const testIds = {
      country: '68a4b54ab46524c54c553cae', // United Arab Emirates
      category: '68a4b54ab46524c54c553cc9', // Clothing
      foundLost: '68a4b54ab46524c54c553cc3' // Found
    };
    
    console.log('Testing specific IDs from your main database:');
    console.log('- Country ID:', testIds.country);
    console.log('- Category ID:', testIds.category);
    console.log('- FoundLost ID:', testIds.foundLost);
    
    // Try to fetch these specific IDs from Railway
    const countriesResponse = await axios.get(`${RAILWAY_URL}/countries`);
    const categoriesResponse = await axios.get(`${RAILWAY_URL}/categories`);
    const flOptionsResponse = await axios.get(`${RAILWAY_URL}/floptions`);
    
    const countries = countriesResponse.data.data || countriesResponse.data;
    const categories = categoriesResponse.data.data || categoriesResponse.data;
    const flOptions = flOptionsResponse.data.data || flOptionsResponse.data;
    
    // Check if our specific IDs exist in Railway
    const countryExists = countries.find(c => c._id === testIds.country);
    const categoryExists = categories.find(c => c._id === testIds.category);
    const foundLostExists = flOptions.find(f => f._id === testIds.foundLost);
    
    console.log('\nResults:');
    console.log('- Country exists in Railway:', countryExists ? '✅ YES' : '❌ NO');
    console.log('- Category exists in Railway:', categoryExists ? '✅ YES' : '❌ NO');
    console.log('- FoundLost exists in Railway:', foundLostExists ? '✅ YES' : '❌ NO');
    
    if (countryExists && categoryExists && foundLostExists) {
      console.log('\n🎉 All IDs exist in Railway! The issue might be elsewhere.');
    } else {
      console.log('\n🚨 Some IDs are missing in Railway. This confirms a database mismatch.');
      console.log('Railway is connecting to a different database than your main one.');
    }
    
  } catch (error) {
    console.log('❌ Error testing Railway data:', error.message);
  }
  
  // Test 2: Check what database Railway is actually using
  console.log('\n2️⃣ Checking Railway environment...');
  try {
    const healthResponse = await axios.get(`${RAILWAY_URL}/health`);
    console.log('Railway health response:', JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Could not check Railway health:', error.message);
  }
}

checkRailwayDatabaseConnection().catch(console.error);
