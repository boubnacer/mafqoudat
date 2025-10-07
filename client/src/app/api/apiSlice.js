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

// Refresh attempt tracking to prevent concurrent refresh calls
let refreshPromise = null;
let refreshAttempts = 0;
let proactiveRefreshTimeout = null;
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second base delay
const PROACTIVE_REFRESH_THRESHOLD = 0.2; // Refresh when 20% of token lifetime remains (48 minutes for 4h token)

// Token validation cache to prevent excessive validation calls
let tokenValidationCache = null;
let lastValidationTime = 0;
const VALIDATION_CACHE_DURATION = 30000; // Cache validation for 30 seconds

// Exponential backoff delay calculation
const getRetryDelay = (attempt) => {
  return Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), 10000); // Max 10 seconds
};

// Reset refresh tracking
const resetRefreshTracking = () => {
  refreshPromise = null;
  refreshAttempts = 0;
  if (proactiveRefreshTimeout) {
    clearTimeout(proactiveRefreshTimeout);
    proactiveRefreshTimeout = null;
  }
  // Clear validation cache when resetting refresh tracking
  tokenValidationCache = null;
  lastValidationTime = 0;
};

// Note: Proactive refresh is now handled by the background service
// Debug functions removed to reduce console spam

// Enhanced error handling for network failures
const isNetworkError = (error) => {
  return !error?.status || error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR';
};

// Optimized token validation using cached validation
const validateTokenBeforeRequest = (token) => {
  const now = Date.now();
  
  // Return cached validation if it's still valid and token hasn't changed
  if (tokenValidationCache && 
      (now - lastValidationTime) < VALIDATION_CACHE_DURATION &&
      tokenValidationCache.token === token) {
    return tokenValidationCache.validation;
  }
  
  // Perform new validation and cache it
  const validation = getOptimizedTokenValidation(token);
  tokenValidationCache = { token, validation };
  lastValidationTime = now;
  
  return validation;
};

// Enhanced refresh token logic with better error handling and background service integration
const attemptTokenRefresh = async (api) => {
  // Check if background service is already handling refresh
  if (backgroundTokenRefreshService.isRefreshInProgress()) {
    console.log('🔄 API SLICE: Background service is refreshing, waiting for completion');
    const backgroundPromise = backgroundTokenRefreshService.getCurrentRefreshPromise();
    if (backgroundPromise) {
      return backgroundPromise;
    }
  }

  // Check if we already have a refresh in progress
  if (refreshPromise) {
    console.log('🔄 API SLICE: Refresh already in progress, returning existing promise');
    return refreshPromise;
  }

  refreshAttempts++;
  
  if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
    console.error('❌ CLIENT REFRESH: Max refresh attempts reached');
    handleRefreshFailure(api, { status: 401, data: { message: 'Max refresh attempts reached' } });
    return Promise.reject(new Error('Max refresh attempts reached'));
  }

  // Set refreshing state
  api.dispatch(setRefreshing(true));
  api.dispatch(setRefreshAttempts(refreshAttempts));

  const refreshUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3500"}/auth/refresh`;
  refreshPromise = fetch(refreshUrl, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = { status: response.status, data: errorData };
        
        // Handle 429 rate limiting with retry-after header
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          if (retryAfter) {
            error.retryAfter = retryAfter;
          }
        }
        
        throw error;
      }
      return response.json();
    })
    .then((data) => {
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
      console.error('❌ CLIENT REFRESH: Token refresh failed:', error);
      
      // Handle 429 rate limiting with proper backoff
      if (error?.status === 429) {
        const retryAfter = error.retryAfter || '900'; // Default 15 minutes
        const retryDelay = parseInt(retryAfter, 10) * 1000;
        
        console.warn(`🔄 API SLICE: Rate limited, retrying after ${retryAfter} seconds`);
        
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
      }
      
      // Calculate retry delay with exponential backoff for other errors
      const retryDelay = getRetryDelay(refreshAttempts - 1);
      
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
      refreshPromise = null;
      api.dispatch(setRefreshing(false));
    });

  return refreshPromise;
};

// Cleanup function for failed refresh
const handleRefreshFailure = (api, error) => {
  console.warn('Token refresh failed, logging out user:', error);
  
  // Clear refresh tracking
  resetRefreshTracking();
  
  // Update refresh state
  api.dispatch(setRefreshError(error?.data?.message || 'Token refresh failed'));
  api.dispatch(clearRefreshState());
  
  // Logout user and clear state
  api.dispatch(logOut());
  localStorage.setItem('isLoggedIn', 'false');
  
  // Enhanced error message based on error type
  const errorMessage = isNetworkError(error) 
    ? "Network error. Please check your connection and try again."
    : "Your session has expired. Please log in again.";
  
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
    
    // Enhanced token validation before adding to headers
    if (token) {
      const tokenValidation = validateTokenBeforeRequest(token);
      
      if (!tokenValidation.isValid) {
        console.warn('Invalid token detected, not adding to headers:', tokenValidation.reason);
        
        // If token is expired, logout the user immediately
        if (tokenValidation.reason === 'TOKEN_EXPIRED') {
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
      console.log('🔄 PROACTIVE REFRESH: Token expiring soon, background service will handle refresh');
    }
    }
    
    // Only add authorization header for authenticated endpoints
    // Skip for public endpoints like dashboard
    if (token && !endpoint?.includes("getDashboard")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    
    // Special case: Always add authorization for report endpoint if we have a token
    if (endpoint === 'submitReport' && token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle both 401 and 403 errors for authenticated routes
  // Skip reauth for public routes like dashboard
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {
    // If we're already refreshing, wait for that to complete
    if (refreshPromise) {
      try {
        await refreshPromise;
        // After waiting, retry the original request
        result = await baseQuery(args, api, extraOptions);
        return result;
      } catch (error) {
        console.error('❌ BASE QUERY: Failed to wait for refresh:', error);
        return handleRefreshFailure(api, error);
      }
    }

    // Check if we should attempt refresh based on error code
    const errorCode = result?.error?.data?.code;
    const shouldRefresh = !errorCode || 
      ['TOKEN_EXPIRED', 'TOKEN_TOO_OLD', 'INVALID_TOKEN', 'MALFORMED_TOKEN'].includes(errorCode);

    if (shouldRefresh) {
      try {
        await attemptTokenRefresh(api);
        // Retry the original request with new token
        result = await baseQuery(args, api, extraOptions);
        return result;
      } catch (error) {
        console.error('❌ BASE QUERY: Token refresh failed:', error);
        return handleRefreshFailure(api, error);
      }
    }
  }

  return result;
};


export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "User", "Country", "Dashboard", "FlOptions", "Category"],
  endpoints: (builder) => ({}),
});
