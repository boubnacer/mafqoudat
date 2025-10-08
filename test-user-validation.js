// Test script to verify user validation in password reset
const axios = require('axios');

const testUserValidation = async () => {
  console.log('='.repeat(60));
  console.log('PASSWORD RESET - USER VALIDATION TEST');
  console.log('='.repeat(60));
  console.log('\n');

  const baseUrl = 'https://www.mafqoudat.com/api/password-reset/request';

  // Test 1: Non-existent user
  console.log('Test 1: Non-existent User');
  console.log('-'.repeat(60));
  console.log('Testing with: nonexistent@example.com\n');

  try {
    const response = await axios.post(baseUrl, {
      contactInfo: 'nonexistent@example.com'
    });

    console.log('❌ UNEXPECTED: Request succeeded when it should have failed');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ CORRECT: Got 404 error as expected');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      console.log('\n✅ User validation is working!\n');
    } else {
      console.log('❌ WRONG ERROR:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test 2: Existing User (Optional)');
  console.log('-'.repeat(60));
  console.log('Note: This test requires a valid user email/phone\n');
  console.log('To test manually:');
  console.log('1. Go to https://www.mafqoudat.com/login');
  console.log('2. Click "Reset Password"');
  console.log('3. Enter a REGISTERED email/phone');
  console.log('4. Should see: ✅ Success message');
  console.log('5. Enter an UNREGISTERED email/phone');
  console.log('6. Should see: ❌ "User not found..." error');
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
};

testUserValidation();

