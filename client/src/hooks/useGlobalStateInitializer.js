/**
 * useGlobalStateInitializer Hook
 * React hook to ensure globalState is initialized
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentCountry } from '../app/state';
import { 
  ensureGlobalStateAlwaysExists, 
  ensureGlobalStateWithUserCountry,
  getGlobalState 
} from '../utils/globalStateInitializer';

/**
 * Hook to ensure globalState is always initialized
 * @param {Object} options - Configuration options
 * @returns {Object} - Utilities and state
 */
const useGlobalStateInitializer = (options = {}) => {
  const {
    autoInitialize = true,
    syncWithRedux = true
  } = options;
  
  const dispatch = useDispatch();
  const reduxCountry = useSelector((state) => state.global?.currentCountry);
  const user = useSelector((state) => state.auth?.user);
  
  // Initialize globalState on mount
  useEffect(() => {
    if (autoInitialize) {
      ensureGlobalStateAlwaysExists();
      
      // If user is logged in, ensure country is set
      if (user && user.country) {
        ensureGlobalStateWithUserCountry(user);
        
        // Sync with Redux if needed
        if (syncWithRedux && reduxCountry !== user.country) {
          dispatch(setCurrentCountry({ currentCountry: user.country }));
        }
      }
    }
  }, [autoInitialize, syncWithRedux, user, reduxCountry, dispatch]);
  
  // Function to manually ensure globalState exists
  const ensureGlobalState = useCallback(() => {
    return ensureGlobalStateAlwaysExists();
  }, []);
  
  // Function to set user country in globalState
  const setUserCountry = useCallback((userData) => {
    return ensureGlobalStateWithUserCountry(userData);
  }, []);
  
  // Function to get current globalState
  const getCurrentGlobalState = useCallback(() => {
    return getGlobalState();
  }, []);
  
  return {
    ensureGlobalState,
    setUserCountry,
    getCurrentGlobalState
  };
};

export default useGlobalStateInitializer;

