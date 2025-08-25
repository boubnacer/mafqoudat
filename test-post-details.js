const axios = require('axios');

async function testPostDetails() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Testing post details...');
    
    // Get all posts for Morocco
    const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=68a4b54ab46524c54c553ca9&page=1&pageSize=10`);
    console.log('Posts API Status:', postsResponse.status);
    console.log('Posts API Response:', JSON.stringify(postsResponse.data, null, 2));
    
    const posts = postsResponse.data.data || postsResponse.data;
    console.log('Posts found:', posts?.length || 'undefined');
    
    if (posts.length > 0) {
      const post = posts[0];
      console.log('\nFirst post details:');
      console.log('Post ID:', post._id);
      console.log('User ID:', post.user);
      console.log('Category ID:', post.category);
      console.log('FoundLost ID:', post.foundLost);
      console.log('Country ID:', post.country);
      console.log('City ID:', post.city);
      console.log('Created At:', post.createdAt);
      
      // Test if user exists
      try {
        const userResponse = await axios.get(`${apiUrl}/users/${post.user}`);
        console.log('\nUser exists:', userResponse.status === 200);
        console.log('User details:', userResponse.data);
      } catch (error) {
        console.log('\nUser lookup failed:', error.response?.status, error.response?.data?.message);
      }
      
      // Test if category exists
      try {
        const categoryResponse = await axios.get(`${apiUrl}/categories`);
        const categories = categoryResponse.data.data || categoryResponse.data;
        const category = categories.find(c => c._id === post.category);
        console.log('\nCategory exists:', !!category);
        if (category) {
          console.log('Category details:', category);
        }
      } catch (error) {
        console.log('\nCategory lookup failed:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPostDetails();
