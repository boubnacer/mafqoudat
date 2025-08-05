// Test utility for language persistence
import { debugLanguageState, getCurrentLanguage, setCurrentLanguage } from './languageUtils';

// Re-export debugLanguageState for use in App.js
export { debugLanguageState };

export const testLanguagePersistence = () => {
  console.log('=== Testing Language Persistence ===');
  
  // Test 1: Check current state
  console.log('1. Current language state:');
  const initialState = debugLanguageState();
  
  // Test 2: Change to Arabic
  console.log('2. Changing to Arabic...');
  setCurrentLanguage('ar');
  const arabicState = debugLanguageState();
  
  // Test 3: Change to French
  console.log('3. Changing to French...');
  setCurrentLanguage('fr');
  const frenchState = debugLanguageState();
  
  // Test 4: Change back to English
  console.log('4. Changing back to English...');
  setCurrentLanguage('en');
  const englishState = debugLanguageState();
  
  // Test 5: Verify localStorage
  console.log('5. Verifying localStorage...');
  const storedLanguage = localStorage.getItem('app_language');
  console.log('Stored language:', storedLanguage);
  
  // Test 6: Simulate page refresh
  console.log('6. Simulating page refresh...');
  const refreshedLanguage = getCurrentLanguage();
  console.log('Language after "refresh":', refreshedLanguage);
  
  console.log('=== Test Complete ===');
  
  return {
    initialState,
    arabicState,
    frenchState,
    englishState,
    storedLanguage,
    refreshedLanguage
  };
};

// Function to run test from browser console
if (typeof window !== 'undefined') {
  window.testLanguagePersistence = testLanguagePersistence;
  window.debugLanguageState = debugLanguageState;
} 