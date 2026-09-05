// Language reset and test utility
// UPDATED: Uses ONLY 'language' key as the single source of truth
export const languageReset = {
  // Clear all language-related localStorage (including deprecated keys)
  clearAll: () => {
    try {
      localStorage.removeItem('language');
      // Also remove deprecated keys if they exist
      localStorage.removeItem('app_language');
      localStorage.removeItem('currentLanguage');
      return true;
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
      return false;
    }
  },
  
  // Set language and verify it's saved (using unified key)
  setAndVerify: (language) => {
    try {
      // Clear first
      languageReset.clearAll();
      
      // Set language using ONLY the unified key
      localStorage.setItem('language', language);
      
      // Verify it's saved
      const savedLanguage = localStorage.getItem('language');

      if (savedLanguage === language) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting language:', error);
      return false;
    }
  },
  
  // Test full persistence cycle
  testPersistence: () => {
    // Step 1: Clear everything
    languageReset.clearAll();

    // Step 2: Set to Arabic
    if (!languageReset.setAndVerify('ar')) {
      return false;
    }

    // Step 3: Simulate page refresh (check localStorage)
    const savedLanguage = localStorage.getItem('language');

    if (savedLanguage === 'ar') {
      // Language persisted after "refresh"
    } else {
      return false;
    }

    // Step 4: Set to English
    if (!languageReset.setAndVerify('en')) {
      return false;
    }

    return true;
  },
  
  // Check what's currently in localStorage
  checkCurrent: () => {
    const current = {
      language: localStorage.getItem('language'),
      app_language: localStorage.getItem('app_language'), // deprecated
      currentLanguage: localStorage.getItem('currentLanguage'), // deprecated
      allKeys: Object.keys(localStorage)
    };

    if (current.app_language || current.currentLanguage) {
      console.warn('⚠️ Deprecated language keys detected! Migration may be needed.');
    }
    return current;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.languageReset = languageReset;
} 