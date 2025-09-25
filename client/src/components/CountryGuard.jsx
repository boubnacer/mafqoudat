import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentCountry } from '../app/state';

/**
 * CountryGuard component that ensures a country is selected before accessing certain routes
 * This is used for routes that don't require authentication but do require country selection
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {React.ReactNode} Protected content or redirect to Welcome page
 */
const CountryGuard = ({ children }) => {
  const location = useLocation();
  const currentCountry = useSelector(selectCurrentCountry);

  // If no country is selected, redirect to Welcome page
  if (!currentCountry) {
    // Store the attempted URL for redirect after country selection
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
