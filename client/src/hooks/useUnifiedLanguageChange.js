/**
 * useUnifiedLanguageChange Hook
 * 
 * A React hook that provides easy access to the unified language change handler
 * with consistent behavior across all components.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  unifiedLanguageChange, 
  quickLanguageChange, 
  languageChangeWithLoading,
  languageChangeWithCallbacks,
  getCurrentLanguage,
  isLanguageChangeInProgress,
  setLanguageChangeInProgress,
  languageChangeEvents
} from '../utils/unifiedLanguageHandler';

/**
 * Hook for unified language change handling
 * @param {Object} options - Default options for language changes
 * @returns {Object} Language change utilities and state
 */
export const useUnifiedLanguageChange = (options = {}) => {
  const [isChanging, setIsChanging] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [lastError, setLastError] = useState(null);
  
  // Default options
  const defaultOptions = {
    showLoadingState: true,
    refetchPriority: 'medium',
    forceRefetch: true,
    dispatchEvents: true,
    enableLogging: process.env.NODE_ENV === 'development',
    ...options
  };
  
  /**
   * Change language with unified handler
   * @param {string} language - Language code
   * @param {Object} customOptions - Override options for this change
   * @returns {Promise<boolean>} Success status
   */
  const changeLanguage = useCallback(async (language, customOptions = {}) => {
    const finalOptions = { ...defaultOptions, ...customOptions };
    
    try {
      setIsChanging(true);
      setLastError(null);
      setLanguageChangeInProgress(true);
      
      const success = await unifiedLanguageChange(language, {
        ...finalOptions,
        onStart: (lang) => {
          if (finalOptions.onStart) finalOptions.onStart(lang);
        },
        onComplete: (lang) => {
          setCurrentLanguage(lang);
          if (finalOptions.onComplete) finalOptions.onComplete(lang);
        },
        onError: (error, lang) => {
          setLastError(error);
          if (finalOptions.onError) finalOptions.onError(error, lang);
        }
      });
      
      return success;
    } catch (error) {
      setLastError(error);
      return false;
    } finally {
      setIsChanging(false);
      setLanguageChangeInProgress(false);
    }
  }, [defaultOptions]);
  
  /**
   * Quick language change (minimal options)
   * @param {string} language - Language code
   * @returns {Promise<boolean>} Success status
   */
  const quickChange = useCallback(async (language) => {
    return await changeLanguage(language, {
      showLoadingState: false,
      refetchPriority: 'high',
      enableLogging: false
    });
  }, [changeLanguage]);
  
  /**
   * Language change with loading state
   * @param {string} language - Language code
   * @param {Function} onComplete - Completion callback
   * @returns {Promise<boolean>} Success status
   */
  const changeWithLoading = useCallback(async (language, onComplete = null) => {
    return await changeLanguage(language, {
      showLoadingState: true,
      loadingDuration: 500,
      refetchPriority: 'medium',
      onComplete
    });
  }, [changeLanguage]);
  
  /**
   * Silent language change (no events, minimal logging)
   * @param {string} language - Language code
   * @returns {Promise<boolean>} Success status
   */
  const silentChange = useCallback(async (language) => {
    return await changeLanguage(language, {
      showLoadingState: false,
      refetchPriority: 'low',
      forceRefetch: false,
      dispatchEvents: false,
      enableLogging: false
    });
  }, [changeLanguage]);
  
  // Listen for language change events to update current language
  useEffect(() => {
    const handleLanguageChanged = (event) => {
      if (event.detail && event.detail.language) {
        setCurrentLanguage(event.detail.language);
      }
    };
    
    const handleLanguageChangeStart = () => {
      setIsChanging(true);
    };
    
    const handleLanguageChangeComplete = () => {
      setIsChanging(false);
    };
    
    const handleLanguageChangeError = (event) => {
      setIsChanging(false);
      if (event.detail && event.detail.error) {
        setLastError(new Error(event.detail.error));
      }
    };
    
    // Add event listeners
    const cleanup1 = languageChangeEvents.addListener('languageChanged', handleLanguageChanged);
    const cleanup2 = languageChangeEvents.addListener('languageChangeStart', handleLanguageChangeStart);
    const cleanup3 = languageChangeEvents.addListener('languageChangeComplete', handleLanguageChangeComplete);
    const cleanup4 = languageChangeEvents.addListener('languageChangeError', handleLanguageChangeError);
    
    // Cleanup function
    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
    };
  }, []);
  
  // Update current language on mount
  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
  }, []);
  
  return {
    // State
    currentLanguage,
    isChanging,
    lastError,
    
    // Actions
    changeLanguage,
    quickChange,
    changeWithLoading,
    silentChange,
    
    // Utilities
    getCurrentLanguage,
    isLanguageChangeInProgress,
    
    // Event utilities
    addEventListener: languageChangeEvents.addListener,
    removeEventListener: languageChangeEvents.removeListener,
    getEventTypes: languageChangeEvents.getEventTypes
  };
};

/**
 * Hook for simple language change (most common use case)
 * @returns {Object} Simple language change utilities
 */
export const useSimpleLanguageChange = () => {
  const { currentLanguage, changeLanguage, isChanging } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: 'medium',
    enableLogging: false
  });
  
  return {
    currentLanguage,
    changeLanguage,
    isChanging
  };
};

/**
 * Hook for language change with loading states
 * @returns {Object} Language change utilities with loading states
 */
export const useLanguageChangeWithLoading = () => {
  return useUnifiedLanguageChange({
    showLoadingState: true,
    loadingDuration: 500,
    refetchPriority: 'medium',
    enableLogging: process.env.NODE_ENV === 'development'
  });
};

export default useUnifiedLanguageChange;
