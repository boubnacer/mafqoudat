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

// User-friendly error messages with translation support
export const AUTH_ERROR_MESSAGES = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: {
    titleKey: 'networkErrorTitle',
    messageKey: 'networkErrorMessage',
    actionKey: 'retry'
  },
  [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: {
    titleKey: 'invalidCredentialsTitle',
    messageKey: 'invalidCredentialsMessage',
    actionKey: 'retry'
  },
  [AUTH_ERROR_TYPES.TOKEN_EXPIRED]: {
    titleKey: 'sessionExpiredTitle',
    messageKey: 'sessionExpiredMessage',
    actionKey: 'login'
  },
  [AUTH_ERROR_TYPES.TOKEN_INVALID]: {
    titleKey: 'invalidSessionTitle',
    messageKey: 'invalidSessionMessage',
    actionKey: 'login'
  },
  [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: {
    titleKey: 'accountLockedTitle',
    messageKey: 'accountLockedMessage',
    actionKey: 'contactSupport'
  },
  [AUTH_ERROR_TYPES.SERVER_ERROR]: {
    titleKey: 'serverErrorTitle',
    messageKey: 'serverErrorMessage',
    actionKey: 'retry'
  },
  [AUTH_ERROR_TYPES.VALIDATION_ERROR]: {
    titleKey: 'invalidInputTitle',
    messageKey: 'invalidInputMessage',
    actionKey: 'retry'
  },
  [AUTH_ERROR_TYPES.RATE_LIMITED]: {
    titleKey: 'tooManyAttemptsTitle',
    messageKey: 'tooManyAttemptsMessage',
    actionKey: 'retry'
  },
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: {
    titleKey: 'unexpectedErrorTitle',
    messageKey: 'unexpectedErrorMessage',
    actionKey: 'retry'
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
    const code = error?.data?.error?.code || error?.data?.code;

    // Check for auth error codes first (regardless of status)
    if (code) {
      switch (code) {
        case 'INVALID_CREDENTIALS':
          return AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
        case 'TOKEN_EXPIRED':
          return AUTH_ERROR_TYPES.TOKEN_EXPIRED;
        case 'TOKEN_INVALID':
          return AUTH_ERROR_TYPES.TOKEN_INVALID;
        case 'ACCOUNT_LOCKED':
          return AUTH_ERROR_TYPES.ACCOUNT_LOCKED;
        case 'VALIDATION_ERROR':
          return AUTH_ERROR_TYPES.VALIDATION_ERROR;
        case 'RATE_LIMITED':
          return AUTH_ERROR_TYPES.RATE_LIMITED;
        case 'DATABASE_ERROR':
          return AUTH_ERROR_TYPES.SERVER_ERROR;
        default:
          break;
      }
    }

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
      // Check if it's a server error that should be treated as auth error
      if (message.toLowerCase().includes('credentials') || 
          message.toLowerCase().includes('authentication') ||
          message.toLowerCase().includes('unauthorized')) {
        return AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
      }
      return AUTH_ERROR_TYPES.SERVER_ERROR;
    }

    return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * Get user-friendly error message for error type
   * @param {string} errorType - Error type category
   * @param {string} customMessage - Custom error message (optional)
   * @param {Function} t - Translation function (optional)
   * @returns {Object} Error message object with title, message, and action
   */
  getErrorMessage(errorType, customMessage = null, t = null) {
    const defaultMessage = AUTH_ERROR_MESSAGES[errorType] || AUTH_ERROR_MESSAGES[AUTH_ERROR_TYPES.UNKNOWN_ERROR];
    
    // If translation function is provided, use translated messages
    if (t) {
      const translatedMessage = {
        title: t(defaultMessage.titleKey) || defaultMessage.titleKey,
        message: customMessage || t(defaultMessage.messageKey) || defaultMessage.messageKey,
        action: t(defaultMessage.actionKey) || defaultMessage.actionKey
      };
      return translatedMessage;
    }
    
    // Fallback to default messages
    if (customMessage) {
      return {
        title: defaultMessage.titleKey,
        message: customMessage,
        action: defaultMessage.actionKey
      };
    }

    return {
      title: defaultMessage.titleKey,
      message: defaultMessage.messageKey,
      action: defaultMessage.actionKey
    };
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
      const errorMessage = this.getErrorMessage(errorType, options.customMessage, options.t);
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
    const errorType = this.categorizeError(error);
    
    // Determine if cleanup is needed based on error type
    const shouldCleanupState = [
      AUTH_ERROR_TYPES.TOKEN_EXPIRED,
      AUTH_ERROR_TYPES.TOKEN_INVALID,
      AUTH_ERROR_TYPES.ACCOUNT_LOCKED
    ].includes(errorType);
    
    return await this.handleAuthError(error, {
      ...options,
      cleanupState: shouldCleanupState,
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
