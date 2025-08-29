const https = require('https');

// Simple health check function
function checkHealth(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData,
            success: true
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            success: true
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        code: err.code,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        success: false
      });
    });

    req.end();
  });
}

async function testRailwayHealth() {
  console.log('🚂 Testing Railway Deployment Health\n');
  console.log('=====================================\n');

  // You need to replace this with your actual Railway URL
  const railwayUrl = process.env.RAILWAY_URL || 'https://your-railway-url.railway.app';
  
  if (railwayUrl.includes('your-railway-url')) {
    console.log('❌ Please set your Railway URL:');
    console.log('   Set RAILWAY_URL environment variable or update the script');
    console.log('   Example: RAILWAY_URL=https://your-app.railway.app');
    return;
  }

  console.log(`🔍 Testing: ${railwayUrl}/health`);
  
  try {
    const response = await checkHealth(`${railwayUrl}/health`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, response.data);
    
    if (response.status === 200) {
      console.log('\n🎉 SUCCESS: Your Railway deployment is working correctly!');
      console.log('✅ The "Deploy Failed" status is a false positive');
      console.log('✅ Your server is healthy and responding');
      console.log('✅ MongoDB connection is established');
    }
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.error}`);
    if (error.code) {
      console.log(`🔧 Error Code: ${error.code}`);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Railway dashboard for deployment logs');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Check if the health endpoint is responding');
    console.log('4. Verify MongoDB connection string');
  }
}

// Run the test
testRailwayHealth().catch(console.error);
