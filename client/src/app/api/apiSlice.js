import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  setCredentials, 
  logOut, 
  setRefreshing, 
  setRefreshAttempts, 
  setRefreshError,
  clearRefreshState 
} from "../../features/auth/authSlice";
import { getOptimizedTokenValidation, getTokenRefreshTiming } from "../../utils/optimizedTokenUtils";
import backgroundTokenRefreshService from "../../services/backgroundTokenRefresh";

// Debug configuration
const DEBUG_AUTH = true;

// Debug logging function
const debugLog = (message, data = null) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔍 [API-SLICE] ${message}`, { timestamp, ...data });
    } else {
      console.log(`🔍 [API-SLICE] ${message} - ${timestamp}`);
    }
  }
};

// Refresh attempt tracking to prevent concurrent refresh calls
let refreshPromise = null;
let refreshAttempts = 0;
let proactiveRefreshTimeout = null;
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second base delay
const PROACTIVE_REFRESH_THRESHOLD = 0.2; // Refresh when 20% of token lifetime remains (48 minutes for 4h token)

// Rate limiting tracking
let rateLimitAttempts = 0;
let rateLimitPromise = null;
const MAX_RATE_LIMIT_ATTEMPTS = 3;
const RATE_LIMIT_BASE_DELAY = 5000; // 5 seconds base delay for rate limiting
const RATE_LIMIT_MAX_DELAY = 20000; // 20 seconds max delay

// Request tracking to prevent duplicate API calls
const activeRequests = new Map();
const REQUEST_DEBOUNCE_TIME = 1000; // 1 second debounce

// Token validation cache to prevent excessive validation calls
let tokenValidationCache = null;
let lastValidationTime = 0;
const VALIDATION_CACHE_DURATION = 30000; // Cache validation for 30 seconds

// Exponential backoff delay calculation
const getRetryDelay = (attempt) => {
  return Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), 10000); // Max 10 seconds
};

// Rate limiting exponential backoff delay calculation
const getRateLimitDelay = (attempt) => {
  return Math.min(RATE_LIMIT_BASE_DELAY * Math.pow(2, attempt), RATE_LIMIT_MAX_DELAY);
};

// Reset refresh tracking
const resetRefreshTracking = () => {
  debugLog('Resetting refresh tracking', {
    previousAttempts: refreshAttempts,
    hadPromise: !!refreshPromise,
    hadTimeout: !!proactiveRefreshTimeout
  });
  
  refreshPromise = null;
  refreshAttempts = 0;
  if (proactiveRefreshTimeout) {
    clearTimeout(proactiveRefreshTimeout);
    proactiveRefreshTimeout = null;
  }
  // Clear validation cache when resetting refresh tracking
  tokenValidationCache = null;
  lastValidationTime = 0;
  
  debugLog('Refresh tracking reset complete');
};

// Reset rate limiting tracking
const resetRateLimitTracking = () => {
  debugLog('Resetting rate limit tracking', {
    previousAttempts: rateLimitAttempts,
    hadPromise: !!rateLimitPromise
  });
  
  rateLimitPromise = null;
  rateLimitAttempts = 0;
  
  debugLog('Rate limit tracking reset complete');
};

// Generate request key for deduplication
const generateRequestKey = (args) => {
  return `${args.method || 'GET'}:${args.url}:${JSON.stringify(args.body || {})}`;
};

// Check if request is already in progress
const isRequestInProgress = (requestKey) => {
  const request = activeRequests.get(requestKey);
  if (!request) return false;
  
  // Check if request is still within debounce time
  const now = Date.now();
  if (now - request.timestamp < REQUEST_DEBOUNCE_TIME) {
    return true;
  }
  
  // Clean up expired request
  activeRequests.delete(requestKey);
  return false;
};

// Track active request
const trackRequest = (requestKey) => {
  activeRequests.set(requestKey, { timestamp: Date.now() });
};

// Clear request tracking
const clearRequest = (requestKey) => {
  activeRequests.delete(requestKey);
};

// Note: Proactive refresh is now handled by the background service
// Debug functions removed to reduce console spam

// Enhanced error handling for network failures
const isNetworkError = (error) => {
  return !error?.status || error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR';
};

// Check if error is a rate limiting error
const isRateLimitError = (error) => {
  return error?.status === 429;
};

// Handle rate limiting with exponential backoff
const handleRateLimitError = async (args, api, extraOptions, error) => {
  debugLog('Handling rate limit error', {
    status: error?.status,
    retryAfter: error?.retryAfter,
    currentAttempts: rateLimitAttempts,
    maxAttempts: MAX_RATE_LIMIT_ATTEMPTS
  });

  // If we already have a rate limit promise in progress, wait for it
  if (rateLimitPromise) {
    debugLog('Rate limit retry already in progress, waiting for completion');
    try {
      await rateLimitPromise;
      // After waiting, retry the original request
      debugLog('Rate limit retry completed, retrying original request');
      return await baseQuery(args, api, extraOptions);
    } catch (retryError) {
      debugLog('Rate limit retry failed', { error: retryError.message });
      return { error: retryError };
    }
  }

  rateLimitAttempts++;
  
  if (rateLimitAttempts > MAX_RATE_LIMIT_ATTEMPTS) {
    debugLog('Max rate limit attempts reached, failing gracefully');
    console.warn('🔄 API SLICE: Max rate limit attempts reached, preserving auth state');
    resetRateLimitTracking();
    
    // Dispatch rate limiting event for UI notification
    const rateLimitEvent = new CustomEvent('rateLimitError', {
      detail: {
        status: 429,
        data: { 
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }
    });
    window.dispatchEvent(rateLimitEvent);
    
    // Don't logout on rate limiting - preserve auth state
    return {
      error: {
        status: 429,
        data: { 
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }
    };
  }

  // Calculate retry delay
  const retryAfter = error?.retryAfter || '900'; // Default 15 minutes
  const serverRetryDelay = parseInt(retryAfter, 10) * 1000;
  const exponentialDelay = getRateLimitDelay(rateLimitAttempts - 1);
  const finalDelay = Math.min(serverRetryDelay, exponentialDelay);

  debugLog('Scheduling rate limit retry', {
    retryAfter,
    serverRetryDelay,
    exponentialDelay,
    finalDelay,
    attempt: rateLimitAttempts
  });

  console.warn(`🔄 API SLICE: Rate limited, retrying after ${Math.round(finalDelay / 1000)} seconds (attempt ${rateLimitAttempts}/${MAX_RATE_LIMIT_ATTEMPTS})`);

  rateLimitPromise = new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        rateLimitPromise = null;
        const result = await baseQuery(args, api, extraOptions);
        
        // If successful, reset rate limit tracking
        if (!result?.error) {
          resetRateLimitTracking();
        }
        
        resolve(result);
      } catch (retryError) {
        rateLimitPromise = null;
        reject(retryError);
      }
    }, finalDelay);
  });

  return rateLimitPromise;
};

// Optimized token validation using cached validation
const validateTokenBeforeRequest = (token) => {
  const now = Date.now();
  
  debugLog('Validating token before request', {
    hasToken: !!token,
    tokenLength: token?.length,
    hasCache: !!tokenValidationCache,
    cacheAge: now - lastValidationTime
  });
  
  // Return cached validation if it's still valid and token hasn't changed
  if (tokenValidationCache && 
      (now - lastValidationTime) < VALIDATION_CACHE_DURATION &&
      tokenValidationCache.token === token) {
    debugLog('Using cached token validation', {
      isValid: tokenValidationCache.validation.isValid,
      reason: tokenValidationCache.validation.reason
    });
    return tokenValidationCache.validation;
  }
  
  // Perform new validation and cache it
  const validation = getOptimizedTokenValidation(token);
  tokenValidationCache = { token, validation };
  lastValidationTime = now;
  
  debugLog('New token validation performed', {
    isValid: validation.isValid,
    reason: validation.reason
  });
  
  return validation;
};

// Enhanced refresh token logic with better error handling and background service integration
const attemptTokenRefresh = async (api) => {
  debugLog('Starting token refresh attempt', {
    currentAttempts: refreshAttempts,
    maxAttempts: MAX_REFRESH_ATTEMPTS,
    hasExistingPromise: !!refreshPromise
  });
  
  // Check if background service is already handling refresh
  if (backgroundTokenRefreshService.isRefreshInProgress()) {
    debugLog('Background service is refreshing, waiting for completion');
    console.log('🔄 API SLICE: Background service is refreshing, waiting for completion');
    const backgroundPromise = backgroundTokenRefreshService.getCurrentRefreshPromise();
    if (backgroundPromise) {
      return backgroundPromise;
    }
  }

  // Check if we already have a refresh in progress
  if (refreshPromise) {
    debugLog('Refresh already in progress, returning existing promise');
    console.log('🔄 API SLICE: Refresh already in progress, returning existing promise');
    return refreshPromise;
  }

  refreshAttempts++;
  
  debugLog('Incremented refresh attempts', { 
    newAttempts: refreshAttempts,
    maxAttempts: MAX_REFRESH_ATTEMPTS 
  });
  
  if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
    debugLog('Max refresh attempts reached, failing');
    console.error('❌ CLIENT REFRESH: Max refresh attempts reached');
    handleRefreshFailure(api, { status: 401, data: { message: 'Max refresh attempts reached' } });
    return Promise.reject(new Error('Max refresh attempts reached'));
  }

  // Set refreshing state
  debugLog('Setting refreshing state to true');
  api.dispatch(setRefreshing(true));
  api.dispatch(setRefreshAttempts(refreshAttempts));

  const refreshUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3500"}/auth/refresh`;
  
  debugLog('Making refresh request', { 
    url: refreshUrl,
    attempt: refreshAttempts 
  });
  
  refreshPromise = fetch(refreshUrl, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      debugLog('Refresh response received', {
        status: response.status,
        ok: response.ok,
        attempt: refreshAttempts
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = { status: response.status, data: errorData };
        
        debugLog('Refresh request failed', {
          status: response.status,
          errorData,
          attempt: refreshAttempts
        });
        
      // Handle 429 rate limiting with retry-after header
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          error.retryAfter = retryAfter;
        }
        debugLog('Rate limit detected in refresh request', {
          retryAfter,
          attempt: refreshAttempts
        });
      }
        
        throw error;
      }
      return response.json();
    })
    .then((data) => {
      debugLog('Refresh request successful', {
        hasAccessToken: !!data.accessToken,
        hasUser: !!data.user,
        attempt: refreshAttempts
      });
      
      // Update credentials
      api.dispatch(setCredentials({ 
        accessToken: data.accessToken, 
        user: data.user 
      }));
      
      // Reset refresh tracking
      resetRefreshTracking();
      
      return data;
    })
    .catch((error) => {
      debugLog('Refresh request caught error', {
        error: error.message,
        status: error?.status,
        attempt: refreshAttempts,
        maxAttempts: MAX_REFRESH_ATTEMPTS
      });
      
      console.error('❌ CLIENT REFRESH: Token refresh failed:', error);
      
      // Handle 429 rate limiting with proper backoff
      if (error?.status === 429) {
        const retryAfter = error.retryAfter || '900'; // Default 15 minutes
        const retryDelay = parseInt(retryAfter, 10) * 1000;
        
        debugLog('Rate limited during refresh, scheduling retry', {
          retryAfter,
          retryDelay,
          attempt: refreshAttempts
        });
        
        console.warn(`🔄 API SLICE: Rate limited during refresh, retrying after ${retryAfter} seconds`);
        
        if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              refreshPromise = null;
              attemptTokenRefresh(api).then(resolve).catch(reject);
            }, retryDelay);
          });
        } else {
          // Don't logout on rate limiting - preserve auth state
          debugLog('Max refresh attempts reached due to rate limiting, preserving auth state');
          console.warn('🔄 API SLICE: Max refresh attempts reached due to rate limiting, preserving auth state');
          resetRefreshTracking();
          api.dispatch(setRefreshing(false));
          throw new Error('Rate limited - too many refresh attempts');
        }
      }
      
      // Calculate retry delay with exponential backoff for other errors
      const retryDelay = getRetryDelay(refreshAttempts - 1);
      
      debugLog('Scheduling retry with exponential backoff', {
        retryDelay,
        attempt: refreshAttempts,
        maxAttempts: MAX_REFRESH_ATTEMPTS
      });
      
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            refreshPromise = null;
            attemptTokenRefresh(api).then(resolve).catch(reject);
          }, retryDelay);
        });
      } else {
        handleRefreshFailure(api, error);
        throw error;
      }
    })
    .finally(() => {
      debugLog('Refresh request finally block - cleaning up');
      refreshPromise = null;
      api.dispatch(setRefreshing(false));
    });

  return refreshPromise;
};

// Cleanup function for failed refresh
const handleRefreshFailure = (api, error) => {
  debugLog('Handling refresh failure', {
    error: error?.message,
    status: error?.status,
    data: error?.data
  });
  
  console.warn('Token refresh failed, logging out user:', error);
  
  // Clear refresh tracking
  resetRefreshTracking();
  
  // Update refresh state
  api.dispatch(setRefreshError(error?.data?.message || 'Token refresh failed'));
  api.dispatch(clearRefreshState());
  
  // Logout user and clear state
  debugLog('Dispatching logout due to refresh failure');
  api.dispatch(logOut());
  localStorage.setItem('isLoggedIn', 'false');
  
  // Enhanced error message based on error type
  const errorMessage = isNetworkError(error) 
    ? "Network error. Please check your connection and try again."
    : "Your session has expired. Please log in again.";
  
  debugLog('Refresh failure handled, returning error response', {
    errorMessage,
    status: error?.status || 401
  });
  
  return {
    error: {
      status: error?.status || 401,
      data: { message: errorMessage }
    }
  };
};

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3500",
  credentials: "include", //important, to send the cookie back to the server along with the token
  timeout: 30000, // 30 seconds timeout for slow connections
  prepareHeaders: (headers, { getState, endpoint }) => {
    // api => api.getState => {getState}
    const token = getState().auth.token;
    
    debugLog('Preparing headers for request', {
      endpoint,
      hasToken: !!token,
      tokenLength: token?.length
    });
    
    // Enhanced token validation before adding to headers
    if (token) {
      const tokenValidation = validateTokenBeforeRequest(token);
      
      if (!tokenValidation.isValid) {
        debugLog('Invalid token detected, not adding to headers', {
          reason: tokenValidation.reason,
          endpoint
        });
        console.warn('Invalid token detected, not adding to headers:', tokenValidation.reason);
        
        // If token is expired, logout the user immediately
        if (tokenValidation.reason === 'TOKEN_EXPIRED') {
          debugLog('Token expired, logging out user');
          console.log('Token expired, logging out user');
          // Dispatch logout action to clear auth state
          getState().dispatch(logOut());
          // Clear localStorage
          localStorage.setItem('isLoggedIn', 'false');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('refreshToken');
        }
        
        // Don't add the token if it's invalid
        return headers;
      }
      
    // Schedule proactive refresh if token is expiring soon
    if (tokenValidation.reason === 'TOKEN_EXPIRING_SOON') {
      // Only log when actually scheduling a refresh, not on every request
      debugLog('Token expiring soon, background service will handle refresh');
      console.log('🔄 PROACTIVE REFRESH: Token expiring soon, background service will handle refresh');
    }
    }
    
    // Only add authorization header for authenticated endpoints
    // Skip for public endpoints like dashboard
    if (token && !endpoint?.includes("getDashboard")) {
      headers.set("authorization", `Bearer ${token}`);
      debugLog('Added authorization header', { endpoint });
    }
    
    // Special case: Always add authorization for report endpoint if we have a token
    if (endpoint === 'submitReport' && token) {
      headers.set("authorization", `Bearer ${token}`);
      debugLog('Added authorization header for submitReport', { endpoint });
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  debugLog('Base query with reauth started', {
    url: args.url,
    method: args.method
  });
  
  // Generate request key for deduplication
  const requestKey = generateRequestKey(args);
  
  // Check if request is already in progress (debouncing)
  if (isRequestInProgress(requestKey)) {
    debugLog('Request already in progress, skipping duplicate', {
      requestKey,
      url: args.url,
      method: args.method
    });
    console.warn(`🔄 API SLICE: Request already in progress, skipping duplicate: ${args.method} ${args.url}`);
    
    // Return a pending promise that will resolve when the original request completes
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isRequestInProgress(requestKey)) {
          clearInterval(checkInterval);
          // Retry the request after debounce period
          setTimeout(() => {
            baseQueryWithReauth(args, api, extraOptions).then(resolve);
          }, REQUEST_DEBOUNCE_TIME);
        }
      }, 100);
    });
  }
  
  // Track this request
  trackRequest(requestKey);
  
  let result;
  try {
    result = await baseQuery(args, api, extraOptions);
  } finally {
    // Clear request tracking
    clearRequest(requestKey);
  }

  debugLog('Base query completed', {
    url: args.url,
    hasError: !!result?.error,
    errorStatus: result?.error?.status,
    errorCode: result?.error?.data?.code
  });

  // Handle 429 rate limiting errors first - don't attempt token refresh
  if (isRateLimitError(result?.error)) {
    debugLog('Rate limit error detected, handling with backoff', {
      status: result?.error?.status,
      retryAfter: result?.error?.retryAfter
    });
    
    // Extract retry-after header if available
    const retryAfter = result?.error?.retryAfter;
    if (retryAfter) {
      result.error.retryAfter = retryAfter;
    }
    
    // Dispatch rate limiting event for UI notification
    const rateLimitEvent = new CustomEvent('rateLimitError', {
      detail: result.error
    });
    window.dispatchEvent(rateLimitEvent);
    
    return await handleRateLimitError(args, api, extraOptions, result.error);
  }

  // Handle both 401 and 403 errors for authenticated routes
  // Skip reauth for public routes like dashboard
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {
    debugLog('Authentication error detected, attempting reauth', {
      status: result?.error?.status,
      code: result?.error?.data?.code,
      hasRefreshPromise: !!refreshPromise
    });
    
    // If we're already refreshing, wait for that to complete
    if (refreshPromise) {
      debugLog('Refresh already in progress, waiting for completion');
      try {
        await refreshPromise;
        // After waiting, retry the original request
        debugLog('Refresh completed, retrying original request');
        result = await baseQuery(args, api, extraOptions);
        return result;
      } catch (error) {
        debugLog('Failed to wait for refresh', { error: error.message });
        console.error('❌ BASE QUERY: Failed to wait for refresh:', error);
        return handleRefreshFailure(api, error);
      }
    }

    // Check if we should attempt refresh based on error code
    const errorCode = result?.error?.data?.code;
    const shouldRefresh = !errorCode || 
      ['TOKEN_EXPIRED', 'TOKEN_TOO_OLD', 'INVALID_TOKEN', 'MALFORMED_TOKEN'].includes(errorCode);

    debugLog('Refresh decision', {
      errorCode,
      shouldRefresh,
      refreshableCodes: ['TOKEN_EXPIRED', 'TOKEN_TOO_OLD', 'INVALID_TOKEN', 'MALFORMED_TOKEN']
    });

    if (shouldRefresh) {
      try {
        debugLog('Attempting token refresh');
        await attemptTokenRefresh(api);
        // Retry the original request with new token
        debugLog('Token refresh successful, retrying original request');
        result = await baseQuery(args, api, extraOptions);
        return result;
      } catch (error) {
        debugLog('Token refresh failed', { error: error.message });
        console.error('❌ BASE QUERY: Token refresh failed:', error);
        return handleRefreshFailure(api, error);
      }
    }
  }

  debugLog('Base query with reauth completed', {
    url: args.url,
    finalResult: !!result,
    hasError: !!result?.error
  });

  return result;
};


export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "User", "Country", "Dashboard", "FlOptions", "Category"],
  endpoints: (builder) => ({}),
});
