// Client-side test utilities

// Test localStorage functionality
export const testLocalStorage = () => {
  console.log('🧪 Testing localStorage...');
  
  try {
    // Test basic operations
    localStorage.setItem('test', 'value');
    const testValue = localStorage.getItem('test');
    localStorage.removeItem('test');
    
    if (testValue === 'value') {
      console.log('✅ localStorage is working correctly');
      return true;
    } else {
      console.log('❌ localStorage test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ localStorage error:', error);
    return false;
  }
};

// Test API base URL
export const testApiConfiguration = () => {
  console.log('🧪 Testing API configuration...');
  
  try {
    // Check if the API base URL is accessible
    const baseUrl = 'http://localhost:3500';
    
    // Test health endpoint
    fetch(`${baseUrl}/health`)
      .then(response => {
        if (response.ok) {
          console.log('✅ API server is accessible');
          return true;
        } else {
          console.log('❌ API server returned error status');
          return false;
        }
      })
      .catch(error => {
        console.error('❌ API server connection failed:', error);
        return false;
      });
  } catch (error) {
    console.error('❌ API configuration error:', error);
    return false;
  }
};

// Test language utilities
export const testLanguageUtils = () => {
  console.log('🧪 Testing language utilities...');
  
  try {
    const { getCurrentLanguage } = require('./languageUtils');
    const language = getCurrentLanguage();
    
    if (language && ['en', 'fr', 'ar'].includes(language)) {
      console.log(`✅ Language utility working: ${language}`);
      return true;
    } else {
      console.log('❌ Language utility failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Language utility error:', error);
    return false;
  }
};

// Run all tests
export const runClientTests = async () => {
  console.log('🧪 Running client-side tests...\n');
  
  const results = {
    localStorage: testLocalStorage(),
    languageUtils: testLanguageUtils(),
    apiConfiguration: await testApiConfiguration()
  };
  
  console.log('\n📊 Test Results:');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${test}: ${result ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All client-side tests passed!');
  } else {
    console.log('\n⚠️ Some client-side tests failed. Check the logs above.');
  }
  
  return allPassed;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testClient = {
    testLocalStorage,
    testApiConfiguration,
    testLanguageUtils,
    runClientTests
  };
}

export default {
  testLocalStorage,
  testApiConfiguration,
  testLanguageUtils,
  runClientTests
}; 