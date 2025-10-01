/**
 * Language Refetch Utilities
 * 
 * This utility provides functions to handle RTK Query refetching
 * when the language changes, ensuring all language-dependent data
 * is updated smoothly without page refresh.
 */

import { store } from '../app/store';
import { apiSlice } from '../app/api/apiSlice';

/**
 * Language-dependent endpoint configurations
 */
export const LANGUAGE_DEPENDENT_ENDPOINTS = {
  // Posts and dashboard
  getPosts: { tags: ['Post'], priority: 'high' },
  getDashboard: { tags: ['Dashboard'], priority: 'high' },
  getPost: { tags: ['Post'], priority: 'high' },
  
  // Dependencies
  getCountries: { tags: ['Country'], priority: 'medium' },
  getCategories: { tags: ['Category'], priority: 'medium' },
  getflOptions: { tags: ['Dependencies'], priority: 'medium' },
  getCities: { tags: ['City'], priority: 'medium' },
  
  // Search endpoints
  searchCountries: { tags: ['Country'], priority: 'low' },
};

/**
 * Trigger refetch for all language-dependent RTK Query endpoints
 * @param {string} language - New language code
 * @param {Object} options - Refetch options
 * @param {boolean} options.forceRefetch - Force refetch even if data exists
 * @param {string} options.priority - Only refetch endpoints with this priority or higher
 */
export const triggerLanguageDependentRefetch = (language, options = {}) => {
  const { forceRefetch = false, priority = 'low' } = options;
  
  try {
    // Check if store and API slice are available
    if (!store) {
      console.warn('🌐 [LANGUAGE-REFETCH] Store not available');
      return;
    }
    
    if (!apiSlice || !apiSlice.util) {
      console.warn('🌐 [LANGUAGE-REFETCH] API slice or util not available');
      return;
    }
    
    // Get the current store state to verify API slice is properly initialized
    const storeState = store.getState();
    const apiState = storeState[apiSlice.reducerPath];
    
    if (!apiState) {
      console.warn('🌐 [LANGUAGE-REFETCH] API state not found in store under path:', apiSlice.reducerPath);
      return;
    }
    
    // Priority levels
    const priorityLevels = { low: 1, medium: 2, high: 3 };
    const currentPriority = priorityLevels[priority] || 1;
    
    // Collect all tags to invalidate
    const tagsToInvalidate = [];
    
    // Process each endpoint
    Object.entries(LANGUAGE_DEPENDENT_ENDPOINTS).forEach(([endpointName, config]) => {
      const endpointPriority = priorityLevels[config.priority] || 1;
      
      // Only process endpoints with sufficient priority
      if (endpointPriority >= currentPriority) {
        tagsToInvalidate.push(...config.tags.map(tag => ({ type: tag, id: 'LIST' })));
      }
    });
    
    // Remove duplicates
    const uniqueTags = tagsToInvalidate.filter((tag, index, self) => 
      index === self.findIndex(t => t.type === tag.type && t.id === tag.id)
    );
    
    // Invalidate tags to trigger refetch
    if (uniqueTags.length > 0) {
      try {
        // Use the correct RTK Query method to invalidate tags
        store.dispatch(apiSlice.util.invalidateTags(uniqueTags));
        
      } catch (dispatchError) {
        console.error('🌐 [LANGUAGE-REFETCH] Error dispatching invalidateTags:', dispatchError);
        // Fallback: try to invalidate tags individually
        uniqueTags.forEach(tag => {
          try {
            store.dispatch(apiSlice.util.invalidateTags([tag]));
          } catch (individualError) {
            console.error('🌐 [LANGUAGE-REFETCH] Failed to invalidate individual tag:', tag, individualError);
          }
        });
      }
    }
    
    // Force refetch specific queries if requested
    if (forceRefetch) {
      forceRefetchLanguageQueries(language);
    }
  } catch (error) {
    console.error('🌐 [LANGUAGE-REFETCH] Error triggering refetch:', error);
    // Provide fallback behavior
    console.log('🌐 [LANGUAGE-REFETCH] Attempting fallback refetch method...');
    fallbackLanguageRefetch(language);
  }
};

/**
 * Force refetch specific language-dependent queries using correct RTK Query methods
 * @param {string} language - New language code
 */
export const forceRefetchLanguageQueries = (language) => {
  try {
    // Check if store and API slice are available
    if (!store || !apiSlice || !apiSlice.util) {
      console.warn('🌐 [LANGUAGE-REFETCH] Store or API slice not available for force refetch');
      return;
    }
    
    // Get all active queries from the store
    const storeState = store.getState();
    const apiState = storeState[apiSlice.reducerPath];
    
    if (!apiState || !apiState.queries) {
      console.warn('🌐 [LANGUAGE-REFETCH] API state or queries not available');
      return;
    }
    
    const activeQueries = apiState.queries;
    
    // Collect language-dependent query keys for refetching
    const languageDependentQueryKeys = [];
    
    // Find language-dependent queries
    Object.entries(activeQueries).forEach(([queryKey, queryState]) => {
      if (queryState && queryState.status === 'fulfilled') {
        // Check if this is a language-dependent query
        const isLanguageDependent = Object.keys(LANGUAGE_DEPENDENT_ENDPOINTS).some(endpoint => 
          queryKey.includes(endpoint)
        );
        
        if (isLanguageDependent) {
          languageDependentQueryKeys.push(queryKey);
        }
      }
    });
    
    // Use invalidateTags to trigger refetch (this is the standard RTK Query approach)
    if (languageDependentQueryKeys.length > 0) {
      try {
        // Get all tags that need to be invalidated
        const tagsToInvalidate = [];
        Object.values(LANGUAGE_DEPENDENT_ENDPOINTS).forEach(config => {
          tagsToInvalidate.push(...config.tags.map(tag => ({ type: tag, id: 'LIST' })));
        });
        
        // Remove duplicates
        const uniqueTags = tagsToInvalidate.filter((tag, index, self) => 
          index === self.findIndex(t => t.type === tag.type && t.id === tag.id)
        );
        
        // Invalidate tags to trigger refetch
        store.dispatch(apiSlice.util.invalidateTags(uniqueTags));
      } catch (error) {
        console.warn('🌐 [LANGUAGE-REFETCH] Failed to invalidate tags:', error);
      }
    }
  } catch (error) {
    console.error('🌐 [LANGUAGE-REFETCH] Error force refetching queries:', error);
  }
};

/**
 * Get language-dependent query parameters
 * @param {string} language - Language code
 * @param {Object} additionalParams - Additional parameters
 * @returns {Object} Query parameters with language
 */
export const getLanguageQueryParams = (language, additionalParams = {}) => {
  return {
    language: language || 'en',
    ...additionalParams
  };
};

/**
 * Check if a query is language-dependent
 * @param {string} queryKey - Query key to check
 * @returns {boolean} True if query is language-dependent
 */
export const isLanguageDependentQuery = (queryKey) => {
  return Object.keys(LANGUAGE_DEPENDENT_ENDPOINTS).some(endpoint => 
    queryKey.includes(endpoint)
  );
};

/**
 * Fallback refetch method when main refetch fails
 * @param {string} language - Language code
 */
export const fallbackLanguageRefetch = (language) => {
  try {
    console.log('🌐 [LANGUAGE-REFETCH] Using fallback refetch method for language:', language);
    
    // Simple fallback: just dispatch a custom event that components can listen to
    const fallbackEvent = new CustomEvent('languageRefetchFallback', {
      detail: { language, timestamp: Date.now() }
    });
    window.dispatchEvent(fallbackEvent);
    
    console.log('🌐 [LANGUAGE-REFETCH] Fallback event dispatched');
  } catch (error) {
    console.error('🌐 [LANGUAGE-REFETCH] Fallback refetch also failed:', error);
  }
};

/**
 * Debounced refetch function to prevent excessive API calls
 */
let refetchTimeout = null;
export const debouncedLanguageRefetch = (language, options = {}) => {
  if (refetchTimeout) {
    clearTimeout(refetchTimeout);
  }
  
  refetchTimeout = setTimeout(() => {
    triggerLanguageDependentRefetch(language, options);
    refetchTimeout = null;
  }, 300); // 300ms debounce
};

/**
 * Refetch using correct RTK Query methods
 * @param {string} language - Language code
 * @param {Object} options - Refetch options
 * @returns {Promise<boolean>} Success status
 */
export const refetchWithCorrectRTKMethods = async (language, options = {}) => {
  try {
    // Check if store and API slice are available
    if (!store || !apiSlice || !apiSlice.util) {
      console.warn('🌐 [LANGUAGE-REFETCH] Store or API slice not available');
      return false;
    }
    
    // Get all tags that need to be invalidated
    const tagsToInvalidate = [];
    Object.values(LANGUAGE_DEPENDENT_ENDPOINTS).forEach(config => {
      tagsToInvalidate.push(...config.tags.map(tag => ({ type: tag, id: 'LIST' })));
    });
    
    // Remove duplicates
    const uniqueTags = tagsToInvalidate.filter((tag, index, self) => 
      index === self.findIndex(t => t.type === tag.type && t.id === tag.id)
    );
    
    if (uniqueTags.length === 0) {
      return true;
    }
    
    // Invalidate tags (this will mark queries as stale and trigger refetch)
    store.dispatch(apiSlice.util.invalidateTags(uniqueTags));
    
    return true;
    
  } catch (error) {
    console.error('🌐 [LANGUAGE-REFETCH] Error using correct RTK Query methods:', error);
    return false;
  }
};

/**
 * Safe refetch function with comprehensive error handling
 * @param {string} language - Language code
 * @param {Object} options - Refetch options
 * @returns {Promise<boolean>} Success status
 */
export const safeLanguageRefetch = async (language, options = {}) => {
  try {
    // First try the correct RTK Query methods
    const correctMethodSuccess = await refetchWithCorrectRTKMethods(language, options);
    
    if (correctMethodSuccess) {
      return true;
    }
    
    // If correct methods fail, try the legacy approach
    triggerLanguageDependentRefetch(language, options);
    
    // Wait a bit to see if it worked
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if store is accessible and API slice is working
    if (store && apiSlice && apiSlice.util) {
      const storeState = store.getState();
      const apiState = storeState[apiSlice.reducerPath];
      
      if (apiState) {
        return true;
      }
    }
    
    // If we get here, something went wrong, try fallback
    fallbackLanguageRefetch(language);
    return false;
    
  } catch (error) {
    console.error('🌐 [LANGUAGE-REFETCH] Safe refetch failed:', error);
    fallbackLanguageRefetch(language);
    return false;
  }
};
