const http = require('http');

const testCountriesAPIRequest = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3500,
      path: '/countries',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API Response received');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Success: ${response.success}`);
          console.log(`Total countries: ${response.total}`);
          
          if (response.data && response.data.length > 0) {
            console.log('\n📋 Sample countries:');
            response.data.slice(0, 5).forEach(country => {
              console.log(`   • ${country.code}: ${country.label} (ID: ${country._id})`);
            });
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

const main = async () => {
  try {
    console.log('🔗 Testing countries API endpoint...');
    console.log('URL: http://localhost:3500/countries');
    
    await testCountriesAPIRequest();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 3500');
  }
};

if (require.main === module) {
  main();
}

module.exports = { testCountriesAPIRequest };
