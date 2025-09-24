/**
 * Centralized Authentication Storage Utility
 * 
 * This utility provides a single source of truth for all authentication-related
 * localStorage operations, ensuring consistency across the application.
 */

// Authentication-related localStorage keys
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  IS_LOGGED_IN: 'isLoggedIn',
  USER_DATA: 'userData',
  REDIRECT_AFTER_LOGIN: 'redirectAfterLogin',
  REFRESH_TOKEN: 'refreshToken'
};

// Language-related localStorage keys (for page refresh functionality)
export const LANGUAGE_KEYS = {
  LANGUAGE: 'language',
  APP_LANGUAGE: 'app_language',
  CURRENT_LANGUAGE: 'currentLanguage'
};

/**
 * Authentication Storage Manager
 */
class AuthStorageManager {
  /**
   * Set authentication credentials in localStorage
   * @param {Object} credentials - Authentication data
   * @param {string} credentials.accessToken - JWT access token
   * @param {Object} [credentials.user] - User data
   * @param {string} [credentials.refreshToken] - Refresh token
   */
  static setCredentials({ accessToken, user = null, refreshToken = null }) {
    try {
      if (accessToken) {
        localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(AUTH_KEYS.IS_LOGGED_IN, 'true');
      }
      
      if (user) {
        localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(user));
      }
      
      if (refreshToken) {
        localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set authentication credentials:', error);
      return false;
    }
  }

  /**
   * Get authentication state from localStorage
   * @returns {Object} Authentication state
   */
  static getAuthState() {
    try {
      const isLoggedIn = localStorage.getItem(AUTH_KEYS.IS_LOGGED_IN) === 'true';
      const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      const userData = localStorage.getItem(AUTH_KEYS.USER_DATA);
      const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);

      return {
        isLoggedIn: isLoggedIn && !!token, // Ensure isLoggedIn is only true if we have a token
        token: token || null,
        user: userData ? JSON.parse(userData) : null,
        refreshToken: refreshToken || null
      };
    } catch (error) {
      console.error('Failed to get authentication state:', error);
      return {
        isLoggedIn: false,
        token: null,
        user: null,
        refreshToken: null
      };
    }
  }

  /**
   * Clear all authentication data from localStorage
   */
  static clearAuth() {
    try {
      localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_KEYS.IS_LOGGED_IN);
      localStorage.removeItem(AUTH_KEYS.USER_DATA);
      localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN);
      
      return true;
    } catch (error) {
      console.error('Failed to clear authentication data:', error);
      return false;
    }
  }

  /**
   * Set user as logged out (keeps isLoggedIn as false but clears sensitive data)
   */
  static setLoggedOut() {
    try {
      localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_KEYS.USER_DATA);
      localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
      localStorage.setItem(AUTH_KEYS.IS_LOGGED_IN, 'false');
      
      return true;
    } catch (error) {
      console.error('Failed to set logged out state:', error);
      return false;
    }
  }

  /**
   * Update user data in localStorage
   * @param {Object} userData - Updated user data
   */
  static updateUserData(userData) {
    try {
      if (userData) {
        localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update user data:', error);
      return false;
    }
  }

  /**
   * Set redirect URL for after login
   * @param {string} url - URL to redirect to after login
   */
  static setRedirectAfterLogin(url) {
    try {
      if (url) {
        localStorage.setItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN, url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set redirect URL:', error);
      return false;
    }
  }

  /**
   * Get and clear redirect URL
   * @returns {string|null} Redirect URL or null
   */
  static getAndClearRedirectUrl() {
    try {
      const redirectUrl = localStorage.getItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN);
      if (redirectUrl) {
        localStorage.removeItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN);
        return redirectUrl;
      }
      return null;
    } catch (error) {
      console.error('Failed to get redirect URL:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  static isAuthenticated() {
    const authState = this.getAuthState();
    return authState.isLoggedIn && !!authState.token;
  }

  /**
   * Get access token
   * @returns {string|null} Access token or null
   */
  static getAccessToken() {
    try {
      return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get user data
   * @returns {Object|null} User data or null
   */
  static getUserData() {
    try {
      const userData = localStorage.getItem(AUTH_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Verify authentication state persistence after page refresh
   * This method ensures that authentication tokens and user data are properly preserved
   * @returns {Object} Verification result with status and details
   */
  static verifyAuthPersistence() {
    try {
      const authState = this.getAuthState();
      const hasToken = !!authState.token;
      const isLoggedIn = authState.isLoggedIn;
      
      // Check if token is valid (not expired) and extract user data from token
      let tokenValid = false;
      let hasUserData = false;
      let userDataFromToken = null;
      
      if (hasToken) {
        try {
          const decoded = JSON.parse(atob(authState.token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          tokenValid = decoded.exp && decoded.exp > currentTime;
          
          // Check if token contains user data
          if (decoded.UserInfo) {
            hasUserData = true;
            userDataFromToken = decoded.UserInfo;
          }
        } catch (error) {
          console.error('Token validation error:', error);
        }
      }
      
      // For authentication verification, we consider it successful if:
      // 1. We have a valid token
      // 2. User is marked as logged in
      // 3. Token is not expired
      // 4. Token contains user data (either in localStorage or in the token itself)
      const hasUser = !!authState.user || hasUserData;
      const success = hasToken && isLoggedIn && tokenValid && hasUser;
      
      return {
        success,
        details: {
          hasToken,
          hasUser,
          hasUserInStorage: !!authState.user,
          hasUserInToken: hasUserData,
          isLoggedIn,
          tokenValid,
          tokenExpired: hasToken && !tokenValid,
          userDataFromToken
        }
      };
    } catch (error) {
      console.error('Failed to verify auth persistence:', error);
      return {
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Preserve authentication state during language change
   * This method ensures that auth data is not lost during page refresh
   * @returns {boolean} True if preservation was successful
   */
  static preserveAuthDuringLanguageChange() {
    try {
      const authState = this.getAuthState();
      
      // Check if token is valid and contains user data
      let hasUserData = false;
      if (authState.token) {
        try {
          const decoded = JSON.parse(atob(authState.token.split('.')[1]));
          hasUserData = !!decoded.UserInfo;
        } catch (error) {
          console.error('Token validation error during language change:', error);
        }
      }
      
      // Double-check that auth data exists before language change
      const hasUser = !!authState.user || hasUserData;
      if (authState.isLoggedIn && authState.token && hasUser) {
        // Only log in development mode to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.log('Authentication state preserved during language change:', {
            hasToken: !!authState.token,
            hasUser,
            hasUserInStorage: !!authState.user,
            hasUserInToken: hasUserData,
            isLoggedIn: authState.isLoggedIn
          });
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to preserve auth during language change:', error);
      return false;
    }
  }
}

/**
 * Language Storage Manager (for page refresh functionality)
 */
class LanguageStorageManager {
  /**
   * Set language and trigger page refresh if needed
   * @param {string} language - Language code
   * @param {boolean} shouldRefresh - Whether to refresh the page
   */
  static setLanguage(language, shouldRefresh = false) {
    try {
      // Preserve authentication state before language change
      if (shouldRefresh) {
        AuthStorageManager.preserveAuthDuringLanguageChange();
      }
      
      localStorage.setItem(LANGUAGE_KEYS.LANGUAGE, language);
      localStorage.setItem(LANGUAGE_KEYS.APP_LANGUAGE, language);
      localStorage.setItem(LANGUAGE_KEYS.CURRENT_LANGUAGE, language);
      
      if (shouldRefresh) {
        // Add URL parameter to indicate this is a language change refresh
        const url = new URL(window.location);
        url.searchParams.set('lang_changed', 'true');
        
        // Refresh the page to ensure dynamic translations are fetched correctly
        // Authentication state will be preserved in localStorage and restored by PersistLogin
        window.location.href = url.toString();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set language:', error);
      return false;
    }
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  static getCurrentLanguage() {
    try {
      return localStorage.getItem(LANGUAGE_KEYS.LANGUAGE) || 
             localStorage.getItem(LANGUAGE_KEYS.APP_LANGUAGE) || 
             'en';
    } catch (error) {
      console.error('Failed to get current language:', error);
      return 'en';
    }
  }

  /**
   * Clear all language-related localStorage
   */
  static clearLanguageData() {
    try {
      localStorage.removeItem(LANGUAGE_KEYS.LANGUAGE);
      localStorage.removeItem(LANGUAGE_KEYS.APP_LANGUAGE);
      localStorage.removeItem(LANGUAGE_KEYS.CURRENT_LANGUAGE);
      return true;
    } catch (error) {
      console.error('Failed to clear language data:', error);
      return false;
    }
  }
}

// Export the managers
export { AuthStorageManager, LanguageStorageManager };

// Export convenience functions for backward compatibility
export const authStorage = {
  setCredentials: AuthStorageManager.setCredentials.bind(AuthStorageManager),
  getAuthState: AuthStorageManager.getAuthState.bind(AuthStorageManager),
  clearAuth: AuthStorageManager.clearAuth.bind(AuthStorageManager),
  setLoggedOut: AuthStorageManager.setLoggedOut.bind(AuthStorageManager),
  updateUserData: AuthStorageManager.updateUserData.bind(AuthStorageManager),
  setRedirectAfterLogin: AuthStorageManager.setRedirectAfterLogin.bind(AuthStorageManager),
  getAndClearRedirectUrl: AuthStorageManager.getAndClearRedirectUrl.bind(AuthStorageManager),
  isAuthenticated: AuthStorageManager.isAuthenticated.bind(AuthStorageManager),
  getAccessToken: AuthStorageManager.getAccessToken.bind(AuthStorageManager),
  getUserData: AuthStorageManager.getUserData.bind(AuthStorageManager),
  verifyAuthPersistence: AuthStorageManager.verifyAuthPersistence.bind(AuthStorageManager),
  preserveAuthDuringLanguageChange: AuthStorageManager.preserveAuthDuringLanguageChange.bind(AuthStorageManager)
};

export const languageStorage = {
  setLanguage: LanguageStorageManager.setLanguage.bind(LanguageStorageManager),
  getCurrentLanguage: LanguageStorageManager.getCurrentLanguage.bind(LanguageStorageManager),
  clearLanguageData: LanguageStorageManager.clearLanguageData.bind(LanguageStorageManager)
};

// Default export
export default {
  authStorage,
  languageStorage,
  AUTH_KEYS,
  LANGUAGE_KEYS
};
