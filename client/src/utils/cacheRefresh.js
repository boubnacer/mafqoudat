// Utility to force refresh RTK Query cache
import { store } from '../app/store';
import { dependencieaApiSlice } from '../features/dependencies/dependenciesApiSlice';

/**
 * Force refresh categories data by invalidating cache and refetching
 * @param {string} language - Language code (default: 'en')
 */
export const forceRefreshCategories = async (language = 'en') => {
  try {
    console.log('🔄 Force refreshing categories cache...');
    
    // Invalidate the cache
    store.dispatch(dependencieaApiSlice.util.invalidateTags(['Category']));
    
    // Force refetch with nocache
    const result = await store.dispatch(
      dependencieaApiSlice.endpoints.getCategories.initiate({
        language,
        active: true,
        nocache: true
      })
    );
    
    console.log('✅ Categories cache refreshed:', result.data?.data?.length || 0, 'categories');
    return result;
  } catch (error) {
    console.error('❌ Error refreshing categories cache:', error);
    throw error;
  }
};

/**
 * Force refresh all dependencies (categories, countries, flOptions)
 * @param {string} language - Language code (default: 'en')
 */
export const forceRefreshAllDependencies = async (language = 'en') => {
  try {
    console.log('🔄 Force refreshing all dependencies cache...');
    
    // Invalidate all dependency caches
    store.dispatch(dependencieaApiSlice.util.invalidateTags([
      'Category', 
      'Country', 
      'Dependencies'
    ]));
    
    // Force refetch all with nocache
    const [categoriesResult, countriesResult, flOptionsResult] = await Promise.all([
      store.dispatch(dependencieaApiSlice.endpoints.getCategories.initiate({
        language,
        active: true,
        nocache: true
      })),
      store.dispatch(dependencieaApiSlice.endpoints.getCountries.initiate({
        language,
        active: true,
        nocache: true
      })),
      store.dispatch(dependencieaApiSlice.endpoints.getflOptions.initiate({
        language,
        active: true,
        nocache: true
      }))
    ]);
    
    console.log('✅ All dependencies cache refreshed:', {
      categories: categoriesResult.data?.data?.length || 0,
      countries: countriesResult.data?.data?.length || 0,
      flOptions: flOptionsResult.data?.data?.length || 0
    });
    
    return {
      categories: categoriesResult,
      countries: countriesResult,
      flOptions: flOptionsResult
    };
  } catch (error) {
    console.error('❌ Error refreshing dependencies cache:', error);
    throw error;
  }
};

/**
 * Clear all RTK Query cache
 */
export const clearAllCache = () => {
  console.log('🗑️ Clearing all RTK Query cache...');
  store.dispatch(dependencieaApiSlice.util.resetApiState());
  console.log('✅ All cache cleared');
};
