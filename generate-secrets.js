const crypto = require('crypto');

console.log('=== Generate JWT Secrets ===');
console.log('JWT_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('\nJWT_REFRESH_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('\n=== Copy these values to your Railway environment variables ===');

