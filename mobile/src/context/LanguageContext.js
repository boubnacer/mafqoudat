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

// The direction this session is ACTUALLY laid out in. I18nManager.isRTL is read
// once from the constants captured when the JS bundle loaded and never changes
// again for this JS context (Libraries/ReactNative/I18nManager.js keeps them in a
// module-level object; allowRTL/forceRTL only call into native).
const SESSION_RTL = I18nManager.isRTL;

const wantsRTL = (language) => language === 'ar';

// Writing the native RTL preferences is NOT the harmless "queue it up for next
// launch" it looks like - it changes the direction of the RUNNING app, at a
// moment we don't control.
//
// allowRTL/forceRTL persist to SharedPreferences, and on the New Architecture
// FabricUIManager.updateRootLayoutSpecs re-reads I18nUtil.isRTL(context) - those
// very preferences - on EVERY root re-measure, then pushes the result into the
// running surface's layout constraints. So the whole view tree flips direction
// the next time anything re-measures the root: a Modal opening (the direction
// notice itself does this), the keyboard, a rotation. It may be seconds after
// the language was tapped, or not until another screen.
//
// Meanwhile I18nManager.isRTL - which every screen's RTL handling is built on,
// see utils/rtl.js - stays frozen at its bundle-load value. Once the two
// disagree, every mirrored row, edge inset and horizontal scroll offset in the
// app is computed against the wrong direction. That is what made the onboarding
// carousel skip slides and the Skip button jump sides mid-session.
//
// So this is called from exactly one place: immediately before a relaunch, where
// the value written is the one the next launch boots with. A running session's
// direction then never changes and I18nManager.isRTL is always the truth.
const commitDirectionPreferences = (isRTL) => {
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
};

// Puts the preferences back to the direction this session is laid out in, for
// when a relaunch was started and didn't happen. Without it a failed restart
// would leave the app primed to flip direction at the next re-measure.
const revertDirectionPreferences = () => commitDirectionPreferences(SESSION_RTL);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ar');
  const [isInitialized, setIsInitialized] = useState(false);
  // Raised whenever the saved language wants a direction this session isn't laid
  // out in, so the user can be asked to reopen the app. Consumed by
  // components/DirectionChangeDialog.js, which owns dismissing it.
  const [directionChangeNotice, setDirectionChangeNotice] = useState(false);
  // Set when a restart was offered but the call actually failed, so the dialog
  // can stop offering a button that doesn't work. See restartNow below.
  const [restartUnavailable, setRestartUnavailable] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await languageStorage.getCurrentLanguage();
        setCurrentLanguage(savedLanguage);
        await reconcileDirection(savedLanguage);
      } catch (error) {
        console.error('Error initializing language:', error);
        setCurrentLanguage('ar');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLanguage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tries the JS-level reload first (cheaper, and enough on its own since the
  // surface is recreated and re-reads the preferences), then a full native
  // restart. Updates.reloadAsync() rejects with ERR_UPDATES_DISABLED whenever
  // expo-updates isn't both outside dev/Expo Go AND configured for OTA - this app
  // has updates.enabled: false in app.config.js, so today that is every
  // environment. Kept anyway: it costs nothing now and becomes a real silent
  // reload for free if OTA is ever enabled. Detection at module scope can only
  // tell us RNRestart is registered, not that the call will succeed, so a throw
  // flips restartUnavailable and the dialog degrades to an acknowledgement
  // rather than leaving the user tapping a dead button.
  const restartNow = async () => {
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

  // Cold start only. If the saved language disagrees with the direction this
  // session actually booted in, the only honest way to apply it is to relaunch -
  // writing the preference and carrying on would flip the layout underneath the
  // running app (see commitDirectionPreferences).
  const reconcileDirection = async (language) => {
    const shouldBeRTL = wantsRTL(language);

    if (shouldBeRTL === SESSION_RTL) {
      // Already correct - forget any earlier attempt so a future change is free
      // to relaunch again.
      await languageStorage.clearDirectionRestartAttempt();
      return;
    }

    // One relaunch per direction, ever. If the app comes back up still laid out
    // the old way - no android:supportsRtl in the manifest, Expo Go, a device
    // that ignores the preference - a second attempt would just loop the user
    // through an endless restart.
    const marker = shouldBeRTL ? 'rtl' : 'ltr';
    const alreadyAttempted = await languageStorage.getDirectionRestartAttempt();

    if (canRestartNatively && alreadyAttempted !== marker) {
      await languageStorage.setDirectionRestartAttempt(marker);
      commitDirectionPreferences(shouldBeRTL);
      if (await restartNow()) return; // app is on its way down
      revertDirectionPreferences();
    }

    // Can't relaunch: keep running in the direction we booted in, which
    // utils/rtl.js compensates for, and let the user choose when to reopen.
    // Only for a language they actually picked - the implicit default shouldn't
    // greet a first launch with a restart prompt.
    if (await languageStorage.hasStoredLanguage()) {
      setDirectionChangeNotice(true);
    }
  };

  const dismissDirectionChangeNotice = () => setDirectionChangeNotice(false);

  // Only ever called from a user tap (the direction-change dialog's "Reopen app"
  // button). This is the one place the native preferences are written, and it
  // writes them for the language the app is about to boot into.
  const restartApp = async () => {
    commitDirectionPreferences(wantsRTL(currentLanguage));
    const ok = await restartNow();
    if (!ok) revertDirectionPreferences();
    return ok;
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
          // Text, icons and alignment follow immediately - utils/rtl.js
          // compensates while the layout is still mirrored the other way. Only
          // the native layout direction has to wait, and it waits by leaving the
          // preferences alone until a relaunch.
          setDirectionChangeNotice(wantsRTL(language) !== SESSION_RTL);
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
