/**
 * Language Context for Mobile App
 * Mirrors: client/src/utils/languageContext.js
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, NativeModules } from 'react-native';
import * as Updates from 'expo-updates';
import RNRestart from 'react-native-restart';
import { languageStorage } from '../utils/languageStorage';

const LanguageContext = createContext();

// RNRestart (react-native-restart) does a real native app restart, but the native
// module it relies on only exists in dev-client/production builds after a native
// rebuild - Expo Go can never load it (custom native modules aren't supported there).
// Checked once, synchronously, so the UI can offer a working "Reopen app" button only
// where one would actually do something, instead of a button that silently fails.
const canRestartNatively = !!NativeModules.RNRestart;

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);
  // Set (never cleared by this file) whenever a direction change couldn't be
  // applied automatically, so a non-blocking banner can tell the user without
  // demanding a manual restart - see promptForRestart below. Consumed by
  // components/RestartNotice.js, which owns clearing it again.
  const [directionChangeNotice, setDirectionChangeNotice] = useState(false);

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
  // Updates.reloadAsync() would do that silently, but it rejects (ERR_UPDATES_DISABLED)
  // whenever expo-updates isn't both running outside dev/Expo Go AND enabled+configured
  // for OTA - this app has updates.enabled: false in app.config.js (no EAS Update
  // channel/project is set up), so today that's every environment, not just Expo Go/dev
  // client. Kept here anyway: it's a harmless no-op call now and becomes a real silent
  // reload for free if OTA updates are ever enabled later. Until then, there is no
  // automatic-reload path available, so we surface a brief non-blocking notice instead
  // of a blocking "please restart" instruction - the new direction still applies fully
  // the next time the user opens the app on their own.
  const promptForRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      setDirectionChangeNotice(true);
    }
  };

  const dismissDirectionChangeNotice = () => setDirectionChangeNotice(false);

  // Only ever called from a user tap (RestartNotice's "Reopen app" button) - a real
  // process restart is more jarring than the silent reloadAsync path above, so it's
  // opt-in rather than automatic. No-op (button isn't rendered in the first place)
  // when canRestartNatively is false.
  const restartApp = () => {
    if (canRestartNatively) {
      RNRestart.restart();
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
            await promptForRestart();
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
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        directionChangeNotice,
        dismissDirectionChangeNotice,
        canRestartNatively,
        restartApp,
      }}
    >
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
