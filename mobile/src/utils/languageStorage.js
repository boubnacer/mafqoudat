/**
 * Language Storage Utilities
 * Uses AsyncStorage for React Native
 * Mirrors: client/src/utils/authStorage.js (languageStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'currentLanguage';
const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];
const DEFAULT_LANGUAGE = 'en';

export const languageStorage = {
  /**
   * Get current language
   * @returns {string} Current language code
   */
  async getCurrentLanguage() {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      return language && SUPPORTED_LANGUAGES.includes(language) 
        ? language 
        : DEFAULT_LANGUAGE;
    } catch (error) {
      console.error('Error getting language:', error);
      return DEFAULT_LANGUAGE;
    }
  },

  /**
   * Set current language
   * @param {string} language - Language code (en, fr, ar)
   * @returns {boolean} Success status
   */
  async setLanguage(language) {
    try {
      if (SUPPORTED_LANGUAGES.includes(language)) {
        await AsyncStorage.setItem(LANGUAGE_KEY, language);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  },

  /**
   * Whether a language has ever been explicitly persisted (as opposed to the
   * in-memory default LanguageContext falls back to). Lets first-launch
   * onboarding distinguish "nothing chosen yet, safe to default to the
   * device locale" from "user already has fr/ar saved, don't override it".
   * @returns {boolean}
   */
  async hasStoredLanguage() {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      return !!language;
    } catch (error) {
      console.error('Error checking stored language:', error);
      return false;
    }
  },

  /**
   * Clear stored language
   */
  async clearLanguage() {
    try {
      await AsyncStorage.removeItem(LANGUAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing language:', error);
      return false;
    }
  },

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  },

  /**
   * Check if language is supported
   */
  isSupportedLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(language);
  },
};

