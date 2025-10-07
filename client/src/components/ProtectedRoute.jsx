import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn, selectIsRefreshing } from '../features/auth/authSlice';
import { selectCurrentCountry } from '../app/state';
import { authStorage } from '../utils/authStorage';
import useAuth from '../hooks/useAuth';

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
  requireCountry = true, 
  redirectTo = '/' 
}) => {
  const location = useLocation();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isRefreshing = useSelector(selectIsRefreshing);
  const currentCountry = useSelector(selectCurrentCountry);
  const { country: userCountry } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [authRestorationInProgress, setAuthRestorationInProgress] = useState(false);

  // Debug initial state
  debugLog('ProtectedRoute component initialized', {
    pathname: location.pathname,
    requireAuth,
    requireCountry,
    redirectTo,
    isLoggedIn,
    isRefreshing,
    currentCountry,
    userCountry,
    isInitialized,
    authRestorationInProgress
  });

  // Check for authentication restoration in progress
  useEffect(() => {
    debugLog('useEffect triggered for auth restoration check');
    
    // Check if we're in the middle of authentication restoration
    const checkAuthRestoration = () => {
      const urlParams = new URLSearchParams(location.search);
      const isLanguageChange = urlParams.get('lang_changed') === 'true';
      const isLanguageChanging = localStorage.getItem('isLanguageChanging') === 'true';
      const preserveAuthFlag = localStorage.getItem('preserveAuthAfterLanguageChange') === 'true';
      
      // Check if we have auth data in localStorage that needs to be restored
      const authState = authStorage.getAuthState();
      const hasStoredAuth = authState.isLoggedIn && authState.token;
      
      // If we have stored auth but Redux shows not logged in, we're in restoration
      const isRestoring = hasStoredAuth && !isLoggedIn;
      
      // Set restoration flag if any of these conditions are true
      const inRestoration = isLanguageChange || isLanguageChanging || preserveAuthFlag || isRestoring || isRefreshing;
      
      debugLog('Auth restoration check result', {
        isLanguageChange,
        isLanguageChanging,
        preserveAuthFlag,
        hasStoredAuth,
        isRestoring,
        isRefreshing,
        inRestoration,
        pathname: location.pathname
      });
      
      setAuthRestorationInProgress(inRestoration);
      
      if (inRestoration) {
        debugLog('Authentication restoration in progress, setting timer');
        console.log('🔒 [AUTH-RESTORATION] ProtectedRoute - Authentication restoration in progress:', {
          isLanguageChange,
          isLanguageChanging,
          preserveAuthFlag,
          hasStoredAuth,
          isRestoring,
          isRefreshing,
          pathname: location.pathname
        });
        
        // Give more time for authentication restoration
        const timer = setTimeout(() => {
          debugLog('Auth restoration timer completed, setting initialized to true');
          setIsInitialized(true);
        }, 1000); // Increased delay for auth restoration
        
        return () => clearTimeout(timer);
      } else {
        // Normal initialization
        debugLog('Normal initialization, setting initialized to true immediately');
        setIsInitialized(true);
      }
    };

    checkAuthRestoration();
  }, [location.search, isLoggedIn, isRefreshing]);

  // Debug logging - only for auth restoration or issues
  if (!isInitialized || authRestorationInProgress || (requireCountry && !currentCountry)) {
    debugLog('Debug logging triggered', {
      isInitialized,
      authRestorationInProgress,
      requireCountry,
      currentCountry,
      pathname: location.pathname
    });
    console.log('🔒 [AUTH-RESTORATION] ProtectedRoute - Location:', location.pathname, 'RequireAuth:', requireAuth, 'RequireCountry:', requireCountry, 'Country:', currentCountry, 'Initialized:', isInitialized, 'AuthRestoration:', authRestorationInProgress);
  }

  // Don't make routing decisions until initialized and auth restoration is complete
  if (!isInitialized || authRestorationInProgress) {
    debugLog('Not initialized or auth restoration in progress, showing loading');
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
          <p style={{ margin: 0, color: '#666' }}>
            {authRestorationInProgress ? 'Restoring session...' : 'Loading...'}
          </p>
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

  // Check authentication requirement
  if (requireAuth && !isLoggedIn) {
    debugLog('Authentication required but user not logged in, redirecting to login', {
      requireAuth,
      isLoggedIn,
      pathname: location.pathname
    });
    console.log('ProtectedRoute - Authentication required but user not logged in, redirecting to login');
    // Store the attempted URL for redirect after login
    const redirectUrl = location.pathname + location.search;
    if (redirectUrl !== '/login') {
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      debugLog('Stored redirect URL after login', { redirectUrl });
    }
    return <Navigate to="/login" replace />;
  }

  // Check country selection requirement
  if (requireCountry && !currentCountry) {
    debugLog('Country selection requirement check', {
      requireCountry,
      currentCountry,
      isLoggedIn,
      userCountry
    });
    
    // For logged-in users: Skip country requirement since they already have a country in their profile
    if (isLoggedIn && userCountry) {
      debugLog('Logged-in user with country in profile, skipping country requirement');
      console.log('🔒 ProtectedRoute - Logged-in user with country in profile, skipping country requirement');
      return children;
    }
    
    // Check if this is a language change refresh or auth restoration - if so, wait for state to restore
    const urlParams = new URLSearchParams(location.search);
    const isLanguageChange = urlParams.get('lang_changed') === 'true';
    const isLanguageChanging = localStorage.getItem('isLanguageChanging') === 'true';
    const preserveAuthFlag = localStorage.getItem('preserveAuthAfterLanguageChange') === 'true';
    
    debugLog('Country requirement - checking restoration flags', { 
      isLanguageChange, 
      isLanguageChanging, 
      preserveAuthFlag,
      authRestorationInProgress,
      isLoggedIn,
      userCountry,
      urlParams: location.search 
    });
    
    console.log('🔒 [AUTH-RESTORATION] ProtectedRoute - Checking country requirement:', { 
      isLanguageChange, 
      isLanguageChanging, 
      preserveAuthFlag,
      authRestorationInProgress,
      isLoggedIn,
      userCountry,
      urlParams: location.search 
    });
    
    if (isLanguageChange || isLanguageChanging || preserveAuthFlag || authRestorationInProgress) {
      debugLog('Auth restoration detected, waiting for country state to restore');
      console.log('🔒 [AUTH-RESTORATION] ProtectedRoute - Auth restoration detected, waiting for country state to restore...');
      // During auth restoration, give more time for country state to restore
      // Show loading indicator while waiting
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
            <p style={{ margin: 0, color: '#666' }}>
              Restoring session...
            </p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    } else {
      debugLog('Country required but not selected, redirecting to Welcome page');
      console.log('🔒 ProtectedRoute - Country required but not selected, redirecting to Welcome page');
      // Store the attempted URL for redirect after country selection
      const redirectUrl = location.pathname + location.search;
      if (redirectUrl !== '/') {
        localStorage.setItem('redirectAfterCountrySelection', redirectUrl);
        debugLog('Stored redirect URL after country selection', { redirectUrl });
      }
      return <Navigate to="/" replace />;
    }
  }

  // All conditions met, render children
  debugLog('All conditions met, rendering children', {
    requireAuth,
    isLoggedIn,
    requireCountry,
    currentCountry,
    pathname: location.pathname
  });
  console.log('ProtectedRoute - All conditions met, rendering children');
  return children;
};

export default ProtectedRoute;