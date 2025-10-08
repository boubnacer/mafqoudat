/**
 * Authentication State Cleanup Utility
 * 
 * This utility provides comprehensive state cleanup functionality for
 * authentication failures, ensuring proper cleanup of Redux state,
 * localStorage, cookies, and navigation.
 */

import { store } from '../app/store';
import { authStorage } from './authStorage';
import { performLogout } from './logoutUtils';
import authErrorHandler from './authErrorHandler';

/**
 * Authentication State Cleanup Manager
 */
class AuthStateCleanupManager {
  constructor() {
    this.isCleaningUp = false;
    this.cleanupCallbacks = new Set();
  }

  /**
   * Add cleanup callback
   * @param {Function} callback - Cleanup callback function
   */
  addCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove cleanup callback
   * @param {Function} callback - Cleanup callback function
   */
  removeCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Execute all cleanup callbacks
   */
  async executeCleanupCallbacks() {
    const promises = Array.from(this.cleanupCallbacks).map(async (callback) => {
      try {
        await callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Comprehensive state cleanup for authentication failures
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async performComprehensiveCleanup(options = {}) {
    if (this.isCleaningUp) {
      console.warn('State cleanup already in progress, skipping duplicate cleanup');
      return { success: false, reason: 'cleanup_in_progress' };
    }

    this.isCleaningUp = true;

    try {
      const {
        clearReduxState = true,
        clearLocalStorage = true,
        clearCookies = true,
        clearSessionStorage = true,
        performLogout = true,
        clearApiCache = true,
        clearErrorState = true,
        preserveLanguage = true
      } = options;


      const cleanupResults = {
        reduxState: false,
        localStorage: false,
        cookies: false,
        sessionStorage: false,
        logout: false,
        apiCache: false,
        errorState: false,
        customCallbacks: false
      };

      // 1. Clear Redux state
      if (clearReduxState) {
        cleanupResults.reduxState = await this.clearReduxState();
      }

      // 2. Clear localStorage (preserve language if requested)
      if (clearLocalStorage) {
        cleanupResults.localStorage = await this.clearLocalStorage(preserveLanguage);
      }

      // 3. Clear sessionStorage
      if (clearSessionStorage) {
        cleanupResults.sessionStorage = await this.clearSessionStorage();
      }

      // 4. Clear cookies
      if (clearCookies) {
        cleanupResults.cookies = await this.clearCookies();
      }

      // 5. Perform logout
      if (performLogout) {
        cleanupResults.logout = await this.performLogoutCleanup();
      }

      // 6. Clear API cache
      if (clearApiCache) {
        cleanupResults.apiCache = await this.clearApiCache();
      }

      // 7. Clear error state
      if (clearErrorState) {
        cleanupResults.errorState = await this.clearErrorState();
      }

      // 8. Execute custom cleanup callbacks
      cleanupResults.customCallbacks = await this.executeCleanupCallbacks();


      return {
        success: true,
        results: cleanupResults,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error during auth state cleanup:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Clear Redux state
   * @returns {Promise<boolean>} Success status
   */
  async clearReduxState() {
    try {
      // Dispatch logout action to clear auth state
      store.dispatch({ type: 'auth/logOut' });
      
      // Clear any other auth-related state
      store.dispatch({ type: 'auth/clearAuth' });
      
      // Reset API state
      store.dispatch({ type: 'api/resetApiState' });
      
      return true;
    } catch (error) {
      console.error('Failed to clear Redux state:', error);
      return false;
    }
  }

  /**
   * Clear localStorage while preserving language settings
   * @param {boolean} preserveLanguage - Whether to preserve language settings
   * @returns {Promise<boolean>} Success status
   */
  async clearLocalStorage(preserveLanguage = true) {
    try {
      const languageData = preserveLanguage ? {
        language: localStorage.getItem('language'),
        app_language: localStorage.getItem('app_language'),
        currentLanguage: localStorage.getItem('currentLanguage')
      } : {};

      // Clear all localStorage
      localStorage.clear();

      // Restore language data if requested
      if (preserveLanguage) {
        Object.entries(languageData).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Clear sessionStorage
   * @returns {Promise<boolean>} Success status
   */
  async clearSessionStorage() {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      return false;
    }
  }

  /**
   * Clear cookies
   * @returns {Promise<boolean>} Success status
   */
  async clearCookies() {
    try {
      // Clear auth-related cookies
      const authCookies = ['jwt', 'accessToken', 'authToken'];
      
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      });

      return true;
    } catch (error) {
      console.error('Failed to clear cookies:', error);
      return false;
    }
  }

  /**
   * Perform logout cleanup
   * @returns {Promise<boolean>} Success status
   */
  async performLogoutCleanup() {
    try {
      await performLogout({ forceClientSide: true });
      return true;
    } catch (error) {
      console.error('Failed to perform logout cleanup:', error);
      return false;
    }
  }

  /**
   * Clear API cache
   * @returns {Promise<boolean>} Success status
   */
  async clearApiCache() {
    try {
      // Clear RTK Query cache
      store.dispatch({ type: 'api/resetApiState' });
      
      // Clear any other cached data
      if (window.caches) {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => window.caches.delete(cacheName))
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to clear API cache:', error);
      return false;
    }
  }

  /**
   * Clear error state
   * @returns {Promise<boolean>} Success status
   */
  async clearErrorState() {
    try {
      // Clear error handler state
      authErrorHandler.clearListeners();

      return true;
    } catch (error) {
      console.error('Failed to clear error state:', error);
      return false;
    }
  }

  /**
   * Quick cleanup for specific error types
   * @param {string} errorType - Error type
   * @returns {Promise<Object>} Cleanup result
   */
  async performQuickCleanup(errorType) {
    const cleanupOptions = {
      clearReduxState: true,
      clearLocalStorage: false, // Preserve user data for quick cleanup
      clearCookies: true,
      clearSessionStorage: false,
      performLogout: false, // Don't perform full logout for quick cleanup
      clearApiCache: false,
      clearErrorState: true,
      preserveLanguage: true
    };

    return await this.performComprehensiveCleanup(cleanupOptions);
  }

  /**
   * Full cleanup for critical errors (account locked, token invalid, etc.)
   * @returns {Promise<Object>} Cleanup result
   */
  async performFullCleanup() {
    const cleanupOptions = {
      clearReduxState: true,
      clearLocalStorage: true,
      clearCookies: true,
      clearSessionStorage: true,
      performLogout: true,
      clearApiCache: true,
      clearErrorState: true,
      preserveLanguage: true
    };

    return await this.performComprehensiveCleanup(cleanupOptions);
  }
}

// Create singleton instance
const authStateCleanup = new AuthStateCleanupManager();

/**
 * Navigation utility for auth failures
 */
export const authNavigation = {
  /**
   * Navigate to login with proper cleanup
   * @param {Object} options - Navigation options
   */
  async navigateToLogin(options = {}) {
    const { 
      preserveRedirectUrl = false,
      redirectUrl = null,
      cleanupState = true,
      showMessage = true
    } = options;

    try {
      if (cleanupState) {
        await authStateCleanup.performQuickCleanup();
      }

      if (preserveRedirectUrl && !redirectUrl) {
        authStorage.setRedirectAfterLogin(window.location.pathname);
      } else if (redirectUrl) {
        authStorage.setRedirectAfterLogin(redirectUrl);
      }

      if (showMessage) {
      }

      window.location.href = '/login';
    } catch (error) {
      console.error('Error navigating to login:', error);
      // Fallback navigation
      window.location.href = '/login';
    }
  },

  /**
   * Navigate to home with proper cleanup
   * @param {Object} options - Navigation options
   */
  async navigateToHome(options = {}) {
    const { cleanupState = true } = options;

    try {
      if (cleanupState) {
        await authStateCleanup.performQuickCleanup();
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Error navigating to home:', error);
      window.location.href = '/';
    }
  },

  /**
   * Force page refresh with cleanup
   * @param {Object} options - Refresh options
   */
  async forceRefresh(options = {}) {
    const { cleanupState = false, delay = 0 } = options;

    try {
      if (cleanupState) {
        await authStateCleanup.performQuickCleanup();
      }

      if (delay > 0) {
        setTimeout(() => {
          window.location.reload();
        }, delay);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error during force refresh:', error);
      window.location.reload();
    }
  }
};

// Export both the class and singleton instance
export { AuthStateCleanupManager };
export default authStateCleanup;
