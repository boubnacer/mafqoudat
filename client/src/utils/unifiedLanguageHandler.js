/**
 * Unified Language Change Handler
 * 
 * This utility provides a centralized, consistent approach to handling
 * language changes across all components, eliminating conflicts and
 * ensuring uniform behavior.
 */

import { languageStorage } from './authStorage';
import { triggerLanguageDependentRefetch } from './languageRefetchUtils';

/**
 * Language change options
 */
export const LANGUAGE_CHANGE_OPTIONS = {
  // Loading state management
  showLoadingState: true,
  loadingDuration: 300, // ms
  
  // Refetch options
  refetchPriority: 'medium', // 'high', 'medium', 'low'
  forceRefetch: true,
  
  // Event options
  dispatchEvents: true,
  eventTypes: ['languageChanged', 'languageChange'],
  
  // Callback options
  onStart: null,
  onComplete: null,
  onError: null,
  
  // Debug options
  enableLogging: process.env.NODE_ENV === 'development'
};

/**
 * Unified language change handler
 * @param {string} language - Language code to switch to
 * @param {Object} options - Configuration options
 * @param {Function} options.onStart - Callback when language change starts
 * @param {Function} options.onComplete - Callback when language change completes
 * @param {Function} options.onError - Callback when language change fails
 * @param {boolean} options.showLoadingState - Whether to show loading state
 * @param {string} options.refetchPriority - Priority for RTK Query refetch
 * @param {boolean} options.forceRefetch - Force refetch of all queries
 * @param {boolean} options.dispatchEvents - Whether to dispatch events
 * @param {Array} options.eventTypes - Types of events to dispatch
 * @param {boolean} options.enableLogging - Enable debug logging
 * @returns {Promise<boolean>} Success status
 */
export const unifiedLanguageChange = async (language, options = {}) => {
  const config = { ...LANGUAGE_CHANGE_OPTIONS, ...options };
  
  try {
    if (config.enableLogging) {
      console.log('🌐 [UNIFIED-HANDLER] Starting language change:', { language, config });
    }
    
    // Validate language
    if (!['en', 'ar', 'fr'].includes(language)) {
      throw new Error(`Invalid language code: ${language}`);
    }
    
    // Call onStart callback
    if (config.onStart && typeof config.onStart === 'function') {
      config.onStart(language);
    }
    
    // Show loading state if requested
    let loadingTimeout = null;
    if (config.showLoadingState) {
      // Dispatch loading start event
      if (config.dispatchEvents) {
        window.dispatchEvent(new CustomEvent('languageChangeStart', {
          detail: { language, timestamp: Date.now() }
        }));
      }
      
      // Set loading timeout
      loadingTimeout = setTimeout(() => {
        if (config.dispatchEvents) {
          window.dispatchEvent(new CustomEvent('languageChangeTimeout', {
            detail: { language, timestamp: Date.now() }
          }));
        }
      }, config.loadingDuration);
    }
    
    // Change language using storage utility
    const success = languageStorage.setLanguage(language);
    
    if (!success) {
      throw new Error('Failed to change language in storage');
    }
    
    if (config.enableLogging) {
      console.log('🌐 [UNIFIED-HANDLER] Language changed in storage:', language);
    }
    
    // Trigger RTK Query refetch
    if (config.forceRefetch) {
      triggerLanguageDependentRefetch(language, {
        priority: config.refetchPriority,
        forceRefetch: true
      });
      
      if (config.enableLogging) {
        console.log('🌐 [UNIFIED-HANDLER] RTK Query refetch triggered');
      }
    }
    
    // Dispatch events
    if (config.dispatchEvents) {
      config.eventTypes.forEach(eventType => {
        const event = new CustomEvent(eventType, {
          detail: { 
            language, 
            timestamp: Date.now(),
            source: 'unified-handler'
          }
        });
        window.dispatchEvent(event);
        
        if (config.enableLogging) {
          console.log(`🌐 [UNIFIED-HANDLER] Dispatched ${eventType} event`);
        }
      });
    }
    
    // Clear loading timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    // Dispatch completion event
    if (config.dispatchEvents) {
      window.dispatchEvent(new CustomEvent('languageChangeComplete', {
        detail: { language, timestamp: Date.now() }
      }));
    }
    
    // Call onComplete callback
    if (config.onComplete && typeof config.onComplete === 'function') {
      config.onComplete(language);
    }
    
    if (config.enableLogging) {
      console.log('🌐 [UNIFIED-HANDLER] Language change completed successfully:', language);
    }
    
    return true;
    
  } catch (error) {
    if (config.enableLogging) {
      console.error('🌐 [UNIFIED-HANDLER] Language change failed:', error);
    }
    
    // Dispatch error event
    if (config.dispatchEvents) {
      window.dispatchEvent(new CustomEvent('languageChangeError', {
        detail: { 
          language, 
          error: error.message, 
          timestamp: Date.now() 
        }
      }));
    }
    
    // Call onError callback
    if (config.onError && typeof config.onError === 'function') {
      config.onError(error, language);
    }
    
    return false;
  }
};

/**
 * Quick language change (minimal options)
 * @param {string} language - Language code
 * @returns {Promise<boolean>} Success status
 */
export const quickLanguageChange = (language) => {
  return unifiedLanguageChange(language, {
    showLoadingState: false,
    refetchPriority: 'high',
    forceRefetch: true,
    dispatchEvents: true,
    enableLogging: false
  });
};

/**
 * Language change with loading state
 * @param {string} language - Language code
 * @param {Function} onComplete - Completion callback
 * @returns {Promise<boolean>} Success status
 */
export const languageChangeWithLoading = (language, onComplete = null) => {
  return unifiedLanguageChange(language, {
    showLoadingState: true,
    loadingDuration: 500,
    refetchPriority: 'medium',
    forceRefetch: true,
    dispatchEvents: true,
    onComplete
  });
};

/**
 * Silent language change (no events, minimal logging)
 * @param {string} language - Language code
 * @returns {Promise<boolean>} Success status
 */
export const silentLanguageChange = (language) => {
  return unifiedLanguageChange(language, {
    showLoadingState: false,
    refetchPriority: 'low',
    forceRefetch: false,
    dispatchEvents: false,
    enableLogging: false
  });
};

/**
 * Language change with custom callbacks
 * @param {string} language - Language code
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onStart - Start callback
 * @param {Function} callbacks.onComplete - Complete callback
 * @param {Function} callbacks.onError - Error callback
 * @returns {Promise<boolean>} Success status
 */
export const languageChangeWithCallbacks = (language, callbacks = {}) => {
  return unifiedLanguageChange(language, {
    showLoadingState: true,
    refetchPriority: 'medium',
    forceRefetch: true,
    dispatchEvents: true,
    ...callbacks
  });
};

/**
 * Get current language from storage
 * @returns {string} Current language code
 */
export const getCurrentLanguage = () => {
  return languageStorage.getCurrentLanguage();
};

/**
 * Check if language change is in progress
 * @returns {boolean} True if language change is in progress
 */
export const isLanguageChangeInProgress = () => {
  // This could be enhanced with a global state management
  // For now, we'll use a simple approach
  return document.body.hasAttribute('data-language-changing');
};

/**
 * Set language change in progress flag
 * @param {boolean} inProgress - Whether language change is in progress
 */
export const setLanguageChangeInProgress = (inProgress) => {
  if (inProgress) {
    document.body.setAttribute('data-language-changing', 'true');
  } else {
    document.body.removeAttribute('data-language-changing');
  }
};

/**
 * Language change event listener utilities
 */
export const languageChangeEvents = {
  /**
   * Add language change event listener
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @returns {Function} Cleanup function
   */
  addListener: (eventType, handler) => {
    window.addEventListener(eventType, handler);
    return () => window.removeEventListener(eventType, handler);
  },
  
  /**
   * Remove language change event listener
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   */
  removeListener: (eventType, handler) => {
    window.removeEventListener(eventType, handler);
  },
  
  /**
   * Get all available language change event types
   * @returns {Array} Array of event types
   */
  getEventTypes: () => [
    'languageChangeStart',
    'languageChanged',
    'languageChange',
    'languageChangeComplete',
    'languageChangeError',
    'languageChangeTimeout'
  ]
};

// Export default unified handler
export default unifiedLanguageChange;
