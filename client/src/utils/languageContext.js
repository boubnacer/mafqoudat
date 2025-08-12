import React, { createContext, useContext, useState, useEffect } from 'react';

// Language context
const LanguageContext = createContext();

// Initialize language settings
export const initializeLanguage = (language = null) => {
  try {
    // Check both 'language' and 'app_language' keys for backward compatibility
    const savedLanguage = localStorage.getItem('language') || localStorage.getItem('app_language');
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

  const setLanguage = (language) => {
    try {
      if (['en', 'ar', 'fr'].includes(language)) {
        console.log('LanguageContext: Setting language to:', language);
        setCurrentLanguage(language);
        
        // Save to both keys for compatibility
        localStorage.setItem('language', language);
        localStorage.setItem('app_language', language);
        
        // Apply language settings immediately
        initializeLanguage(language);
        
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
      // Check both keys for backward compatibility
      const savedLanguage = localStorage.getItem('language') || localStorage.getItem('app_language');
      
      if (savedLanguage && ['en', 'ar', 'fr'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        initializeLanguage(savedLanguage);
      } else {
        // No saved language or invalid, use default
        initializeLanguage('en');
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      initializeLanguage('en');
    }

    // Listen for language change events
    const handleLanguageChange = () => {
      // Force re-render of components that depend on language
      setCurrentLanguage(prev => {
        const newLang = localStorage.getItem('language') || localStorage.getItem('app_language') || 'en';
        if (prev !== newLang) {
          initializeLanguage(newLang);
          return newLang;
        }
        return prev;
      });
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

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