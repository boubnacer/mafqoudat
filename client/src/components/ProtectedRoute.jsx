import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthValidation } from '../hooks/useAuthValidation';
import { 
  AuthLoadingWrapper,
  AuthErrorState,
  PermissionDeniedState
} from './AuthLoadingStates';

/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication and/or specific permissions
 * Provides comprehensive authentication state validation
 */

/**
 * Main Protected Route Component
 */
export const ProtectedRoute = ({ 
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRole = null,
  fallbackPath = '/login',
  redirectTo = null,
  onAuthError = null,
  onPermissionDenied = null,
  loadingMessage = "Validating access...",
  ...props
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Use enhanced authentication validation
  const {
    isValid,
    isLoading,
    isRefreshing,
    isValidating,
    hasPermission,
    error,
    isAuthenticated,
    canAccess,
    triggerRefresh,
    triggerValidation,
    user
  } = useAuthValidation({
    requireAuth,
    requiredPermissions,
    requiredRole,
    autoRefresh: true,
    onAuthError: (errorMessage) => {
      console.error('Authentication error in ProtectedRoute:', errorMessage);
      if (onAuthError) {
        onAuthError(errorMessage);
      }
    },
    onPermissionDenied: (errorMessage) => {
      console.error('Permission denied in ProtectedRoute:', errorMessage);
      if (onPermissionDenied) {
        onPermissionDenied(errorMessage);
      }
    }
  });

  // Handle retry for authentication errors
  const handleRetry = async () => {
    await triggerValidation();
  };

  // Handle login redirect
  const handleLogin = () => {
    // Store current location for redirect after login
    const currentPath = location.pathname + location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    
    // Navigate to login
    navigate(fallbackPath, { replace: true });
  };

  // Handle go back for permission errors
  const handleGoBack = () => {
    navigate(-1);
  };

  // If authentication is not required, render children directly
  if (!requireAuth) {
    return children;
  }

  // Show loading states during authentication checks
  if (isLoading || isValidating || isRefreshing) {
    return (
      <AuthLoadingWrapper
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isValidating={isValidating}
        isValid={isValid}
        hasPermission={hasPermission}
        error={error}
        onRetry={handleRetry}
        onLogin={handleLogin}
        loadingMessage={loadingMessage}
        refreshMessage="Refreshing your session..."
        validationMessage="Validating your access..."
      />
    );
  }

  // Handle authentication errors
  if (error) {
    return (
      <AuthErrorState
        title="Authentication Required"
        message={error}
        onRetry={handleRetry}
        onLogin={handleLogin}
      />
    );
  }

  // Handle permission errors
  if (isValid && !hasPermission && requiredPermissions.length > 0) {
    return (
      <PermissionDeniedState
        title="Access Denied"
        message="You don't have the required permissions to access this page."
        onGoBack={handleGoBack}
      />
    );
  }

  // Handle role-based access
  if (isValid && requiredRole && user?.role !== requiredRole) {
    return (
      <PermissionDeniedState
        title="Access Denied"
        message={`This page requires ${requiredRole} role access.`}
        onGoBack={handleGoBack}
      />
    );
  }

  // If authenticated and authorized, render children
  if (canAccess) {
    return children;
  }

  // Fallback: redirect to login
  return <Navigate to={fallbackPath} state={{ from: location }} replace />;
};

/**
 * Admin Only Route Component
 */
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requiredRole="admin"
    fallbackPath="/unauthorized"
    loadingMessage="Validating admin access..."
    {...props}
  >
    {children}
  </ProtectedRoute>
);

/**
 * User Route Component (requires authentication but no specific role)
 */
export const UserRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requireAuth={true}
    fallbackPath="/login"
    loadingMessage="Validating user access..."
    {...props}
  >
    {children}
  </ProtectedRoute>
);

/**
 * Public Route Component (redirects authenticated users)
 */
export const PublicRoute = ({ 
  children, 
  redirectTo = '/dashboard',
  ...props 
}) => {
  const { isAuthenticated } = useAuthValidation({ requireAuth: false });

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * Conditional Route Component (shows different content based on auth state)
 */
export const ConditionalRoute = ({ 
  authenticatedComponent,
  unauthenticatedComponent,
  loadingComponent = null,
  ...props 
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    isValidating, 
    isRefreshing 
  } = useAuthValidation({ requireAuth: false });

  // Show loading state
  if (isLoading || isValidating || isRefreshing) {
    return loadingComponent || (
      <AuthLoadingWrapper
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isValidating={isValidating}
        loadingMessage="Loading..."
      />
    );
  }

  // Show appropriate component based on authentication state
  return isAuthenticated ? authenticatedComponent : unauthenticatedComponent;
};

/**
 * Permission-based Route Component
 */
export const PermissionRoute = ({ 
  children,
  permissions = [],
  fallbackComponent = null,
  ...props 
}) => {
  const { 
    hasPermission, 
    isLoading, 
    isValidating, 
    isRefreshing 
  } = useAuthValidation({
    requiredPermissions: permissions,
    requireAuth: true,
    ...props
  });

  // Show loading state
  if (isLoading || isValidating || isRefreshing) {
    return (
      <AuthLoadingWrapper
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isValidating={isValidating}
        loadingMessage="Checking permissions..."
      />
    );
  }

  // Show children if user has permission, otherwise show fallback
  return hasPermission ? children : (fallbackComponent || null);
};

/**
 * Higher-order component for protecting components
 */
export const withAuth = (WrappedComponent, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

/**
 * Higher-order component for admin-only components
 */
export const withAdminAuth = (WrappedComponent) => {
  return withAuth(WrappedComponent, { requiredRole: 'admin' });
};

/**
 * Higher-order component for permission-based components
 */
export const withPermissions = (WrappedComponent, permissions = []) => {
  return withAuth(WrappedComponent, { requiredPermissions: permissions });
};

export default ProtectedRoute;
