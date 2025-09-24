import React, { createContext, useContext, useState, useEffect } from 'react';
import { languageStorage } from './authStorage';

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

  const setLanguage = (language, shouldRefresh = false) => {
    try {
      if (['en', 'ar', 'fr'].includes(language)) {
        
        // Use centralized language storage utility with page refresh option
        languageStorage.setLanguage(language, shouldRefresh);
        
        // Apply language settings immediately (only if not refreshing)
        if (!shouldRefresh) {
          initializeLanguage(language);
          
          // Update state
          setCurrentLanguage(language);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
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

    // Listen for language change events
    const handleLanguageChange = () => {
      // Force re-render of components that depend on language
      setCurrentLanguage(prev => {
        const newLang = languageStorage.getCurrentLanguage();
        if (prev !== newLang) {
          initializeLanguage(newLang);
          return newLang;
        }
        return prev;
      });
    };

    // Also listen for the specific event name used in WelcomePage
    const handleLanguageChanged = () => {
      setCurrentLanguage(prev => {
        const newLang = languageStorage.getCurrentLanguage();
        if (prev !== newLang) {
          initializeLanguage(newLang);
          return newLang;
        }
        return prev;
      });
    };

    window.addEventListener('languageChange', handleLanguageChange);
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
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