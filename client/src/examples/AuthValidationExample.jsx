import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Import our authentication validation components and hooks
import { useAuthValidation } from '../hooks/useAuthValidation';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGate } from '../hooks/usePermissions';
import { AuthStatusIndicator } from '../components/AuthLoadingStates';
import { ProtectedRoute, AdminRoute, UserRoute } from '../components/ProtectedRoute';
import tokenRefreshService from '../services/tokenRefreshService';

/**
 * Example component demonstrating comprehensive authentication state validation
 */
const AuthValidationExample = () => {
  // Use authentication validation hook
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
    autoRefresh: true,
    onAuthError: (error) => {
      console.error('Authentication error:', error);
    },
    onPermissionDenied: (error) => {
      console.error('Permission denied:', error);
    }
  });

  // Use permissions hook
  const permissions = usePermissions();

  // Get token status from service
  const tokenStatus = tokenRefreshService.getTokenStatus();

  const handleForceRefresh = async () => {
    try {
      await tokenRefreshService.forceRefresh();
      console.log('Token refresh triggered');
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  };

  const handleValidateAuth = async () => {
    try {
      await triggerValidation();
      console.log('Authentication validation triggered');
    } catch (error) {
      console.error('Failed to validate authentication:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Authentication State Validation Example
      </Typography>
      
      {/* Authentication Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Authentication Status
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AuthStatusIndicator 
                  isValid={isValid}
                  isExpiringSoon={isExpiringSoon}
                  isRefreshing={isRefreshing}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Token Status: {tokenStatus.isValid ? 'Valid' : 'Invalid'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time Remaining: {Math.round(tokenStatus.timeRemaining / 1000)}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Is Refreshing: {tokenStatus.isRefreshing ? 'Yes' : 'No'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={isAuthenticated ? 'Authenticated' : 'Not Authenticated'} 
                  color={isAuthenticated ? 'success' : 'error'}
                  size="small"
                />
                <Chip 
                  label={canAccess ? 'Can Access' : 'Access Denied'} 
                  color={canAccess ? 'success' : 'error'}
                  size="small"
                />
                <Chip 
                  label={isExpiringSoon ? 'Expiring Soon' : 'Valid'} 
                  color={isExpiringSoon ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* User Information */}
      {user && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              User Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Username:</strong> {user.username}
                </Typography>
                <Typography variant="body2">
                  <strong>Role:</strong> {permissions.getRoleDisplayName(user.role)}
                </Typography>
                <Typography variant="body2">
                  <strong>Country:</strong> {user.country}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>User ID:</strong> {user.usernameId}
                </Typography>
                <Typography variant="body2">
                  <strong>Permissions:</strong> {permissions.getPermissions().length} total
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Permission Examples */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AdminIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Permission Examples
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Role Checks:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`Admin: ${permissions.isAdmin() ? 'Yes' : 'No'}`}
                  color={permissions.isAdmin() ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`Moderator: ${permissions.isModerator() ? 'Yes' : 'No'}`}
                  color={permissions.isModerator() ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`Authenticated: ${permissions.isAuthenticated() ? 'Yes' : 'No'}`}
                  color={permissions.isAuthenticated() ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Content Permissions:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`Create Posts: ${permissions.canCreatePosts() ? 'Yes' : 'No'}`}
                  color={permissions.canCreatePosts() ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`Delete Posts: ${permissions.canDeletePosts() ? 'Yes' : 'No'}`}
                  color={permissions.canDeletePosts() ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`Moderate Posts: ${permissions.canModeratePosts() ? 'Yes' : 'No'}`}
                  color={permissions.canModeratePosts() ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Admin Permissions:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`Manage Users: ${permissions.canManageUsers() ? 'Yes' : 'No'}`}
                  color={permissions.canManageUsers() ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`View Reports: ${permissions.canViewReports() ? 'Yes' : 'No'}`}
                  color={permissions.canViewReports() ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`Access Admin: ${permissions.canAccessAdmin() ? 'Yes' : 'No'}`}
                  color={permissions.canAccessAdmin() ? 'success' : 'No'}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Permission Gates Examples */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Permission Gates Examples
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Admin Only Content:
              </Typography>
              <PermissionGate requiredRole={permissions.ROLES.ADMIN}>
                <Alert severity="success">
                  This content is only visible to administrators!
                </Alert>
              </PermissionGate>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Post Creation Permission:
              </Typography>
              <PermissionGate 
                requiredPermissions={[permissions.PERMISSIONS.POST_WRITE]}
                fallback={<Alert severity="info">You need post creation permission to see this content.</Alert>}
              >
                <Button variant="contained" startIcon={<EditIcon />}>
                  Create New Post
                </Button>
              </PermissionGate>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Multiple Permissions:
              </Typography>
              <PermissionGate 
                requiredAnyPermissions={[
                  permissions.PERMISSIONS.POST_DELETE,
                  permissions.PERMISSIONS.POST_MODERATE
                ]}
                fallback={<Alert severity="warning">You need delete or moderate permissions.</Alert>}
              >
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
                  Delete Post
                </Button>
              </PermissionGate>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              onClick={handleForceRefresh}
              disabled={isRefreshing}
            >
              Force Token Refresh
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleValidateAuth}
              disabled={isLoading}
            >
              Validate Authentication
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => {
                const status = tokenRefreshService.getTokenStatus();
                console.log('Token Status:', status);
              }}
            >
              Log Token Status
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

/**
 * Example of using ProtectedRoute components
 */
const ProtectedContentExample = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Protected Route Examples
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Route
              </Typography>
              <UserRoute>
                <Alert severity="success">
                  This content is only visible to authenticated users!
                </Alert>
              </UserRoute>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Admin Route
              </Typography>
              <AdminRoute>
                <Alert severity="warning">
                  This content is only visible to administrators!
                </Alert>
              </AdminRoute>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Custom Protected Route
              </Typography>
              <ProtectedRoute
                requiredPermissions={[permissions.PERMISSIONS.POST_MODERATE]}
                fallbackPath="/unauthorized"
              >
                <Alert severity="info">
                  This content requires post moderation permissions!
                </Alert>
              </ProtectedRoute>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthValidationExample;
export { ProtectedContentExample };
