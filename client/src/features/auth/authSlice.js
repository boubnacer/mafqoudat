import { createSlice } from "@reduxjs/toolkit";
import { authStorage } from "../../utils/authStorage";
import { getOptimizedTokenValidation } from "../../utils/optimizedTokenUtils";

// Get initial state from localStorage using centralized auth utility
const getInitialState = () => {
  const authState = authStorage.getAuthState();
  
  // Validate token if it exists
  if (authState.token) {
    const tokenValidation = getOptimizedTokenValidation(authState.token);
    
    // If token is expired, clear the auth state
    if (!tokenValidation.isValid && tokenValidation.reason === 'TOKEN_EXPIRED') {
      console.log('Token expired on app initialization, clearing auth state');
      authStorage.setLoggedOut();
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
  
  return {
    token: authState.token,
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    isLoading: false,
    isRefreshing: false,
    refreshAttempts: 0,
    lastRefreshError: null,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      state.token = accessToken;
      state.isLoggedIn = true;
      state.user = user || null;
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
      
      // Persist to localStorage using centralized auth utility
      authStorage.setCredentials({ accessToken, user });
    },
    logOut: (state, action) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
      
      // Clear localStorage using centralized auth utility
      authStorage.setLoggedOut();
    },
    setUser: (state, action) => {
      state.user = action.payload;
      
      // Update user data in localStorage using centralized auth utility
      authStorage.updateUserData(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearAuth: (state, action) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      state.isRefreshing = false;
      state.refreshAttempts = 0;
      state.lastRefreshError = null;
      
      // Clear all auth-related localStorage using centralized auth utility
      authStorage.clearAuth();
    },
    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
      if (action.payload) {
        state.lastRefreshError = null;
      }
    },
    setRefreshAttempts: (state, action) => {
      state.refreshAttempts = action.payload;
    },
    setRefreshError: (state, action) => {
      state.lastRefreshError = action.payload;
      state.isRefreshing = false;
    },
    clearRefreshState: (state) => {
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
