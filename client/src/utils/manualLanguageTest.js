// Manual test utility for language persistence
// UPDATED: Uses ONLY 'language' key as the single source of truth
export const manualLanguageTest = {
  // Set language manually (using unified key)
  setLanguage: (language) => {
    try {
      console.log(`Manually setting language to: ${language} (using unified key)`);
      localStorage.setItem('language', language);
      
      // Apply to DOM
      document.documentElement.setAttribute("lang", language);
      
      if (language === "ar") {
        document.body.setAttribute("dir", "rtl");
        document.body.style.direction = "rtl";
        document.body.style.textAlign = "right";
        console.log('Applied RTL settings for Arabic');
      } else {
        document.body.setAttribute("dir", "ltr");
        document.body.style.direction = "ltr";
        document.body.style.textAlign = "left";
        console.log('Applied LTR settings for', language);
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
    console.log('=== Manual Language Test Cycle (Unified Key) ===');
    
    // Step 1: Check initial state
    console.log('1. Initial state:', manualLanguageTest.getCurrentState());
    
    // Step 2: Set to Arabic
    console.log('2. Setting to Arabic...');
    manualLanguageTest.setLanguage('ar');
    console.log('   After setting Arabic:', manualLanguageTest.getCurrentState());
    
    // Step 3: Simulate refresh (just check localStorage)
    console.log('3. Simulating refresh...');
    const savedLang = localStorage.getItem('language');
    console.log('   Saved language in localStorage:', savedLang);
    
    // Step 4: Set to French
    console.log('4. Setting to French...');
    manualLanguageTest.setLanguage('fr');
    console.log('   After setting French:', manualLanguageTest.getCurrentState());
    
    // Step 5: Set back to English
    console.log('5. Setting back to English...');
    manualLanguageTest.setLanguage('en');
    console.log('   After setting English:', manualLanguageTest.getCurrentState());
    
    console.log('=== Test Cycle Complete ===');
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.manualLanguageTest = manualLanguageTest;
} 