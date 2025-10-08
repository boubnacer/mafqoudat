import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentCountry } from '../app/state';
import { selectIsLoggedIn } from '../features/auth/authSlice';
import useAuth from '../hooks/useAuth';

/**
 * CountryGuard component that ensures a country is selected before accessing certain routes
 * This is used for routes that don't require authentication but do require country selection
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {boolean} props.allowAuthenticatedWithoutCountry - Allow authenticated users to access even without country (default: true)
 * @returns {React.ReactNode} Protected content or redirect to Welcome page
 */
const CountryGuard = ({ children, allowAuthenticatedWithoutCountry = true }) => {
  const location = useLocation();
  const currentCountry = useSelector(selectCurrentCountry);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const { country: userCountry } = useAuth();
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
      }, 500); // Original working delay
      
      return () => clearTimeout(timer);
    } else {
      setIsInitialized(true);
    }
  }, [location.search]);

  // Don't make routing decisions until initialized (especially after language change)
  if (!isInitialized) {
    return null; // or a loading indicator
  }

  // If no country is selected
  if (!currentCountry) {
    // If user is authenticated and has a country in their profile, let them through
    if (isLoggedIn && userCountry) {
      return children;
    }
    
    // If user is authenticated and we allow authenticated users without country, let them through
    if (isLoggedIn && allowAuthenticatedWithoutCountry) {
      return children;
    }
    
    // Don't redirect if we're already on the Welcome page
    if (location.pathname === '/') {
      return children;
    }
    
    // Otherwise, redirect to Welcome page
    const redirectUrl = location.pathname + location.search;
    if (redirectUrl !== '/') {
      localStorage.setItem('redirectAfterCountrySelection', redirectUrl);
    }
    return <Navigate to="/" replace />;
  }

  // Country is selected, render children
  return children;
};

export default CountryGuard;
