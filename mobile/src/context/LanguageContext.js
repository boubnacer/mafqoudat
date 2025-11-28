/**
 * Language Context for Mobile App
 * Mirrors: client/src/utils/languageContext.js
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { languageStorage } from '../utils/languageStorage';
import { I18nManager } from 'react-native';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await languageStorage.getCurrentLanguage();
        setCurrentLanguage(savedLanguage);
        applyLanguageDirection(savedLanguage);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing language:', error);
        setCurrentLanguage('en');
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  // Apply RTL/LTR direction based on language
  const applyLanguageDirection = (language) => {
    if (language === 'ar') {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
    } else {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false);
    }
    // Note: I18nManager changes require app restart on Android
    // For dynamic changes, you might need to use a library like react-native-restart
  };

  /**
   * Set language and save to storage
   * @param {string} language - Language code (en, fr, ar)
   * @returns {boolean} Success status
   */
  const setLanguage = async (language) => {
    try {
      if (languageStorage.isSupportedLanguage(language)) {
        const success = await languageStorage.setLanguage(language);
        if (success) {
          setCurrentLanguage(language);
          applyLanguageDirection(language);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  if (!isInitialized) {
    // Return a loading state or null while initializing
    return null;
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use language context
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

