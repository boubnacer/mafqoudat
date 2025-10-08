import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoggedIn } from '../features/auth/authSlice';
import { selectCurrentCountry } from '../app/state';
import useAuth from '../hooks/useAuth';
import { Alert, Snackbar } from '@mui/material';
import { store } from '../app/store';

// Debug configuration
const DEBUG_AUTH = true;

// Debug logging function
const debugLog = (message, data = null) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔍 [PROTECTED-ROUTE] ${message}`, { timestamp, ...data });
    } else {
      console.log(`🔍 [PROTECTED-ROUTE] ${message} - ${timestamp}`);
    }
  }
};

/**
 * ProtectedRoute component that checks authentication and country selection
 * Simplified - no refresh token logic, tokens are long-lived (30 days)
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {boolean} props.requireCountry - Whether country selection is required (default: true)
 * @param {string} props.redirectTo - Where to redirect if conditions not met (default: '/')
 * @returns {React.ReactNode} Protected content or redirect
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireCountry = false, 
  redirectTo = '/' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentCountry = useSelector(selectCurrentCountry);
  const { country: userCountry } = useAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [showRateLimitAlert, setShowRateLimitAlert] = useState(false);

  debugLog('ProtectedRoute component initialized', {
    pathname: location.pathname,
    requireAuth,
    requireCountry,
    redirectTo,
    isLoggedIn,
    currentCountry,
    userCountry,
    isInitialized
  });

  // Global error handler for rate limiting
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.detail && event.detail.status === 429) {
        debugLog('Global rate limiting error detected', { error: event.detail });
        setRateLimitError(event.detail);
        setShowRateLimitAlert(true);
      }
    };

    window.addEventListener('rateLimitError', handleGlobalError);
    
    return () => {
      window.removeEventListener('rateLimitError', handleGlobalError);
    };
  }, []);

  // State synchronization check
  useEffect(() => {
    const checkAuthState = () => {
      const state = store.getState();
      const { token, isLoggedIn: stateIsLoggedIn } = state.auth;
      
      if (token && !stateIsLoggedIn) {
        console.warn('🚨 Auth state inconsistency detected, forcing update');
        dispatch({ type: 'auth/forceUpdate' });
      }
    };
    
    const interval = setInterval(checkAuthState, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  // Simple initialization - no complex refresh logic needed
  useEffect(() => {
    debugLog('Initializing protected route');
    // Simple delay to ensure state is loaded
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Redirect logic - no refresh delays needed with long-lived tokens
  useEffect(() => {
    if (!isInitialized) return;

    if (requireAuth && !isLoggedIn) {
      debugLog('User not authenticated, redirecting to login', {
        requireAuth,
        isLoggedIn,
        pathname: location.pathname
      });
      console.log('🚨 User not authenticated, redirecting to login');
      const redirectUrl = location.pathname + location.search;
      if (redirectUrl !== '/login') {
        localStorage.setItem('redirectAfterLogin', redirectUrl);
      }
      navigate('/login', { replace: true });
      return;
    }

    if (requireCountry && !currentCountry && isLoggedIn && !userCountry) {
      debugLog('Country required but not selected, redirecting to Welcome page', {
        requireCountry,
        currentCountry,
        isLoggedIn,
        pathname: location.pathname
      });
      console.log('🚨 Country required but not selected, redirecting to Welcome page');
      const redirectUrl = location.pathname + location.search;
      if (redirectUrl !== '/') {
        localStorage.setItem('redirectAfterCountrySelection', redirectUrl);
      }
      navigate('/', { replace: true, state: { from: location.pathname } });
      return;
    }

    debugLog('All conditions met, rendering children', {
      requireAuth,
      isLoggedIn,
      requireCountry,
      currentCountry,
      pathname: location.pathname
    });
  }, [requireAuth, requireCountry, isLoggedIn, currentCountry, userCountry, isInitialized, location.pathname, location.search, navigate]);

  // Handle rate limit alert close
  const handleRateLimitAlertClose = () => {
    setShowRateLimitAlert(false);
    setRateLimitError(null);
  };

  // Loading state while initializing
  if (!isInitialized) {
    debugLog('Not initialized, showing loading');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ margin: 0, color: '#666' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // All conditions met, render children
  debugLog('Rendering protected content', {
    requireAuth,
    isLoggedIn,
    requireCountry,
    currentCountry,
    pathname: location.pathname
  });
  
  return (
    <>
      {children}
      {/* Rate limiting error alert */}
      <Snackbar
        open={showRateLimitAlert}
        autoHideDuration={10000}
        onClose={handleRateLimitAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleRateLimitAlertClose} 
          severity="warning"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {rateLimitError?.data?.message || 'Too many requests. Please wait a moment and try again.'}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProtectedRoute;
