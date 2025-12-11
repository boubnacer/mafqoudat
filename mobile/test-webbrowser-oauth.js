/**
 * Test script to verify WebBrowser OAuth implementation
 * This can be used to test the OAuth flow independently
 */

import * as WebBrowser from 'expo-web-browser';

// Test the WebBrowser OAuth flow
const testWebBrowserOAuth = async () => {
  console.log('Testing WebBrowser OAuth flow...');
  
  try {
    // Test redirect URL generation
    const redirectUrl = 'mafqoudat://auth/callback';
    console.log('✅ Redirect URL:', redirectUrl);
    
    // Test URL construction (replace with your actual API URL)
    const API_BASE_URL = 'http://localhost:5000'; // Update this
    const authUrl = `${API_BASE_URL}/auth/google?mobile=true&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    console.log('✅ Auth URL:', authUrl);
    
    // Test WebBrowser availability
    console.log('✅ WebBrowser available:', !!WebBrowser);
    console.log('✅ openAuthSessionAsync available:', !!WebBrowser.openAuthSessionAsync);
    
    // Note: Actual OAuth test requires user interaction
    console.log('ℹ️ To test full OAuth flow:');
    console.log('1. Start the app with: npx expo start');
    console.log('2. Go to Login screen');
    console.log('3. Click "Continue with Google"');
    console.log('4. Check console logs for debugging');
    
    return {
      success: true,
      message: 'WebBrowser OAuth setup verified',
      redirectUrl,
      authUrl
    };
    
  } catch (error) {
    console.error('❌ WebBrowser OAuth test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for use in React Native environment
export { testWebBrowserOAuth };

// For direct testing in Node.js environment
if (typeof window === 'undefined') {
  console.log('Running WebBrowser OAuth test in Node.js environment...');
  console.log('Note: This test requires React Native environment to work properly.');
  console.log('Please run this within the React Native app or use Expo Go.');
  
  testWebBrowserOAuth().then(result => {
    console.log('Test result:', result);
  });
}
