/**
 * Language Context for Mobile App
 * Mirrors: client/src/utils/languageContext.js
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { languageStorage } from '../utils/languageStorage';

const LanguageContext = createContext();

// I18nManager.forceRTL only takes visual effect after the JS bundle reloads, so
// this can't go through utils/translations.js (useTranslation itself depends on
// this context - importing it here would be circular). Kept tiny and duplicated
// on purpose.
const RESTART_PROMPT = {
  en: { title: 'Restart Required', message: 'Please close and reopen the app to apply the new text direction.' },
  fr: { title: 'Redémarrage requis', message: "Veuillez fermer et rouvrir l'application pour appliquer le nouveau sens du texte." },
  ar: { title: 'إعادة التشغيل مطلوبة', message: 'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق اتجاه النص الجديد.' },
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await languageStorage.getCurrentLanguage();
        setCurrentLanguage(savedLanguage);
        // Cold start: just line up I18nManager with the persisted language,
        // no reload prompt - there's nothing running yet to restart.
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

  // Applies RTL/LTR to I18nManager and reports whether the actual direction
  // changed (as opposed to e.g. switching en <-> fr, which never touches RTL).
  const applyLanguageDirection = (language) => {
    const shouldBeRTL = language === 'ar';
    const directionChanged = I18nManager.isRTL !== shouldBeRTL;

    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);

    return directionChanged;
  };

  // I18nManager.forceRTL doesn't visually apply until the JS bundle reloads.
  // Updates.reloadAsync() does that in a standalone/production build; it's
  // unsupported in Expo Go/most dev clients, so this falls back to asking the
  // user to restart manually rather than failing silently.
  const promptForRestart = async (language) => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      const copy = RESTART_PROMPT[language] || RESTART_PROMPT.en;
      Alert.alert(copy.title, copy.message);
    }
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
          const directionChanged = applyLanguageDirection(language);
          if (directionChanged) {
            await promptForRestart(language);
          }
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
