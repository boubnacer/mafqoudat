const axios = require('axios');

async function createTestPost() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('🔧 Creating test post for deployment...');
    console.log('API URL:', apiUrl);
    
    // Test post data with correct IDs
    const testPostData = {
      title: "Test Post - Found Item",
      description: "This is a test post to verify dashboard functionality",
      category: "68a4b54ab46524c54c553cc5", // ELECTRONICS
      foundLost: "68a4b54ab46524c54c553cc3", // FOUND
      country: "68a4b54ab46524c54c553ca9", // Morocco
      city: "68a4b54ab46524c54c553cc6", // Casablanca
      region: "Casablanca, Morocco",
      exactLocation: "Test location in Casablanca",
      contact: "test@example.com",
      image: null
    };
    
    console.log('\n📝 Test post data:');
    console.log('- Title:', testPostData.title);
    console.log('- Category ID:', testPostData.category);
    console.log('- FoundLost ID:', testPostData.foundLost);
    console.log('- Country ID:', testPostData.country);
    console.log('- City ID:', testPostData.city);
    
    console.log('\n🚀 Attempting to create test post...');
    
    try {
      const response = await axios.post(`${apiUrl}/posts`, testPostData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      console.log('✅ Test post created successfully!');
      console.log('📊 Post ID:', response.data._id);
      console.log('📅 Created at:', response.data.createdAt);
      
      // Test dashboard after creating post
      console.log('\n🔍 Testing dashboard after creating post...');
      try {
        const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${testPostData.country}`, {
          timeout: 10000
        });
        
        console.log('✅ Dashboard working!');
        console.log('📈 Dashboard data:');
        console.log('- Total Posts:', dashboardResponse.data.totalPosts);
        console.log('- Total Founds:', dashboardResponse.data.totalFounds);
        console.log('- Total Losts:', dashboardResponse.data.totalLosts);
        console.log('- Recent Founds:', dashboardResponse.data.recentFounds?.length || 0);
        console.log('- Recent Losts:', dashboardResponse.data.recentLosts?.length || 0);
        
      } catch (dashboardError) {
        console.log('❌ Dashboard still failing:', dashboardError.response?.data || dashboardError.message);
      }
      
    } catch (error) {
      console.log('❌ Failed to create test post:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        console.log('\n💡 Authentication required. You need to be logged in to create posts.');
        console.log('Please log in to your account first.');
      }
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

createTestPost();
