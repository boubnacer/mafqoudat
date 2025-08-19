const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

const testEndpoints = async () => {
  try {
    console.log('🔍 Testing server endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Health endpoint working:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
    }

    // Test countries endpoint
    console.log('\n2. Testing countries endpoint...');
    try {
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries?language=en&active=true`);
      console.log('✅ Countries endpoint working');
      console.log('📊 Found', countriesResponse.data.total, 'countries');
      console.log('📋 First 3 countries:', countriesResponse.data.data.slice(0, 3).map(c => `${c.code}: ${c.label}`));
    } catch (error) {
      console.log('❌ Countries endpoint failed:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }

    // Test categories endpoint
    console.log('\n3. Testing categories endpoint...');
    try {
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      console.log('✅ Categories endpoint working');
      console.log('📊 Found', categoriesResponse.data.length, 'categories');
    } catch (error) {
      console.log('❌ Categories endpoint failed:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }

    // Test dependencies endpoint
    console.log('\n4. Testing dependencies endpoint...');
    try {
      const dependenciesResponse = await axios.get(`${API_BASE_URL}/dependencies`);
      console.log('✅ Dependencies endpoint working');
      console.log('📊 Found', dependenciesResponse.data.length, 'dependencies');
    } catch (error) {
      console.log('❌ Dependencies endpoint failed:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEndpoints();
