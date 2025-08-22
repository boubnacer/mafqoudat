const http = require('http');

const testAPIEndpoint = () => {
  // Get Morocco country ID from the previous test
  const moroccoId = '68a4b54ab46524c54c553ca9';
  
  const options = {
    hostname: 'localhost',
    port: 3500,
    path: `/cities-public?countryId=${moroccoId}&language=en`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  console.log('🔍 Testing API endpoint:', `http://localhost:3500${options.path}`);

  const req = http.request(options, (res) => {
    console.log('🔍 Response status:', res.statusCode);
    console.log('🔍 Response headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('🔍 Response data:', JSON.stringify(jsonData, null, 2));
        
        if (jsonData.success) {
          console.log('✅ API test successful! Found', jsonData.total, 'cities');
        } else {
          console.log('❌ API test failed:', jsonData.message);
        }
      } catch (error) {
        console.log('❌ Error parsing response:', error);
        console.log('🔍 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.end();
};

// Wait a bit for server to start, then test
setTimeout(() => {
  testAPIEndpoint();
}, 2000);
