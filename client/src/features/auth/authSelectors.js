import { createSelector } from '@reduxjs/toolkit';
import { getOptimizedTokenValidation } from '../../utils/optimizedTokenUtils';

// Base selectors (these are already memoized by Redux)
const selectAuthSlice = (state) => state.auth;
const selectToken = (state) => state.auth.token;
const selectUser = (state) => state.auth.user;
const selectIsLoggedIn = (state) => state.auth.isLoggedIn;

// Memoized selectors for better performance
export const selectTokenValidation = createSelector(
  [selectToken],
  (token) => getOptimizedTokenValidation(token)
);

export const selectIsTokenValid = createSelector(
  [selectTokenValidation],
  (validation) => validation.isValid
);

export const selectAuthStatus = createSelector(
  [selectIsLoggedIn, selectTokenValidation],
  (isLoggedIn, tokenValidation) => {
    return {
      isAuthenticated: isLoggedIn && tokenValidation.isValid,
      isExpired: false, // Tokens are long-lived (30 days), no expiration tracking
      isExpiringSoon: false,
      isRefreshing: false,
      needsRefresh: false
    };
  }
);

export const selectUserInfo = createSelector(
  [selectUser, selectTokenValidation],
  (user, tokenValidation) => {
    // Try to get user info from token first (more reliable)
    if (tokenValidation.decoded?.UserInfo) {
      return {
        ...tokenValidation.decoded.UserInfo,
        isFromToken: true,
        isFromStorage: false
      };
    }
    
    // Fallback to stored user data
    if (user) {
      return {
        ...user,
        isFromToken: false,
        isFromStorage: true
      };
    }
    
    return null;
  }
);

// Combined auth state selector for components that need multiple auth properties
export const selectAuthState = createSelector(
  [selectTokenValidation, selectUserInfo, selectAuthStatus],
  (tokenValidation, userInfo, authStatus) => ({
    token: tokenValidation.token || null,
    user: userInfo,
    ...authStatus,
    // Legacy compatibility
    isLoggedIn: authStatus.isAuthenticated,
    isLoading: false
  })
);

// Selector for components that only need authentication status
export const selectIsAuthenticated = createSelector(
  [selectAuthStatus],
  (authStatus) => authStatus.isAuthenticated
);

// Selector for components that need user data
export const selectCurrentUser = createSelector(
  [selectUserInfo],
  (userInfo) => userInfo
);

// Selector for token with validation
export const selectCurrentToken = createSelector(
  [selectToken, selectTokenValidation],
  (token, validation) => validation.isValid ? token : null
);

// Export all selectors for backward compatibility
export {
  selectToken as selectCurrentTokenRaw,
  selectUser as selectCurrentUserRaw,
  selectIsLoggedIn
};
