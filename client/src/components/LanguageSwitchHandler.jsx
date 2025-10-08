import React, { useEffect } from 'react';
import { authStorage } from '../utils/authStorage';

/**
 * LanguageSwitchHandler Component
 * 
 * This component ensures that authentication state is properly preserved
 * during language changes that trigger page refreshes.
 * 
 * It should be included in the main App component to monitor language changes
 * and verify authentication state persistence.
 */
const LanguageSwitchHandler = () => {
  useEffect(() => {
    // Check if this is a page refresh after language change
    const checkLanguageChangeRefresh = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isLanguageChange = urlParams.get('lang_changed') === 'true';
      
      if (isLanguageChange) {
        // Verify that authentication state was preserved
        const authVerification = authStorage.verifyAuthPersistence();
        
        if (!authVerification.success) {
          // Always log warnings for debugging
          console.warn('⚠️ Language change completed but authentication state verification failed:', authVerification.details);
        }
        
        // Clean up the URL parameter
        urlParams.delete('lang_changed');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    };

    // Run check on component mount
    checkLanguageChangeRefresh();
  }, []);

  // This component doesn't render anything
  return null;
};

export default LanguageSwitchHandler;
