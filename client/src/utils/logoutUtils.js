/**
 * Robust Logout Utility
 * 
 * This utility provides a comprehensive logout function that handles various scenarios:
 * - Valid tokens (server-side logout with token blacklisting)
 * - Network failures (client-side cleanup)
 * - Always ensures local state is cleared
 */

import { authStorage, decodeTokenPayload } from './authStorage';
import { unsubscribe as unsubscribeFromWebPush } from './webPush';

// Same pattern as refreshClient.js: a plain fetch needs the API origin
// itself, not a relative path - vercel.json only rewrites a handful of
// specific paths, and a wrong one here silently 404s to index.html instead
// of ever reaching the server.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';

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
    // Browser notifications go first, while the session still has a token to
    // authenticate the DELETE with. Skipping it would leave this account's
    // match alerts arriving on a computer the next person signs into - a
    // privacy leak rather than noise, since the copy states what kind of
    // listing it concerns. Never allowed to hold up the logout itself.
    try {
      await unsubscribeFromWebPush();
    } catch (pushError) {
      /* signing out matters more than tidying the subscription */
    }

    // Read the token before clearing local state below - performLocalLogout()
    // wipes it from storage, and the server call needs it in the Authorization
    // header to revoke the right refresh session.
    const accessToken = authStorage.getAccessToken();

    // Always clear local state first to ensure user is logged out immediately
    const localCleanupSuccess = performLocalLogout();

    if (forceClientSide || !localCleanupSuccess) {
      // If forced client-side or local cleanup failed, we're done
      if (onSuccess) onSuccess('Client-side logout completed');
      return true;
    }

    // Attempt server-side logout with the captured token, so the server can
    // revoke its refresh session - otherwise it stays live for the full
    // REFRESH_TOKEN_EXPIRES_IN window even though the client looks logged out.
    // There is no fallback route on the server (no verifyJWT on /auth/logout -
    // see server/routes/authRoutes.js - it authenticates whatever Bearer token
    // is presented itself, so this is the only call needed).
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          // Required by server/middleware/csrfGuard.js on /auth/logout.
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });

      if (response.ok) {
        if (onSuccess) onSuccess('Server-side logout completed');
        return true;
      } else {
        throw new Error(`Server logout failed: ${response.status}`);
      }
    } catch (serverError) {
      console.warn('Server-side logout failed, refresh session may remain live until it expires:', serverError);
      // Local cleanup already succeeded, so the user is logged out here
      // regardless - the server just never got told to revoke its side.
      if (onSuccess) onSuccess('Client-side logout completed (server unavailable)');
      return true;
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

  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Auto-logout if token is expired
 * @returns {Promise<boolean>} - True if auto-logout was performed
 */
export const autoLogoutIfExpired = async () => {
  const token = authStorage.getAccessToken();
  
  if (isTokenExpired(token)) {
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
  return await performLogout({ forceClientSide: true });
};

// Export default logout function for convenience
export default performLogout;
