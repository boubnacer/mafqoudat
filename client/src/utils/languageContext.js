import React, { createContext, useContext, useState, useEffect } from 'react';
import { languageStorage } from './authStorage';
import { safeLanguageRefetch } from './languageRefetchUtils';

// Language context
const LanguageContext = createContext();

// Initialize language settings
export const initializeLanguage = (language = null) => {
  try {
    // Use centralized language storage utility
    const savedLanguage = languageStorage.getCurrentLanguage();
    const currentLang = language || savedLanguage || 'en';
    
    // Set document language attribute
    document.documentElement.setAttribute("lang", currentLang);
    
    // Force re-render for RTL languages
    if (currentLang === "ar") {
      document.body.setAttribute("dir", "rtl");
      document.body.style.direction = "rtl";
      document.body.style.textAlign = "right";
    } else {
      document.body.setAttribute("dir", "ltr");
      document.body.style.direction = "ltr";
      document.body.style.textAlign = "left";
    }
    
    return currentLang;
  } catch (error) {
    console.error('Error initializing language:', error);
    return 'en';
  }
};

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Start with default
  const [isInitialized, setIsInitialized] = useState(false);

  const setLanguage = (language) => {
    try {
      console.log('🌐 [LANGUAGE-CONTEXT] setLanguage called:', { language, currentUrl: window.location.href });
      if (['en', 'ar', 'fr'].includes(language)) {
        
        // Use centralized language storage utility (no page refresh)
        const success = languageStorage.setLanguage(language);
        
        if (success) {
          // Update context state immediately
          setCurrentLanguage(language);
          
          // Trigger RTK Query refetch for all language-dependent queries
          handleLanguageRefetch(language);
          
          console.log('🌐 [LANGUAGE-CONTEXT] Language changed successfully:', language);
        }
        
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  /**
   * Trigger refetch for all language-dependent RTK Query endpoints
   * @param {string} language - New language code
   */
  const handleLanguageRefetch = async (language) => {
    try {
      console.log('🌐 [LANGUAGE-CONTEXT] Triggering refetch for language:', language);
      
      // Use the safe refetch function with error handling
      const refetchSuccess = await safeLanguageRefetch(language, {
        forceRefetch: true,
        priority: 'medium' // Refetch medium and high priority endpoints
      });
      
      console.log('🌐 [LANGUAGE-CONTEXT] Refetch result:', refetchSuccess ? 'SUCCESS' : 'FALLBACK');
    } catch (error) {
      console.error('Error triggering language-dependent refetch:', error);
    }
  };

  useEffect(() => {
    // Load language from localStorage on mount
    try {
      // Use centralized language storage utility
      const savedLanguage = languageStorage.getCurrentLanguage();
      
      if (savedLanguage && ['en', 'ar', 'fr'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        initializeLanguage(savedLanguage);
      } else {
        // No saved language or invalid, use default
        initializeLanguage('en');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading saved language:', error);
      initializeLanguage('en');
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Listen for language change events (smooth switching)
    const handleLanguageChanged = (event) => {
      console.log('🌐 [LANGUAGE-CONTEXT] Language change event received:', event.detail);
      
      // Update context state
      setCurrentLanguage(prev => {
        const newLang = languageStorage.getCurrentLanguage();
        if (prev !== newLang) {
          console.log('🌐 [LANGUAGE-CONTEXT] Language changed from', prev, 'to', newLang);
          return newLang;
        }
        return prev;
      });
    };

    // Listen for the custom language change event
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [isInitialized]);

  // Don't render children until language is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 