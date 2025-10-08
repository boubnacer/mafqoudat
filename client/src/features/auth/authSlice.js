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

// Helper function to extract user data from token
const extractUserFromToken = (token) => {
  try {
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
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
    console.error('Error extracting user from token:', error);
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
  
  // Simply restore token and user from localStorage (tokens last 30 days, no expiration checks needed)
  if (authState.token && authState.isLoggedIn) {
    // Extract user data from token if not in storage
    const userData = extractUserFromToken(authState.token) || authState.user;
    debugLog('Restoring auth state with user data', {
      hasUserData: !!userData,
      userId: userData?._id
    });
    
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
