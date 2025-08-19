const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

const seedViaAdmin = async () => {
  try {
    console.log('🌱 Starting database seeding via admin endpoint...');
    console.log('📡 Calling admin endpoint...');

    const response = await axios.post(`${API_BASE_URL}/admin/seed`);

    console.log('✅ Seeding completed successfully!');
    console.log('📊 Summary:', response.data.summary);
    console.log('💬 Message:', response.data.message);

    // Test the endpoints after seeding
    console.log('\n🔍 Testing endpoints after seeding...');

    // Test countries endpoint
    try {
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries?language=en&active=true`);
      console.log('✅ Countries endpoint working');
      console.log('📊 Found', countriesResponse.data.total, 'countries');
      console.log('📋 First 3 countries:', countriesResponse.data.data.slice(0, 3).map(c => `${c.code}: ${c.label}`));
    } catch (error) {
      console.log('❌ Countries endpoint still failing:', error.message);
    }

    // Test categories endpoint
    try {
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      console.log('✅ Categories endpoint working');
      console.log('📊 Found', categoriesResponse.data.length, 'categories');
    } catch (error) {
      console.log('❌ Categories endpoint failing:', error.message);
    }

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

seedViaAdmin();
