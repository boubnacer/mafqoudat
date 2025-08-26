const https = require('https');

const RAILWAY_URL = 'mafqoudat-production.up.railway.app';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: RAILWAY_URL,
            port: 443,
            path: path,
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
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        length: Array.isArray(jsonData) ? jsonData.length : 'N/A'
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        length: 'Not JSON'
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function testRailwayEndpoints() {
    console.log('🔍 Testing Railway Endpoints...\n');
    
    const endpoints = [
        { name: 'Health Check', path: '/health' },
        { name: 'Countries (Arabic)', path: '/countries?language=ar&active=true' },
        { name: 'Categories (Arabic)', path: '/categories?language=ar&active=true' },
        { name: 'FoundLost Options (Arabic)', path: '/floptions?language=ar&active=true' }
    ];

    for (const endpoint of endpoints) {
        console.log(`📡 Testing ${endpoint.name}...`);
        try {
            const result = await makeRequest(endpoint.path);
            console.log(`✅ ${endpoint.name}: Status ${result.status}`);
            console.log(`   Data length: ${result.length}`);
            
            if (Array.isArray(result.data) && result.data.length > 0) {
                console.log(`   Sample: ${JSON.stringify(result.data[0]).substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint.name} failed: ${error.message}`);
        }
        console.log('');
    }
    
    console.log('🎯 Test completed!');
}

testRailwayEndpoints().catch(console.error);
