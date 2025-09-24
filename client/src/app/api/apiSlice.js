import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  setCredentials, 
  logOut, 
  setRefreshing, 
  setRefreshAttempts, 
  setRefreshError,
  clearRefreshState 
} from "../../features/auth/authSlice";

// Refresh attempt tracking to prevent concurrent refresh calls
let refreshPromise = null;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second base delay

// Exponential backoff delay calculation
const getRetryDelay = (attempt) => {
  return Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), 10000); // Max 10 seconds
};

// Reset refresh tracking
const resetRefreshTracking = () => {
  refreshPromise = null;
  refreshAttempts = 0;
};

// Enhanced error handling for network failures
const isNetworkError = (error) => {
  return !error?.status || error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR';
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

    // Set refreshing state
    api.dispatch(setRefreshing(true));
    
    // Start refresh process with exponential backoff
    refreshPromise = performTokenRefresh(api, extraOptions);
    
    try {
      const refreshResult = await refreshPromise;
      
      if (refreshResult?.data) {
        // Reset refresh tracking on success
        resetRefreshTracking();
        
        // Clear refresh state
        api.dispatch(clearRefreshState());
        
        // Store the new token
        api.dispatch(setCredentials({ ...refreshResult.data }));

        // Retry original query with new access token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed
        return handleRefreshFailure(api, refreshResult?.error || { status: 401 });
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return handleRefreshFailure(api, error);
    } finally {
      // Clear the refresh promise and state
      refreshPromise = null;
      api.dispatch(setRefreshing(false));
    }
  }

  return result;
};

// Enhanced token refresh with exponential backoff
const performTokenRefresh = async (api, extraOptions) => {
  for (let attempt = 0; attempt < MAX_REFRESH_ATTEMPTS; attempt++) {
    refreshAttempts = attempt + 1;
    
    // Update refresh attempts in state
    api.dispatch(setRefreshAttempts(refreshAttempts));
    
    try {
      console.log(`Token refresh attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS}`);
      
      const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);
      
      if (refreshResult?.data) {
        console.log('Token refresh successful');
        return refreshResult;
      }
      
      // If refresh fails with 401/403, don't retry
      if (refreshResult?.error?.status === 401 || refreshResult?.error?.status === 403) {
        console.warn('Token refresh failed with authentication error, not retrying');
        return refreshResult;
      }
      
      // For other errors, retry with exponential backoff
      if (attempt < MAX_REFRESH_ATTEMPTS - 1) {
        const delay = getRetryDelay(attempt);
        console.log(`Token refresh failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`Token refresh attempt ${refreshAttempts} failed:`, error);
      
      // If this is a network error and we have retries left, wait and retry
      if (isNetworkError(error) && attempt < MAX_REFRESH_ATTEMPTS - 1) {
        const delay = getRetryDelay(attempt);
        console.log(`Network error during refresh, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If this is the last attempt or not a network error, throw
      if (attempt === MAX_REFRESH_ATTEMPTS - 1) {
        throw error;
      }
    }
  }
  
  // If we get here, all attempts failed
  throw new Error('All token refresh attempts failed');
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "User", "Country", "Dashboard", "FlOptions", "Category"],
  endpoints: (builder) => ({}),
});
