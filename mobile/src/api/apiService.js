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

// server/middleware/jwtSecurity.js answers 401 with one of these `code` values for
// every "the token you sent cannot be used" case, so status alone is enough to decide
// on current deployments. The 403 arm below is a compatibility fallback for a server
// that predates that change (it answered 403 for a bad token, and the second, weaker
// middleware that used to live in server/middleware/verifyJWT.js sent a bare
// "Forbidden" with no code at all) - a shipped build outlives any one API deploy.
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

// Silent session refresh. Access tokens are short-lived (~30 min) now; the
// long-lived refresh token in SecureStore (mobile's stand-in for the web's
// httpOnly cookie) trades for a fresh one via POST /auth/refresh, which also
// rotates the refresh token. Single-flight: a burst of concurrent 401s shares
// one refresh request, which matters doubly here because rotation makes the
// second concurrent attempt with the same refresh token fail by design.
// Raw axios, not apiClient - the interceptors must never recurse into this.
//
// Legacy bootstrap: a still-valid 30-day token from before the refresh-token
// deploy has no stored refresh token; sending it as a Bearer lets the server
// upgrade it to a real session without re-login (see AuthContext's
// loadStoredAuth, which calls this once at startup for exactly that case).
let refreshPromise = null;
export const refreshSessionTokens = () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const accessToken = await SecureStore.getItemAsync('accessToken');
        if (!refreshToken && !accessToken) return null;

        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { headers, timeout: API_TIMEOUT }
        );

        const data = response.data;
        if (!data?.accessToken) return null;

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        }
        return data.accessToken;
      } catch (error) {
        // Network failure or a refused refresh - the caller decides whether
        // that ends the session (it does only after a real 401).
        return null;
      }
    })();
    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

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
      // First response to a dead access token is a silent refresh + one retry
      // of the original request - _retriedAfterRefresh stops a second lap if
      // the retry itself comes back 401.
      if (!error.config?._retriedAfterRefresh) {
        const newToken = await refreshSessionTokens();
        if (newToken) {
          error.config._retriedAfterRefresh = true;
          error.config.headers = error.config.headers || {};
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(error.config);
        }
      }

      // Refresh unavailable or refused - the session is really over.
      try {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      } catch (storageError) {
        console.error('Error clearing tokens:', storageError);
      }
      authFailureHandler?.();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
