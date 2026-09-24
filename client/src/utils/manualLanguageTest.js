// Manual test utility for language persistence
// UPDATED: Uses ONLY 'language' key as the single source of truth
export const manualLanguageTest = {
  // Set language manually (using unified key)
  setLanguage: (language) => {
    try {
      localStorage.setItem('language', language);
      
      // Apply to DOM
      document.documentElement.setAttribute("lang", language);
      
      if (language === "ar") {
        document.body.setAttribute("dir", "rtl");
        document.body.style.direction = "rtl";
        document.body.style.textAlign = "right";
      } else {
        document.body.setAttribute("dir", "ltr");
        document.body.style.direction = "ltr";
        document.body.style.textAlign = "left";
      }
      
      return true;
    } catch (error) {
      console.error('Error setting language manually:', error);
      return false;
    }
  },
  
  // Get current language state
  getCurrentState: () => {
    return {
      localStorage: localStorage.getItem('language'),
      localStorage_app_language: localStorage.getItem('app_language'), // deprecated
      localStorage_currentLanguage: localStorage.getItem('currentLanguage'), // deprecated
      htmlLang: document.documentElement.getAttribute('lang'),
      bodyDir: document.body.getAttribute('dir'),
      bodyDirection: document.body.style.direction,
      bodyTextAlign: document.body.style.textAlign
    };
  },
  
  // Test full cycle
  testCycle: () => {
    // Step 1: Set to Arabic
    manualLanguageTest.setLanguage('ar');

    // Step 2: Set to French
    manualLanguageTest.setLanguage('fr');

    // Step 3: Set back to English
    manualLanguageTest.setLanguage('en');
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.manualLanguageTest = manualLanguageTest;
} 