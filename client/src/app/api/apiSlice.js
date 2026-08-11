import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut } from "../../features/auth/authSlice";
import { setMaintenanceMode } from "../state/maintenanceSlice";
import { getVisitorSessionId } from "../../utils/visitorSession";
import { authStorage } from "../../utils/authStorage";

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

// The server runs two different JWT-verification middlewares depending on the route
// (middleware/jwtSecurity.js on /posts, plain middleware/verifyJWT.js everywhere else),
// so neither a single status code nor a single message string reliably means "this
// request failed because the stored session/token is invalid" on its own:
//  - jwtSecurity.js answers 403 (never 401) for a bad token and tags it with one of
//    these `code` values.
//  - the plain verifyJWT.js has no `code` field at all, and always uses the literal
//    message "Forbidden" for an invalid/expired token (401 is always "no token sent").
// Resource-ownership 403s (e.g. "Not authorized to update this post") come from
// controllers after auth already passed, so they carry neither a matching code nor
// that exact message - this is what keeps them from forcing a logout below.
// Kept in sync with mobile/src/api/apiService.js, which does the same triage.
const AUTH_FAILURE_CODES = new Set([
  'NO_TOKEN',
  'TOKEN_REVOKED',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'MALFORMED_TOKEN',
  'TOKEN_NOT_ACTIVE',
  'TOKEN_EARLY',
  'INVALID_PAYLOAD',
  'INCOMPLETE_USER_INFO',
  'TOKEN_TOO_OLD',
  'FUTURE_TOKEN',
  'MISSING_JTI',
]);

// Endpoints where a 401/403 is an expected outcome of the request itself (bad
// credentials on sign-in, an already-invalid token being logged out) rather than a
// sign that an established session has gone bad - must never force a logout.
// /dashboard is here because it is also read by signed-out visitors.
const AUTH_FAILURE_EXCLUDED_PATHS = ['/auth', '/dashboard'];

const isSessionFailure = (url, error) => {
  const path = url || '';
  if (AUTH_FAILURE_EXCLUDED_PATHS.some((excluded) => path.includes(excluded))) {
    return false;
  }

  const { status, data } = error || {};
  if (status === 401) return true;
  return status === 403 && (data?.message === 'Forbidden' || AUTH_FAILURE_CODES.has(data?.code));
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

  // A dead token has to end the session, whichever status the server dressed it up
  // in. Leaving it in localStorage is what produced the worst bug this file has had:
  // the user still looked signed in everywhere in the UI, but every write failed with
  // a bare 403 and nothing ever cleared the token, so they were stuck until they
  // logged out by hand. isSessionFailure() is what separates that from an
  // insufficient-permission 403, which the caller still handles on its own.
  if (isSessionFailure(args.url, result?.error)) {
    debugLog('Session failure detected, clearing stored token', {
      status: result?.error?.status,
      code: result?.error?.data?.code
    });

    // Logout user - no refresh token available with simplified auth
    api.dispatch(logOut({ reason: 'Token expired or invalid' }));

    // Tell the login screen why the user landed there. Set after the dispatch: logOut
    // writes to the same localStorage namespace. ProtectedRoute adds the return URL
    // when it bounces them, and leaves this message in place.
    authStorage.setLoginRedirectMessage('sessionExpiredMessage');

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
  tagTypes: [
    "Post",
    "User",
    "Country",
    "Dashboard",
    "FlOptions",
    "Category",
    "SystemSettings",
    "Notification",
    "PostMatch",
    "NotificationPreferences",
    "BlockedUser",
  ],
  endpoints: (builder) => ({}),
});
