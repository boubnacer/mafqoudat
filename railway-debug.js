const https = require('https');
const http = require('http');

// Configuration - Update these with your actual Railway URLs
const config = {
  // Replace with your actual Railway URLs
  apiUrl: process.env.RAILWAY_API_URL || 'https://your-api-url.railway.app',
  clientUrl: process.env.RAILWAY_CLIENT_URL || 'https://your-client-url.railway.app',
  
  // Test endpoints
  endpoints: [
    '/health',
    '/',
    '/auth',
    '/posts'
  ]
};

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Railway-Debug-Script/1.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: responseData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            raw: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        code: err.code,
        url: url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: url
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');
  
  for (const endpoint of config.endpoints) {
    const url = `${config.apiUrl}${endpoint}`;
    console.log(`Testing: ${url}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Error: ${error.error}`);
      if (error.code) {
        console.log(`🔧 Code: ${error.code}`);
      }
    }
    console.log('---\n');
  }
}

// Test client endpoints
async function testClientEndpoints() {
  console.log('🌐 Testing Client Endpoints...\n');
  
  const clientEndpoints = ['/', '/dashboard', '/login'];
  
  for (const endpoint of clientEndpoints) {
    const url = `${config.clientUrl}${endpoint}`;
    console.log(`Testing: ${url}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`✅ Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`📄 Response length: ${response.raw.length} characters`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.error}`);
      if (error.code) {
        console.log(`🔧 Code: ${error.code}`);
      }
    }
    console.log('---\n');
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('🔧 Environment Check...\n');
  
  const envVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'RAILWAY_API_URL',
    'RAILWAY_CLIENT_URL'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***SET***' : value}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });
  
  console.log('\n---\n');
}

// Main function
async function main() {
  console.log('🚂 Railway Deployment Debug Script\n');
  console.log('=====================================\n');
  
  // Check environment
  checkEnvironment();
  
  // Test API if URL is provided
  if (config.apiUrl && !config.apiUrl.includes('your-api-url')) {
    await testAPIEndpoints();
  } else {
    console.log('⚠️  API URL not configured. Set RAILWAY_API_URL environment variable.\n');
  }
  
  // Test client if URL is provided
  if (config.clientUrl && !config.clientUrl.includes('your-client-url')) {
    await testClientEndpoints();
  } else {
    console.log('⚠️  Client URL not configured. Set RAILWAY_CLIENT_URL environment variable.\n');
  }
  
  console.log('🎯 Troubleshooting Tips:');
  console.log('1. Check Railway dashboard for deployment logs');
  console.log('2. Verify environment variables are set correctly');
  console.log('3. Check if the health endpoint is responding');
  console.log('4. Verify MongoDB connection string');
  console.log('5. Check if the start command is correct');
  console.log('6. Look for any build errors in the logs');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  makeRequest,
  testAPIEndpoints,
  testClientEndpoints,
  checkEnvironment
};
