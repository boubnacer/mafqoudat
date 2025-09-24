/**
 * Robust Logout Utility
 * 
 * This utility provides a comprehensive logout function that handles various scenarios:
 * - Valid tokens (server-side logout with token blacklisting)
 * - Expired/invalid tokens (fallback logout)
 * - Network failures (client-side cleanup)
 * - Always ensures local state is cleared
 */

import { authStorage } from './authStorage';

/**
 * Comprehensive logout function that handles all scenarios
 * @param {Object} options - Logout options
 * @param {boolean} options.forceClientSide - Force client-side only logout
 * @param {Function} options.onSuccess - Callback for successful logout
 * @param {Function} options.onError - Callback for logout errors
 * @returns {Promise<boolean>} - True if logout was successful
 */
export const performLogout = async (options = {}) => {
  const { 
    forceClientSide = false, 
    onSuccess = null, 
    onError = null 
  } = options;

  try {
    // Always clear local state first to ensure user is logged out immediately
    const localCleanupSuccess = performLocalLogout();
    
    if (forceClientSide || !localCleanupSuccess) {
      // If forced client-side or local cleanup failed, we're done
      if (onSuccess) onSuccess('Client-side logout completed');
      return true;
    }

    // Attempt server-side logout with valid token
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStorage.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('Server-side logout successful');
        if (onSuccess) onSuccess('Server-side logout completed');
        return true;
      } else {
        throw new Error(`Server logout failed: ${response.status}`);
      }
    } catch (serverError) {
      console.warn('Server-side logout failed, attempting fallback:', serverError);
      
      // Attempt fallback logout (no JWT required)
      try {
        const fallbackResponse = await fetch('/api/auth/logout-fallback', {
          method: 'POST',
          credentials: 'include'
        });

        if (fallbackResponse.ok) {
          console.log('Fallback logout successful');
          if (onSuccess) onSuccess('Fallback logout completed');
          return true;
        } else {
          throw new Error(`Fallback logout failed: ${fallbackResponse.status}`);
        }
      } catch (fallbackError) {
        console.warn('Fallback logout also failed:', fallbackError);
        // Even if both server attempts fail, local cleanup was successful
        if (onSuccess) onSuccess('Client-side logout completed (server unavailable)');
        return true;
      }
    }
  } catch (error) {
    console.error('Logout process failed:', error);
    if (onError) onError(error);
    
    // Even if everything fails, ensure local cleanup happens
    performLocalLogout();
    return false;
  }
};

/**
 * Perform local logout cleanup (clear localStorage, etc.)
 * @returns {boolean} - True if cleanup was successful
 */
export const performLocalLogout = () => {
  try {
    // Clear all authentication data
    authStorage.clearAuth();
    
    // Clear any other app-specific data that should be cleared on logout
    localStorage.removeItem('persist:root');
    localStorage.removeItem('persist:auth');
    
    // Clear any cached API data
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('authLogout'));
    }
    
    console.log('Local logout cleanup completed');
    return true;
  } catch (error) {
    console.error('Local logout cleanup failed:', error);
    return false;
  }
};

/**
 * Check if user should be logged out due to token expiration
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if we can't parse it
  }
};

/**
 * Auto-logout if token is expired
 * @returns {Promise<boolean>} - True if auto-logout was performed
 */
export const autoLogoutIfExpired = async () => {
  const token = authStorage.getAccessToken();
  
  if (isTokenExpired(token)) {
    console.log('Token expired, performing auto-logout');
    await performLogout({ forceClientSide: true });
    return true;
  }
  
  return false;
};

/**
 * Force logout (for security purposes, admin actions, etc.)
 * @returns {Promise<boolean>} - True if logout was successful
 */
export const forceLogout = async () => {
  console.log('Force logout initiated');
  return await performLogout({ forceClientSide: true });
};

// Export default logout function for convenience
export default performLogout;
