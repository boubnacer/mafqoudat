/**
 * Centralized Authentication Error Handler
 * 
 * This utility provides comprehensive error handling for authentication-related
 * operations, including error categorization, user feedback, state cleanup,
 * and proper redirects.
 */

import { authStorage } from './authStorage';
import { performLogout } from './logoutUtils';

// Error categories for better user feedback
export const AUTH_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// User-friendly error messages
export const AUTH_ERROR_MESSAGES = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'Retry'
  },
  [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: {
    title: 'Invalid Credentials',
    message: 'The email/phone or password you entered is incorrect. Please try again.',
    action: 'Try Again'
  },
  [AUTH_ERROR_TYPES.TOKEN_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    action: 'Log In'
  },
  [AUTH_ERROR_TYPES.TOKEN_INVALID]: {
    title: 'Invalid Session',
    message: 'Your session is no longer valid. Please log in again.',
    action: 'Log In'
  },
  [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: {
    title: 'Account Locked',
    message: 'Your account has been temporarily locked due to multiple failed login attempts.',
    action: 'Contact Support'
  },
  [AUTH_ERROR_TYPES.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    action: 'Try Again'
  },
  [AUTH_ERROR_TYPES.VALIDATION_ERROR]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Fix Input'
  },
  [AUTH_ERROR_TYPES.RATE_LIMITED]: {
    title: 'Too Many Attempts',
    message: 'Too many login attempts. Please wait a moment before trying again.',
    action: 'Wait'
  },
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Try Again'
  }
};

/**
 * Authentication Error Handler Class
 */
class AuthErrorHandler {
  constructor() {
    this.errorListeners = new Set();
    this.isHandlingError = false;
  }

  /**
   * Categorize error based on status code and error details
   * @param {Object} error - Error object from API
   * @returns {string} Error type category
   */
  categorizeError(error) {
    const status = error?.status || error?.response?.status;
    const message = error?.data?.message || error?.message || '';

    // Network errors
    if (!status || status === 'FETCH_ERROR' || status === 'PARSING_ERROR') {
      return AUTH_ERROR_TYPES.NETWORK_ERROR;
    }

    // Rate limiting
    if (status === 429 || message.toLowerCase().includes('rate limit')) {
      return AUTH_ERROR_TYPES.RATE_LIMITED;
    }

    // Validation errors
    if (status === 400 && (
      message.toLowerCase().includes('validation') ||
      message.toLowerCase().includes('required') ||
      message.toLowerCase().includes('invalid')
    )) {
      return AUTH_ERROR_TYPES.VALIDATION_ERROR;
    }

    // Authentication errors
    if (status === 401) {
      if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('expire')) {
        return AUTH_ERROR_TYPES.TOKEN_EXPIRED;
      }
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('credentials')) {
        return AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
      }
      return AUTH_ERROR_TYPES.TOKEN_INVALID;
    }

    // Forbidden errors
    if (status === 403) {
      if (message.toLowerCase().includes('locked') || message.toLowerCase().includes('blocked')) {
        return AUTH_ERROR_TYPES.ACCOUNT_LOCKED;
      }
      return AUTH_ERROR_TYPES.TOKEN_INVALID;
    }

    // Server errors
    if (status >= 500) {
      return AUTH_ERROR_TYPES.SERVER_ERROR;
    }

    return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * Get user-friendly error message for error type
   * @param {string} errorType - Error type category
   * @param {string} customMessage - Custom error message (optional)
   * @returns {Object} Error message object with title, message, and action
   */
  getErrorMessage(errorType, customMessage = null) {
    const defaultMessage = AUTH_ERROR_MESSAGES[errorType] || AUTH_ERROR_MESSAGES[AUTH_ERROR_TYPES.UNKNOWN_ERROR];
    
    if (customMessage) {
      return {
        ...defaultMessage,
        message: customMessage
      };
    }

    return defaultMessage;
  }

  /**
   * Handle authentication error with proper cleanup and user feedback
   * @param {Object} error - Error object
   * @param {Object} options - Handler options
   * @returns {Object} Processed error information
   */
  async handleAuthError(error, options = {}) {
    if (this.isHandlingError) {
      console.warn('Auth error handler is already processing an error, skipping duplicate');
      return;
    }

    this.isHandlingError = true;

    try {
      const errorType = this.categorizeError(error);
      const errorMessage = this.getErrorMessage(errorType, options.customMessage);
      const shouldCleanupState = options.cleanupState !== false; // Default to true
      const shouldRedirect = options.redirect !== false; // Default to true
      const redirectPath = options.redirectPath || '/login';

      console.error('Auth Error Handler:', {
        errorType,
        originalError: error,
        errorMessage,
        shouldCleanupState,
        shouldRedirect
      });

      // Determine if this error requires immediate logout
      const requiresLogout = this.shouldLogoutOnError(errorType);

      if (requiresLogout && shouldCleanupState) {
        await this.performErrorCleanup();
      }

      // Notify listeners
      this.notifyErrorListeners({
        errorType,
        errorMessage,
        originalError: error,
        requiresLogout,
        shouldRedirect,
        redirectPath
      });

      return {
        errorType,
        errorMessage,
        requiresLogout,
        shouldRedirect,
        redirectPath,
        handled: true
      };
    } catch (handlerError) {
      console.error('Error in auth error handler:', handlerError);
      return {
        errorType: AUTH_ERROR_TYPES.UNKNOWN_ERROR,
        errorMessage: AUTH_ERROR_MESSAGES[AUTH_ERROR_TYPES.UNKNOWN_ERROR],
        requiresLogout: true,
        shouldRedirect: true,
        redirectPath: '/login',
        handled: false
      };
    } finally {
      this.isHandlingError = false;
    }
  }

  /**
   * Determine if error requires immediate logout
   * @param {string} errorType - Error type category
   * @returns {boolean} Whether logout is required
   */
  shouldLogoutOnError(errorType) {
    const logoutRequiredTypes = [
      AUTH_ERROR_TYPES.TOKEN_EXPIRED,
      AUTH_ERROR_TYPES.TOKEN_INVALID,
      AUTH_ERROR_TYPES.ACCOUNT_LOCKED,
      AUTH_ERROR_TYPES.SERVER_ERROR
    ];

    return logoutRequiredTypes.includes(errorType);
  }

  /**
   * Perform cleanup operations when auth error occurs
   */
  async performErrorCleanup() {
    try {
      console.log('Performing auth error cleanup...');
      
      // Clear authentication state
      authStorage.clearAuth();
      
      // Perform logout to clear server-side state
      await performLogout({ forceClientSide: true });
      
      console.log('Auth error cleanup completed');
    } catch (cleanupError) {
      console.error('Error during auth cleanup:', cleanupError);
    }
  }

  /**
   * Add error listener
   * @param {Function} listener - Error listener function
   */
  addErrorListener(listener) {
    this.errorListeners.add(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Error listener function
   */
  removeErrorListener(listener) {
    this.errorListeners.delete(listener);
  }

  /**
   * Notify all error listeners
   * @param {Object} errorInfo - Error information
   */
  notifyErrorListeners(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (listenerError) {
        console.error('Error in auth error listener:', listenerError);
      }
    });
  }

  /**
   * Handle login-specific errors
   * @param {Object} error - Login error
   * @param {Object} options - Handler options
   * @returns {Object} Processed error information
   */
  async handleLoginError(error, options = {}) {
    return await this.handleAuthError(error, {
      ...options,
      cleanupState: false, // Don't cleanup state for login errors
      redirect: false // Don't redirect for login errors
    });
  }

  /**
   * Handle token refresh errors
   * @param {Object} error - Token refresh error
   * @param {Object} options - Handler options
   * @returns {Object} Processed error information
   */
  async handleTokenRefreshError(error, options = {}) {
    return await this.handleAuthError(error, {
      ...options,
      cleanupState: true, // Always cleanup on token refresh failure
      redirect: true, // Always redirect on token refresh failure
      redirectPath: '/login'
    });
  }

  /**
   * Handle API request errors
   * @param {Object} error - API error
   * @param {Object} options - Handler options
   * @returns {Object} Processed error information
   */
  async handleApiError(error, options = {}) {
    return await this.handleAuthError(error, {
      ...options,
      cleanupState: true, // Cleanup state for API errors
      redirect: true, // Redirect for API errors
      redirectPath: '/login'
    });
  }

  /**
   * Clear all error listeners
   */
  clearListeners() {
    this.errorListeners.clear();
  }
}

// Create singleton instance
const authErrorHandler = new AuthErrorHandler();

// Export both the class and singleton instance
export { AuthErrorHandler };
export default authErrorHandler;

// Convenience functions for common error handling scenarios
export const handleAuthError = (error, options) => authErrorHandler.handleAuthError(error, options);
export const handleLoginError = (error, options) => authErrorHandler.handleLoginError(error, options);
export const handleTokenRefreshError = (error, options) => authErrorHandler.handleTokenRefreshError(error, options);
export const handleApiError = (error, options) => authErrorHandler.handleApiError(error, options);
export const categorizeError = (error) => authErrorHandler.categorizeError(error);
export const getErrorMessage = (errorType, customMessage) => authErrorHandler.getErrorMessage(errorType, customMessage);
