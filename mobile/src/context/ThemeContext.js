/**
 * Theme Context for Mobile App
 * Resolves the active color scheme from the OS setting (useColorScheme),
 * with an optional 'system' | 'light' | 'dark' override persisted in AsyncStorage.
 * Mirrors: src/context/LanguageContext.js
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, radii, fontSizes } from '../theme/tokens';
import { themeStorage } from '../utils/themeStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme override on mount
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedMode = await themeStorage.getCurrentMode();
        setThemeModeState(savedMode);
      } catch (error) {
        console.error('Error initializing theme:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeTheme();
  }, []);

  /**
   * Set theme override and save to storage
   * @param {string} mode - 'system' | 'light' | 'dark'
   * @returns {boolean} Success status
   */
  const setThemeMode = async (mode) => {
    if (!themeStorage.isSupportedMode(mode)) {
      return false;
    }
    const success = await themeStorage.setMode(mode);
    if (success) {
      setThemeModeState(mode);
    }
    return success;
  };

  const resolvedScheme = themeMode === 'system' ? (systemScheme || 'light') : themeMode;
  const isDark = resolvedScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      themeMode,
      resolvedScheme,
      isDark,
      colors,
      spacing,
      radii,
      fontSizes,
      setThemeMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeMode, resolvedScheme, isDark, colors]
  );

  if (!isInitialized) {
    // Avoids a flash of the wrong theme while the persisted override loads.
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to use theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
