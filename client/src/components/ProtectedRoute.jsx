import React from 'react';
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

  // Check authentication requirement
  if (requireAuth && !isLoggedIn) {
    // Store the attempted URL for redirect after login
    const redirectUrl = location.pathname + location.search;
    if (redirectUrl !== '/login') {
      localStorage.setItem('redirectAfterLogin', redirectUrl);
    }
    return <Navigate to="/login" replace />;
  }

  // Check country selection requirement
  if (requireCountry && !currentCountry) {
    // Store the attempted URL for redirect after country selection
    const redirectUrl = location.pathname + location.search;
    if (redirectUrl !== '/') {
      localStorage.setItem('redirectAfterCountrySelection', redirectUrl);
    }
    return <Navigate to="/" replace />;
  }

  // All conditions met, render children
  return children;
};

export default ProtectedRoute;