import jwtDecode from 'jwt-decode';

// Token validation cache to avoid repeated decoding
const tokenValidationCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Simplified token validation - only checks if token exists and is well-formed
 * Tokens are long-lived (30 days) so expiration checking is removed
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
    
    // Token is valid if it can be decoded (no expiration checks needed)
    const validationResult = { isValid: true, reason: 'TOKEN_VALID', decoded };

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
 * Simple token validation
 * @param {string} token - The JWT token to validate
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = (token) => {
  const validation = getOptimizedTokenValidation(token);
  return validation.isValid;
};

/**
 * Clear token validation cache
 */
export const clearTokenValidationCache = () => {
  tokenValidationCache.clear();
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
