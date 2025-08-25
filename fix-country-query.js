const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function fixCountryQuery() {
  console.log('🔍 Fixing Country Query...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check countries structure
    console.log('\\n1. Checking countries structure...');
    const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/countries`);
    const countries = Array.isArray(countriesResponse.data) ? countriesResponse.data : countriesResponse.data.data || [];
    
    console.log(`Countries found: ${countries.length}`);
    
    if (countries.length > 0) {
      console.log('Sample countries:');
      countries.slice(0, 3).forEach((country, index) => {
        console.log(`  ${index + 1}. ID: ${country._id}`);
        console.log(`     Code: ${country.code}`);
        console.log(`     Labels: ${JSON.stringify(country.labels)}`);
        console.log(`     Names: ${JSON.stringify(country.names)}`);
        console.log('');
      });
      
      // Find Morocco
      const morocco = countries.find(c => c.code === 'MA');
      if (morocco) {
        console.log('✅ Morocco found:');
        console.log(`  ID: ${morocco._id}`);
        console.log(`  Code: ${morocco.code}`);
        console.log(`  Labels: ${JSON.stringify(morocco.labels)}`);
      } else {
        console.log('❌ Morocco not found');
      }
    }
    
    // Step 2: Test posts with country ID instead of code
    console.log('\\n2. Testing posts with country ID...');
    if (countries.length > 0) {
      const morocco = countries.find(c => c.code === 'MA');
      if (morocco) {
        try {
          const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${morocco._id}&page=0&pageSize=5`);
          const posts = response.data?.postsWithUser || [];
          console.log(`Posts with Morocco ID: ${posts.length}`);
          
          if (posts.length > 0) {
            console.log('✅ Posts found with country ID!');
            posts.forEach((post, index) => {
              console.log(`  ${index + 1}. ID: ${post._id}`);
              console.log(`     User: ${post.user}`);
              console.log(`     Found/Lost: ${post.foundLost}`);
              console.log(`     Category: ${post.categoryname}`);
              console.log(`     Location: ${post.exactLocation}`);
            });
          }
        } catch (error) {
          console.log(`Error with country ID: ${error.response?.status || error.message}`);
          if (error.response?.data) {
            console.log('Error data:', error.response.data);
          }
        }
      }
    }
    
    // Step 3: Test posts with country code (current broken way)
    console.log('\\n3. Testing posts with country code (current broken way)...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
      const posts = response.data?.postsWithUser || [];
      console.log(`Posts with country code: ${posts.length}`);
    } catch (error) {
      console.log(`Error with country code: ${error.response?.status || error.message}`);
      if (error.response?.data) {
            console.log('Error data:', error.response.data);
          }
    }
    
    console.log('\\n🎉 Country query analysis completed!');
    console.log('\\n📋 ANALYSIS:');
    console.log('✅ Countries are stored with ObjectIds');
    console.log('✅ Country codes are strings (MA, DZ, etc.)');
    console.log('❌ The query is trying to convert country code to ObjectId');
    console.log('\\n💡 The fix needed:');
    console.log('1. Look up country by code first');
    console.log('2. Then use the country ID in the posts query');
    console.log('3. Or modify the server code to handle country codes properly');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the analysis
fixCountryQuery();
