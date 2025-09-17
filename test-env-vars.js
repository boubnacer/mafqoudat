require('dotenv').config({ path: './server/.env' });

console.log('🧪 Testing Environment Variables...\n');

console.log('GEONAMES_USERNAME:', process.env.GEONAMES_USERNAME);
console.log('GEONAMES_API_URL:', process.env.GEONAMES_API_URL);

// Test if the service can be instantiated
try {
  const geonamesService = require('./server/services/geonamesService');
  console.log('✅ Service loaded successfully');
  console.log('Service username:', geonamesService.username);
  console.log('Service baseURL:', geonamesService.baseURL);
} catch (error) {
  console.error('❌ Error loading service:', error.message);
}
