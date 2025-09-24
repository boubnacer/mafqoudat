import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import {
  hasRole,
  hasAnyRole,
  hasRoleLevel,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canPerformAction,
  validatePermissions,
  canAccessRoute,
  ROLES,
  PERMISSIONS
} from '../utils/permissionUtils';

/**
 * Permission Hook
 * 
 * Provides easy access to permission checking functions in React components
 * Automatically uses the current user from Redux store
 */

export const usePermissions = () => {
  const user = useSelector(selectCurrentUser);

  /**
   * Check if current user has a specific role
   */
  const checkRole = (role) => {
    return hasRole(user, role);
  };

  /**
   * Check if current user has any of the specified roles
   */
  const checkAnyRole = (roles) => {
    return hasAnyRole(user, roles);
  };

  /**
   * Check if current user has a role with sufficient hierarchy level
   */
  const checkRoleLevel = (minimumRole) => {
    return hasRoleLevel(user, minimumRole);
  };

  /**
   * Check if current user has a specific permission
   */
  const checkPermission = (permission) => {
    return hasPermission(user, permission);
  };

  /**
   * Check if current user has any of the specified permissions
   */
  const checkAnyPermission = (permissions) => {
    return hasAnyPermission(user, permissions);
  };

  /**
   * Check if current user has all of the specified permissions
   */
  const checkAllPermissions = (permissions) => {
    return hasAllPermissions(user, permissions);
  };

  /**
   * Check if current user can perform an action on a resource
   */
  const checkAction = (action, resource) => {
    return canPerformAction(user, action, resource);
  };

  /**
   * Check if current user can access a specific route
   */
  const checkRouteAccess = (route) => {
    return canAccessRoute(user, route);
  };

  /**
   * Validate permissions for a specific context
   */
  const validate = (context) => {
    return validatePermissions(user, context);
  };

  /**
   * Get all permissions for current user
   */
  const getPermissions = () => {
    return getUserPermissions(user);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => {
    return checkRole(ROLES.ADMIN);
  };

  /**
   * Check if user is moderator or admin
   */
  const isModerator = () => {
    return checkAnyRole([ROLES.ADMIN, ROLES.MODERATOR]);
  };

  /**
   * Check if user is authenticated (has any role above guest)
   */
  const isAuthenticated = () => {
    return checkRoleLevel(ROLES.USER);
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = () => {
    return checkPermission(PERMISSIONS.USER_MANAGE);
  };

  /**
   * Check if user can moderate posts
   */
  const canModeratePosts = () => {
    return checkPermission(PERMISSIONS.POST_MODERATE);
  };

  /**
   * Check if user can create posts
   */
  const canCreatePosts = () => {
    return checkPermission(PERMISSIONS.POST_WRITE);
  };

  /**
   * Check if user can delete posts
   */
  const canDeletePosts = () => {
    return checkPermission(PERMISSIONS.POST_DELETE);
  };

  /**
   * Check if user can manage categories
   */
  const canManageCategories = () => {
    return checkPermission(PERMISSIONS.CATEGORY_WRITE);
  };

  /**
   * Check if user can view reports
   */
  const canViewReports = () => {
    return checkPermission(PERMISSIONS.REPORTS_READ);
  };

  /**
   * Check if user can access admin panel
   */
  const canAccessAdmin = () => {
    return checkRoleLevel(ROLES.MODERATOR);
  };

  return {
    // User info
    user,
    
    // Basic role checks
    checkRole,
    checkAnyRole,
    checkRoleLevel,
    
    // Permission checks
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    
    // Action checks
    checkAction,
    checkRouteAccess,
    
    // Validation
    validate,
    
    // Utility functions
    getPermissions,
    
    // Convenience methods
    isAdmin,
    isModerator,
    isAuthenticated,
    canManageUsers,
    canModeratePosts,
    canCreatePosts,
    canDeletePosts,
    canManageCategories,
    canViewReports,
    canAccessAdmin,
    
    // Constants
    ROLES,
    PERMISSIONS
  };
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermissions = (WrappedComponent, permissionConfig) => {
  return function PermissionWrappedComponent(props) {
    const permissions = usePermissions();
    
    // Check if user has required permissions
    const validation = permissions.validate(permissionConfig);
    
    if (!validation.valid) {
      // Return null or a fallback component
      return null;
    }
    
    return <WrappedComponent {...props} permissions={permissions} />;
  };
};

/**
 * Permission-based conditional rendering component
 */
export const PermissionGate = ({ 
  children, 
  requiredRole,
  requiredPermissions,
  requiredAnyPermissions,
  requiredAllPermissions,
  fallback = null,
  showError = false
}) => {
  const permissions = usePermissions();
  
  const validation = permissions.validate({
    requiredRole,
    requiredPermissions,
    requiredAnyPermissions,
    requiredAllPermissions
  });
  
  if (!validation.valid) {
    if (showError) {
      return (
        <div style={{ color: 'red', padding: '10px' }}>
          Access denied: {validation.reason}
        </div>
      );
    }
    return fallback;
  }
  
  return children;
};

/**
 * Hook for checking multiple permissions at once
 */
export const usePermissionCheck = (permissionConfig) => {
  const permissions = usePermissions();
  
  return {
    ...permissions,
    validation: permissions.validate(permissionConfig),
    hasAccess: permissions.validate(permissionConfig).valid
  };
};

export default usePermissions;
