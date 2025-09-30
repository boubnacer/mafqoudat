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
      console.log('🔄 [LANG-FIX] Language change detected on:', location.pathname);
      
      // Set a flag to indicate we're in a language change process
      // This helps other components (like ProtectedRoute) know about the language change
      localStorage.setItem('isLanguageChanging', 'true');
      
      // Clean up the auth preservation flag
      localStorage.removeItem('preserveAuthAfterLanguageChange');
      
      // Get the preserved URL from localStorage
      const preservedUrl = languageStorage.getAndClearLanguageChangeRedirectUrl();
      console.log('🔄 [LANG-FIX] Preserved URL:', preservedUrl);
      
      if (preservedUrl && preservedUrl !== location.pathname + location.search) {
        // Only redirect if we have a preserved URL and it's different from current location
        console.log('🔄 [LANG-FIX] Redirecting to preserved URL:', preservedUrl);
        
        // Small delay to ensure authentication state is fully restored
        setTimeout(() => {
          navigate(preservedUrl, { replace: true });
        }, 300);
      } else {
        // If no preserved URL but we're on a valid route, just clean up the parameters
        if (urlParams.has('lang_changed')) {
          urlParams.delete('lang_changed');
          const cleanUrl = location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          
          // Only navigate if the URL actually changes
          if (cleanUrl !== location.pathname + location.search) {
            console.log('🔄 [LANG-FIX] Cleaning up URL parameters');
            navigate(cleanUrl, { replace: true });
          }
        }
        
        console.log('🔄 [LANG-FIX] Staying on current route:', location.pathname);
        
        // Clear the language change flag after a delay to allow other components to detect it
        setTimeout(() => {
          localStorage.removeItem('isLanguageChanging');
        }, 1000);
      }
    }
  }, [location, navigate, isLoggedIn]);

  // This component doesn't render anything
  return null;
};

export default LanguageChangeHandler;
