import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../features/auth/authSlice';
import { languageStorage } from '../utils/authStorage';

/**
 * LanguageChangeHandler component that handles URL restoration after language change
 * This component checks if the page was refreshed due to a language change and
 * redirects the user back to their original URL if needed.
 */
const LanguageChangeHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    // Check if this is a language change refresh
    const urlParams = new URLSearchParams(location.search);
    const isLanguageChange = urlParams.get('lang_changed') === 'true';
    
    if (isLanguageChange) {
      console.log('🔄 LanguageChangeHandler: Language change detected');
      console.log('🔄 Current location:', location.pathname + location.search);
      console.log('🔄 Auth state:', isLoggedIn);
      
      // Clean up the auth preservation flag
      localStorage.removeItem('preserveAuthAfterLanguageChange');
      
      // Get the preserved URL from localStorage
      const preservedUrl = languageStorage.getAndClearLanguageChangeRedirectUrl();
      console.log('🔄 Preserved URL:', preservedUrl);
      
      if (preservedUrl && preservedUrl !== location.pathname + location.search) {
        // Only redirect if we have a preserved URL and it's different from current location
        console.log('🔄 Language change: Redirecting to preserved URL:', preservedUrl);
        
        // Small delay to ensure authentication state is fully restored
        setTimeout(() => {
          console.log('🔄 Language change: Executing redirect to:', preservedUrl);
          navigate(preservedUrl, { replace: true });
        }, 300);
      } else {
        console.log('🔄 Language change: No redirect needed, cleaning up URL parameters');
        // Clean up URL parameters if no redirect is needed
        if (urlParams.has('lang_changed')) {
          urlParams.delete('lang_changed');
          const cleanUrl = location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          if (cleanUrl !== location.pathname + location.search) {
            navigate(cleanUrl, { replace: true });
          }
        }
      }
    }
  }, [location, navigate, isLoggedIn]);

  // This component doesn't render anything
  return null;
};

export default LanguageChangeHandler;
