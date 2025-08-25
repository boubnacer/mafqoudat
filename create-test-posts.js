const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function createTestPosts() {
  console.log('🌱 Creating Test Posts...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check what data exists
    console.log('\\n1. Checking existing data...');
    
    const [countriesResponse, categoriesResponse, flOptionsResponse] = await Promise.all([
      axios.get(`${DEPLOYMENT_URL}/countries`),
      axios.get(`${DEPLOYMENT_URL}/categories`),
      axios.get(`${DEPLOYMENT_URL}/floptions`)
    ]);
    
    // Handle different response formats
    const countries = Array.isArray(countriesResponse.data) ? countriesResponse.data : countriesResponse.data.data || [];
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data.data || [];
    const flOptions = Array.isArray(flOptionsResponse.data) ? flOptionsResponse.data : flOptionsResponse.data.data || [];
    
    console.log(`Countries: ${countries.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Found/Lost Options: ${flOptions.length}`);
    
    if (countries.length === 0 || categories.length === 0 || flOptions.length === 0) {
      console.log('❌ Missing required data. Please seed the database first.');
      return;
    }
    
    // Step 2: Get Morocco and some sample data
    const morocco = countries.find(c => c.code === 'MA');
    const electronicsCategory = categories.find(c => c.code === 'ELECTRONICS');
    const lostOption = flOptions.find(f => f.code === 'LOST');
    const foundOption = flOptions.find(f => f.code === 'FOUND');
    
    if (!morocco || !electronicsCategory || !lostOption || !foundOption) {
      console.log('❌ Missing required data (Morocco, Electronics category, or Found/Lost options)');
      console.log('Available countries:', countries.map(c => c.code).join(', '));
      console.log('Available categories:', categories.map(c => c.code).join(', '));
      console.log('Available flOptions:', flOptions.map(f => f.code).join(', '));
      return;
    }
    
    console.log('✅ Found required data for creating posts');
    console.log(`Morocco ID: ${morocco._id}`);
    console.log(`Electronics Category ID: ${electronicsCategory._id}`);
    console.log(`Lost Option ID: ${lostOption._id}`);
    console.log(`Found Option ID: ${foundOption._id}`);
    
    // Step 3: Create test posts
    console.log('\\n2. Creating test posts...');
    
    const testPosts = [
      {
        user: "68ac670da64876b1bc50cc43", // This will be replaced with a real user ID
        country: morocco._id,
        category: electronicsCategory._id,
        contact: "+212-6-1234-5678",
        foundLost: lostOption._id,
        exactLocation: "Boulevard Mohammed V, Casablanca",
        exactDate: "2024-01-15T10:30:00.000Z",
        description: "Lost my iPhone 13 with a black case at the mall. Please contact if found.",
        region: "Casablanca-Settat"
      },
      {
        user: "68ac670da64876b1bc50cc43", // This will be replaced with a real user ID
        country: morocco._id,
        category: electronicsCategory._id,
        contact: "+212-6-9876-5432",
        foundLost: foundOption._id,
        exactLocation: "Avenue Hassan II, Rabat",
        exactDate: "2024-01-16T14:20:00.000Z",
        description: "Found a Samsung Galaxy phone near the train station. Contact to claim.",
        region: "Rabat-Salé-Kénitra"
      }
    ];
    
    console.log('📝 Test posts prepared:');
    testPosts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.foundLost === lostOption._id ? 'LOST' : 'FOUND'} - ${post.description.substring(0, 50)}...`);
    });
    
    // Step 4: Note about user ID
    console.log('\\n⚠️  NOTE: The posts use a placeholder user ID.');
    console.log('💡 To create posts with a real user, you need to:');
    console.log('   1. Create a user account first');
    console.log('   2. Get the user ID from the database');
    console.log('   3. Replace the placeholder user ID');
    
    console.log('\\n🎉 Test posts data prepared!');
    console.log('\\n📋 Next Steps:');
    console.log('1. Create a user account in your application');
    console.log('2. Get the user ID from the database');
    console.log('3. Update the user ID in this script');
    console.log('4. Run the script to create the posts');
    console.log('5. Test the report functionality');
    
  } catch (error) {
    console.error('❌ Error creating test posts:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the script
createTestPosts();
