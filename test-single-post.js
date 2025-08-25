const axios = require('axios');

async function testSinglePost() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const postId = '68aa03b90e21b15bed928b04';
    
    console.log('Testing single post API...');
    console.log('Post ID:', postId);
    console.log('API URL:', `${apiUrl}/posts/${postId}`);
    
    // Test the single post endpoint
    const response = await axios.get(`${apiUrl}/posts/${postId}?language=en`);
    
    console.log('Single Post API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing single post API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSinglePost();
