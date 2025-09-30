/**
 * Test utility for smooth language switching
 * 
 * This utility provides functions to test the smooth language switching
 * implementation without page refresh.
 */

import { languageStorage } from './authStorage';
import { triggerLanguageDependentRefetch } from './languageRefetchUtils';

/**
 * Test smooth language switching functionality
 */
export const testSmoothLanguageSwitching = () => {
  console.log('🧪 [TEST] Starting smooth language switching test...');
  
  const testResults = {
    languageStorage: false,
    documentAttributes: false,
    eventDispatching: false,
    refetchTriggering: false,
    overall: false
  };
  
  try {
    // Test 1: Language storage
    console.log('🧪 [TEST] Testing language storage...');
    const testLanguage = 'ar';
    const result = languageStorage.setLanguage(testLanguage);
    testResults.languageStorage = result;
    console.log('🧪 [TEST] Language storage test:', result ? 'PASS' : 'FAIL');
    
    // Test 2: Document attributes
    console.log('🧪 [TEST] Testing document attributes...');
    const langAttr = document.documentElement.getAttribute('lang');
    const dirAttr = document.body.getAttribute('dir');
    const textAlign = document.body.style.textAlign;
    
    testResults.documentAttributes = (
      langAttr === testLanguage &&
      dirAttr === 'rtl' &&
      textAlign === 'right'
    );
    console.log('🧪 [TEST] Document attributes test:', testResults.documentAttributes ? 'PASS' : 'FAIL');
    console.log('🧪 [TEST] - lang:', langAttr, 'dir:', dirAttr, 'textAlign:', textAlign);
    
    // Test 3: Event dispatching
    console.log('🧪 [TEST] Testing event dispatching...');
    let eventReceived = false;
    const eventHandler = (event) => {
      if (event.detail && event.detail.language === testLanguage) {
        eventReceived = true;
        console.log('🧪 [TEST] Language change event received:', event.detail);
      }
    };
    
    window.addEventListener('languageChanged', eventHandler);
    
    // Trigger another language change to test event
    setTimeout(() => {
      languageStorage.setLanguage('fr');
      setTimeout(() => {
        testResults.eventDispatching = eventReceived;
        console.log('🧪 [TEST] Event dispatching test:', testResults.eventDispatching ? 'PASS' : 'FAIL');
        
        // Test 4: Refetch triggering
        console.log('🧪 [TEST] Testing refetch triggering...');
        try {
          triggerLanguageDependentRefetch('en', { priority: 'low' });
          testResults.refetchTriggering = true;
          console.log('🧪 [TEST] Refetch triggering test: PASS');
        } catch (error) {
          console.error('🧪 [TEST] Refetch triggering test: FAIL', error);
          testResults.refetchTriggering = false;
        }
        
        // Cleanup
        window.removeEventListener('languageChanged', eventHandler);
        
        // Overall result
        testResults.overall = Object.values(testResults).every(result => result === true);
        console.log('🧪 [TEST] Overall test result:', testResults.overall ? 'PASS' : 'FAIL');
        console.log('🧪 [TEST] Test results:', testResults);
        
        // Reset to English
        languageStorage.setLanguage('en');
        
      }, 100);
    }, 100);
    
  } catch (error) {
    console.error('🧪 [TEST] Test failed with error:', error);
    testResults.overall = false;
  }
  
  return testResults;
};

/**
 * Test language context integration
 */
export const testLanguageContextIntegration = () => {
  console.log('🧪 [TEST] Testing language context integration...');
  
  // This would need to be called from within a React component
  // that has access to the language context
  console.log('🧪 [TEST] Language context integration test requires React component context');
  console.log('🧪 [TEST] Please run this test from within a component that uses useLanguage hook');
  
  return {
    contextAvailable: typeof window !== 'undefined',
    message: 'Run from React component with language context'
  };
};

/**
 * Performance test for language switching
 */
export const testLanguageSwitchingPerformance = () => {
  console.log('🧪 [TEST] Testing language switching performance...');
  
  const languages = ['en', 'ar', 'fr'];
  const iterations = 10;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    languages.forEach(lang => {
      languageStorage.setLanguage(lang);
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    results.push(duration);
    
    console.log(`🧪 [TEST] Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
  }
  
  const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);
  
  console.log('🧪 [TEST] Performance results:');
  console.log('🧪 [TEST] - Average time:', averageTime.toFixed(2), 'ms');
  console.log('🧪 [TEST] - Min time:', minTime.toFixed(2), 'ms');
  console.log('🧪 [TEST] - Max time:', maxTime.toFixed(2), 'ms');
  
  // Reset to English
  languageStorage.setLanguage('en');
  
  return {
    averageTime,
    minTime,
    maxTime,
    iterations,
    results
  };
};

// Export test functions for use in development
if (process.env.NODE_ENV === 'development') {
  window.testSmoothLanguageSwitching = testSmoothLanguageSwitching;
  window.testLanguageContextIntegration = testLanguageContextIntegration;
  window.testLanguageSwitchingPerformance = testLanguageSwitchingPerformance;
  
  console.log('🧪 [TEST] Test functions available in development mode:');
  console.log('🧪 [TEST] - testSmoothLanguageSwitching()');
  console.log('🧪 [TEST] - testLanguageContextIntegration()');
  console.log('🧪 [TEST] - testLanguageSwitchingPerformance()');
}
