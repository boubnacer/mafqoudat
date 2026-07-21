import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut } from "../../features/auth/authSlice";
import { setMaintenanceMode } from "../state/maintenanceSlice";
import { getVisitorSessionId } from "../../utils/visitorSession";

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
  prepareHeaders: async (headers, { getState, endpoint }) => {
    const token = getState().auth.token;
    
    debugLog('Preparing headers for request', {
      endpoint,
      hasToken: !!token,
      tokenLength: token?.length
    });
    
    // Add token to headers if available (tokens are long-lived, no expiration checks needed)
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
      debugLog('Added authorization header', { endpoint });
    }
    
    // Add visitor session ID header for cross-origin tracking
    // Always get from localStorage - it should be set synchronously
    const visitorSessionId = getVisitorSessionId();
    if (visitorSessionId) {
      headers.set("X-Visitor-Session", visitorSessionId);
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
  
  // Sync visitor session from response headers (if available)
  // Note: RTK Query doesn't expose raw response, so we'll handle this differently
  // For now, the session ID is sent in headers on every request

  debugLog('Base query completed', {
    url: args.url,
    hasError: !!result?.error,
    errorStatus: result?.error?.status,
    errorCode: result?.error?.data?.code
  });

  // Check for maintenance mode from ANY 503 response
  // This ensures maintenance mode is detected immediately from any blocked API call
  if (result?.error?.status === 503 && result?.error?.data?.maintenanceMode === true) {
    // Dispatch maintenance mode to Redux
    api.dispatch(setMaintenanceMode({
      isActive: true,
      message: result.error.data.message || "We're currently performing scheduled maintenance.",
      estimatedReturn: result.error.data.estimatedReturn || 'soon'
    }));
    
    // Return the error so the query fails gracefully
    return result;
  }

  // Handle authentication errors - long-lived tokens should rarely expire
  // If they do, user needs to login again
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {
    debugLog('Authentication error detected, token may be expired', {
      status: result?.error?.status,
      code: result?.error?.data?.code
    });
    
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
  tagTypes: ["Post", "User", "Country", "Dashboard", "FlOptions", "Category", "SystemSettings"],
  endpoints: (builder) => ({}),
});
