import jwtDecode from 'jwt-decode';

// Token validation cache to avoid repeated decoding
const tokenValidationCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Optimized token validation with caching
 * @param {string} token - The JWT token to validate
 * @returns {Object} Validation result with caching
 */
export const getOptimizedTokenValidation = (token) => {
  if (!token) {
    return { isValid: false, reason: 'NO_TOKEN', decoded: null };
  }

  // Check cache first
  const cacheKey = token.substring(0, 20); // Use first 20 chars as cache key
  const cached = tokenValidationCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    let validationResult;
    
    if (decoded.exp && decoded.exp < currentTime) {
      validationResult = { isValid: false, reason: 'TOKEN_EXPIRED', decoded };
    } else if (decoded.exp && (decoded.exp - currentTime) < 300) { // 5 minutes warning
      validationResult = { isValid: true, reason: 'TOKEN_EXPIRING_SOON', decoded };
    } else {
      validationResult = { isValid: true, reason: 'TOKEN_VALID', decoded };
    }

    // Cache the result
    tokenValidationCache.set(cacheKey, {
      result: validationResult,
      timestamp: Date.now()
    });

    return validationResult;
  } catch (error) {
    console.error('Token validation error:', error);
    return { isValid: false, reason: 'TOKEN_MALFORMED', decoded: null };
  }
};

/**
 * Smart token validation that skips validation for recently validated tokens
 * @param {string} token - The JWT token to validate
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = (token) => {
  const validation = getOptimizedTokenValidation(token);
  return validation.isValid;
};

/**
 * Check if token is expiring soon (optimized)
 * @param {string} token - The JWT token
 * @returns {boolean} True if token expires soon
 */
export const isTokenExpiringSoon = (token) => {
  const validation = getOptimizedTokenValidation(token);
  return validation.reason === 'TOKEN_EXPIRING_SOON';
};

/**
 * Get token expiration time (optimized with caching)
 * @param {string} token - The JWT token
 * @returns {number|null} Expiration time in milliseconds
 */
export const getTokenExpirationTime = (token) => {
  const validation = getOptimizedTokenValidation(token);
  return validation.decoded?.exp ? validation.decoded.exp * 1000 : null;
};

/**
 * Get time remaining until token expires
 * @param {string} token - The JWT token
 * @returns {number} Time remaining in milliseconds
 */
export const getTokenTimeRemaining = (token) => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  
  const currentTime = Date.now();
  const timeRemaining = expirationTime - currentTime;
  
  return Math.max(0, timeRemaining);
};

/**
 * Clear token validation cache
 */
export const clearTokenValidationCache = () => {
  tokenValidationCache.clear();
};

/**
 * Get token refresh timing recommendations
 * @param {string} token - The JWT token
 * @returns {Object} Refresh timing recommendations
 */
export const getTokenRefreshTiming = (token) => {
  const validation = getOptimizedTokenValidation(token);
  
  if (!validation.isValid) {
    return { shouldRefresh: false, timeUntilRefresh: 0, priority: 'none' };
  }

  const timeRemaining = getTokenTimeRemaining(token);
  const totalLifetime = validation.decoded?.exp && validation.decoded?.iat 
    ? (validation.decoded.exp - validation.decoded.iat) * 1000 
    : 4 * 60 * 60 * 1000; // Assume 4 hours default (updated to match new config)

  const remainingPercentage = timeRemaining / totalLifetime;

  if (remainingPercentage > 0.5) {
    return { shouldRefresh: false, timeUntilRefresh: timeRemaining - (totalLifetime * 0.3), priority: 'low' };
  } else if (remainingPercentage > 0.2) {
    return { shouldRefresh: true, timeUntilRefresh: 0, priority: 'medium' };
  } else {
    return { shouldRefresh: true, timeUntilRefresh: 0, priority: 'high' };
  }
};

/**
 * Batch validate multiple tokens efficiently
 * @param {string[]} tokens - Array of tokens to validate
 * @returns {Object[]} Array of validation results
 */
export const batchValidateTokens = (tokens) => {
  return tokens.map(token => getOptimizedTokenValidation(token));
};

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenValidationCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      tokenValidationCache.delete(key);
    }
  }
}, CACHE_DURATION * 2);
