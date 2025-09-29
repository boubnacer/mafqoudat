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
      console.log('🔄 Checking localStorage for preserved URL...');
      console.log('🔄 Raw localStorage.getItem:', localStorage.getItem('languageChangeRedirectUrl'));
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
        
        // If no preserved URL but we're on a valid route, just clean up the parameters
        // This handles the case where URL preservation failed but user is on a valid page
        if (urlParams.has('lang_changed')) {
          urlParams.delete('lang_changed');
          const cleanUrl = location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          
          // Only navigate if the URL actually changes
          if (cleanUrl !== location.pathname + location.search) {
            console.log('🔄 Language change: Cleaning up URL parameters:', cleanUrl);
            navigate(cleanUrl, { replace: true });
          }
        }
        
        // If we're on a valid route (not root or login), we can stay here
        // This prevents unnecessary redirects when URL preservation fails
        if (location.pathname !== '/' && !location.pathname.startsWith('/login')) {
          console.log('🔄 Language change: Staying on current valid route:', location.pathname);
        }
      }
    }
  }, [location, navigate, isLoggedIn]);

  // This component doesn't render anything
  return null;
};

export default LanguageChangeHandler;
