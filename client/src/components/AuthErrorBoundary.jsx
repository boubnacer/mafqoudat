/**
 * Authentication Error Boundary Component
 * 
 * This component catches JavaScript errors anywhere in the authentication
 * component tree, logs those errors, and displays a fallback UI instead
 * of the component tree that crashed.
 */

import React, { Component } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { Refresh, Login, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../utils/translations';
import { authStorage } from '../utils/authStorage';
import { performLogout } from '../utils/logoutUtils';
import authErrorHandler from '../utils/authErrorHandler';

class AuthErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // Generate unique error ID for tracking
    const errorId = `auth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report error to error handler
    this.reportError(error, errorInfo, errorId);
  }

  reportError = (error, errorInfo, errorId) => {
    try {
      // Create a structured error object for the auth error handler
      const authError = {
        status: 500,
        message: error.message || 'Authentication component error',
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId,
        type: 'AUTH_COMPONENT_ERROR'
      };

      // Handle the error through the centralized auth error handler
      authErrorHandler.handleAuthError(authError, {
        cleanupState: true,
        redirect: false // We'll handle redirect in the component
      });
    } catch (reportingError) {
      console.error('Failed to report auth error:', reportingError);
    }
  };

  handleRetry = async () => {
    try {
      // Clear any corrupted auth state
      authStorage.clearAuth();
      
      // Reset error boundary state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    } catch (retryError) {
      console.error('Error during retry:', retryError);
    }
  };

  handleLogout = async () => {
    try {
      await performLogout({ forceClientSide: true });
      window.location.href = '/login';
    } catch (logoutError) {
      console.error('Error during logout:', logoutError);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback 
            error={error} 
            errorId={errorId}
            onRetry={this.handleRetry}
            onLogout={this.handleLogout}
            onGoHome={this.handleGoHome}
          />
        );
      }

      // Default fallback UI
      return <AuthErrorFallback 
        error={error} 
        errorId={errorId}
        onRetry={this.handleRetry}
        onLogout={this.handleLogout}
        onGoHome={this.handleGoHome}
      />;
    }

    return children;
  }
}

/**
 * Default Auth Error Fallback Component
 */
const AuthErrorFallback = ({ error, errorId, onRetry, onLogout, onGoHome }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        backgroundColor: 'background.default',
        textAlign: 'center'
      }}
    >
      <Alert 
        severity="error" 
        sx={{ 
          maxWidth: 600, 
          width: '100%',
          mb: 3 
        }}
      >
        <AlertTitle>
          {t('authErrorTitle') || 'Authentication Error'}
        </AlertTitle>
        {t('authErrorMessage') || 'Something went wrong with the authentication system. Please try again.'}
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Error ID: {errorId}
        </Typography>
        {process.env.NODE_ENV === 'development' && error && (
          <Typography variant="caption" color="error" sx={{ 
            display: 'block', 
            textAlign: 'left',
            backgroundColor: 'error.light',
            color: 'error.contrastText',
            padding: 2,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            maxWidth: 600,
            overflow: 'auto'
          }}>
            {error.message}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRetry}
          sx={{ minWidth: 120 }}
        >
          {t('retry') || 'Retry'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Login />}
          onClick={onLogout}
          sx={{ minWidth: 120 }}
        >
          {t('login') || 'Login Again'}
        </Button>
        
        <Button
          variant="text"
          startIcon={<Home />}
          onClick={onGoHome}
          sx={{ minWidth: 120 }}
        >
          {t('goHome') || 'Go Home'}
        </Button>
      </Box>

      <Box sx={{ mt: 3, maxWidth: 600 }}>
        <Typography variant="body2" color="text.secondary">
          {t('authErrorHelp') || 'If this problem persists, please contact support with the error ID above.'}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Hook-based Auth Error Boundary for functional components
 */
export const useAuthErrorBoundary = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAuthError = async (error, options = {}) => {
    try {
      const result = await authErrorHandler.handleAuthError(error, options);
      
      if (result.requiresLogout) {
        // Clear auth state
        authStorage.clearAuth();
        
        // Navigate to login
        navigate('/login');
      }
      
      return result;
    } catch (handlerError) {
      console.error('Error in auth error boundary hook:', handlerError);
      // Fallback: clear state and redirect
      authStorage.clearAuth();
      navigate('/login');
    }
  };

  return { handleAuthError };
};

/**
 * Higher-order component for wrapping components with auth error boundary
 */
export const withAuthErrorBoundary = (WrappedComponent, fallbackComponent = null) => {
  return function AuthErrorBoundaryWrapper(props) {
    return (
      <AuthErrorBoundaryClass fallback={fallbackComponent}>
        <WrappedComponent {...props} />
      </AuthErrorBoundaryClass>
    );
  };
};

// Export the main component
const AuthErrorBoundary = AuthErrorBoundaryClass;

export default AuthErrorBoundary;
