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

// Refresh attempt tracking to prevent concurrent refresh calls
let refreshPromise = null;
let refreshAttempts = 0;
let proactiveRefreshTimeout = null;
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second base delay
const PROACTIVE_REFRESH_THRESHOLD = 0.2; // Refresh when 20% of token lifetime remains (48 minutes for 4h token)

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
};

// Schedule proactive token refresh
const scheduleProactiveRefresh = (api, token) => {
  if (proactiveRefreshTimeout) {
    clearTimeout(proactiveRefreshTimeout);
  }

  const refreshTiming = getTokenRefreshTiming(token);
  
  if (refreshTiming.shouldRefresh && refreshTiming.timeUntilRefresh > 0) {
    console.log(`Scheduling proactive token refresh in ${refreshTiming.timeUntilRefresh}ms (priority: ${refreshTiming.priority})`);
    
    proactiveRefreshTimeout = setTimeout(() => {
      console.log('Executing proactive token refresh');
      attemptTokenRefresh(api).catch(error => {
        console.warn('Proactive token refresh failed:', error);
      });
    }, refreshTiming.timeUntilRefresh);
  }
};

// Enhanced error handling for network failures
const isNetworkError = (error) => {
  return !error?.status || error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR';
};

// Optimized token validation using cached validation
const validateTokenBeforeRequest = (token) => {
  return getOptimizedTokenValidation(token);
};

// Enhanced refresh token logic with better error handling
const attemptTokenRefresh = async (api) => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshAttempts++;
  
  if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
    console.error('Max refresh attempts reached');
    handleRefreshFailure(api, { status: 401, data: { message: 'Max refresh attempts reached' } });
    return Promise.reject(new Error('Max refresh attempts reached'));
  }

  console.log(`Attempting token refresh (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);
  
  // Set refreshing state
  api.dispatch(setRefreshing(true));
  api.dispatch(setRefreshAttempts(refreshAttempts));

  refreshPromise = fetch('/auth/refresh', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, data: errorData };
      }
      return response.json();
    })
    .then((data) => {
      console.log('Token refresh successful');
      
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
      console.error('Token refresh failed:', error);
      
      // Calculate retry delay with exponential backoff
      const retryDelay = getRetryDelay(refreshAttempts - 1);
      
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        console.log(`Retrying token refresh in ${retryDelay}ms`);
        
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
        console.warn('Token expiring soon, scheduling proactive refresh');
        scheduleProactiveRefresh({ dispatch: getState().dispatch, getState }, token);
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
  // console.log(args) // request url, method, body
  // console.log(api) // signal, dispatch, getState()
  // console.log(extraOptions) //custom like {shout: true}

  let result = await baseQuery(args, api, extraOptions);

  // Handle both 401 and 403 errors for authenticated routes
  // Skip reauth for public routes like dashboard
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {

    // If we're already refreshing, wait for that to complete
    if (refreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      try {
        await refreshPromise;
        // After waiting, retry the original request
        result = await baseQuery(args, api, extraOptions);
        return result;
      } catch (error) {
        console.error('Failed to wait for refresh:', error);
        return handleRefreshFailure(api, error);
      }
    }

    // Check if we should attempt refresh based on error code
    const errorCode = result?.error?.data?.code;
    const shouldRefresh = !errorCode || 
      ['TOKEN_EXPIRED', 'TOKEN_TOO_OLD', 'INVALID_TOKEN', 'MALFORMED_TOKEN'].includes(errorCode);

    if (shouldRefresh) {
      console.log('Attempting token refresh due to authentication error');
      try {
        await attemptTokenRefresh(api);
        // Retry the original request with new token
        result = await baseQuery(args, api, extraOptions);
        return result;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return handleRefreshFailure(api, error);
      }
    } else {
      // Don't attempt refresh for certain error types
      console.log('Not attempting refresh due to error type:', errorCode);
      return result;
    }
  }

  return result;
};


export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "User", "Country", "Dashboard", "FlOptions", "Category"],
  endpoints: (builder) => ({}),
});
