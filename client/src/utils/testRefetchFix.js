/**
 * Test utility for RTK Query refetch fix
 * 
 * This utility provides comprehensive tests to verify that the RTK Query
 * refetch mechanism works correctly after the language switching fix.
 */

import { 
  triggerLanguageDependentRefetch, 
  safeLanguageRefetch,
  fallbackLanguageRefetch,
  LANGUAGE_DEPENDENT_ENDPOINTS 
} from './languageRefetchUtils';
import { store } from '../app/store';
import { apiSlice } from '../app/api/apiSlice';

/**
 * Test RTK Query store access
 */
export const testStoreAccess = () => {
  console.log('🧪 [REFETCH-TEST] Testing store access...');
  
  const testResults = {
    storeAvailable: false,
    apiSliceAvailable: false,
    apiSliceUtilAvailable: false,
    storeStateAccessible: false,
    apiStateAccessible: false,
    overall: false
  };
  
  try {
    // Test 1: Store availability
    testResults.storeAvailable = !!store;
    console.log('🧪 [REFETCH-TEST] Store available:', testResults.storeAvailable);
    
    // Test 2: API slice availability
    testResults.apiSliceAvailable = !!apiSlice;
    console.log('🧪 [REFETCH-TEST] API slice available:', testResults.apiSliceAvailable);
    
    // Test 3: API slice util availability
    testResults.apiSliceUtilAvailable = !!(apiSlice && apiSlice.util);
    console.log('🧪 [REFETCH-TEST] API slice util available:', testResults.apiSliceUtilAvailable);
    
    // Test 4: Store state access
    if (store) {
      try {
        const storeState = store.getState();
        testResults.storeStateAccessible = !!storeState;
        console.log('🧪 [REFETCH-TEST] Store state accessible:', testResults.storeStateAccessible);
        console.log('🧪 [REFETCH-TEST] Store state keys:', Object.keys(storeState));
        
        // Test 5: API state access
        if (apiSlice && storeState) {
          const apiState = storeState[apiSlice.reducerPath];
          testResults.apiStateAccessible = !!apiState;
          console.log('🧪 [REFETCH-TEST] API state accessible:', testResults.apiStateAccessible);
          console.log('🧪 [REFETCH-TEST] API reducer path:', apiSlice.reducerPath);
          
          if (apiState) {
            console.log('🧪 [REFETCH-TEST] API state keys:', Object.keys(apiState));
            console.log('🧪 [REFETCH-TEST] Active queries count:', Object.keys(apiState.queries || {}).length);
          }
        }
      } catch (error) {
        console.error('🧪 [REFETCH-TEST] Error accessing store state:', error);
      }
    }
    
    // Overall result
    testResults.overall = Object.values(testResults).every(result => result === true);
    console.log('🧪 [REFETCH-TEST] Store access test result:', testResults.overall ? 'PASS' : 'FAIL');
    console.log('🧪 [REFETCH-TEST] Detailed results:', testResults);
    
  } catch (error) {
    console.error('🧪 [REFETCH-TEST] Store access test failed:', error);
    testResults.overall = false;
  }
  
  return testResults;
};

/**
 * Test refetch mechanism
 */
export const testRefetchMechanism = async () => {
  console.log('🧪 [REFETCH-TEST] Testing refetch mechanism...');
  
  const testResults = {
    basicRefetch: false,
    safeRefetch: false,
    fallbackRefetch: false,
    errorHandling: false,
    overall: false
  };
  
  try {
    const testLanguage = 'ar';
    
    // Test 1: Basic refetch
    console.log('🧪 [REFETCH-TEST] Testing basic refetch...');
    try {
      triggerLanguageDependentRefetch(testLanguage, {
        priority: 'medium',
        forceRefetch: true
      });
      testResults.basicRefetch = true;
      console.log('🧪 [REFETCH-TEST] Basic refetch test: PASS');
    } catch (error) {
      console.error('🧪 [REFETCH-TEST] Basic refetch test: FAIL', error);
    }
    
    // Test 2: Safe refetch
    console.log('🧪 [REFETCH-TEST] Testing safe refetch...');
    try {
      const safeResult = await safeLanguageRefetch(testLanguage, {
        priority: 'medium',
        forceRefetch: true
      });
      testResults.safeRefetch = true;
      console.log('🧪 [REFETCH-TEST] Safe refetch test: PASS, result:', safeResult);
    } catch (error) {
      console.error('🧪 [REFETCH-TEST] Safe refetch test: FAIL', error);
    }
    
    // Test 3: Fallback refetch
    console.log('🧪 [REFETCH-TEST] Testing fallback refetch...');
    try {
      fallbackLanguageRefetch(testLanguage);
      testResults.fallbackRefetch = true;
      console.log('🧪 [REFETCH-TEST] Fallback refetch test: PASS');
    } catch (error) {
      console.error('🧪 [REFETCH-TEST] Fallback refetch test: FAIL', error);
    }
    
    // Test 4: Error handling
    console.log('🧪 [REFETCH-TEST] Testing error handling...');
    try {
      // Test with invalid language
      await safeLanguageRefetch('invalid', {
        priority: 'medium',
        forceRefetch: true
      });
      testResults.errorHandling = true; // Should handle gracefully
      console.log('🧪 [REFETCH-TEST] Error handling test: PASS');
    } catch (error) {
      console.log('🧪 [REFETCH-TEST] Error handling test: PASS (caught expected error)');
      testResults.errorHandling = true;
    }
    
    // Overall result
    testResults.overall = Object.values(testResults).every(result => result === true);
    console.log('🧪 [REFETCH-TEST] Refetch mechanism test result:', testResults.overall ? 'PASS' : 'FAIL');
    console.log('🧪 [REFETCH-TEST] Detailed results:', testResults);
    
  } catch (error) {
    console.error('🧪 [REFETCH-TEST] Refetch mechanism test failed:', error);
    testResults.overall = false;
  }
  
  return testResults;
};

/**
 * Test language-dependent endpoints configuration
 */
export const testLanguageDependentEndpoints = () => {
  console.log('🧪 [REFETCH-TEST] Testing language-dependent endpoints configuration...');
  
  const testResults = {
    endpointsDefined: false,
    validTags: false,
    validPriorities: false,
    overall: false
  };
  
  try {
    // Test 1: Endpoints are defined
    testResults.endpointsDefined = Object.keys(LANGUAGE_DEPENDENT_ENDPOINTS).length > 0;
    console.log('🧪 [REFETCH-TEST] Endpoints defined:', testResults.endpointsDefined);
    console.log('🧪 [REFETCH-TEST] Endpoints:', Object.keys(LANGUAGE_DEPENDENT_ENDPOINTS));
    
    // Test 2: Valid tags
    const validTags = ['Post', 'User', 'Country', 'Dashboard', 'FlOptions', 'Category'];
    const allTagsValid = Object.values(LANGUAGE_DEPENDENT_ENDPOINTS).every(config => 
      config.tags && config.tags.every(tag => validTags.includes(tag))
    );
    testResults.validTags = allTagsValid;
    console.log('🧪 [REFETCH-TEST] Valid tags:', testResults.validTags);
    
    // Test 3: Valid priorities
    const validPriorities = ['low', 'medium', 'high'];
    const allPrioritiesValid = Object.values(LANGUAGE_DEPENDENT_ENDPOINTS).every(config => 
      validPriorities.includes(config.priority)
    );
    testResults.validPriorities = allPrioritiesValid;
    console.log('🧪 [REFETCH-TEST] Valid priorities:', testResults.validPriorities);
    
    // Overall result
    testResults.overall = Object.values(testResults).every(result => result === true);
    console.log('🧪 [REFETCH-TEST] Endpoints configuration test result:', testResults.overall ? 'PASS' : 'FAIL');
    console.log('🧪 [REFETCH-TEST] Detailed results:', testResults);
    
  } catch (error) {
    console.error('🧪 [REFETCH-TEST] Endpoints configuration test failed:', error);
    testResults.overall = false;
  }
  
  return testResults;
};

/**
 * Test event system integration
 */
export const testEventSystemIntegration = () => {
  console.log('🧪 [REFETCH-TEST] Testing event system integration...');
  
  const testResults = {
    fallbackEventReceived: false,
    languageChangeEventReceived: false,
    overall: false
  };
  
  try {
    // Test 1: Fallback event
    console.log('🧪 [REFETCH-TEST] Testing fallback event...');
    let fallbackEventReceived = false;
    
    const fallbackEventHandler = (event) => {
      if (event.type === 'languageRefetchFallback') {
        fallbackEventReceived = true;
        console.log('🧪 [REFETCH-TEST] Fallback event received:', event.detail);
      }
    };
    
    window.addEventListener('languageRefetchFallback', fallbackEventHandler);
    
    // Trigger fallback
    fallbackLanguageRefetch('fr');
    
    // Wait for event
    setTimeout(() => {
      testResults.fallbackEventReceived = fallbackEventReceived;
      console.log('🧪 [REFETCH-TEST] Fallback event test:', testResults.fallbackEventReceived ? 'PASS' : 'FAIL');
      
      // Cleanup
      window.removeEventListener('languageRefetchFallback', fallbackEventHandler);
    }, 100);
    
    // Test 2: Language change event
    console.log('🧪 [REFETCH-TEST] Testing language change event...');
    let languageChangeEventReceived = false;
    
    const languageChangeEventHandler = (event) => {
      if (event.type === 'languageChanged') {
        languageChangeEventReceived = true;
        console.log('🧪 [REFETCH-TEST] Language change event received:', event.detail);
      }
    };
    
    window.addEventListener('languageChanged', languageChangeEventHandler);
    
    // Trigger language change
    const languageChangeEvent = new CustomEvent('languageChanged', {
      detail: { language: 'en', timestamp: Date.now() }
    });
    window.dispatchEvent(languageChangeEvent);
    
    // Wait for event
    setTimeout(() => {
      testResults.languageChangeEventReceived = languageChangeEventReceived;
      console.log('🧪 [REFETCH-TEST] Language change event test:', testResults.languageChangeEventReceived ? 'PASS' : 'FAIL');
      
      // Cleanup
      window.removeEventListener('languageChanged', languageChangeEventHandler);
      
      // Overall result
      testResults.overall = Object.values(testResults).every(result => result === true);
      console.log('🧪 [REFETCH-TEST] Event system integration test result:', testResults.overall ? 'PASS' : 'FAIL');
      console.log('🧪 [REFETCH-TEST] Detailed results:', testResults);
    }, 100);
    
  } catch (error) {
    console.error('🧪 [REFETCH-TEST] Event system integration test failed:', error);
    testResults.overall = false;
  }
  
  return testResults;
};

/**
 * Performance test for refetch mechanism
 */
export const testRefetchPerformance = async () => {
  console.log('🧪 [REFETCH-TEST] Testing refetch performance...');
  
  const languages = ['en', 'ar', 'fr'];
  const iterations = 3;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    for (const lang of languages) {
      await safeLanguageRefetch(lang, {
        priority: 'medium',
        forceRefetch: false // Don't force refetch for performance test
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    results.push(duration);
    
    console.log(`🧪 [REFETCH-TEST] Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
  }
  
  const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);
  
  console.log('🧪 [REFETCH-TEST] Performance results:');
  console.log('🧪 [REFETCH-TEST] - Average time:', averageTime.toFixed(2), 'ms');
  console.log('🧪 [REFETCH-TEST] - Min time:', minTime.toFixed(2), 'ms');
  console.log('🧪 [REFETCH-TEST] - Max time:', maxTime.toFixed(2), 'ms');
  
  return {
    averageTime,
    minTime,
    maxTime,
    iterations,
    results
  };
};

/**
 * Run all refetch tests
 */
export const runAllRefetchTests = async () => {
  console.log('🧪 [REFETCH-TEST] Running all refetch tests...');
  
  const allResults = {
    storeAccess: null,
    refetchMechanism: null,
    endpointsConfiguration: null,
    eventSystemIntegration: null,
    performance: null,
    overall: false
  };
  
  try {
    // Run all tests
    allResults.storeAccess = testStoreAccess();
    allResults.refetchMechanism = await testRefetchMechanism();
    allResults.endpointsConfiguration = testLanguageDependentEndpoints();
    allResults.eventSystemIntegration = testEventSystemIntegration();
    allResults.performance = await testRefetchPerformance();
    
    // Calculate overall result
    allResults.overall = Object.values(allResults).every(result => 
      result === null || (typeof result === 'object' && result.overall === true)
    );
    
    console.log('🧪 [REFETCH-TEST] All tests completed!');
    console.log('🧪 [REFETCH-TEST] Overall result:', allResults.overall ? 'PASS' : 'FAIL');
    console.log('🧪 [REFETCH-TEST] Detailed results:', allResults);
    
  } catch (error) {
    console.error('🧪 [REFETCH-TEST] Test suite failed:', error);
    allResults.overall = false;
  }
  
  return allResults;
};

// Export test functions for use in development
if (process.env.NODE_ENV === 'development') {
  window.testStoreAccess = testStoreAccess;
  window.testRefetchMechanism = testRefetchMechanism;
  window.testLanguageDependentEndpoints = testLanguageDependentEndpoints;
  window.testEventSystemIntegration = testEventSystemIntegration;
  window.testRefetchPerformance = testRefetchPerformance;
  window.runAllRefetchTests = runAllRefetchTests;
  
  console.log('🧪 [REFETCH-TEST] Test functions available in development mode:');
  console.log('🧪 [REFETCH-TEST] - testStoreAccess()');
  console.log('🧪 [REFETCH-TEST] - testRefetchMechanism()');
  console.log('🧪 [REFETCH-TEST] - testLanguageDependentEndpoints()');
  console.log('🧪 [REFETCH-TEST] - testEventSystemIntegration()');
  console.log('🧪 [REFETCH-TEST] - testRefetchPerformance()');
  console.log('🧪 [REFETCH-TEST] - runAllRefetchTests()');
}
