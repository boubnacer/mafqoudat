const axios = require('axios');

async function debugPostStructure() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Debugging post structure...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    // Test 1: Get a single post to see its structure
    console.log('\n1️⃣ Getting a single post to analyze structure...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=${moroccoCountryId}&page=1&pageSize=1`, { timeout: 15000 });
      
      if (postsResponse.data?.ids?.length > 0) {
        const postId = postsResponse.data.ids[0];
        const post = postsResponse.data.entities[postId];
        
        console.log('📝 Post structure:');
        console.log('- ID:', post._id);
        console.log('- Category field type:', typeof post.category);
        console.log('- Category value:', post.category);
        console.log('- City field type:', typeof post.city);
        console.log('- City value:', post.city);
        console.log('- Country field type:', typeof post.country);
        console.log('- Country value:', post.country);
        console.log('- FoundLost field type:', typeof post.foundLost);
        console.log('- FoundLost value:', post.foundLost);
        
        // Check if these are ObjectIds or strings
        console.log('\n🔍 Field analysis:');
        console.log('- Category is ObjectId:', /^[0-9a-fA-F]{24}$/.test(post.category));
        console.log('- City is ObjectId:', /^[0-9a-fA-F]{24}$/.test(post.city));
        console.log('- Country is ObjectId:', /^[0-9a-fA-F]{24}$/.test(post.country));
        console.log('- FoundLost is ObjectId:', /^[0-9a-fA-F]{24}$/.test(post.foundLost));
        
      } else {
        console.log('❌ No posts found');
      }
      
    } catch (error) {
      console.log('❌ Failed to get posts:', error.response?.data || error.message);
    }
    
    // Test 2: Check if categories exist
    console.log('\n2️⃣ Checking categories...');
    try {
      const categoriesResponse = await axios.get(`${apiUrl}/dependencies/categories`, { timeout: 10000 });
      console.log('✅ Categories endpoint working');
      console.log('📊 Categories count:', categoriesResponse.data?.data?.length || 0);
      
      if (categoriesResponse.data?.data?.length > 0) {
        console.log('📝 First few categories:');
        categoriesResponse.data.data.slice(0, 3).forEach((cat, index) => {
          console.log(`  ${index + 1}. ID: ${cat._id}, Code: ${cat.code}`);
        });
      }
    } catch (error) {
      console.log('❌ Categories endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 3: Check if cities exist
    console.log('\n3️⃣ Checking cities...');
    try {
      const citiesResponse = await axios.get(`${apiUrl}/dependencies/cities?countryId=${moroccoCountryId}`, { timeout: 10000 });
      console.log('✅ Cities endpoint working');
      console.log('📊 Cities count:', citiesResponse.data?.data?.length || 0);
      
      if (citiesResponse.data?.data?.length > 0) {
        console.log('📝 First few cities:');
        citiesResponse.data.data.slice(0, 3).forEach((city, index) => {
          console.log(`  ${index + 1}. ID: ${city.id}, Code: ${city.code}, Label: ${city.label}`);
        });
      }
    } catch (error) {
      console.log('❌ Cities endpoint failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

debugPostStructure();
