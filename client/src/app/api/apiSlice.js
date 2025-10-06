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
  console.log('🔄 PROACTIVE REFRESH: Checking if proactive refresh should be scheduled');
  
  if (proactiveRefreshTimeout) {
    console.log('🔄 PROACTIVE REFRESH: Clearing existing timeout');
    clearTimeout(proactiveRefreshTimeout);
  }

  const refreshTiming = getTokenRefreshTiming(token);
  console.log('🔄 PROACTIVE REFRESH: Token timing analysis:', {
    shouldRefresh: refreshTiming.shouldRefresh,
    timeUntilRefresh: refreshTiming.timeUntilRefresh,
    priority: refreshTiming.priority
  });
  
  if (refreshTiming.shouldRefresh && refreshTiming.timeUntilRefresh > 0) {
    console.log(`🔄 PROACTIVE REFRESH: Scheduling proactive token refresh in ${refreshTiming.timeUntilRefresh}ms (priority: ${refreshTiming.priority})`);
    
    proactiveRefreshTimeout = setTimeout(() => {
      console.log('🔄 PROACTIVE REFRESH: Executing proactive token refresh');
      attemptTokenRefresh(api).catch(error => {
        console.warn('❌ PROACTIVE REFRESH: Proactive token refresh failed:', error);
      });
    }, refreshTiming.timeUntilRefresh);
  } else {
    console.log('🔄 PROACTIVE REFRESH: No proactive refresh needed at this time');
  }
};

// Manual refresh test function (for debugging)
window.testRefreshToken = () => {
  console.log('🧪 MANUAL TEST: Testing refresh token endpoint');
  const fullUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3500"}/auth/refresh`;
  console.log('🧪 MANUAL TEST: Full URL:', fullUrl);
  fetch(fullUrl, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    console.log('🧪 MANUAL TEST: Response status:', response.status);
    console.log('🧪 MANUAL TEST: Response headers:', response.headers);
    return response.text();
  })
  .then(text => {
    console.log('🧪 MANUAL TEST: Response text:', text);
    try {
      const json = JSON.parse(text);
      console.log('🧪 MANUAL TEST: Parsed JSON:', json);
    } catch (e) {
      console.log('🧪 MANUAL TEST: Not valid JSON, first 200 chars:', text.substring(0, 200));
    }
  })
  .catch(error => {
    console.log('🧪 MANUAL TEST: Error:', error);
  });
};

// Manual proactive refresh test
window.testProactiveRefresh = () => {
  console.log('🧪 PROACTIVE TEST: Testing proactive refresh mechanism');
  const token = localStorage.getItem('accessToken');
  if (token) {
    console.log('🧪 PROACTIVE TEST: Current token found, testing validation');
    const validation = getOptimizedTokenValidation(token);
    console.log('🧪 PROACTIVE TEST: Token validation:', validation);
    
    if (validation.reason === 'TOKEN_EXPIRING_SOON') {
      console.log('🧪 PROACTIVE TEST: Token is expiring soon, should schedule refresh');
    } else {
      console.log('🧪 PROACTIVE TEST: Token is not expiring soon, reason:', validation.reason);
    }
  } else {
    console.log('🧪 PROACTIVE TEST: No token found in localStorage');
  }
};

// Test full URL directly
window.testFullUrl = () => {
  const fullUrl = 'https://mafqoudat-production.up.railway.app/auth/refresh';
  console.log('🧪 FULL URL TEST: Testing direct server URL:', fullUrl);
  fetch(fullUrl, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    console.log('🧪 FULL URL TEST: Response status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('🧪 FULL URL TEST: Response text (first 200 chars):', text.substring(0, 200));
    try {
      const json = JSON.parse(text);
      console.log('🧪 FULL URL TEST: Parsed JSON:', json);
    } catch (e) {
      console.log('🧪 FULL URL TEST: Not valid JSON');
    }
  })
  .catch(error => {
    console.log('🧪 FULL URL TEST: Error:', error);
  });
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
  console.log('🔄 CLIENT REFRESH: Starting token refresh attempt');
  
  if (refreshPromise) {
    console.log('🔄 CLIENT REFRESH: Refresh already in progress, waiting...');
    return refreshPromise;
  }

  refreshAttempts++;
  console.log(`🔄 CLIENT REFRESH: Attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS}`);
  
  if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
    console.error('❌ CLIENT REFRESH: Max refresh attempts reached');
    handleRefreshFailure(api, { status: 401, data: { message: 'Max refresh attempts reached' } });
    return Promise.reject(new Error('Max refresh attempts reached'));
  }

  console.log(`🔄 CLIENT REFRESH: Attempting token refresh (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);
  
  // Set refreshing state
  api.dispatch(setRefreshing(true));
  api.dispatch(setRefreshAttempts(refreshAttempts));

  const refreshUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3500"}/auth/refresh`;
  console.log('🔄 CLIENT REFRESH: Making fetch request to:', refreshUrl);
  refreshPromise = fetch(refreshUrl, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      console.log('🔄 CLIENT REFRESH: Response received, status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ CLIENT REFRESH: Response not OK, error data:', errorData);
        throw { status: response.status, data: errorData };
      }
      console.log('✅ CLIENT REFRESH: Response OK, parsing JSON...');
      return response.json();
    })
    .then((data) => {
      console.log('✅ CLIENT REFRESH: Token refresh successful');
      console.log('🔄 CLIENT REFRESH: Received data:', {
        hasAccessToken: !!data.accessToken,
        accessTokenLength: data.accessToken?.length,
        hasUser: !!data.user
      });
      
      // Update credentials
      api.dispatch(setCredentials({ 
        accessToken: data.accessToken, 
        user: data.user 
      }));
      console.log('✅ CLIENT REFRESH: Credentials updated in store');
      
      // Reset refresh tracking
      resetRefreshTracking();
      console.log('✅ CLIENT REFRESH: Refresh tracking reset');
      
      return data;
    })
    .catch((error) => {
      console.error('❌ CLIENT REFRESH: Token refresh failed:', error);
      console.log('❌ CLIENT REFRESH: Error details:', {
        status: error.status,
        message: error.data?.message,
        errorType: error.name
      });
      
      // Calculate retry delay with exponential backoff
      const retryDelay = getRetryDelay(refreshAttempts - 1);
      console.log(`🔄 CLIENT REFRESH: Calculated retry delay: ${retryDelay}ms`);
      
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        console.log(`🔄 CLIENT REFRESH: Retrying token refresh in ${retryDelay}ms`);
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            console.log('🔄 CLIENT REFRESH: Retry timeout completed, attempting refresh again');
            refreshPromise = null;
            attemptTokenRefresh(api).then(resolve).catch(reject);
          }, retryDelay);
        });
      } else {
        console.log('❌ CLIENT REFRESH: Max attempts reached, handling refresh failure');
        handleRefreshFailure(api, error);
        throw error;
      }
    })
    .finally(() => {
      console.log('🔄 CLIENT REFRESH: Cleanup - clearing refresh promise and setting refreshing to false');
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
      console.warn('🔄 PROACTIVE REFRESH: Token expiring soon, scheduling proactive refresh');
      scheduleProactiveRefresh({ dispatch: getState().dispatch, getState }, token);
    } else {
      console.log('🔄 PROACTIVE REFRESH: Token validation result:', {
        isValid: tokenValidation.isValid,
        reason: tokenValidation.reason,
        timeRemaining: tokenValidation.timeRemaining
      });
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
  console.log('🔄 BASE QUERY: Processing request:', {
    url: args.url,
    method: args.method || 'GET',
    isPublicRoute: args.url?.includes("/dashboard")
  });

  let result = await baseQuery(args, api, extraOptions);
  console.log('🔄 BASE QUERY: Initial result:', {
    hasError: !!result?.error,
    errorStatus: result?.error?.status,
    errorMessage: result?.error?.data?.message
  });

  // Handle both 401 and 403 errors for authenticated routes
  // Skip reauth for public routes like dashboard
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {
    console.log('🔄 BASE QUERY: Authentication error detected, attempting refresh');

    // If we're already refreshing, wait for that to complete
    if (refreshPromise) {
      console.log('🔄 BASE QUERY: Token refresh already in progress, waiting...');
      try {
        await refreshPromise;
        console.log('🔄 BASE QUERY: Refresh completed, retrying original request');
        // After waiting, retry the original request
        result = await baseQuery(args, api, extraOptions);
        console.log('🔄 BASE QUERY: Retry result:', {
          hasError: !!result?.error,
          errorStatus: result?.error?.status
        });
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

    console.log('🔄 BASE QUERY: Refresh decision:', {
      errorCode,
      shouldRefresh,
      errorStatus: result?.error?.status
    });

    if (shouldRefresh) {
      console.log('🔄 BASE QUERY: Attempting token refresh due to authentication error');
      try {
        await attemptTokenRefresh(api);
        console.log('🔄 BASE QUERY: Token refresh successful, retrying original request');
        // Retry the original request with new token
        result = await baseQuery(args, api, extraOptions);
        console.log('🔄 BASE QUERY: Retry after refresh result:', {
          hasError: !!result?.error,
          errorStatus: result?.error?.status
        });
        return result;
      } catch (error) {
        console.error('❌ BASE QUERY: Token refresh failed:', error);
        return handleRefreshFailure(api, error);
      }
    } else {
      // Don't attempt refresh for certain error types
      console.log('🔄 BASE QUERY: Not attempting refresh due to error type:', errorCode);
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
