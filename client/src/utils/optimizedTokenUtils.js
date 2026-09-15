import jwtDecode from 'jwt-decode';

// Token validation cache to avoid repeated decoding
const tokenValidationCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Token validation, cached briefly to avoid re-decoding on every render.
 * Access tokens are short-lived (30 min by default, see server's
 * JWT_ACCESS_EXPIRES_IN) and rotate on every silent refresh, so both the
 * cache key and the result have to be per-token, not per-session.
 * @param {string} token - The JWT token to validate
 * @returns {Object} Validation result with caching
 */
export const getOptimizedTokenValidation = (token) => {
  if (!token) {
    return { isValid: false, reason: 'NO_TOKEN', decoded: null };
  }

  // Check cache first. The full token is the key - every token this app
  // issues is HS256, so its base64 header ("{"alg":"HS256","typ":"JWT"}")
  // is identical across all of them, and any short shared prefix (the old
  // first-20-chars key) collides every token together. That made this cache
  // hand back one signed-in user's decoded payload - username, role,
  // country - for whoever's token happened to populate the cache first
  // within the 5s window, across a silent refresh or a second account
  // signing in on the same tab.
  const cacheKey = token;
  const cached = tokenValidationCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  try {
    const decoded = jwtDecode(token);

    // isValid intentionally does not check decoded.exp: this app never
    // proactively refreshes before expiry (see useSessionBootstrap's
    // one-shot boot refresh + apiSlice's reactive 401-triggered refresh), so
    // gating selectIsAuthenticated on expiry here would flip an idle tab to
    // "logged out" the moment the 30-minute access token lapses, ahead of
    // the silent refresh that only runs off a real API call.
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
