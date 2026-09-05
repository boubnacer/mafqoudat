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
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ localStorage error:', error);
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

    if (state.localStorage_app_language || state.localStorage_currentLanguage) {
      console.warn('⚠️ Deprecated language keys detected! Consider running migration.');
    }
    return state;
  },
  
  // Set language directly (using unified key)
  setLanguageDirect: (language) => {
    try {
      // Save to ONLY the unified localStorage key
      localStorage.setItem('language', language);
      
      // Apply to DOM
      document.documentElement.setAttribute('lang', language);
      
      if (language === 'ar') {
        document.body.setAttribute('dir', 'rtl');
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
      } else {
        document.body.setAttribute('dir', 'ltr');
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
      }
      
      return true;
    } catch (error) {
      console.error('Error setting language directly:', error);
      return false;
    }
  },
  
  // Test full cycle
  runTest: () => {
    // Step 1: Test localStorage
    if (!simpleLanguageTest.testLocalStorage()) {
      return false;
    }

    // Step 2: Set to Arabic
    simpleLanguageTest.setLanguageDirect('ar');

    // Step 3: Set to English
    simpleLanguageTest.setLanguageDirect('en');

    return true;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.simpleLanguageTest = simpleLanguageTest;
} 