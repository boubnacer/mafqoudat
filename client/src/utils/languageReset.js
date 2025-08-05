// Language reset and test utility
export const languageReset = {
  // Clear all language-related localStorage
  clearAll: () => {
    try {
      localStorage.removeItem('language');
      localStorage.removeItem('app_language');
      console.log('✅ Cleared all language localStorage');
      return true;
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
      return false;
    }
  },
  
  // Set language and verify it's saved
  setAndVerify: (language) => {
    try {
      console.log(`Setting language to: ${language}`);
      
      // Clear first
      languageReset.clearAll();
      
      // Set language using the context approach
      localStorage.setItem('language', language);
      localStorage.setItem('app_language', language);
      
      // Verify it's saved
      const savedLanguage = localStorage.getItem('language');
      const savedAppLanguage = localStorage.getItem('app_language');
      
      console.log('Verification:');
      console.log('  localStorage.language:', savedLanguage);
      console.log('  localStorage.app_language:', savedAppLanguage);
      
      if (savedLanguage === language && savedAppLanguage === language) {
        console.log('✅ Language saved successfully');
        return true;
      } else {
        console.log('❌ Language not saved correctly');
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting language:', error);
      return false;
    }
  },
  
  // Test full persistence cycle
  testPersistence: () => {
    console.log('=== Language Persistence Test ===');
    
    // Step 1: Clear everything
    console.log('1. Clearing all language data...');
    languageReset.clearAll();
    
    // Step 2: Set to Arabic
    console.log('2. Setting to Arabic...');
    if (!languageReset.setAndVerify('ar')) {
      console.log('❌ Failed to set Arabic');
      return false;
    }
    
    // Step 3: Simulate page refresh (check localStorage)
    console.log('3. Simulating page refresh...');
    const savedLanguage = localStorage.getItem('language');
    const savedAppLanguage = localStorage.getItem('app_language');
    
    if (savedLanguage === 'ar' || savedAppLanguage === 'ar') {
      console.log('✅ Language persisted after "refresh"');
    } else {
      console.log('❌ Language not persisted');
      return false;
    }
    
    // Step 4: Set to English
    console.log('4. Setting to English...');
    if (!languageReset.setAndVerify('en')) {
      console.log('❌ Failed to set English');
      return false;
    }
    
    console.log('✅ All tests passed!');
    return true;
  },
  
  // Check what's currently in localStorage
  checkCurrent: () => {
    const current = {
      language: localStorage.getItem('language'),
      app_language: localStorage.getItem('app_language'),
      allKeys: Object.keys(localStorage)
    };
    
    console.log('Current localStorage state:', current);
    return current;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.languageReset = languageReset;
} 