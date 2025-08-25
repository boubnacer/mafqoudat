const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function debugCityModelIssue() {
  console.log('🔍 Debugging City Model Issue...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check server health
    console.log('\\n1. Checking server health...');
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/`);
    console.log('✅ Server is healthy');
    
    // Step 2: Check cities structure
    console.log('\\n2. Checking cities structure...');
    try {
      const citiesResponse = await axios.get(`${DEPLOYMENT_URL}/cities`);
      const cities = Array.isArray(citiesResponse.data) ? citiesResponse.data : citiesResponse.data.data || [];
      console.log(`Cities found: ${cities.length}`);
      
      if (cities.length > 0) {
        console.log('Sample cities:');
        cities.slice(0, 3).forEach((city, index) => {
          console.log(`  ${index + 1}. ID: ${city._id}`);
          console.log(`     Code: ${city.code}`);
          console.log(`     Labels: ${JSON.stringify(city.labels)}`);
          console.log(`     Country: ${city.country}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`Error getting cities: ${error.response?.status || error.message}`);
    }
    
    // Step 3: Check countries structure
    console.log('\\n3. Checking countries structure...');
    const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/countries`);
    const countries = Array.isArray(countriesResponse.data) ? countriesResponse.data : countriesResponse.data.data || [];
    console.log(`Countries found: ${countries.length}`);
    
    const morocco = countries.find(c => c.code === 'MA');
    if (morocco) {
      console.log('✅ Morocco found:');
      console.log(`  ID: ${morocco._id}`);
      console.log(`  Code: ${morocco.code}`);
    }
    
    // Step 4: Test posts query with minimal aggregation
    console.log('\\n4. Testing posts query with minimal aggregation...');
    try {
      // Try to get posts without the complex aggregation first
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${morocco._id}&page=0&pageSize=5`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`Error with minimal aggregation: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Step 5: Test posts query without country filter
    console.log('\\n5. Testing posts query without country filter...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?page=0&pageSize=5`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`Error without country filter: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Step 6: Check if there are any posts at all (raw query)
    console.log('\\n6. Checking raw posts count...');
    try {
      // Try to get a simple count of posts
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${morocco._id}&page=0&pageSize=1`);
      const posts = response.data?.postsWithUser || [];
      console.log(`Posts found: ${posts.length}`);
      
      if (posts.length > 0) {
        console.log('Sample post structure:');
        console.log(JSON.stringify(posts[0], null, 2));
      }
    } catch (error) {
      console.log(`Error getting posts count: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Step 7: Test the aggregation pipeline step by step
    console.log('\\n7. Testing aggregation pipeline...');
    try {
      // Try with a simpler query first
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${morocco._id}&page=0&pageSize=1`);
      console.log('Aggregation test response:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`Aggregation test error: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\\n🎉 City model debug completed!');
    console.log('\\n📋 ANALYSIS:');
    console.log('The issue is likely:');
    console.log('1. Posts exist but the aggregation pipeline is failing');
    console.log('2. City references might be missing or invalid');
    console.log('3. The $unwind operation on City might be failing');
    console.log('4. Posts might not have the city field populated');
    
    console.log('\\n💡 POSSIBLE SOLUTIONS:');
    console.log('1. Make city field optional in the aggregation');
    console.log('2. Handle missing city references gracefully');
    console.log('3. Update existing posts to include city references');
    console.log('4. Modify the query to work with posts that don\'t have cities');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug
debugCityModelIssue();
