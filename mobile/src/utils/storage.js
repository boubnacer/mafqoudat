/**
 * Secure Storage Utilities
 * For storing sensitive data like JWT tokens
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'userData';
const COUNTRY_KEY = 'currentCountry';

export const storage = {
  // Token storage
  async setToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  },

  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  },

  // User data storage
  async setUserData(userData) {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  },

  async getUserData() {
    try {
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  async removeUserData() {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
      return true;
    } catch (error) {
      console.error('Error removing user data:', error);
      return false;
    }
  },

  // Country storage (using AsyncStorage as it's not sensitive)
  async setCurrentCountry(countryId) {
    try {
      await AsyncStorage.setItem(COUNTRY_KEY, countryId);
      return true;
    } catch (error) {
      console.error('Error storing country:', error);
      return false;
    }
  },

  async getCurrentCountry() {
    try {
      return await AsyncStorage.getItem(COUNTRY_KEY);
    } catch (error) {
      console.error('Error getting country:', error);
      return null;
    }
  },

  async removeCurrentCountry() {
    try {
      await AsyncStorage.removeItem(COUNTRY_KEY);
      return true;
    } catch (error) {
      console.error('Error removing country:', error);
      return false;
    }
  },

  // Clear all stored data
  async clearAll() {
    try {
      await this.removeToken();
      await this.removeUserData();
      await this.removeCurrentCountry();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

