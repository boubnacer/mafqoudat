import jwtDecode from 'jwt-decode';


/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token has expired
    if (decoded.exp && decoded.exp < currentTime) {
      return true;
    }
    
    // Additional check: if token is older than 14 minutes (close to 15min expiry)
    const tokenAge = currentTime - decoded.iat;
    if (tokenAge > 14 * 60) { // 14 minutes in seconds
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token validation error:', error);
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Get token expiration time in milliseconds
 * @param {string} token - The JWT token
 * @returns {number|null} - Expiration time in milliseconds, or null if invalid
 */
export const getTokenExpirationTime = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

/**
 * Get time remaining until token expires in milliseconds
 * @param {string} token - The JWT token
 * @returns {number} - Time remaining in milliseconds, or 0 if expired/invalid
 */
export const getTokenTimeRemaining = (token) => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  
  const currentTime = Date.now();
  const timeRemaining = expirationTime - currentTime;
  
  return Math.max(0, timeRemaining);
};

/**
 * Check if token will expire soon (within the next 2 minutes)
 * @param {string} token - The JWT token
 * @returns {boolean} - True if token expires soon
 */
export const isTokenExpiringSoon = (token) => {
  const timeRemaining = getTokenTimeRemaining(token);
  return timeRemaining < 2 * 60 * 1000; // 2 minutes in milliseconds
};
