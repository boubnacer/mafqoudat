const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function checkDatabaseConnection() {
  console.log('🔍 Checking Database Connection...\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Check all available endpoints
    console.log('\n1. Checking all available endpoints...');
    
    const endpoints = [
      '/',
      '/users',
      '/countries', 
      '/categories',
      '/cities',
      '/floptions',
      '/posts',
      '/dependencies'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${DEPLOYMENT_URL}${endpoint}`);
        const data = response.data;
        let count = 0;
        
        if (Array.isArray(data)) {
          count = data.length;
        } else if (data && typeof data === 'object') {
          if (data.postsWithUser) {
            count = data.postsWithUser.length;
          } else if (data.users) {
            count = data.users.length;
          } else if (data.countries) {
            count = data.countries.length;
          } else if (data.categories) {
            count = data.categories.length;
          } else if (data.cities) {
            count = data.cities.length;
          } else if (data.dependencies) {
            count = data.dependencies.length;
          }
        }
        
        console.log(`✅ ${endpoint}: ${count} items`);
        
        // Show sample data for non-empty collections
        if (count > 0 && Array.isArray(data) && data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n2. Checking database health...');
    try {
      const healthResponse = await axios.get(`${DEPLOYMENT_URL}/health`);
      console.log('✅ Health endpoint working');
      console.log('Health data:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health endpoint error:', error.response?.status, error.response?.data);
    }
    
    console.log('\n🎉 Database check completed!');
    console.log('\n💡 Next Steps:');
    console.log('1. If all collections are empty, you need to seed the database');
    console.log('2. If some collections have data but posts are empty, you need to create posts');
    console.log('3. If you see connection errors, check your database configuration');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the check
checkDatabaseConnection();
