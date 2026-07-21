/**
 * Onboarding Storage Utilities
 * Uses AsyncStorage for React Native
 * Mirrors: src/utils/themeStorage.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export const onboardingStorage = {
  async getHasSeenOnboarding() {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error getting onboarding flag:', error);
      return false;
    }
  },

  async setHasSeenOnboarding() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error setting onboarding flag:', error);
      return false;
    }
  },
};
