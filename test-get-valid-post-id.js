const axios = require('axios');

async function testGetValidPostId() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Getting valid post ID from database...');
    
    // First, get posts from Morocco to find a valid post ID
    const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=68a4b54ab46524c54c553ca9&page=1&pageSize=10`);
    
    console.log('Posts API Status:', postsResponse.status);
    
    const posts = postsResponse.data.postsWithUser || [];
    console.log('Posts found:', posts.length);
    
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log('\nFirst post details:');
      console.log('Post ID:', firstPost._id);
      console.log('Category:', firstPost.categoryname);
      console.log('Found/Lost:', firstPost.foundLost);
      console.log('Created At:', firstPost.createdAt);
      
      // Test the single post endpoint with this valid ID
      console.log('\nTesting single post with valid ID...');
      const singlePostResponse = await axios.get(`${apiUrl}/posts/${firstPost._id}?language=en`);
      
      console.log('Single Post API Response:');
      console.log('Status:', singlePostResponse.status);
      console.log('Data keys:', Object.keys(singlePostResponse.data));
      
    } else {
      console.log('No posts found in Morocco');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testGetValidPostId();
