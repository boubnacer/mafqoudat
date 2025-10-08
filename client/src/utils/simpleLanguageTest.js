// Simple language persistence test
// UPDATED: Uses ONLY 'language' key as the single source of truth
export const simpleLanguageTest = {
  // Check if localStorage is working
  testLocalStorage: () => {
    try {
      // Test writing to localStorage
      localStorage.setItem('test_key', 'test_value');
      const retrieved = localStorage.getItem('test_key');
      localStorage.removeItem('test_key');
      
      if (retrieved === 'test_value') {
        console.log('✅ localStorage is working');
        return true;
      } else {
        console.log('❌ localStorage is not working');
        return false;
      }
    } catch (error) {
      console.log('❌ localStorage error:', error);
      return false;
    }
  },
  
  // Check current language state
  checkCurrentState: () => {
    const state = {
      localStorage_language: localStorage.getItem('language'),
      localStorage_app_language: localStorage.getItem('app_language'), // deprecated
      localStorage_currentLanguage: localStorage.getItem('currentLanguage'), // deprecated
      htmlLang: document.documentElement.getAttribute('lang'),
      bodyDir: document.body.getAttribute('dir'),
      bodyDirection: document.body.style.direction,
      bodyTextAlign: document.body.style.textAlign
    };
    
    console.log('Current Language State:', state);
    if (state.localStorage_app_language || state.localStorage_currentLanguage) {
      console.warn('⚠️ Deprecated language keys detected! Consider running migration.');
    }
    return state;
  },
  
  // Set language directly (using unified key)
  setLanguageDirect: (language) => {
    try {
      console.log(`Setting language directly to: ${language} (using unified key)`);
      
      // Save to ONLY the unified localStorage key
      localStorage.setItem('language', language);
      
      // Apply to DOM
      document.documentElement.setAttribute('lang', language);
      
      if (language === 'ar') {
        document.body.setAttribute('dir', 'rtl');
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
        console.log('Applied RTL settings');
      } else {
        document.body.setAttribute('dir', 'ltr');
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
        console.log('Applied LTR settings');
      }
      
      return true;
    } catch (error) {
      console.error('Error setting language directly:', error);
      return false;
    }
  },
  
  // Test full cycle
  runTest: () => {
    console.log('=== Simple Language Test (Unified Key) ===');
    
    // Step 1: Test localStorage
    if (!simpleLanguageTest.testLocalStorage()) {
      console.log('❌ Test failed: localStorage not working');
      return false;
    }
    
    // Step 2: Check initial state
    console.log('Initial state:');
    simpleLanguageTest.checkCurrentState();
    
    // Step 3: Set to Arabic
    console.log('Setting to Arabic...');
    simpleLanguageTest.setLanguageDirect('ar');
    simpleLanguageTest.checkCurrentState();
    
    // Step 4: Simulate refresh (check localStorage)
    console.log('Simulating refresh...');
    const savedLang = localStorage.getItem('language');
    console.log('Saved language:', savedLang);
    
    // Step 5: Set to English
    console.log('Setting to English...');
    simpleLanguageTest.setLanguageDirect('en');
    simpleLanguageTest.checkCurrentState();
    
    console.log('✅ Test completed successfully');
    return true;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.simpleLanguageTest = simpleLanguageTest;
} 