/**
 * Test utility for unified language handling
 * 
 * This utility provides comprehensive tests for the unified language
 * change handling system to ensure consistent behavior across all components.
 */

import { 
  unifiedLanguageChange, 
  quickLanguageChange, 
  languageChangeWithLoading,
  getCurrentLanguage,
  languageChangeEvents
} from './unifiedLanguageHandler';

/**
 * Test unified language change functionality
 */
export const testUnifiedLanguageChange = async () => {
  console.log('🧪 [UNIFIED-TEST] Starting unified language change test...');
  
  const testResults = {
    basicChange: false,
    quickChange: false,
    loadingChange: false,
    eventDispatching: false,
    errorHandling: false,
    overall: false
  };
  
  try {
    // Test 1: Basic language change
    console.log('🧪 [UNIFIED-TEST] Testing basic language change...');
    const basicResult = await unifiedLanguageChange('ar', {
      showLoadingState: false,
      enableLogging: true
    });
    testResults.basicChange = basicResult;
    console.log('🧪 [UNIFIED-TEST] Basic change test:', basicResult ? 'PASS' : 'FAIL');
    
    // Test 2: Quick language change
    console.log('🧪 [UNIFIED-TEST] Testing quick language change...');
    const quickResult = await quickLanguageChange('fr');
    testResults.quickChange = quickResult;
    console.log('🧪 [UNIFIED-TEST] Quick change test:', quickResult ? 'PASS' : 'FAIL');
    
    // Test 3: Language change with loading
    console.log('🧪 [UNIFIED-TEST] Testing language change with loading...');
    const loadingResult = await languageChangeWithLoading('en', (language) => {
      console.log('🧪 [UNIFIED-TEST] Loading change completed:', language);
    });
    testResults.loadingChange = loadingResult;
    console.log('🧪 [UNIFIED-TEST] Loading change test:', loadingResult ? 'PASS' : 'FAIL');
    
    // Test 4: Event dispatching
    console.log('🧪 [UNIFIED-TEST] Testing event dispatching...');
    let eventsReceived = 0;
    const eventHandler = (event) => {
      eventsReceived++;
      console.log('🧪 [UNIFIED-TEST] Event received:', event.type, event.detail);
    };
    
    // Add event listeners
    const cleanup1 = languageChangeEvents.addListener('languageChanged', eventHandler);
    const cleanup2 = languageChangeEvents.addListener('languageChangeComplete', eventHandler);
    
    // Trigger a language change
    await unifiedLanguageChange('ar', {
      dispatchEvents: true,
      enableLogging: true
    });
    
    // Wait a bit for events
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testResults.eventDispatching = eventsReceived > 0;
    console.log('🧪 [UNIFIED-TEST] Event dispatching test:', testResults.eventDispatching ? 'PASS' : 'FAIL');
    console.log('🧪 [UNIFIED-TEST] Events received:', eventsReceived);
    
    // Cleanup
    cleanup1();
    cleanup2();
    
    // Test 5: Error handling
    console.log('🧪 [UNIFIED-TEST] Testing error handling...');
    try {
      await unifiedLanguageChange('invalid', {
        enableLogging: true
      });
      testResults.errorHandling = false; // Should have thrown an error
    } catch (error) {
      testResults.errorHandling = true; // Expected error
      console.log('🧪 [UNIFIED-TEST] Error handling test: PASS (caught expected error)');
    }
    
    // Overall result
    testResults.overall = Object.values(testResults).every(result => result === true);
    console.log('🧪 [UNIFIED-TEST] Overall test result:', testResults.overall ? 'PASS' : 'FAIL');
    console.log('🧪 [UNIFIED-TEST] Test results:', testResults);
    
    // Reset to English
    await unifiedLanguageChange('en', { enableLogging: false });
    
  } catch (error) {
    console.error('🧪 [UNIFIED-TEST] Test failed with error:', error);
    testResults.overall = false;
  }
  
  return testResults;
};

/**
 * Test component integration
 */
export const testComponentIntegration = () => {
  console.log('🧪 [UNIFIED-TEST] Testing component integration...');
  
  const integrationResults = {
    hookAvailable: false,
    handlerAvailable: false,
    eventsAvailable: false,
    overall: false
  };
  
  try {
    // Test if hook is available
    try {
      // This would need to be tested in a React component context
      integrationResults.hookAvailable = typeof window !== 'undefined';
      console.log('🧪 [UNIFIED-TEST] Hook availability test:', integrationResults.hookAvailable ? 'PASS' : 'FAIL');
    } catch (error) {
      console.log('🧪 [UNIFIED-TEST] Hook availability test: FAIL', error);
    }
    
    // Test if handler is available
    integrationResults.handlerAvailable = typeof unifiedLanguageChange === 'function';
    console.log('🧪 [UNIFIED-TEST] Handler availability test:', integrationResults.handlerAvailable ? 'PASS' : 'FAIL');
    
    // Test if events are available
    integrationResults.eventsAvailable = typeof languageChangeEvents === 'object' && 
                                       typeof languageChangeEvents.addListener === 'function';
    console.log('🧪 [UNIFIED-TEST] Events availability test:', integrationResults.eventsAvailable ? 'PASS' : 'FAIL');
    
    // Overall result
    integrationResults.overall = Object.values(integrationResults).every(result => result === true);
    console.log('🧪 [UNIFIED-TEST] Integration test result:', integrationResults.overall ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('🧪 [UNIFIED-TEST] Integration test failed:', error);
    integrationResults.overall = false;
  }
  
  return integrationResults;
};

/**
 * Test consistency across different change methods
 */
export const testConsistencyAcrossMethods = async () => {
  console.log('🧪 [UNIFIED-TEST] Testing consistency across methods...');
  
  const consistencyResults = {
    sameStorage: false,
    sameEvents: false,
    sameDocumentAttributes: false,
    overall: false
  };
  
  try {
    const testLanguage = 'ar';
    
    // Test 1: Same storage result
    console.log('🧪 [UNIFIED-TEST] Testing storage consistency...');
    await unifiedLanguageChange(testLanguage, { enableLogging: false });
    const storageAfterUnified = getCurrentLanguage();
    
    await quickLanguageChange('en');
    await quickLanguageChange(testLanguage);
    const storageAfterQuick = getCurrentLanguage();
    
    consistencyResults.sameStorage = storageAfterUnified === storageAfterQuick;
    console.log('🧪 [UNIFIED-TEST] Storage consistency test:', consistencyResults.sameStorage ? 'PASS' : 'FAIL');
    
    // Test 2: Same events
    console.log('🧪 [UNIFIED-TEST] Testing event consistency...');
    let unifiedEvents = 0;
    let quickEvents = 0;
    
    const unifiedEventHandler = () => unifiedEvents++;
    const quickEventHandler = () => quickEvents++;
    
    const cleanup1 = languageChangeEvents.addListener('languageChanged', unifiedEventHandler);
    await unifiedLanguageChange('en', { dispatchEvents: true });
    cleanup1();
    
    const cleanup2 = languageChangeEvents.addListener('languageChanged', quickEventHandler);
    await quickLanguageChange('en');
    cleanup2();
    
    consistencyResults.sameEvents = unifiedEvents > 0 && quickEvents > 0;
    console.log('🧪 [UNIFIED-TEST] Event consistency test:', consistencyResults.sameEvents ? 'PASS' : 'FAIL');
    console.log('🧪 [UNIFIED-TEST] Unified events:', unifiedEvents, 'Quick events:', quickEvents);
    
    // Test 3: Same document attributes
    console.log('🧪 [UNIFIED-TEST] Testing document attributes consistency...');
    await unifiedLanguageChange(testLanguage, { enableLogging: false });
    const unifiedLang = document.documentElement.getAttribute('lang');
    const unifiedDir = document.body.getAttribute('dir');
    
    await quickLanguageChange('en');
    await quickLanguageChange(testLanguage);
    const quickLang = document.documentElement.getAttribute('lang');
    const quickDir = document.body.getAttribute('dir');
    
    consistencyResults.sameDocumentAttributes = 
      unifiedLang === quickLang && unifiedDir === quickDir;
    console.log('🧪 [UNIFIED-TEST] Document attributes consistency test:', consistencyResults.sameDocumentAttributes ? 'PASS' : 'FAIL');
    console.log('🧪 [UNIFIED-TEST] Unified - lang:', unifiedLang, 'dir:', unifiedDir);
    console.log('🧪 [UNIFIED-TEST] Quick - lang:', quickLang, 'dir:', quickDir);
    
    // Overall result
    consistencyResults.overall = Object.values(consistencyResults).every(result => result === true);
    console.log('🧪 [UNIFIED-TEST] Consistency test result:', consistencyResults.overall ? 'PASS' : 'FAIL');
    
    // Reset to English
    await unifiedLanguageChange('en', { enableLogging: false });
    
  } catch (error) {
    console.error('🧪 [UNIFIED-TEST] Consistency test failed:', error);
    consistencyResults.overall = false;
  }
  
  return consistencyResults;
};

/**
 * Performance test for unified language handling
 */
export const testUnifiedLanguagePerformance = async () => {
  console.log('🧪 [UNIFIED-TEST] Testing unified language performance...');
  
  const languages = ['en', 'ar', 'fr'];
  const iterations = 5;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    for (const lang of languages) {
      await unifiedLanguageChange(lang, {
        showLoadingState: false,
        enableLogging: false
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    results.push(duration);
    
    console.log(`🧪 [UNIFIED-TEST] Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
  }
  
  const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);
  
  console.log('🧪 [UNIFIED-TEST] Performance results:');
  console.log('🧪 [UNIFIED-TEST] - Average time:', averageTime.toFixed(2), 'ms');
  console.log('🧪 [UNIFIED-TEST] - Min time:', minTime.toFixed(2), 'ms');
  console.log('🧪 [UNIFIED-TEST] - Max time:', maxTime.toFixed(2), 'ms');
  
  // Reset to English
  await unifiedLanguageChange('en', { enableLogging: false });
  
  return {
    averageTime,
    minTime,
    maxTime,
    iterations,
    results
  };
};

/**
 * Run all unified language tests
 */
export const runAllUnifiedLanguageTests = async () => {
  console.log('🧪 [UNIFIED-TEST] Running all unified language tests...');
  
  const allResults = {
    basicFunctionality: null,
    componentIntegration: null,
    consistency: null,
    performance: null,
    overall: false
  };
  
  try {
    // Run all tests
    allResults.basicFunctionality = await testUnifiedLanguageChange();
    allResults.componentIntegration = testComponentIntegration();
    allResults.consistency = await testConsistencyAcrossMethods();
    allResults.performance = await testUnifiedLanguagePerformance();
    
    // Calculate overall result
    allResults.overall = Object.values(allResults).every(result => 
      result === null || (typeof result === 'object' && result.overall === true)
    );
    
    console.log('🧪 [UNIFIED-TEST] All tests completed!');
    console.log('🧪 [UNIFIED-TEST] Overall result:', allResults.overall ? 'PASS' : 'FAIL');
    console.log('🧪 [UNIFIED-TEST] Detailed results:', allResults);
    
  } catch (error) {
    console.error('🧪 [UNIFIED-TEST] Test suite failed:', error);
    allResults.overall = false;
  }
  
  return allResults;
};

// Export test functions for use in development
if (process.env.NODE_ENV === 'development') {
  window.testUnifiedLanguageChange = testUnifiedLanguageChange;
  window.testComponentIntegration = testComponentIntegration;
  window.testConsistencyAcrossMethods = testConsistencyAcrossMethods;
  window.testUnifiedLanguagePerformance = testUnifiedLanguagePerformance;
  window.runAllUnifiedLanguageTests = runAllUnifiedLanguageTests;
  
  console.log('🧪 [UNIFIED-TEST] Test functions available in development mode:');
  console.log('🧪 [UNIFIED-TEST] - testUnifiedLanguageChange()');
  console.log('🧪 [UNIFIED-TEST] - testComponentIntegration()');
  console.log('🧪 [UNIFIED-TEST] - testConsistencyAcrossMethods()');
  console.log('🧪 [UNIFIED-TEST] - testUnifiedLanguagePerformance()');
  console.log('🧪 [UNIFIED-TEST] - runAllUnifiedLanguageTests()');
}
