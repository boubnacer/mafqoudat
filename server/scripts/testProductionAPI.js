const https = require('https');

const testProductionAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mafqoudat-production.up.railway.app',
      port: 443,
      path: '/countries',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Production API Response received');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Success: ${response.success}`);
          console.log(`Total countries: ${response.total}`);
          
          if (response.data && response.data.length > 0) {
            console.log('\n📋 Sample countries from production:');
            response.data.slice(0, 5).forEach(country => {
              console.log(`   • ${country.code}: ${country.label} (ID: ${country._id})`);
            });
          } else {
            console.log('❌ No countries data in production API');
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

    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

const main = async () => {
  try {
    console.log('🔗 Testing production countries API endpoint...');
    console.log('URL: https://mafqoudat-production.up.railway.app/countries');
    
    await testProductionAPI();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

if (require.main === module) {
  main();
}

module.exports = { testProductionAPI };
