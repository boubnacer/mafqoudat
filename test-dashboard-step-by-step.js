const axios = require('axios');

async function testDashboardStepByStep() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Testing dashboard step by step...');
    console.log('API URL:', apiUrl);
    console.log('Morocco Country ID:', moroccoCountryId);
    
    // Test 1: Check if posts exist for Morocco
    console.log('\n1️⃣ Checking posts for Morocco...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=${moroccoCountryId}&page=1&pageSize=10`, { timeout: 10000 });
      console.log('✅ Posts endpoint working');
      console.log('📊 Posts count for Morocco:', postsResponse.data?.ids?.length || 0);
      
      if (postsResponse.data?.ids?.length > 0) {
        console.log('📝 First post details:');
        const firstPost = postsResponse.data.entities[postsResponse.data.ids[0]];
        console.log('- ID:', firstPost._id);
        console.log('- Country:', firstPost.country);
        console.log('- FoundLost:', firstPost.foundLost);
        console.log('- Category:', firstPost.category);
        console.log('- Title:', firstPost.title || 'No title');
        console.log('- Created:', firstPost.createdAt);
      }
    } catch (error) {
      console.log('❌ Posts endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 2: Check if FoundLost options exist (this should work since we know they exist)
    console.log('\n2️⃣ Checking FoundLost options...');
    try {
      const flResponse = await axios.get(`${apiUrl}/dependencies/foundlost-options`, { timeout: 10000 });
      console.log('✅ FoundLost options endpoint working');
      console.log('📊 FoundLost options count:', flResponse.data?.data?.length || 0);
      
      if (flResponse.data?.data?.length > 0) {
        flResponse.data.data.forEach((option, index) => {
          console.log(`  ${index + 1}. ${option.code} (${option._id})`);
        });
      }
    } catch (error) {
      console.log('❌ FoundLost options endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 3: Check if Categories exist
    console.log('\n3️⃣ Checking Categories...');
    try {
      const categoriesResponse = await axios.get(`${apiUrl}/dependencies/categories`, { timeout: 10000 });
      console.log('✅ Categories endpoint working');
      console.log('📊 Categories count:', categoriesResponse.data?.data?.length || 0);
    } catch (error) {
      console.log('❌ Categories endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 4: Check if Countries exist
    console.log('\n4️⃣ Checking Countries...');
    try {
      const countriesResponse = await axios.get(`${apiUrl}/dependencies/countries`, { timeout: 10000 });
      console.log('✅ Countries endpoint working');
      console.log('📊 Countries count:', countriesResponse.data?.data?.length || 0);
    } catch (error) {
      console.log('❌ Countries endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 5: Try dashboard with detailed error handling
    console.log('\n5️⃣ Testing dashboard with detailed error...');
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, { 
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes less than 500
        }
      });
      
      console.log('✅ Dashboard call successful!');
      console.log('Status:', dashboardResponse.status);
      console.log('📈 Dashboard data:');
      console.log('- Total Posts:', dashboardResponse.data.totalPosts);
      console.log('- Total Founds:', dashboardResponse.data.totalFounds);
      console.log('- Total Losts:', dashboardResponse.data.totalLosts);
      console.log('- Recent Founds:', dashboardResponse.data.recentFounds?.length || 0);
      console.log('- Recent Losts:', dashboardResponse.data.recentLosts?.length || 0);
      
    } catch (error) {
      console.log('❌ Dashboard call failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      
      // Try to get more details about the error
      if (error.response?.data?.message) {
        console.log('Error message:', error.response.data.message);
        console.log('Error stack:', error.response.data.stack || 'No stack trace');
      }
    }
    
    // Test 6: Try a simple aggregation test
    console.log('\n6️⃣ Testing simple aggregation...');
    try {
      // Try to get posts with a simple query to see if aggregation works
      const simpleResponse = await axios.get(`${apiUrl}/posts?currentCountry=${moroccoCountryId}&page=1&pageSize=1`, { timeout: 10000 });
      console.log('✅ Simple posts query working');
      console.log('Posts found:', simpleResponse.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Simple posts query failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardStepByStep();
