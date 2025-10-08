import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut } from "../../features/auth/authSlice";

// Debug configuration
const DEBUG_AUTH = false;

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

// Enhanced error handling for network failures
const isNetworkError = (error) => {
  return !error?.status || error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR';
};

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3500",
  credentials: "include", // important, to send the cookie back to the server along with the token
  timeout: 30000, // 30 seconds timeout for slow connections
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = getState().auth.token;
    
    debugLog('Preparing headers for request', {
      endpoint,
      hasToken: !!token,
      tokenLength: token?.length
    });
    
    // Add token to headers if available (tokens are long-lived, no expiration checks needed)
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
  debugLog('Base query started', {
    url: args.url,
    method: args.method
  });
  
  let result = await baseQuery(args, api, extraOptions);

  debugLog('Base query completed', {
    url: args.url,
    hasError: !!result?.error,
    errorStatus: result?.error?.status,
    errorCode: result?.error?.data?.code
  });

  // Handle authentication errors - long-lived tokens should rarely expire
  // If they do, user needs to login again
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {
    debugLog('Authentication error detected, token may be expired', {
      status: result?.error?.status,
      code: result?.error?.data?.code
    });
    
    console.warn('Authentication error - token expired or invalid. Please login again.');
    
    // Logout user - no refresh token available with simplified auth
    api.dispatch(logOut({ reason: 'Token expired or invalid' }));
    
    // Return user-friendly error message
    const errorMessage = isNetworkError(result?.error) 
      ? "Network error. Please check your connection and try again."
      : "Your session has expired. Please log in again.";
    
    return {
      error: {
        status: result?.error?.status || 401,
        data: { message: errorMessage }
      }
    };
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
