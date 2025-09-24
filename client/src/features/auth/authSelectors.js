import { createSelector } from '@reduxjs/toolkit';
import { getOptimizedTokenValidation, isTokenExpiringSoon, getTokenTimeRemaining } from '../../utils/optimizedTokenUtils';

// Base selectors (these are already memoized by Redux)
const selectAuthSlice = (state) => state.auth;
const selectToken = (state) => state.auth.token;
const selectUser = (state) => state.auth.user;
const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
const selectIsRefreshing = (state) => state.auth.isRefreshing;
const selectRefreshAttempts = (state) => state.auth.refreshAttempts;
const selectLastRefreshError = (state) => state.auth.lastRefreshError;

// Memoized selectors for better performance
export const selectTokenValidation = createSelector(
  [selectToken],
  (token) => getOptimizedTokenValidation(token)
);

export const selectIsTokenValid = createSelector(
  [selectTokenValidation],
  (validation) => validation.isValid
);

export const selectIsTokenExpiringSoon = createSelector(
  [selectToken],
  (token) => isTokenExpiringSoon(token)
);

export const selectTokenTimeRemaining = createSelector(
  [selectToken],
  (token) => getTokenTimeRemaining(token)
);

export const selectAuthStatus = createSelector(
  [selectIsLoggedIn, selectTokenValidation, selectIsRefreshing],
  (isLoggedIn, tokenValidation, isRefreshing) => {
    const isExpired = !tokenValidation.isValid && tokenValidation.reason === 'TOKEN_EXPIRED';
    const isExpiringSoon = tokenValidation.reason === 'TOKEN_EXPIRING_SOON';
    
    return {
      isAuthenticated: isLoggedIn && tokenValidation.isValid,
      isExpired,
      isExpiringSoon,
      isRefreshing,
      needsRefresh: isExpiringSoon || isExpired
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

export const selectAuthPerformanceMetrics = createSelector(
  [selectTokenValidation, selectIsRefreshing, selectRefreshAttempts],
  (tokenValidation, isRefreshing, refreshAttempts) => ({
    tokenStatus: tokenValidation.reason,
    isRefreshing,
    refreshAttempts,
    lastValidationTime: Date.now(),
    cacheHit: tokenValidation.cached || false
  })
);

// Combined auth state selector for components that need multiple auth properties
export const selectAuthState = createSelector(
  [selectTokenValidation, selectUserInfo, selectAuthStatus, selectAuthPerformanceMetrics],
  (tokenValidation, userInfo, authStatus, performanceMetrics) => ({
    token: tokenValidation.token || null,
    user: userInfo,
    ...authStatus,
    performance: performanceMetrics,
    // Legacy compatibility
    isLoggedIn: authStatus.isAuthenticated,
    isLoading: false // We don't use loading state in optimized version
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
  selectIsLoggedIn,
  selectIsRefreshing,
  selectRefreshAttempts,
  selectLastRefreshError
};
