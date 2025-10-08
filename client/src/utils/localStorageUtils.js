// LocalStorage utility functions

// Clean up unused localStorage items
export const cleanupLocalStorage = () => {
  const allowedKeys = [
    'accessToken',
    'isLoggedIn',
    'language',
    'theme',
    'currentCountry',
    'globalState' // Added to preserve Redux global state
  ];

  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  
  // Remove keys that are not in the allowed list
  allKeys.forEach(key => {
    if (!allowedKeys.includes(key)) {
      localStorage.removeItem(key);
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
    language: 'en',
    theme: 'light'
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, value);
    }
  });
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