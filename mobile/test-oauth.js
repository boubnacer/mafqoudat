/**
 * Test script to verify Google OAuth implementation
 * Run this in the mobile app directory to test the OAuth flow
 */

import { initiateGoogleAuth } from './src/utils/googleAuth';

// Test the OAuth flow
const testOAuth = async () => {
  console.log('Testing Google OAuth flow...');
  
  try {
    const result = await initiateGoogleAuth();
    console.log('OAuth Result:', result);
    
    if (result.type === 'success') {
      console.log('✅ OAuth successful!');
      console.log('Access Token:', result.accessToken?.substring(0, 20) + '...');
    } else if (result.type === 'pending') {
      console.log('✅ OAuth pending - new user');
      console.log('Pending Token:', result.pendingToken?.substring(0, 20) + '...');
    } else if (result.type === 'cancel') {
      console.log('⚠️ OAuth cancelled by user');
    } else {
      console.log('❌ OAuth failed:', result.error);
    }
  } catch (error) {
    console.error('❌ OAuth test failed:', error);
  }
};

// Export for use in React Native environment
export { testOAuth };

// For direct testing in Node.js environment (if needed)
if (typeof window === 'undefined') {
  console.log('Running OAuth test in Node.js environment...');
  console.log('Note: This test requires React Native environment to work properly.');
  console.log('Please run this within the React Native app or use Expo Go.');
}
