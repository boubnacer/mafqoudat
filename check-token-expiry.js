// Real token from user
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySW5mbyI6eyJ1c2VybmFtZSI6IjAwMDAwMDAwMDAiLCJ1c2VybmFtZUlkIjoiNjhhZjg5YmIzMDQ2NGM1YTk3Y2E4ZmNmIiwiY291bnRyeSI6IjY4YTRiNTRhYjQ2NTI0YzU0YzU1M2NhZSJ9LCJpYXQiOjE3NTYzMzQ1ODUsImV4cCI6MTc1NjMzNTQ4NX0.9S1YAZUwSB3ncco_rauQO6nQ01vc7876B58CSv2fc64';

console.log('🔐 Checking token expiration...\n');

try {
  // Decode JWT token manually (base64 decode the payload part)
  const parts = REAL_TOKEN.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format');
  }
  
  // Decode the payload (second part)
  const payload = parts[1];
  // Add padding if needed
  const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
  const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
  const decoded = JSON.parse(decodedPayload);
  
  console.log('Token payload:', JSON.stringify(decoded, null, 2));
  
  const now = Math.floor(Date.now() / 1000);
  const exp = decoded.exp;
  const iat = decoded.iat;
  
  console.log(`\n📅 Token Details:`);
  console.log(`Current time: ${now}`);
  console.log(`Token issued at: ${iat}`);
  console.log(`Token expires at: ${exp}`);
  console.log(`Token is expired: ${now > exp ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Token age: ${now - iat} seconds`);
  console.log(`Time until expiry: ${exp - now} seconds`);
  
  if (now > exp) {
    console.log('\n🚨 PROBLEM IDENTIFIED: Token is expired!');
    console.log('This is why post creation is failing.');
    console.log('Solution: You need to log in again to get a fresh token.');
  } else {
    console.log('\n✅ Token is still valid');
    console.log('The issue might be something else.');
  }
  
} catch (error) {
  console.log('❌ Error decoding token:', error.message);
}
