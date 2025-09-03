const axios = require('axios');

async function testPostsAPI() {
  try {
    console.log('Testing Posts API...');
    
    const response = await axios.get('http://localhost:3500/posts', {
      params: {
        currentCountry: 'MA',
        page: 1,
        pageSize: 3
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Total Posts:', response.data.total);
    console.log('📄 Page:', response.data.page);
    console.log('📋 Total Pages:', response.data.totalPages);
    
    if (response.data.postsWithUser && response.data.postsWithUser.length > 0) {
      console.log('\n🔍 First Post Fields:');
      const firstPost = response.data.postsWithUser[0];
      
      // Log all available fields
      Object.keys(firstPost).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(firstPost[key])}`);
      });
      
      // Check specific fields we need
      console.log('\n📋 Required Fields Check:');
      console.log(`  categoryname: ${firstPost.categoryname ? '✅' : '❌'} - ${firstPost.categoryname}`);
      console.log(`  createdAt: ${firstPost.createdAt ? '✅' : '❌'} - ${firstPost.createdAt}`);
      console.log(`  cityName: ${firstPost.cityName ? '✅' : '❌'} - ${firstPost.cityName}`);
      console.log(`  username: ${firstPost.username ? '✅' : '❌'} - ${firstPost.username}`);
      
    } else {
      console.log('❌ No posts returned');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testPostsAPI();
