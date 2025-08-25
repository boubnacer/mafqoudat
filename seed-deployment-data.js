const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

// Sample data for testing
const samplePosts = [
  {
    user: "64f8b2c1a1b2c3d4e5f6a7b8", // You'll need to replace this with a real user ID
    country: "64f8b2c1a1b2c3d4e5f6a7b9", // You'll need to replace this with Morocco's ID
    category: "64f8b2c1a1b2c3d4e5f6a7ba", // You'll need to replace this with a real category ID
    contact: "+212-6-1234-5678",
    foundLost: "64f8b2c1a1b2c3d4e5f6a7bb", // You'll need to replace this with LOST ID
    city: "64f8b2c1a1b2c3d4e5f6a7bc", // You'll need to replace this with Casablanca's ID
    exactLocation: "Boulevard Mohammed V, Casablanca",
    exactDate: "2024-01-15T10:30:00.000Z",
    description: "Lost my phone at the mall. It's an iPhone 13 with a black case.",
    contactPreferences: {
      phone: true,
      email: false,
      whatsapp: true
    }
  },
  {
    user: "64f8b2c1a1b2c3d4e5f6a7b8",
    country: "64f8b2c1a1b2c3d4e5f6a7b9",
    category: "64f8b2c1a1b2c3d4e5f6a7ba",
    contact: "+212-6-9876-5432",
    foundLost: "64f8b2c1a1b2c3d4e5f6a7bd", // You'll need to replace this with FOUND ID
    city: "64f8b2c1a1b2c3d4e5f6a7be", // You'll need to replace this with Rabat's ID
    exactLocation: "Avenue Mohammed VI, Rabat",
    exactDate: "2024-01-16T14:20:00.000Z",
    description: "Found a wallet with some money and cards. Please contact to identify.",
    contactPreferences: {
      phone: true,
      email: true,
      whatsapp: false
    }
  }
];

async function getRequiredIds() {
  console.log('🔧 Getting required IDs from deployment database...\n');
  
  try {
    // Get users
    console.log('1. Getting users...');
    const usersResponse = await axios.get(`${DEPLOYMENT_URL}/users`);
    const users = usersResponse.data;
    console.log('Users found:', users.length);
    
    // Get countries
    console.log('\n2. Getting countries...');
    const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/countries`);
    const countries = countriesResponse.data;
    const morocco = countries.find(c => c.code === 'MA');
    console.log('Morocco found:', morocco ? 'Yes' : 'No');
    
    // Get categories
    console.log('\n3. Getting categories...');
    const categoriesResponse = await axios.get(`${DEPLOYMENT_URL}/categories`);
    const categories = categoriesResponse.data;
    console.log('Categories found:', categories.length);
    
    // Get found/lost options
    console.log('\n4. Getting found/lost options...');
    const flOptionsResponse = await axios.get(`${DEPLOYMENT_URL}/floptions`);
    const flOptions = flOptionsResponse.data;
    console.log('Found/Lost options:', flOptions);
    
    // Get cities
    console.log('\n5. Getting cities...');
    const citiesResponse = await axios.get(`${DEPLOYMENT_URL}/cities?country=${morocco?._id}`);
    const cities = citiesResponse.data;
    console.log('Cities found:', cities.length);
    
    return {
      users,
      morocco,
      categories,
      flOptions,
      cities
    };
    
  } catch (error) {
    console.error('❌ Error getting required IDs:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

async function seedDeploymentData() {
  console.log('🌱 Seeding Deployment Database...\n');
  
  try {
    // Get required IDs
    const data = await getRequiredIds();
    if (!data) {
      console.log('❌ Could not get required data. Stopping.');
      return;
    }
    
    console.log('\n📊 Available Data:');
    console.log('- Users:', data.users.length);
    console.log('- Morocco:', data.morocco ? 'Available' : 'Not found');
    console.log('- Categories:', data.categories.length);
    console.log('- Found/Lost options:', data.flOptions.length);
    console.log('- Cities:', data.cities.length);
    
    if (data.users.length === 0) {
      console.log('\n❌ No users found. You need to create a user first.');
      console.log('💡 Try logging in to your application to create a user account.');
      return;
    }
    
    if (!data.morocco) {
      console.log('\n❌ Morocco not found in countries. Database might not be properly seeded.');
      return;
    }
    
    console.log('\n✅ Database appears to be properly set up!');
    console.log('💡 You can now test the report functionality with existing posts.');
    
  } catch (error) {
    console.error('❌ Error seeding deployment data:', error.message);
  }
}

// Run the seed function
seedDeploymentData();
