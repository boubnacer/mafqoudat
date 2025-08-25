const axios = require('axios');

async function testPostExistence() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const postId = '68aa03b90e21b15bed928b04';
    
    console.log('Testing post existence...');
    console.log('Post ID:', postId);
    
    // Test 1: Get all posts and see if this ID appears
    console.log('\n1. Testing posts list...');
    const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=68a4b54ab46524c54c553ca9&page=1&pageSize=50`);
    const posts = postsResponse.data.postsWithUser || [];
    
    const foundPost = posts.find(post => post._id === postId);
    if (foundPost) {
      console.log('✅ Post found in posts list!');
      console.log('Post details:', {
        _id: foundPost._id,
        categoryname: foundPost.categoryname,
        foundLost: foundPost.foundLost,
        user: foundPost.user,
        username: foundPost.username
      });
    } else {
      console.log('❌ Post not found in posts list');
    }
    
    // Test 2: Try to get the post directly with different approaches
    console.log('\n2. Testing direct post access...');
    
    // Test without language parameter
    try {
      const directResponse = await axios.get(`${apiUrl}/posts/${postId}`);
      console.log('✅ Direct access without language parameter works!');
      console.log('Status:', directResponse.status);
    } catch (error) {
      console.log('❌ Direct access without language parameter failed:', error.response?.status);
    }
    
    // Test with different language
    try {
      const frResponse = await axios.get(`${apiUrl}/posts/${postId}?language=fr`);
      console.log('✅ Direct access with French language works!');
      console.log('Status:', frResponse.status);
    } catch (error) {
      console.log('❌ Direct access with French language failed:', error.response?.status);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPostExistence();
