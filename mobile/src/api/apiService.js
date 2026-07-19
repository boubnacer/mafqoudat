/**
 * API Service
 * Mirrors the web app's API slice functionality
 * Reference: client/src/app/api/apiSlice.js
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import * as SecureStore from 'expo-secure-store';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bridges from this plain axios module into the React tree: MaintenanceContext and
// AuthContext each register a handler on mount (they're the ones with state to update),
// since this module is instantiated once outside of React and has no state of its own.
let maintenanceHandler = null;
export const setMaintenanceHandler = (handler) => {
  maintenanceHandler = handler;
};

let authFailureHandler = null;
export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

// The server runs two different JWT-verification middlewares depending on the route
// (middleware/jwtSecurity.js on /posts, plain middleware/verifyJWT.js everywhere else),
// so neither a single status code nor a single message string reliably means "this
// request failed because postRoutes.js's session/token is invalid" on its own:
//  - jwtSecurity.js always tags real token failures with one of these `code` values.
//  - the plain verifyJWT.js has no `code` field at all, and always uses the literal
//    message "Forbidden" for an invalid/expired token (401 is always "no token sent").
// Resource-ownership 403s (e.g. "Not authorized to update this post") come from
// controllers after auth already passed, so they carry neither a matching code nor
// that exact message - this is what keeps them from forcing a logout below.
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
// credentials, expired one-shot registration token) rather than a sign that an
// already-established session has gone bad - must never force a logout.
const AUTH_FAILURE_EXCLUDED_PREFIXES = ['/auth'];

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Any successful response is proof maintenance mode (if it was active) has lifted -
    // this is what lets the maintenance retry button clear the overlay without needing
    // a dedicated status-check endpoint.
    maintenanceHandler?.(null);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 503 && data?.maintenanceMode) {
      maintenanceHandler?.({ message: data.message, estimatedReturn: data.estimatedReturn });
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url || '';
    const isExcluded = AUTH_FAILURE_EXCLUDED_PREFIXES.some((prefix) => requestUrl.startsWith(prefix));
    const isAuthFailure =
      status === 401 || (status === 403 && (data?.message === 'Forbidden' || AUTH_FAILURE_CODES.has(data?.code)));

    if (isAuthFailure && !isExcluded) {
      try {
        await SecureStore.deleteItemAsync('accessToken');
      } catch (storageError) {
        console.error('Error clearing token:', storageError);
      }
      authFailureHandler?.();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
