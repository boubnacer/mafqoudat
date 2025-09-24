/**
 * Permission Validation Utilities
 * 
 * Provides comprehensive permission checking and validation functions
 * for role-based and permission-based access control
 */

// Define available roles and their hierarchy
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [ROLES.GUEST]: 0,
  [ROLES.USER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3
};

// Define available permissions
export const PERMISSIONS = {
  // User management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',
  
  // Post management
  POST_READ: 'post:read',
  POST_WRITE: 'post:write',
  POST_DELETE: 'post:delete',
  POST_MODERATE: 'post:moderate',
  
  // Category management
  CATEGORY_READ: 'category:read',
  CATEGORY_WRITE: 'category:write',
  CATEGORY_DELETE: 'category:delete',
  
  // Country/City management
  LOCATION_READ: 'location:read',
  LOCATION_WRITE: 'location:write',
  LOCATION_DELETE: 'location:delete',
  
  // System administration
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
  
  // Reports and analytics
  REPORTS_READ: 'reports:read',
  REPORTS_WRITE: 'reports:write',
  ANALYTICS_READ: 'analytics:read',
  
  // Content moderation
  CONTENT_MODERATE: 'content:moderate',
  CONTENT_APPROVE: 'content:approve',
  CONTENT_REJECT: 'content:reject'
};

// Define role-permission mappings
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admins have all permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.MODERATOR]: [
    // User permissions
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    
    // Post permissions
    PERMISSIONS.POST_READ,
    PERMISSIONS.POST_WRITE,
    PERMISSIONS.POST_DELETE,
    PERMISSIONS.POST_MODERATE,
    
    // Category permissions
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_WRITE,
    
    // Location permissions
    PERMISSIONS.LOCATION_READ,
    PERMISSIONS.LOCATION_WRITE,
    
    // Reports permissions
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_WRITE,
    
    // Content moderation
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.CONTENT_APPROVE,
    PERMISSIONS.CONTENT_REJECT
  ],
  
  [ROLES.USER]: [
    // Basic user permissions
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    
    // Post permissions
    PERMISSIONS.POST_READ,
    PERMISSIONS.POST_WRITE,
    
    // Category permissions
    PERMISSIONS.CATEGORY_READ,
    
    // Location permissions
    PERMISSIONS.LOCATION_READ,
    
    // Reports permissions
    PERMISSIONS.REPORTS_WRITE
  ],
  
  [ROLES.GUEST]: [
    // Read-only permissions
    PERMISSIONS.POST_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.LOCATION_READ
  ]
};

/**
 * Check if a user has a specific role
 */
export const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  return user.role === requiredRole;
};

/**
 * Check if a user has any of the specified roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role || !Array.isArray(roles)) return false;
  return roles.includes(user.role);
};

/**
 * Check if a user has a role with sufficient hierarchy level
 */
export const hasRoleLevel = (user, minimumRole) => {
  if (!user || !user.role) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;
  
  // Admin role has all permissions
  if (user.role === ROLES.ADMIN) return true;
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  if (rolePermissions.includes(permission)) return true;
  
  // Check explicit user permissions (if user has custom permissions)
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  
  return false;
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (user) => {
  if (!user) return [];
  
  // Admin role has all permissions
  if (user.role === ROLES.ADMIN) {
    return Object.values(PERMISSIONS);
  }
  
  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  
  // Add explicit user permissions if they exist
  const explicitPermissions = user.permissions || [];
  
  // Combine and deduplicate
  return [...new Set([...rolePermissions, ...explicitPermissions])];
};

/**
 * Check if a user can perform an action on a resource
 */
export const canPerformAction = (user, action, resource) => {
  if (!user || !action || !resource) return false;
  
  // Construct permission string
  const permission = `${resource}:${action}`;
  
  // Check if permission exists in our system
  if (!Object.values(PERMISSIONS).includes(permission)) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  
  return hasPermission(user, permission);
};

/**
 * Validate user permissions for a specific context
 */
export const validatePermissions = (user, context) => {
  if (!user || !context) return { valid: false, reason: 'Invalid user or context' };
  
  const { requiredRole, requiredPermissions, requiredAnyPermissions, requiredAllPermissions } = context;
  
  // Check role requirement
  if (requiredRole) {
    if (!hasRole(user, requiredRole)) {
      return { 
        valid: false, 
        reason: `Required role: ${requiredRole}, user has: ${user.role}` 
      };
    }
  }
  
  // Check specific permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAllPermissions(user, requiredPermissions)) {
      return { 
        valid: false, 
        reason: `Missing required permissions: ${requiredPermissions.join(', ')}` 
      };
    }
  }
  
  // Check any permissions
  if (requiredAnyPermissions && requiredAnyPermissions.length > 0) {
    if (!hasAnyPermission(user, requiredAnyPermissions)) {
      return { 
        valid: false, 
        reason: `Missing any of permissions: ${requiredAnyPermissions.join(', ')}` 
      };
    }
  }
  
  // Check all permissions
  if (requiredAllPermissions && requiredAllPermissions.length > 0) {
    if (!hasAllPermissions(user, requiredAllPermissions)) {
      return { 
        valid: false, 
        reason: `Missing all permissions: ${requiredAllPermissions.join(', ')}` 
      };
    }
  }
  
  return { valid: true };
};

/**
 * Create a permission checker function for a specific context
 */
export const createPermissionChecker = (context) => {
  return (user) => {
    return validatePermissions(user, context);
  };
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.MODERATOR]: 'Moderator',
    [ROLES.USER]: 'User',
    [ROLES.GUEST]: 'Guest'
  };
  
  return displayNames[role] || 'Unknown';
};

/**
 * Get permission display name
 */
export const getPermissionDisplayName = (permission) => {
  const displayNames = {
    [PERMISSIONS.USER_READ]: 'Read Users',
    [PERMISSIONS.USER_WRITE]: 'Write Users',
    [PERMISSIONS.USER_DELETE]: 'Delete Users',
    [PERMISSIONS.USER_MANAGE]: 'Manage Users',
    [PERMISSIONS.POST_READ]: 'Read Posts',
    [PERMISSIONS.POST_WRITE]: 'Write Posts',
    [PERMISSIONS.POST_DELETE]: 'Delete Posts',
    [PERMISSIONS.POST_MODERATE]: 'Moderate Posts',
    [PERMISSIONS.CATEGORY_READ]: 'Read Categories',
    [PERMISSIONS.CATEGORY_WRITE]: 'Write Categories',
    [PERMISSIONS.CATEGORY_DELETE]: 'Delete Categories',
    [PERMISSIONS.LOCATION_READ]: 'Read Locations',
    [PERMISSIONS.LOCATION_WRITE]: 'Write Locations',
    [PERMISSIONS.LOCATION_DELETE]: 'Delete Locations',
    [PERMISSIONS.SYSTEM_ADMIN]: 'System Administration',
    [PERMISSIONS.SYSTEM_CONFIG]: 'System Configuration',
    [PERMISSIONS.SYSTEM_LOGS]: 'View System Logs',
    [PERMISSIONS.REPORTS_READ]: 'Read Reports',
    [PERMISSIONS.REPORTS_WRITE]: 'Write Reports',
    [PERMISSIONS.ANALYTICS_READ]: 'View Analytics',
    [PERMISSIONS.CONTENT_MODERATE]: 'Moderate Content',
    [PERMISSIONS.CONTENT_APPROVE]: 'Approve Content',
    [PERMISSIONS.CONTENT_REJECT]: 'Reject Content'
  };
  
  return displayNames[permission] || permission;
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (user, route) => {
  if (!user || !route) return false;
  
  // Define route permissions
  const routePermissions = {
    '/admin': { requiredRole: ROLES.ADMIN },
    '/admin/users': { requiredPermissions: [PERMISSIONS.USER_READ] },
    '/admin/posts': { requiredPermissions: [PERMISSIONS.POST_MODERATE] },
    '/admin/categories': { requiredPermissions: [PERMISSIONS.CATEGORY_WRITE] },
    '/admin/reports': { requiredPermissions: [PERMISSIONS.REPORTS_READ] },
    '/profile': { requiredRole: ROLES.USER },
    '/posts/create': { requiredPermissions: [PERMISSIONS.POST_WRITE] },
    '/posts/edit': { requiredPermissions: [PERMISSIONS.POST_WRITE] },
    '/posts/delete': { requiredPermissions: [PERMISSIONS.POST_DELETE] }
  };
  
  const routeConfig = routePermissions[route];
  if (!routeConfig) return true; // Public route
  
  return validatePermissions(user, routeConfig).valid;
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasRole,
  hasAnyRole,
  hasRoleLevel,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canPerformAction,
  validatePermissions,
  createPermissionChecker,
  getRoleDisplayName,
  getPermissionDisplayName,
  canAccessRoute
};
