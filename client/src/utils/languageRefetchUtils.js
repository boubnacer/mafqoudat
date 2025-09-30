/**
 * Language Refetch Utilities
 * 
 * This utility provides functions to handle RTK Query refetching
 * when the language changes, ensuring all language-dependent data
 * is updated smoothly without page refresh.
 */

import { store } from '../app/store';

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
    console.log('🌐 [LANGUAGE-REFETCH] Triggering refetch for language:', language, 'with options:', options);
    
    // Get the API slice from the store
    const apiSlice = store.getState().api;
    
    if (!apiSlice) {
      console.warn('🌐 [LANGUAGE-REFETCH] API slice not found in store');
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
        console.log(`🌐 [LANGUAGE-REFETCH] Added ${endpointName} (${config.priority}) to refetch queue`);
      }
    });
    
    // Remove duplicates
    const uniqueTags = tagsToInvalidate.filter((tag, index, self) => 
      index === self.findIndex(t => t.type === tag.type && t.id === tag.id)
    );
    
    // Invalidate tags to trigger refetch
    if (uniqueTags.length > 0) {
      store.dispatch(apiSlice.util.invalidateTags(uniqueTags));
      console.log('🌐 [LANGUAGE-REFETCH] Invalidated tags:', uniqueTags);
    }
    
    // Force refetch specific queries if requested
    if (forceRefetch) {
      forceRefetchLanguageQueries(language);
    }
    
    console.log('🌐 [LANGUAGE-REFETCH] Refetch triggered successfully for language:', language);
  } catch (error) {
    console.error('🌐 [LANGUAGE-REFETCH] Error triggering refetch:', error);
  }
};

/**
 * Force refetch specific language-dependent queries
 * @param {string} language - New language code
 */
export const forceRefetchLanguageQueries = (language) => {
  try {
    console.log('🌐 [LANGUAGE-REFETCH] Force refetching queries for language:', language);
    
    // Get all active queries from the store
    const apiSlice = store.getState().api;
    const activeQueries = apiSlice.queries || {};
    
    // Find and refetch language-dependent queries
    Object.entries(activeQueries).forEach(([queryKey, queryState]) => {
      if (queryState && queryState.status === 'fulfilled') {
        // Check if this is a language-dependent query
        const isLanguageDependent = Object.keys(LANGUAGE_DEPENDENT_ENDPOINTS).some(endpoint => 
          queryKey.includes(endpoint)
        );
        
        if (isLanguageDependent) {
          try {
            // Extract the original query args and update language
            const originalArgs = queryState.originalArgs || {};
            const updatedArgs = { ...originalArgs, language };
            
            // Trigger refetch with updated language
            store.dispatch(apiSlice.util.refetchQuery({
              type: 'query',
              endpoint: queryKey.split('/')[0],
              originalArgs: updatedArgs
            }));
            
            console.log('🌐 [LANGUAGE-REFETCH] Force refetched query:', queryKey);
          } catch (error) {
            console.warn('🌐 [LANGUAGE-REFETCH] Failed to force refetch query:', queryKey, error);
          }
        }
      }
    });
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
