/**
 * Language Authentication Integration Test Utility
 * 
 * This utility provides functions to test that authentication state
 * is properly preserved during language switching operations.
 */

import { authStorage, languageStorage } from './authStorage';

/**
 * Test authentication state before language change
 * @returns {Object} Test result with status and details
 */
export const testAuthBeforeLanguageChange = () => {
  try {
    const authState = authStorage.getAuthState();
    const verification = authStorage.verifyAuthPersistence();
    
    return {
      success: true,
      message: 'Authentication state test before language change',
      data: {
        authState: {
          hasToken: !!authState.token,
          hasUser: !!authState.user,
          isLoggedIn: authState.isLoggedIn
        },
        verification: verification
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test auth state before language change',
      error: error.message
    };
  }
};

/**
 * Test language change with authentication preservation
 * @param {string} targetLanguage - Language to switch to
 * @returns {Object} Test result with status and details
 */
export const testLanguageChangeWithAuth = (targetLanguage = 'ar') => {
  try {
    // Get current state
    const beforeAuth = testAuthBeforeLanguageChange();
    const currentLanguage = languageStorage.getCurrentLanguage();
    
    // Simulate language change (without actual page refresh for testing)
    const languageChangeResult = languageStorage.setLanguage(targetLanguage, false);
    
    // Verify language was changed
    const newLanguage = languageStorage.getCurrentLanguage();
    const languageChanged = newLanguage === targetLanguage;
    
    // Verify auth state is still intact
    const afterAuth = testAuthBeforeLanguageChange();
    const authPreserved = afterAuth.success && afterAuth.data.verification.success;
    
    return {
      success: languageChanged && authPreserved,
      message: 'Language change with authentication preservation test',
      data: {
        beforeAuth,
        afterAuth,
        languageChange: {
          from: currentLanguage,
          to: newLanguage,
          changed: languageChanged
        },
        authPreserved,
        languageChangeResult
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test language change with auth preservation',
      error: error.message
    };
  }
};

/**
 * Comprehensive test of the language switching integration
 * @returns {Object} Complete test results
 */
export const runLanguageAuthIntegrationTest = () => {
  console.log('🧪 Running Language Authentication Integration Test...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test 1: Initial auth state
  const test1 = testAuthBeforeLanguageChange();
  results.tests.push({
    name: 'Initial Authentication State',
    ...test1
  });
  
  // Test 2: Language change with auth preservation
  const test2 = testLanguageChangeWithAuth('ar');
  results.tests.push({
    name: 'Language Change to Arabic with Auth Preservation',
    ...test2
  });
  
  // Test 3: Language change back to English
  const test3 = testLanguageChangeWithAuth('en');
  results.tests.push({
    name: 'Language Change to English with Auth Preservation',
    ...test3
  });
  
  // Test 4: Language change to French
  const test4 = testLanguageChangeWithAuth('fr');
  results.tests.push({
    name: 'Language Change to French with Auth Preservation',
    ...test4
  });
  
  // Calculate overall success
  const allTestsPassed = results.tests.every(test => test.success);
  results.overallSuccess = allTestsPassed;
  
  // Log results
  console.log('📊 Test Results:', results);
  
  if (allTestsPassed) {
    console.log('✅ All language authentication integration tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the results above.');
  }
  
  return results;
};

/**
 * Test authentication state after page refresh simulation
 * @returns {Object} Test result
 */
export const testAuthAfterPageRefresh = () => {
  try {
    // Simulate what happens after a page refresh
    const authState = authStorage.getAuthState();
    const verification = authStorage.verifyAuthPersistence();
    
    return {
      success: verification.success,
      message: 'Authentication state after page refresh simulation',
      data: {
        authState,
        verification
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test auth state after page refresh',
      error: error.message
    };
  }
};

// Export all test functions
export default {
  testAuthBeforeLanguageChange,
  testLanguageChangeWithAuth,
  runLanguageAuthIntegrationTest,
  testAuthAfterPageRefresh
};
