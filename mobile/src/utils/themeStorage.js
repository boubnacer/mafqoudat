/**
 * Theme Mode Storage Utilities
 * Uses AsyncStorage for React Native
 * Mirrors: src/utils/languageStorage.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'themeMode';
const SUPPORTED_MODES = ['system', 'light', 'dark'];
const DEFAULT_MODE = 'system';

export const themeStorage = {
  /**
   * Get current theme mode
   * @returns {string} Theme mode ('system', 'light', or 'dark')
   */
  async getCurrentMode() {
    try {
      const mode = await AsyncStorage.getItem(THEME_KEY);
      return mode && SUPPORTED_MODES.includes(mode) ? mode : DEFAULT_MODE;
    } catch (error) {
      console.error('Error getting theme mode:', error);
      return DEFAULT_MODE;
    }
  },

  /**
   * Set current theme mode
   * @param {string} mode - Theme mode ('system', 'light', or 'dark')
   * @returns {boolean} Success status
   */
  async setMode(mode) {
    try {
      if (SUPPORTED_MODES.includes(mode)) {
        await AsyncStorage.setItem(THEME_KEY, mode);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting theme mode:', error);
      return false;
    }
  },

  /**
   * Get supported theme modes
   */
  getSupportedModes() {
    return SUPPORTED_MODES;
  },

  /**
   * Check if theme mode is supported
   */
  isSupportedMode(mode) {
    return SUPPORTED_MODES.includes(mode);
  },
};
