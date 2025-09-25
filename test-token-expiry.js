// Test script to verify token expiry handling
// This script can be run in the browser console to test the fix

console.log('Testing token expiry handling...');

// Simulate an expired token (this is a fake JWT for testing)
const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySW5mbyI6eyJ1c2VybmFtZUlkIjoiNjY0YjFhYjFhYjFhYjFhYjFhYjFhYjEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiY291bnRyeSI6IjY2NGIxYWIxYWIxYWIxYWIxYWIxYWIxIiwicm9sZSI6InVzZXIifSwiaWF0IjoxNzA0MDAwMDAwLCJleHAiOjE3MDQwMDAwMDB9.fake_signature';

// Test the token validation function
if (typeof getOptimizedTokenValidation === 'function') {
  const validation = getOptimizedTokenValidation(expiredToken);
  console.log('Token validation result:', validation);
  
  if (!validation.isValid && validation.reason === 'TOKEN_EXPIRED') {
    console.log('✅ Token expiry detection is working correctly');
  } else {
    console.log('❌ Token expiry detection is not working correctly');
  }
} else {
  console.log('❌ getOptimizedTokenValidation function not available');
}

// Test localStorage state
console.log('Current localStorage state:');
console.log('- accessToken:', localStorage.getItem('accessToken'));
console.log('- isLoggedIn:', localStorage.getItem('isLoggedIn'));
console.log('- userData:', localStorage.getItem('userData'));

console.log('Test completed. If you see "Token expired, logging out user" in the console, the fix is working.');
