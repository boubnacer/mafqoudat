/**
 * Authentication Error Feedback Component
 * 
 * This component provides comprehensive user feedback for different
 * authentication error types with appropriate actions and suggestions.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Refresh as RetryIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  Support as SupportIcon,
  Lock as LockIcon,
  WifiOff as NetworkIcon
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';
import { useNavigate } from 'react-router-dom';
import authErrorHandler, { AUTH_ERROR_TYPES } from '../utils/authErrorHandler';

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error severity configuration
 */
const ERROR_SEVERITY_CONFIG = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: ERROR_SEVERITY.MEDIUM,
  [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: ERROR_SEVERITY.LOW,
  [AUTH_ERROR_TYPES.TOKEN_EXPIRED]: ERROR_SEVERITY.MEDIUM,
  [AUTH_ERROR_TYPES.TOKEN_INVALID]: ERROR_SEVERITY.MEDIUM,
  [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: ERROR_SEVERITY.HIGH,
  [AUTH_ERROR_TYPES.SERVER_ERROR]: ERROR_SEVERITY.HIGH,
  [AUTH_ERROR_TYPES.VALIDATION_ERROR]: ERROR_SEVERITY.LOW,
  [AUTH_ERROR_TYPES.RATE_LIMITED]: ERROR_SEVERITY.MEDIUM,
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: ERROR_SEVERITY.MEDIUM
};

/**
 * Get severity color and icon
 */
const getSeverityInfo = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.LOW:
      return { color: 'info', icon: InfoIcon };
    case ERROR_SEVERITY.MEDIUM:
      return { color: 'warning', icon: WarningIcon };
    case ERROR_SEVERITY.HIGH:
      return { color: 'error', icon: ErrorIcon };
    case ERROR_SEVERITY.CRITICAL:
      return { color: 'error', icon: LockIcon };
    default:
      return { color: 'info', icon: InfoIcon };
  }
};

/**
 * Get error-specific icon
 */
const getErrorIcon = (errorType) => {
  switch (errorType) {
    case AUTH_ERROR_TYPES.NETWORK_ERROR:
      return NetworkIcon;
    case AUTH_ERROR_TYPES.ACCOUNT_LOCKED:
      return LockIcon;
    case AUTH_ERROR_TYPES.TOKEN_EXPIRED:
    case AUTH_ERROR_TYPES.TOKEN_INVALID:
      return LoginIcon;
    default:
      return ErrorIcon;
  }
};

/**
 * Auth Error Feedback Component
 */
const AuthErrorFeedback = ({
  error,
  errorType,
  onRetry,
  onDismiss,
  showSnackbar = true,
  showDialog = false,
  autoHide = true,
  autoHideDuration = 5000
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const severity = ERROR_SEVERITY_CONFIG[errorType] || ERROR_SEVERITY.MEDIUM;
  const severityInfo = getSeverityInfo(severity);
  const ErrorIcon = getErrorIcon(errorType);
  const errorMessage = authErrorHandler.getErrorMessage(errorType);

  useEffect(() => {
    if (autoHide && showSnackbar) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
        onDismiss?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDuration, onDismiss, showSnackbar]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleSupport = () => {
    // Open support contact or help page
    window.open('/support', '_blank');
  };

  const getActionButtons = () => {
    const buttons = [];

    // Retry button for certain error types
    if ([
      AUTH_ERROR_TYPES.NETWORK_ERROR,
      AUTH_ERROR_TYPES.SERVER_ERROR,
      AUTH_ERROR_TYPES.UNKNOWN_ERROR
    ].includes(errorType)) {
      buttons.push(
        <Button
          key="retry"
          variant="contained"
          startIcon={isRetrying ? <CircularProgress size={16} /> : <RetryIcon />}
          onClick={handleRetry}
          disabled={isRetrying}
          size="small"
        >
          {t('retry') || 'Retry'}
        </Button>
      );
    }

    // Login button for auth-related errors
    if ([
      AUTH_ERROR_TYPES.TOKEN_EXPIRED,
      AUTH_ERROR_TYPES.TOKEN_INVALID,
      AUTH_ERROR_TYPES.INVALID_CREDENTIALS
    ].includes(errorType)) {
      buttons.push(
        <Button
          key="login"
          variant="outlined"
          startIcon={<LoginIcon />}
          onClick={handleLogin}
          size="small"
        >
          {t('login') || 'Login Again'}
        </Button>
      );
    }

    // Support button for account locked
    if (errorType === AUTH_ERROR_TYPES.ACCOUNT_LOCKED) {
      buttons.push(
        <Button
          key="support"
          variant="outlined"
          startIcon={<SupportIcon />}
          onClick={handleSupport}
          size="small"
        >
          {t('contactSupport') || 'Contact Support'}
        </Button>
      );
    }

    // Home button as fallback
    buttons.push(
      <Button
        key="home"
        variant="text"
        startIcon={<HomeIcon />}
        onClick={handleGoHome}
        size="small"
      >
        {t('goHome') || 'Go Home'}
      </Button>
    );

    return buttons;
  };

  const getHelpfulTips = () => {
    switch (errorType) {
      case AUTH_ERROR_TYPES.NETWORK_ERROR:
        return [
          t('checkInternetConnection') || 'Check your internet connection',
          t('tryAgainLater') || 'Try again in a few moments',
          t('contactSupportIfPersistent') || 'Contact support if the problem persists'
        ];
      
      case AUTH_ERROR_TYPES.INVALID_CREDENTIALS:
        return [
          t('checkEmailPassword') || 'Double-check your email/phone and password',
          t('useForgotPassword') || 'Use "Forgot Password" if needed',
          t('contactSupportIfStillIssues') || 'Contact support if you still have issues'
        ];
      
      case AUTH_ERROR_TYPES.ACCOUNT_LOCKED:
        return [
          t('waitBeforeRetrying') || 'Wait before retrying login attempts',
          t('contactSupportToUnlock') || 'Contact support to unlock your account',
          t('checkEmailForInstructions') || 'Check your email for unlock instructions'
        ];
      
      case AUTH_ERROR_TYPES.RATE_LIMITED:
        return [
          t('waitBeforeRetrying') || 'Wait a few minutes before trying again',
          t('avoidRapidRequests') || 'Avoid making rapid requests',
          t('contactSupportIfNeeded') || 'Contact support if you need immediate access'
        ];
      
      default:
        return [
          t('tryAgainLater') || 'Try again in a few moments',
          t('contactSupportIfPersistent') || 'Contact support if the problem persists'
        ];
    }
  };

  const renderSnackbar = () => (
    <Snackbar
      open={showFeedback}
      onClose={() => {
        setShowFeedback(false);
        onDismiss?.();
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={severityInfo.color}
        icon={<ErrorIcon />}
        onClose={() => {
          setShowFeedback(false);
          onDismiss?.();
        }}
        sx={{ minWidth: 400 }}
      >
        <AlertTitle>{errorMessage.title}</AlertTitle>
        {errorMessage.message}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {getActionButtons()}
        </Box>
      </Alert>
    </Snackbar>
  );

  const renderDialog = () => (
    <Dialog
      open={showFeedback}
      onClose={() => {
        setShowFeedback(false);
        onDismiss?.();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorIcon color={severityInfo.color} />
        {errorMessage.title}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {errorMessage.message}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('helpfulTips') || 'Helpful Tips:'}
        </Typography>
        
        <Stack spacing={1}>
          {getHelpfulTips().map((tip, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={index + 1}
                size="small"
                color={severityInfo.color}
                sx={{ minWidth: 24, height: 24 }}
              />
              <Typography variant="body2">{tip}</Typography>
            </Box>
          ))}
        </Stack>
        
        {error?.errorId && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Error ID: {error.errorId}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {getActionButtons()}
        <Button
          onClick={() => {
            setShowFeedback(false);
            onDismiss?.();
          }}
        >
          {t('dismiss') || 'Dismiss'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!showFeedback) {
    return null;
  }

  return showDialog ? renderDialog() : renderSnackbar();
};

/**
 * Auth Error Feedback Hook
 */
export const useAuthErrorFeedback = () => {
  const [errors, setErrors] = useState([]);

  const showError = (error, errorType, options = {}) => {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const errorInfo = {
      id: errorId,
      error,
      errorType,
      timestamp: Date.now(),
      ...options
    };

    setErrors(prev => [...prev, errorInfo]);

    // Auto-remove after duration
    if (options.autoHide !== false) {
      setTimeout(() => {
        removeError(errorId);
      }, options.duration || 5000);
    }
  };

  const removeError = (errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    showError,
    removeError,
    clearAllErrors
  };
};

/**
 * Global Auth Error Feedback Provider
 */
export const AuthErrorFeedbackProvider = ({ children }) => {
  const { errors, removeError, showError } = useAuthErrorFeedback();

  useEffect(() => {
    // Listen for auth errors from the error handler
    const handleAuthError = (errorInfo) => {
      showError(errorInfo.originalError, errorInfo.errorType, {
        autoHide: true,
        duration: 7000,
        showDialog: errorInfo.errorType === AUTH_ERROR_TYPES.ACCOUNT_LOCKED
      });
    };

    authErrorHandler.addErrorListener(handleAuthError);

    return () => {
      authErrorHandler.removeErrorListener(handleAuthError);
    };
  }, [showError]);

  return (
    <>
      {children}
      {errors.map((errorInfo) => (
        <AuthErrorFeedback
          key={errorInfo.id}
          error={errorInfo.error}
          errorType={errorInfo.errorType}
          onRetry={errorInfo.onRetry}
          onDismiss={() => removeError(errorInfo.id)}
          showSnackbar={!errorInfo.showDialog}
          showDialog={errorInfo.showDialog}
          autoHide={errorInfo.autoHide}
          autoHideDuration={errorInfo.duration}
        />
      ))}
    </>
  );
};

export default AuthErrorFeedback;
