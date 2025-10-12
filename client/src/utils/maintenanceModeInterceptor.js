/**
 * Maintenance Mode Interceptor for Axios
 * Detects 503 maintenance mode responses and updates Redux state
 */

import { setMaintenanceMode } from '../app/state/maintenanceSlice';

/**
 * Setup maintenance mode interceptor for an Axios instance
 * @param {Object} axiosInstance - The axios instance to add the interceptor to
 * @param {Object} store - Redux store instance
 */
export const setupMaintenanceModeInterceptor = (axiosInstance, store) => {
  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      // Success response - return as is
      return response;
    },
    (error) => {
      // Check if the error is a 503 maintenance mode response
      if (error.response?.status === 503) {
        const data = error.response.data;
        
        // Check if it's a maintenance mode response
        if (data?.maintenanceMode === true) {
          console.log('🔧 Maintenance mode detected from API:', data);
          
          // Dispatch action to show maintenance mode
          store.dispatch(setMaintenanceMode({
            isActive: true,
            message: data.message || "We're currently performing scheduled maintenance.",
            estimatedReturn: data.estimatedReturn || 'soon'
          }));
          
          // Add a flag to the error so components can handle it differently if needed
          error.maintenanceMode = true;
        }
      }
      
      // Reject the promise with the error
      return Promise.reject(error);
    }
  );
  
  console.log('✅ Maintenance mode interceptor installed');
};

/**
 * Check if an error is a maintenance mode error
 * @param {Object} error - The error object to check
 * @returns {boolean} - True if it's a maintenance mode error
 */
export const isMaintenanceModeError = (error) => {
  return (
    error?.response?.status === 503 &&
    error?.response?.data?.maintenanceMode === true
  );
};

/**
 * Extract maintenance mode details from an error
 * @param {Object} error - The error object
 * @returns {Object|null} - Maintenance mode details or null
 */
export const extractMaintenanceDetails = (error) => {
  if (!isMaintenanceModeError(error)) {
    return null;
  }
  
  return {
    message: error.response.data.message,
    estimatedReturn: error.response.data.estimatedReturn,
    isActive: true
  };
};

