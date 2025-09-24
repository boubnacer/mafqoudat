# Authentication State Validation Guide

This guide explains how to use the comprehensive authentication state validation system implemented in your application.

## Overview

The authentication validation system provides:
- **Token validity verification** before making authenticated requests
- **Proactive token refresh** with expiration monitoring
- **User permission validation** for protected content
- **Proper loading states** during authentication checks
- **Enhanced server-side validation** with comprehensive security checks

## Components

### 1. Authentication Validation Hook (`useAuthValidation`)

The main hook for authentication state validation.

```jsx
import { useAuthValidation } from '../hooks/useAuthValidation';

const MyComponent = () => {
  const {
    isValid,
    isLoading,
    isRefreshing,
    isExpiringSoon,
    hasPermission,
    error,
    isAuthenticated,
    canAccess,
    triggerRefresh,
    triggerValidation,
    user,
    token
  } = useAuthValidation({
    requireAuth: true,
    requiredPermissions: ['post:write'],
    requiredRole: 'user',
    autoRefresh: true,
    refreshThreshold: 2 * 60 * 1000, // 2 minutes
    onAuthError: (error) => console.error('Auth error:', error),
    onPermissionDenied: (error) => console.error('Permission denied:', error)
  });

  if (isLoading) return <div>Loading...</div>;
  if (!canAccess) return <div>Access denied</div>;

  return <div>Protected content</div>;
};
```

#### Options:
- `requireAuth`: Whether authentication is required (default: false)
- `requiredPermissions`: Array of required permissions
- `requiredRole`: Required user role
- `autoRefresh`: Enable automatic token refresh (default: true)
- `refreshThreshold`: Time before expiry to refresh (default: 2 minutes)
- `onAuthError`: Callback for authentication errors
- `onPermissionDenied`: Callback for permission errors

### 2. Permission System (`usePermissions`)

Comprehensive permission checking system.

```jsx
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.isAdmin() && <AdminPanel />}
      {permissions.canCreatePosts() && <CreatePostButton />}
      {permissions.checkPermission('user:manage') && <UserManagement />}
    </div>
  );
};
```

#### Available Methods:
- `isAdmin()`: Check if user is admin
- `isModerator()`: Check if user is moderator or admin
- `isAuthenticated()`: Check if user is authenticated
- `canCreatePosts()`: Check post creation permission
- `canModeratePosts()`: Check post moderation permission
- `canManageUsers()`: Check user management permission
- `checkPermission(permission)`: Check specific permission
- `checkRole(role)`: Check specific role
- `validate(context)`: Validate permissions for context

### 3. Protected Route Components

#### Basic Protected Route
```jsx
import { ProtectedRoute } from '../components/ProtectedRoute';

<ProtectedRoute requireAuth={true}>
  <MyProtectedComponent />
</ProtectedRoute>
```

#### Admin Only Route
```jsx
import { AdminRoute } from '../components/ProtectedRoute';

<AdminRoute>
  <AdminPanel />
</AdminRoute>
```

#### Permission-Based Route
```jsx
import { ProtectedRoute } from '../components/ProtectedRoute';

<ProtectedRoute
  requiredPermissions={['post:moderate']}
  fallbackPath="/unauthorized"
>
  <ModerationPanel />
</ProtectedRoute>
```

#### Permission Gate Component
```jsx
import { PermissionGate } from '../hooks/usePermissions';

<PermissionGate 
  requiredRole="admin"
  fallback={<div>Access denied</div>}
>
  <AdminContent />
</PermissionGate>

<PermissionGate 
  requiredPermissions={['post:write']}
  requiredAnyPermissions={['post:delete', 'post:moderate']}
  showError={true}
>
  <PostActions />
</PermissionGate>
```

### 4. Loading States

#### Authentication Loading Wrapper
```jsx
import { AuthLoadingWrapper } from '../components/AuthLoadingStates';

<AuthLoadingWrapper
  isLoading={isLoading}
  isRefreshing={isRefreshing}
  isValidating={isValidating}
  isValid={isValid}
  hasPermission={hasPermission}
  error={error}
  onRetry={handleRetry}
  onLogin={handleLogin}
>
  <MyContent />
</AuthLoadingWrapper>
```

#### Individual Loading Components
```jsx
import { 
  AuthValidationLoading,
  TokenRefreshLoading,
  PermissionValidationLoading,
  AuthErrorState,
  PermissionDeniedState
} from '../components/AuthLoadingStates';

// Show during authentication validation
<AuthValidationLoading message="Validating your access..." />

// Show during token refresh
<TokenRefreshLoading message="Refreshing your session..." />

// Show during permission check
<PermissionValidationLoading message="Checking permissions..." />

// Show authentication errors
<AuthErrorState
  title="Authentication Error"
  message="Please log in again"
  onRetry={handleRetry}
  onLogin={handleLogin}
/>

// Show permission errors
<PermissionDeniedState
  title="Access Denied"
  message="You don't have permission to access this resource"
  onGoBack={handleGoBack}
/>
```

### 5. Token Refresh Service

Proactive token refresh with monitoring.

```jsx
import tokenRefreshService from '../services/tokenRefreshService';

// Get token status
const status = tokenRefreshService.getTokenStatus();
console.log('Token valid:', status.isValid);
console.log('Time remaining:', status.timeRemaining);

// Force refresh
await tokenRefreshService.forceRefresh();

// Listen to refresh events
const unsubscribe = tokenRefreshService.addListener((event, data) => {
  switch (event) {
    case 'TOKEN_EXPIRED':
      console.log('Token expired');
      break;
    case 'TOKEN_EXPIRING_SOON':
      console.log('Token expiring soon');
      break;
    case 'REFRESH_SUCCESS':
      console.log('Token refreshed successfully');
      break;
    case 'REFRESH_FAILED':
      console.log('Token refresh failed');
      break;
  }
});

// Cleanup
unsubscribe();
```

## Server-Side Validation

### Enhanced JWT Middleware

The server-side JWT middleware now includes comprehensive validation:

```javascript
// Basic JWT verification
app.use('/api/protected', verifyJWT);

// Role-based access
app.use('/api/admin', verifyJWT, requireAdmin);

// Permission-based access
app.use('/api/users', verifyJWT, requirePermission('user:manage'));

// Multiple permissions
app.use('/api/posts', verifyJWT, requireAnyPermission(['post:write', 'post:moderate']));

// Optional authentication
app.use('/api/public', optionalAuth);
```

### Available Middleware:
- `verifyJWT`: Enhanced JWT verification with comprehensive security checks
- `requireRole(role)`: Require specific role
- `requireAdmin`: Require admin role
- `requirePermission(permission)`: Require specific permission
- `requireAnyPermission(permissions)`: Require any of the specified permissions
- `requireAllPermissions(permissions)`: Require all specified permissions
- `optionalAuth`: Optional authentication (continues without auth if no token)

## Permission System

### Available Roles:
- `admin`: Full system access
- `moderator`: Content moderation and user management
- `user`: Basic user permissions
- `guest`: Read-only access

### Available Permissions:
- `user:read`, `user:write`, `user:delete`, `user:manage`
- `post:read`, `post:write`, `post:delete`, `post:moderate`
- `category:read`, `category:write`, `category:delete`
- `location:read`, `location:write`, `location:delete`
- `system:admin`, `system:config`, `system:logs`
- `reports:read`, `reports:write`, `analytics:read`
- `content:moderate`, `content:approve`, `content:reject`

## Best Practices

### 1. Use Appropriate Components
```jsx
// For route protection
<ProtectedRoute requireAuth={true}>
  <MyComponent />
</ProtectedRoute>

// For conditional rendering
<PermissionGate requiredRole="admin">
  <AdminButton />
</PermissionGate>

// For loading states
<AuthLoadingWrapper isLoading={isLoading}>
  <MyContent />
</AuthLoadingWrapper>
```

### 2. Handle Authentication Errors
```jsx
const { error, onAuthError } = useAuthValidation({
  onAuthError: (error) => {
    // Log error
    console.error('Authentication error:', error);
    
    // Show user-friendly message
    toast.error('Please log in again');
    
    // Redirect to login
    navigate('/login');
  }
});
```

### 3. Monitor Token Status
```jsx
useEffect(() => {
  const unsubscribe = tokenRefreshService.addListener((event, data) => {
    if (event === 'TOKEN_EXPIRING_SOON') {
      toast.warning('Your session will expire soon');
    }
  });

  return unsubscribe;
}, []);
```

### 4. Use Permission Utilities
```jsx
import { validatePermissions, canAccessRoute } from '../utils/permissionUtils';

// Validate permissions
const validation = validatePermissions(user, {
  requiredRole: 'admin',
  requiredPermissions: ['user:manage']
});

if (!validation.valid) {
  console.log('Access denied:', validation.reason);
}

// Check route access
if (canAccessRoute(user, '/admin/users')) {
  // User can access admin users page
}
```

## Error Handling

### Authentication Errors:
- `NO_TOKEN`: No authentication token provided
- `TOKEN_EXPIRED`: Token has expired
- `TOKEN_MALFORMED`: Token format is invalid
- `TOKEN_REVOKED`: Token has been blacklisted
- `INVALID_PAYLOAD`: Token payload is invalid

### Permission Errors:
- `INSUFFICIENT_ROLE`: User doesn't have required role
- `INSUFFICIENT_PERMISSION`: User doesn't have required permission
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required permissions

## Integration with Existing Code

### Update Existing Components:
```jsx
// Before
const MyComponent = () => {
  const { user } = useSelector(selectCurrentUser);
  
  if (!user) return <div>Please log in</div>;
  
  return <div>Content</div>;
};

// After
const MyComponent = () => {
  const { isAuthenticated, isLoading } = useAuthValidation({
    requireAuth: true
  });
  
  if (isLoading) return <AuthValidationLoading />;
  if (!isAuthenticated) return <AuthErrorState onLogin={() => navigate('/login')} />;
  
  return <div>Content</div>;
};
```

### Update Route Protection:
```jsx
// Before
<Route path="/admin" element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/login" />} />

// After
<Route path="/admin" element={
  <AdminRoute>
    <AdminPanel />
  </AdminRoute>
} />
```

## Testing

### Test Authentication States:
```jsx
import { render, screen } from '@testing-library/react';
import { useAuthValidation } from '../hooks/useAuthValidation';

// Mock the hook
jest.mock('../hooks/useAuthValidation');
useAuthValidation.mockReturnValue({
  isValid: true,
  isLoading: false,
  isAuthenticated: true,
  canAccess: true
});

test('renders protected content when authenticated', () => {
  render(<MyProtectedComponent />);
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

### Test Permission Gates:
```jsx
import { usePermissions } from '../hooks/usePermissions';

// Mock permissions
usePermissions.mockReturnValue({
  isAdmin: () => true,
  canCreatePosts: () => true
});

test('shows admin content for admin users', () => {
  render(<MyComponent />);
  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
});
```

This comprehensive authentication validation system provides robust security, excellent user experience, and easy integration with your existing codebase.
