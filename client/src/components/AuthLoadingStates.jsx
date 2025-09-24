import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Alert, 
  AlertTitle,
  Button,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

/**
 * Authentication Loading States Component
 * 
 * Provides comprehensive loading states for authentication operations
 */

/**
 * Basic loading spinner with message
 */
export const AuthLoadingSpinner = ({ message = "Loading...", size = 40 }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center"
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={size} />
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

/**
 * Authentication validation loading state
 */
export const AuthValidationLoading = ({ message = "Validating authentication..." }) => (
  <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
    <CardContent>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <SecurityIcon color="primary" sx={{ fontSize: 48 }} />
        <Typography variant="h6" textAlign="center">
          Authentication Check
        </Typography>
        <Box width="100%">
          <LinearProgress />
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

/**
 * Token refresh loading state
 */
export const TokenRefreshLoading = ({ message = "Refreshing session..." }) => (
  <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
    <CardContent>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <RefreshIcon color="primary" sx={{ fontSize: 48 }} />
        <Typography variant="h6" textAlign="center">
          Session Refresh
        </Typography>
        <Box width="100%">
          <LinearProgress />
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

/**
 * Permission validation loading state
 */
export const PermissionValidationLoading = ({ message = "Checking permissions..." }) => (
  <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
    <CardContent>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <SecurityIcon color="warning" sx={{ fontSize: 48 }} />
        <Typography variant="h6" textAlign="center">
          Permission Check
        </Typography>
        <Box width="100%">
          <LinearProgress />
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

/**
 * Authentication error state
 */
export const AuthErrorState = ({ 
  title = "Authentication Error",
  message = "An authentication error occurred",
  onRetry = null,
  onLogin = null
}) => (
  <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
    <CardContent>
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
      
      <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
        {onRetry && (
          <Button 
            variant="outlined" 
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        )}
        {onLogin && (
          <Button 
            variant="contained" 
            onClick={onLogin}
            startIcon={<SecurityIcon />}
          >
            Login
          </Button>
        )}
      </Box>
    </CardContent>
  </Card>
);

/**
 * Permission denied state
 */
export const PermissionDeniedState = ({ 
  title = "Access Denied",
  message = "You don't have permission to access this resource",
  onGoBack = null
}) => (
  <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
    <CardContent>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <ErrorIcon color="error" sx={{ fontSize: 64 }} />
        <Typography variant="h5" textAlign="center" color="error">
          {title}
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary">
          {message}
        </Typography>
        
        {onGoBack && (
          <Button 
            variant="contained" 
            onClick={onGoBack}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        )}
      </Box>
    </CardContent>
  </Card>
);

/**
 * Authentication success state
 */
export const AuthSuccessState = ({ 
  message = "Authentication successful",
  showIcon = true
}) => (
  <Box display="flex" alignItems="center" gap={1} p={2}>
    {showIcon && <CheckCircleIcon color="success" />}
    <Typography variant="body2" color="success.main">
      {message}
    </Typography>
  </Box>
);

/**
 * Comprehensive authentication loading wrapper
 */
export const AuthLoadingWrapper = ({ 
  children,
  isLoading = false,
  isRefreshing = false,
  isValidating = false,
  isValid = false,
  hasPermission = false,
  error = null,
  permissionError = null,
  onRetry = null,
  onLogin = null,
  onGoBack = null,
  loadingMessage = "Loading...",
  refreshMessage = "Refreshing session...",
  validationMessage = "Validating authentication...",
  permissionMessage = "Checking permissions..."
}) => {
  // Show loading state
  if (isLoading || isValidating) {
    return <AuthValidationLoading message={validationMessage} />;
  }

  // Show refresh state
  if (isRefreshing) {
    return <TokenRefreshLoading message={refreshMessage} />;
  }

  // Show permission check
  if (isValid && !hasPermission && !permissionError) {
    return <PermissionValidationLoading message={permissionMessage} />;
  }

  // Show authentication error
  if (error) {
    return (
      <AuthErrorState
        title="Authentication Error"
        message={error}
        onRetry={onRetry}
        onLogin={onLogin}
      />
    );
  }

  // Show permission error
  if (permissionError) {
    return (
      <PermissionDeniedState
        title="Access Denied"
        message={permissionError}
        onGoBack={onGoBack}
      />
    );
  }

  // Show content if authenticated and authorized
  if (isValid && hasPermission) {
    return children;
  }

  // Default loading state
  return <AuthLoadingSpinner message={loadingMessage} />;
};

/**
 * Inline authentication status indicator
 */
export const AuthStatusIndicator = ({ 
  isValid = false,
  isExpiringSoon = false,
  isRefreshing = false,
  size = "small"
}) => {
  if (isRefreshing) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="primary">
          Refreshing...
        </Typography>
      </Box>
    );
  }

  if (isExpiringSoon) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} color="warning" />
        <Typography variant="caption" color="warning.main">
          Expiring soon
        </Typography>
      </Box>
    );
  }

  if (isValid) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
        <Typography variant="caption" color="success.main">
          Authenticated
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <ErrorIcon color="error" sx={{ fontSize: 16 }} />
      <Typography variant="caption" color="error.main">
        Not authenticated
      </Typography>
    </Box>
  );
};

export default {
  AuthLoadingSpinner,
  AuthValidationLoading,
  TokenRefreshLoading,
  PermissionValidationLoading,
  AuthErrorState,
  PermissionDeniedState,
  AuthSuccessState,
  AuthLoadingWrapper,
  AuthStatusIndicator
};
