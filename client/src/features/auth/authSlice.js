import { createSlice } from "@reduxjs/toolkit";
import { authStorage } from "../../utils/authStorage";
import { getOptimizedTokenValidation } from "../../utils/optimizedTokenUtils";

// Debug configuration
const DEBUG_AUTH = true;

// Debug logging function
const debugLog = (message, data = null) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔍 [AUTH-SLICE] ${message}`, { timestamp, ...data });
    } else {
      console.log(`🔍 [AUTH-SLICE] ${message} - ${timestamp}`);
    }
  }
};

// Get initial state from localStorage using centralized auth utility
const getInitialState = () => {
  debugLog('Getting initial state from localStorage');
  const authState = authStorage.getAuthState();
  
  debugLog('Retrieved auth state from storage', {
    hasToken: !!authState.token,
    isLoggedIn: authState.isLoggedIn,
    hasUser: !!authState.user,
    tokenLength: authState.token?.length
  });
  
  // Validate token if it exists
  if (authState.token) {
    const tokenValidation = getOptimizedTokenValidation(authState.token);
    debugLog('Token validation result', {
      isValid: tokenValidation.isValid,
      reason: tokenValidation.reason
    });
    
    // If token is valid, restore auth state
    if (tokenValidation.isValid) {
      debugLog('Token is valid, restoring auth state');
      return {
        token: authState.token,
        isLoggedIn: true,
        user: authState.user || null,
        isLoading: false,
        isRefreshing: false,
        refreshAttempts: 0,
        lastRefreshError: null,
      };
    } else {
      // Token is invalid/expired, but don't clear immediately
      // Return initial state but keep the refresh token cookie
      // Let the PersistLogin component handle the refresh attempt
      debugLog('Token expired, will attempt refresh on component mount');
      console.log('🔄 Token expired, will attempt refresh on component mount');
      return {
        token: null,
        isLoggedIn: false,
        user: null,
        isLoading: false,
        isRefreshing: false,
        refreshAttempts: 0,
        lastRefreshError: null,
      };
    }
  }
  
  // No token found, return initial state
  const initialState = {
    token: null,
    isLoggedIn: false,
    user: null,
    isLoading: false,
    isRefreshing: false,
    refreshAttempts: 0,
    lastRefreshError: null,
  };
  
  debugLog('Returning initial state (no token)', initialState);
  return initialState;
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      
      debugLog('setCredentials action dispatched', {
        hasAccessToken: !!accessToken,
        hasUser: !!user,
        tokenLength: accessToken?.length,
        userId: user?.id
      });
      
      const previousState = {
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        user: state.user
      };
      
      state.token = accessToken;
      state.isLoggedIn = true;
      state.user = user || null;
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
      
      debugLog('setCredentials state updated', {
        previous: previousState,
        new: {
          token: state.token,
          isLoggedIn: state.isLoggedIn,
          user: state.user
        }
      });
      
      // Persist to localStorage using centralized auth utility
      const storageResult = authStorage.setCredentials({ accessToken, user });
      debugLog('setCredentials localStorage result', { success: storageResult });
    },
    logOut: (state, action) => {
      debugLog('logOut action dispatched', {
        reason: action.payload?.reason || 'unknown',
        previousToken: !!state.token,
        previousUser: !!state.user
      });
      
      const previousState = {
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        user: state.user
      };
      
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
      
      debugLog('logOut state updated', {
        previous: previousState,
        new: {
          token: state.token,
          isLoggedIn: state.isLoggedIn,
          user: state.user
        }
      });
      
      // Clear localStorage using centralized auth utility
      const storageResult = authStorage.setLoggedOut();
      debugLog('logOut localStorage result', { success: storageResult });
    },
    setUser: (state, action) => {
      debugLog('setUser action dispatched', {
        hasUser: !!action.payload,
        userId: action.payload?.id
      });
      
      state.user = action.payload;
      
      // Update user data in localStorage using centralized auth utility
      const storageResult = authStorage.updateUserData(action.payload);
      debugLog('setUser localStorage result', { success: storageResult });
    },
    setLoading: (state, action) => {
      debugLog('setLoading action dispatched', { isLoading: action.payload });
      state.isLoading = action.payload;
    },
    clearAuth: (state, action) => {
      debugLog('clearAuth action dispatched');
      
      const previousState = {
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        user: state.user
      };
      
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
      
      debugLog('clearAuth state updated', {
        previous: previousState,
        new: {
          token: state.token,
          isLoggedIn: state.isLoggedIn,
          user: state.user
        }
      });
      
      // Clear all auth-related localStorage using centralized auth utility
      const storageResult = authStorage.clearAuth();
      debugLog('clearAuth localStorage result', { success: storageResult });
    },
    setRefreshing: (state, action) => {
      debugLog('setRefreshing action dispatched', { isRefreshing: action.payload });
      state.isRefreshing = action.payload;
      if (action.payload) {
        state.lastRefreshError = null;
      }
    },
    setRefreshAttempts: (state, action) => {
      debugLog('setRefreshAttempts action dispatched', { attempts: action.payload });
      state.refreshAttempts = action.payload;
    },
    setRefreshError: (state, action) => {
      debugLog('setRefreshError action dispatched', { error: action.payload });
      state.lastRefreshError = action.payload;
      state.isRefreshing = false;
    },
    clearRefreshState: (state) => {
      debugLog('clearRefreshState action dispatched');
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
    },
  },
});

export const { 
  setCredentials, 
  logOut, 
  setUser, 
  setLoading, 
  clearAuth,
  setRefreshing,
  setRefreshAttempts,
  setRefreshError,
  clearRefreshState
} = authSlice.actions;

// Legacy selectors for backward compatibility
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;
export const selectRefreshAttempts = (state) => state.auth.refreshAttempts;
export const selectLastRefreshError = (state) => state.auth.lastRefreshError;

// Re-export optimized selectors for better performance
export {
  selectAuthState as selectOptimizedAuthState,
  selectIsAuthenticated as selectOptimizedIsAuthenticated,
  selectCurrentUser as selectOptimizedCurrentUser,
  selectTokenValidation as selectOptimizedTokenValidation,
  selectAuthStatus as selectOptimizedAuthStatus,
  selectUserInfo as selectOptimizedUserInfo
} from './authSelectors';

export default authSlice.reducer;
