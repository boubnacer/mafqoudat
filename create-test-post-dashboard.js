const axios = require('axios');

async function createTestPost() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('🔧 Creating test post for dashboard verification...');
    console.log('API URL:', apiUrl);
    
    // Test post data with correct IDs from your database
    const testPostData = {
      title: "Test Post - Found Item",
      description: "This is a test post to verify dashboard functionality",
      category: "68a4b54ab46524c54c553cc9", // Category ID from your example
      foundLost: "68a4b54ab46524c54c553cc3", // FOUND
      country: "68a4b54ab46524c54c553ca9", // Morocco
      city: "68a9d9ba6bbbb3b407a5bdc6", // Casablanca
      region: "Casablanca, Morocco",
      exactLocation: "Test location in Casablanca",
      contact: "test@example.com",
      image: null,
      exactDate: new Date().toISOString().split('T')[0], // Today's date
      contactPreferences: {
        phone: "0000000000",
        email: "test@example.com",
        whatsapp: ""
      },
      additionalContact: {
        phone: "",
        email: "",
        whatsapp: ""
      }
    };
    
    console.log('\n📝 Test post data:');
    console.log('- Title:', testPostData.title);
    console.log('- Category:', testPostData.category);
    console.log('- FoundLost:', testPostData.foundLost);
    console.log('- Country:', testPostData.country);
    console.log('- City:', testPostData.city);
    
    console.log('\n⚠️  Note: This will create a test post in your deployment database.');
    console.log('You can delete it later if needed.');
    
    // For now, just show what would be created
    console.log('\n✅ Test post data prepared successfully!');
    console.log('📋 To create this post, you would need to:');
    console.log('1. Use the post creation form in your app');
    console.log('2. Or use an authenticated API call');
    console.log('3. Or create it directly in the database');
    
    console.log('\n🎯 Once you create a post, the dashboard should show:');
    console.log('- Total Posts: 1');
    console.log('- Total Founds: 1 (if it\'s a FOUND post)');
    console.log('- Total Losts: 0');
    console.log('- Recent Founds: 1 post');
    console.log('- Recent Losts: 0 posts');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestPost();
