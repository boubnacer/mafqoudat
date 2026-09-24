// Utility to force refresh RTK Query cache
import { store } from '../app/store';
import { dependencieaApiSlice } from '../features/dependencies/dependenciesApiSlice';
import { postsApiSlice } from '../features/posts/postsApiSlice';

/**
 * Force refresh categories data by invalidating cache and refetching
 * @param {string} language - Language code (default: 'en')
 */
export const forceRefreshCategories = async (language = 'en') => {
  try {
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
export const forceRefreshAllDependencies = async (language = 'en', currentCountry = '') => {
  try {
    // Invalidate all dependency caches
    store.dispatch(dependencieaApiSlice.util.invalidateTags([
      'Category', 
      'Country', 
      'Dependencies'
    ]));
    
    // Force refetch all with nocache
    const ts = Date.now();
    const [categoriesResult, countriesResult, flOptionsResult, dashboardResult] = await Promise.all([
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
      })),
      // Also refresh dashboard with a cache-buster to bypass server cache
      currentCountry
        ? store.dispatch(postsApiSlice.endpoints.getDashboard.initiate({
            currentCountry,
            language,
            nocache: true,
            ts
          }))
        : Promise.resolve(null)
    ]);

    return {
      categories: categoriesResult,
      countries: countriesResult,
      flOptions: flOptionsResult,
      dashboard: dashboardResult
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
  store.dispatch(dependencieaApiSlice.util.resetApiState());
};
