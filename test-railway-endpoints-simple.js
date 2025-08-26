const https = require('https');

console.log('🔍 Testing Railway Endpoints...\n');

function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'mafqoudat-production.up.railway.app',
            port: 443,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data,
                    path: path
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                status: 'ERROR',
                error: error.message,
                path: path
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                status: 'TIMEOUT',
                error: 'Request timeout',
                path: path
            });
        });

        req.end();
    });
}

async function runTests() {
    const endpoints = [
        '/health',
        '/countries?language=ar&active=true',
        '/countries?language=en&active=true',
        '/categories?language=ar&active=true',
        '/floptions?language=ar&active=true'
    ];

    for (const endpoint of endpoints) {
        console.log(`📡 Testing: ${endpoint}`);
        const result = await testEndpoint(endpoint);
        
        if (result.status === 200) {
            console.log(`✅ Status: ${result.status}`);
            try {
                const jsonData = JSON.parse(result.data);
                if (Array.isArray(jsonData.data)) {
                    console.log(`   Found ${jsonData.data.length} items`);
                } else {
                    console.log(`   Response: ${result.data.substring(0, 100)}...`);
                }
            } catch (e) {
                console.log(`   Response: ${result.data.substring(0, 100)}...`);
            }
        } else {
            console.log(`❌ Status: ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
        console.log('');
    }
    
    console.log('🎯 Test completed!');
}

runTests();
