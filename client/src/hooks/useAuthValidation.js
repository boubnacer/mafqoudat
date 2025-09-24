import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentToken, selectCurrentUser, selectIsRefreshing } from '../features/auth/authSlice';
import { useRefreshMutation } from '../features/auth/authApiSlice';
import { isTokenExpired, isTokenExpiringSoon, getTokenTimeRemaining } from '../utils/tokenUtils';
import { authStorage } from '../utils/authStorage';

/**
 * Enhanced Authentication Validation Hook
 * 
 * Provides comprehensive authentication state validation including:
 * - Token validity verification
 * - Proactive token refresh
 * - User permission validation
 * - Loading states during auth checks
 */
export const useAuthValidation = (options = {}) => {
  const {
    requireAuth = false,
    requiredPermissions = [],
    requiredRole = null,
    autoRefresh = true,
    refreshThreshold = 2 * 60 * 1000, // 2 minutes before expiry
    onAuthError = null,
    onPermissionDenied = null
  } = options;

  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);
  const isRefreshing = useSelector(selectIsRefreshing);

  const [refresh] = useRefreshMutation();
  
  // State management
  const [authState, setAuthState] = useState({
    isValid: false,
    isLoading: true,
    isExpired: false,
    isExpiringSoon: false,
    hasPermission: false,
    error: null,
    lastValidated: null
  });

  // Refs for cleanup and tracking
  const refreshTimerRef = useRef(null);
  const validationTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Validate token and user permissions
   */
  const validateAuth = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if token exists
      if (!token) {
        const newState = {
          isValid: false,
          isLoading: false,
          isExpired: true,
          isExpiringSoon: false,
          hasPermission: false,
          error: requireAuth ? 'Authentication required' : null,
          lastValidated: Date.now()
        };
        
        setAuthState(newState);
        
        if (requireAuth && onAuthError) {
          onAuthError('No authentication token found');
        }
        
        return newState;
      }

      // Check if token is expired
      const isExpired = isTokenExpired(token);
      const isExpiringSoon = isTokenExpiringSoon(token);
      
      if (isExpired) {
        const newState = {
          isValid: false,
          isLoading: false,
          isExpired: true,
          isExpiringSoon: false,
          hasPermission: false,
          error: 'Token expired',
          lastValidated: Date.now()
        };
        
        setAuthState(newState);
        
        if (onAuthError) {
          onAuthError('Authentication token has expired');
        }
        
        return newState;
      }

      // Check if token is expiring soon and needs refresh
      if (isExpiringSoon && autoRefresh && !isRefreshing) {
        console.log('Token expiring soon, attempting refresh...');
        await attemptTokenRefresh();
      }

      // Validate user permissions
      const hasPermission = validatePermissions(user, requiredPermissions, requiredRole);

      const newState = {
        isValid: true,
        isLoading: false,
        isExpired: false,
        isExpiringSoon,
        hasPermission,
        error: null,
        lastValidated: Date.now()
      };

      setAuthState(newState);

      // Handle permission denial
      if (requiredPermissions.length > 0 && !hasPermission && onPermissionDenied) {
        onPermissionDenied('Insufficient permissions');
      }

      return newState;

    } catch (error) {
      console.error('Authentication validation error:', error);
      
      const newState = {
        isValid: false,
        isLoading: false,
        isExpired: true,
        isExpiringSoon: false,
        hasPermission: false,
        error: error.message || 'Authentication validation failed',
        lastValidated: Date.now()
      };
      
      setAuthState(newState);
      
      if (onAuthError) {
        onAuthError(error.message || 'Authentication validation failed');
      }
      
      return newState;
    }
  }, [token, user, requireAuth, requiredPermissions, requiredRole, autoRefresh, isRefreshing, onAuthError, onPermissionDenied]);

  /**
   * Attempt to refresh the token
   */
  const attemptTokenRefresh = useCallback(async () => {
    if (isRefreshing) return false;

    try {
      console.log('Attempting token refresh...');
      await refresh().unwrap();
      console.log('Token refresh successful');
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Clear invalid auth state
      authStorage.clearAuth();
      
      if (onAuthError) {
        onAuthError('Session expired. Please log in again.');
      }
      
      return false;
    }
  }, [refresh, isRefreshing, onAuthError]);

  /**
   * Validate user permissions
   */
  const validatePermissions = useCallback((user, permissions, role) => {
    if (!user) return false;
    
    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
      return false;
    }
    
    // Check specific permissions
    if (permissions.length > 0) {
      // This would need to be implemented based on your permission system
      // For now, we'll assume admin role has all permissions
      if (user.role === 'admin') return true;
      
      // Add your permission validation logic here
      return permissions.every(permission => 
        user.permissions && user.permissions.includes(permission)
      );
    }
    
    return true;
  }, [requiredRole]);

  /**
   * Set up proactive token refresh timer
   */
  const setupRefreshTimer = useCallback(() => {
    if (!token || !autoRefresh) return;

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const timeRemaining = getTokenTimeRemaining(token);
    const refreshTime = Math.max(timeRemaining - refreshThreshold, 0);

    if (refreshTime > 0) {
      refreshTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          attemptTokenRefresh();
        }
      }, refreshTime);
    }
  }, [token, autoRefresh, refreshThreshold, attemptTokenRefresh]);

  /**
   * Set up periodic validation timer
   */
  const setupValidationTimer = useCallback(() => {
    if (validationTimerRef.current) {
      clearInterval(validationTimerRef.current);
    }

    // Validate every 30 seconds
    validationTimerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        validateAuth();
      }
    }, 30000);
  }, [validateAuth]);

  /**
   * Manual refresh trigger
   */
  const triggerRefresh = useCallback(async () => {
    return await attemptTokenRefresh();
  }, [attemptTokenRefresh]);

  /**
   * Manual validation trigger
   */
  const triggerValidation = useCallback(async () => {
    return await validateAuth();
  }, [validateAuth]);

  // Effect for initial validation and setup
  useEffect(() => {
    validateAuth();
    setupRefreshTimer();
    setupValidationTimer();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (validationTimerRef.current) {
        clearInterval(validationTimerRef.current);
      }
    };
  }, [validateAuth, setupRefreshTimer, setupValidationTimer]);

  // Effect for cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Effect to re-validate when token or user changes
  useEffect(() => {
    if (isMountedRef.current) {
      validateAuth();
      setupRefreshTimer();
    }
  }, [token, user, validateAuth, setupRefreshTimer]);

  return {
    // State
    ...authState,
    
    // Computed values
    isAuthenticated: authState.isValid && !authState.isExpired,
    canAccess: authState.isValid && !authState.isExpired && authState.hasPermission,
    needsRefresh: authState.isExpiringSoon,
    
    // Actions
    triggerRefresh,
    triggerValidation,
    
    // User info
    user,
    token
  };
};

export default useAuthValidation;
