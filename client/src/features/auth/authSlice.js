import { createSlice } from "@reduxjs/toolkit";
import { authStorage } from "../../utils/authStorage";
import { getOptimizedTokenValidation } from "../../utils/optimizedTokenUtils";
import { ensureGlobalStateWithUserCountry } from "../../utils/globalStateInitializer";

// Debug configuration
const DEBUG_AUTH = false;

// Debug logging function
const debugLog = (message, data = null) => {
  // Debug logging disabled for production
};

// Decode a JWT's payload without verifying it - enough to read the claims the UI
// needs. Handles base64url (`-`/`_`), which raw atob() rejects.
const decodeTokenPayload = (token) => {
  try {
    const segment = token?.split('.')[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')));
  } catch (error) {
    return null;
  }
};

// Whether a stored token is already past its `exp`. Only a definite answer counts as
// expired: a token we cannot decode, or one with no `exp` claim, is left for the
// server to judge, so a parsing quirk here can never sign a valid user out.
export const isStoredTokenExpired = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;

  return payload.exp * 1000 <= Date.now();
};

// Helper function to extract user data from token
const extractUserFromToken = (token) => {
  try {
    if (!token) return null;

    const payload = decodeTokenPayload(token);
    if (!payload) return null;

    // Extract user data from token payload
    if (payload.UserInfo) {
      return {
        _id: payload.UserInfo.userId,
        username: payload.UserInfo.username,
        country: payload.UserInfo.country,
        role: payload.UserInfo.role
      };
    }
    
    return null;
  } catch (error) {
    return null;
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
  
  // A token past its `exp` will be refused by every protected endpoint, so restoring
  // it would put the app back in the state this guard exists to prevent: a UI that
  // shows the user as signed in while every write fails. Drop it up front and let
  // them log in again, with the same notice the API layer stores on a mid-session
  // failure (see app/api/apiSlice.js).
  if (authState.token && isStoredTokenExpired(authState.token)) {
    debugLog('Stored token is expired, starting signed out');
    authStorage.setLoggedOut();
    authStorage.setLoginRedirectMessage('sessionExpiredMessage');

    return {
      token: null,
      isLoggedIn: false,
      user: null,
      isLoading: false,
      lastUpdate: Date.now(),
    };
  }

  // Restore token and user from localStorage (tokens last 30 days)
  if (authState.token && authState.isLoggedIn) {
    // Extract user data from token if not in storage
    const userData = extractUserFromToken(authState.token) || authState.user;
    debugLog('Restoring auth state with user data', {
      hasUserData: !!userData,
      userId: userData?._id
    });
    
    // Ensure globalState exists with user's country on app startup
    if (userData) {
      ensureGlobalStateWithUserCountry(userData);
      debugLog('GlobalState ensured on auth restoration', { 
        country: userData.country || userData.Country 
      });
    }
    
    return {
      token: authState.token,
      isLoggedIn: true,
      user: userData || null,
      isLoading: false,
      lastUpdate: Date.now(),
    };
  }
  
  // No token found, return initial state
  const initialState = {
    token: null,
    isLoggedIn: false,
    user: null,
    isLoading: false,
    lastUpdate: Date.now(),
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
      
      // Extract user data from token if not provided
      let userData = user;
      if (!userData && accessToken) {
        userData = extractUserFromToken(accessToken);
        debugLog('Extracted user data from token', {
          hasUserData: !!userData,
          userId: userData?._id
        });
      }
      
      const previousState = {
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        user: state.user
      };
      
      state.token = accessToken;
      state.isLoggedIn = true;
      state.user = userData || null;
      state.lastUpdate = Date.now(); // Add timestamp for force updates
      
      debugLog('setCredentials state updated', {
        previous: previousState,
        new: {
          token: state.token,
          isLoggedIn: state.isLoggedIn,
          user: state.user
        }
      });
      
      // Persist to localStorage using centralized auth utility
      const storageResult = authStorage.setCredentials({ accessToken, user: userData });
      debugLog('setCredentials localStorage result', { success: storageResult });
      
      // Ensure globalState exists and is initialized with user's country
      if (userData) {
        ensureGlobalStateWithUserCountry(userData);
        debugLog('GlobalState ensured with user country', { 
          country: userData.country || userData.Country 
        });
      }
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
      state.lastUpdate = Date.now(); // Add timestamp to force re-renders
      
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
      state.lastUpdate = Date.now(); // Add timestamp to force re-renders
      
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
    forceUpdate: (state) => {
      // Force a state update to trigger re-renders
      state.lastUpdate = Date.now();
      debugLog('forceUpdate action dispatched', { timestamp: state.lastUpdate });
    },
  },
});

export const { 
  setCredentials, 
  logOut, 
  setUser, 
  setLoading, 
  clearAuth,
  forceUpdate
} = authSlice.actions;

// Legacy selectors for backward compatibility
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.isLoading;

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
