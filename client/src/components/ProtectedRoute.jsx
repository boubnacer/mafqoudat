import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../features/auth/authSlice';
import { selectCurrentCountry } from '../app/state';

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
  const currentCountry = useSelector(selectCurrentCountry);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if this is a language change refresh and give auth state time to restore
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isLanguageChange = urlParams.get('lang_changed') === 'true';
    const isLanguageChanging = localStorage.getItem('isLanguageChanging') === 'true';
    
    if (isLanguageChange || isLanguageChanging) {
      // Give authentication state time to restore after language change
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 200); // Reduced delay to minimize loading oscillation
      
      return () => clearTimeout(timer);
    } else {
      setIsInitialized(true);
    }
  }, [location.search]);

  // Debug logging - only for language changes or issues
  if (!isInitialized || (requireCountry && !currentCountry)) {
    console.log('🔒 [LANG-FIX] ProtectedRoute - Location:', location.pathname, 'RequireCountry:', requireCountry, 'Country:', currentCountry, 'Initialized:', isInitialized);
  }

  // Don't make routing decisions until initialized (especially after language change)
  if (!isInitialized) {
    return null; // or a loading indicator
  }

  // Check authentication requirement
  if (requireAuth && !isLoggedIn) {
    console.log('ProtectedRoute - Authentication required but user not logged in, redirecting to login');
    // Store the attempted URL for redirect after login
    const redirectUrl = location.pathname + location.search;
    if (redirectUrl !== '/login') {
      localStorage.setItem('redirectAfterLogin', redirectUrl);
    }
    return <Navigate to="/login" replace />;
  }

  // Check country selection requirement
  if (requireCountry && !currentCountry) {
    // Check if this is a language change refresh - if so, wait a bit longer for country state to restore
    const urlParams = new URLSearchParams(location.search);
    const isLanguageChange = urlParams.get('lang_changed') === 'true';
    const isLanguageChanging = localStorage.getItem('isLanguageChanging') === 'true';
    
    console.log('🔒 [LANG-FIX] ProtectedRoute - Checking language change:', { 
      isLanguageChange, 
      isLanguageChanging, 
      urlParams: location.search 
    });
    
    if (isLanguageChange || isLanguageChanging) {
      console.log('🔒 [LANG-FIX] ProtectedRoute - Language change detected, waiting for country state to restore...');
      // During language change, give more time for country state to restore
      // Don't redirect immediately, let the component re-render and check again
      return null; // or a loading indicator
    } else {
      console.log('🔒 ProtectedRoute - Country required but not selected, redirecting to Welcome page');
      // Store the attempted URL for redirect after country selection
      const redirectUrl = location.pathname + location.search;
      if (redirectUrl !== '/') {
        localStorage.setItem('redirectAfterCountrySelection', redirectUrl);
      }
      return <Navigate to="/" replace />;
    }
  }

  // All conditions met, render children
  console.log('ProtectedRoute - All conditions met, rendering children');
  return children;
};

export default ProtectedRoute;