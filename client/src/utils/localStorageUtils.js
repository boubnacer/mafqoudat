// LocalStorage utility functions

// Clean up unused localStorage items
export const cleanupLocalStorage = () => {
  const allowedKeys = [
    'accessToken',
    'isLoggedIn',
    'language',
    'currentCountry',
    'globalState', // Added to preserve Redux global state
    'cachedCities' // Added to preserve cached cities for city search
  ];

  // Keys that should be preserved based on pattern (not exact match)
  const preservedPatterns = [
    'viewedNotifications_' // Preserve notification tracking keys
  ];

  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  
  // Remove keys that are not in the allowed list and don't match preserved patterns
  allKeys.forEach(key => {
    if (!allowedKeys.includes(key)) {
      // Check if key matches any preserved pattern
      const shouldPreserve = preservedPatterns.some(pattern => key.startsWith(pattern));
      if (!shouldPreserve) {
        localStorage.removeItem(key);
      }
    }
  });
};

// Get current localStorage state
export const getLocalStorageState = () => {
  const state = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      state[key] = localStorage.getItem(key);
    }
  }
  return state;
};

// Clear all localStorage
export const clearAllLocalStorage = () => {
  localStorage.clear();
};

// Set localStorage item with validation
export const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set localStorage item ${key}:`, error);
    return false;
  }
};

// Get localStorage item with validation
export const getLocalStorageItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get localStorage item ${key}:`, error);
    return null;
  }
};

// Remove localStorage item with validation
export const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage item ${key}:`, error);
    return false;
  }
};

// Initialize localStorage with default values
export const initializeLocalStorage = () => {
  const defaults = {
    isLoggedIn: 'false',
    language: 'en'
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, value);
    }
  });
  
  // Migration: Remove legacy 'theme' key if it exists
  const legacyTheme = localStorage.getItem('theme');
  if (legacyTheme) {
    localStorage.removeItem('theme');
    console.log('Removed legacy theme key from localStorage');
  }
};

// Export cleanup function for immediate use
export default {
  cleanupLocalStorage,
  getLocalStorageState,
  clearAllLocalStorage,
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem,
  initializeLocalStorage
}; 