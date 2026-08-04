/**
 * Language Context for Mobile App
 * Mirrors: client/src/utils/languageContext.js
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, NativeModules, TurboModuleRegistry } from 'react-native';
import * as Updates from 'expo-updates';
import RNRestart from 'react-native-restart';
import { languageStorage } from '../utils/languageStorage';

const LanguageContext = createContext();

// RNRestart (react-native-restart) does a real native app restart, but the native
// module it relies on only exists in dev-client/production builds after a native
// rebuild - Expo Go can never load it (custom native modules aren't supported there).
//
// It ships as a legacy (non-TurboModule - its package.json declares no
// codegenConfig) native module, so on this app's New Architecture runtime
// (Expo SDK 54 / RN 0.81, bridgeless by default) it is reached through the
// interop layer rather than the classic bridge. Probe both registries:
// NativeModules covers the classic path, TurboModuleRegistry.get the interop
// one. The library's own JS wrapper is useless for detection - it defines
// restart()/Restart() as plain closures whether or not the native side loaded,
// and only throws once actually called.
const findRestartModule = () => {
  try {
    if (NativeModules?.RNRestart) return NativeModules.RNRestart;
  } catch (error) {
    // Accessing a missing module can throw rather than return undefined.
  }
  try {
    return TurboModuleRegistry?.get?.('RNRestart') || null;
  } catch (error) {
    return null;
  }
};

const canRestartNatively = !!findRestartModule();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);
  // Set (never cleared by this file) whenever a direction change couldn't be
  // applied automatically, so the user can be asked to reopen the app - see
  // promptForRestart below. Consumed by components/DirectionChangeDialog.js,
  // which owns clearing it again.
  const [directionChangeNotice, setDirectionChangeNotice] = useState(false);
  // Set when a restart was offered but the call actually failed, so the dialog
  // can stop offering a button that doesn't work. See restartApp below.
  const [restartUnavailable, setRestartUnavailable] = useState(false);

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
  // automatic path available, so we raise the direction-change dialog, which offers
  // a real native restart where one is available and otherwise explains that the new
  // direction applies the next time the user opens the app.
  const promptForRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      setDirectionChangeNotice(true);
    }
  };

  const dismissDirectionChangeNotice = () => setDirectionChangeNotice(false);

  // Only ever called from a user tap (the direction-change dialog's "Reopen app"
  // button) - a real process restart is more jarring than the silent reloadAsync
  // path above, so it's opt-in rather than automatic.
  //
  // Tries the JS-level reload first (cheaper, and enough for RTL to take effect
  // since the root view is recreated), then falls back to a full native restart.
  // Detection above can only tell us the native module is registered, not that
  // the call will succeed, so a throw here flips restartUnavailable and the
  // dialog degrades to "this applies next time you open the app" rather than
  // leaving the user tapping a dead button.
  const restartApp = async () => {
    try {
      await Updates.reloadAsync();
      return true;
    } catch (error) {
      // Expected whenever expo-updates is disabled - fall through to RNRestart.
    }
    try {
      RNRestart.restart();
      return true;
    } catch (error) {
      console.error('Native restart unavailable:', error);
      setRestartUnavailable(true);
      return false;
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
        // Offer the restart button only while we still believe it can work.
        canRestartNatively: canRestartNatively && !restartUnavailable,
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
