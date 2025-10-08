/**
 * Centralized Authentication Storage Utility
 * 
 * This utility provides a single source of truth for all authentication-related
 * localStorage operations, ensuring consistency across the application.
 */

// Debug configuration
const DEBUG_AUTH = false;

// Debug logging function
const debugLog = (message, data = null) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔍 [AUTH-STORAGE] ${message}`, { timestamp, ...data });
    } else {
      console.log(`🔍 [AUTH-STORAGE] ${message} - ${timestamp}`);
    }
  }
};

// Helper function to extract user data from token
const extractUserFromToken = (token) => {
  try {
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (payload.UserInfo) {
      return {
        _id: payload.UserInfo.userId,
        username: payload.UserInfo.username,
        country: payload.UserInfo.country,
        role: payload.UserInfo.role
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

// Authentication-related localStorage keys
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  IS_LOGGED_IN: 'isLoggedIn',
  USER_DATA: 'userData',
  REDIRECT_AFTER_LOGIN: 'redirectAfterLogin'
};

// Language-related localStorage keys (for page refresh functionality)
// NOTE: We now use ONLY 'language' as the single source of truth
// APP_LANGUAGE and CURRENT_LANGUAGE are deprecated and kept for reference only
export const LANGUAGE_KEYS = {
  LANGUAGE: 'language',
  APP_LANGUAGE: 'app_language', // DEPRECATED - do not use
  CURRENT_LANGUAGE: 'currentLanguage' // DEPRECATED - do not use
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
   * @param {boolean} [credentials.isLoggedIn] - Login status
   */
  static setCredentials({ accessToken, user = null, isLoggedIn = true }) {
    debugLog('=== SET CREDENTIALS STARTED ===');
    debugLog('Input data:', {
      accessToken: accessToken ? 'present' : 'null',
      user: user ? 'present' : 'null',
      isLoggedIn
    });

    try {
      // If no user data provided, extract from token
      let userData = user;
      if (!userData && accessToken) {
        userData = extractUserFromToken(accessToken);
        debugLog('Extracted user data from token', {
          hasUserData: !!userData,
          userId: userData?._id
        });
      }

      if (accessToken) {
        localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(AUTH_KEYS.IS_LOGGED_IN, isLoggedIn.toString());
        debugLog('Access token and login status set in localStorage');
      }
      
      if (userData) {
        localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData));
        debugLog('User data set in localStorage', { userId: userData._id || userData.id });
      }
      
      debugLog('✅ Auth data stored successfully');
      return true;
    } catch (error) {
      debugLog('❌ Error storing auth data:', error);
      console.error('Failed to set authentication credentials:', error);
      return false;
    }
  }

  /**
   * Get authentication state from localStorage
   * @returns {Object} Authentication state
   */
  static getAuthState() {
    debugLog('Getting authentication state from localStorage');
    
    try {
      const isLoggedIn = localStorage.getItem(AUTH_KEYS.IS_LOGGED_IN) === 'true';
      const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      const userData = localStorage.getItem(AUTH_KEYS.USER_DATA);

      // Parse user data from localStorage
      let parsedUserData = null;
      if (userData) {
        try {
          parsedUserData = JSON.parse(userData);
        } catch (error) {
          debugLog('Failed to parse stored user data', { error: error.message });
        }
      }

      // If no user data in localStorage but we have a token, extract from token
      let finalUserData = parsedUserData;
      if (!finalUserData && token) {
        finalUserData = extractUserFromToken(token);
        debugLog('Extracted user data from token in getAuthState', {
          hasUserData: !!finalUserData,
          userId: finalUserData?._id
        });
      }

      const authState = {
        isLoggedIn: isLoggedIn && !!token, // Ensure isLoggedIn is only true if we have a token
        token: token || null,
        user: finalUserData
      };

      debugLog('Retrieved authentication state', {
        isLoggedIn: authState.isLoggedIn,
        hasToken: !!authState.token,
        hasUser: !!authState.user,
        tokenLength: authState.token?.length,
        userId: authState.user?._id || authState.user?.id
      });

      return authState;
    } catch (error) {
      debugLog('Failed to get authentication state', { error: error.message });
      console.error('Failed to get authentication state:', error);
      return {
        isLoggedIn: false,
        token: null,
        user: null
      };
    }
  }

  /**
   * Clear all authentication data from localStorage
   */
  static clearAuth() {
    debugLog('Clearing all authentication data from localStorage');
    
    try {
      localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_KEYS.IS_LOGGED_IN);
      localStorage.removeItem(AUTH_KEYS.USER_DATA);
      localStorage.removeItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN);
      
      debugLog('All authentication data cleared successfully');
      return true;
    } catch (error) {
      debugLog('Failed to clear authentication data', { error: error.message });
      console.error('Failed to clear authentication data:', error);
      return false;
    }
  }

  /**
   * Set user as logged out (keeps isLoggedIn as false but clears sensitive data)
   */
  static setLoggedOut() {
    debugLog('Setting user as logged out');
    
    try {
      localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_KEYS.USER_DATA);
      localStorage.setItem(AUTH_KEYS.IS_LOGGED_IN, 'false');
      
      debugLog('User logged out state set successfully');
      return true;
    } catch (error) {
      debugLog('Failed to set logged out state', { error: error.message });
      console.error('Failed to set logged out state:', error);
      return false;
    }
  }

  /**
   * Update user data in localStorage
   * @param {Object} userData - Updated user data
   */
  static updateUserData(userData) {
    debugLog('Updating user data in localStorage', {
      hasUserData: !!userData,
      userId: userData?.id
    });
    
    try {
      if (userData) {
        localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData));
        debugLog('User data updated successfully');
        return true;
      }
      debugLog('No user data provided, skipping update');
      return false;
    } catch (error) {
      debugLog('Failed to update user data', { error: error.message });
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
    debugLog('Verifying authentication state persistence');
    
    try {
      const authState = this.getAuthState();
      const hasToken = !!authState.token;
      const isLoggedIn = authState.isLoggedIn;
      
      debugLog('Initial auth state check', {
        hasToken,
        isLoggedIn,
        hasUser: !!authState.user
      });
      
      // Check if token is valid (not expired) and extract user data from token
      let tokenValid = false;
      let hasUserData = false;
      let userDataFromToken = null;
      
      if (hasToken) {
        try {
          const decoded = JSON.parse(atob(authState.token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          tokenValid = decoded.exp && decoded.exp > currentTime;
          
          debugLog('Token validation', {
            tokenValid,
            exp: decoded.exp,
            currentTime,
            timeUntilExpiry: decoded.exp - currentTime
          });
          
          // Check if token contains user data
          if (decoded.UserInfo) {
            hasUserData = true;
            userDataFromToken = decoded.UserInfo;
            debugLog('User data found in token', { userId: userDataFromToken.id });
          }
        } catch (error) {
          debugLog('Token validation error', { error: error.message });
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
      
      const result = {
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
      
      debugLog('Auth persistence verification result', result);
      
      return result;
    } catch (error) {
      debugLog('Failed to verify auth persistence', { error: error.message });
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
      let tokenValid = false;
      if (authState.token) {
        try {
          const decoded = JSON.parse(atob(authState.token.split('.')[1]));
          hasUserData = !!decoded.UserInfo;
          
          // Check if token is not expired
          const currentTime = Date.now() / 1000;
          tokenValid = decoded.exp && decoded.exp > currentTime;
        } catch (error) {
          console.error('Token validation error during language change:', error);
        }
      }
      
      // Double-check that auth data exists and token is valid before language change
      const hasUser = !!authState.user || hasUserData;
      if (authState.isLoggedIn && authState.token && hasUser && tokenValid) {
        // Set a flag to indicate that auth state should be preserved
        localStorage.setItem('preserveAuthAfterLanguageChange', 'true');
        return true;
      } else {
        // Clear the preservation flag if auth state is not valid
        localStorage.removeItem('preserveAuthAfterLanguageChange');
        if (process.env.NODE_ENV === 'development') {
          console.warn('Authentication state not preserved during language change:', {
            hasToken: !!authState.token,
            hasUser,
            tokenValid,
            isLoggedIn: authState.isLoggedIn
          });
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to preserve auth during language change:', error);
      return false;
    }
  }
}

/**
 * Language Storage Manager (smooth switching without page refresh)
 */
class LanguageStorageManager {
  /**
   * Set language and trigger smooth context updates
   * Uses ONLY 'language' key as the single source of truth
   * @param {string} language - Language code
   */
  static setLanguage(language) {
    try {
      console.log('🌐 [SMOOTH-SWITCHING] setLanguage called:', { language, currentUrl: window.location.href });
      
      // Validate language
      if (!['en', 'ar', 'fr'].includes(language)) {
        console.error('Invalid language code:', language);
        return false;
      }
      
      // Store language in localStorage using ONLY the unified key
      localStorage.setItem(LANGUAGE_KEYS.LANGUAGE, language);
      
      // Update document attributes immediately
      this.updateDocumentAttributes(language);
      
      // Dispatch custom event to notify components of language change
      const languageChangeEvent = new CustomEvent('languageChanged', {
        detail: { language, timestamp: Date.now() }
      });
      window.dispatchEvent(languageChangeEvent);
      
      console.log('🌐 [SMOOTH-SWITCHING] Language changed successfully:', language);
      return true;
    } catch (error) {
      console.error('Failed to set language:', error);
      return false;
    }
  }

  /**
   * Update document language and RTL/LTR direction
   * @param {string} language - Language code
   */
  static updateDocumentAttributes(language) {
    try {
      // Set document language attribute
      document.documentElement.setAttribute("lang", language);
      
      // Update RTL/LTR direction
      if (language === "ar") {
        document.body.setAttribute("dir", "rtl");
        document.body.style.direction = "rtl";
        document.body.style.textAlign = "right";
      } else {
        document.body.setAttribute("dir", "ltr");
        document.body.style.direction = "ltr";
        document.body.style.textAlign = "left";
      }
      
      console.log('🌐 [SMOOTH-SWITCHING] Document attributes updated for language:', language);
    } catch (error) {
      console.error('Failed to update document attributes:', error);
    }
  }

  /**
   * Get current language
   * Reads ONLY from 'language' key (single source of truth)
   * @returns {string} Current language code
   */
  static getCurrentLanguage() {
    try {
      return localStorage.getItem(LANGUAGE_KEYS.LANGUAGE) || 'en';
    } catch (error) {
      console.error('Failed to get current language:', error);
      return 'en';
    }
  }

  /**
   * Clear all language-related localStorage
   * Also cleans up any deprecated keys that might still exist
   */
  static clearLanguageData() {
    try {
      localStorage.removeItem(LANGUAGE_KEYS.LANGUAGE);
      // Also remove deprecated keys if they exist (cleanup)
      localStorage.removeItem(LANGUAGE_KEYS.APP_LANGUAGE);
      localStorage.removeItem(LANGUAGE_KEYS.CURRENT_LANGUAGE);
      localStorage.removeItem('languageChangeRedirectUrl');
      return true;
    } catch (error) {
      console.error('Failed to clear language data:', error);
      return false;
    }
  }

  /**
   * Get and clear the preserved URL after language change
   * @returns {string|null} The preserved URL or null
   */
  static getAndClearLanguageChangeRedirectUrl() {
    try {
      const redirectUrl = localStorage.getItem('languageChangeRedirectUrl');
      console.log('🌐 Getting preserved URL from localStorage:', redirectUrl);
      
      if (redirectUrl) {
        localStorage.removeItem('languageChangeRedirectUrl');
        console.log('🌐 Returning preserved URL:', redirectUrl);
        return redirectUrl;
      }
      
      console.log('🌐 No preserved URL found, returning null');
      return null;
    } catch (error) {
      console.error('Failed to get language change redirect URL:', error);
      return null;
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
  clearLanguageData: LanguageStorageManager.clearLanguageData.bind(LanguageStorageManager),
  getAndClearLanguageChangeRedirectUrl: LanguageStorageManager.getAndClearLanguageChangeRedirectUrl.bind(LanguageStorageManager)
};

// Default export
export default {
  authStorage,
  languageStorage,
  AUTH_KEYS,
  LANGUAGE_KEYS
};
