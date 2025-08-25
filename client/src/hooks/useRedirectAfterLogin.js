import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../features/auth/authSlice';

const useRedirectAfterLogin = () => {
  console.log('🔍 useRedirectAfterLogin - hook initialized');
  
  try {
    const navigate = useNavigate();
    const location = useLocation();
    const token = useSelector(selectCurrentToken);
    const hasRedirected = useRef(false);

    console.log('🔍 useRedirectAfterLogin - hooks initialized successfully');

    useEffect(() => {
      console.log('🔍 useRedirectAfterLogin - useEffect triggered');
      console.log('🔍 useRedirectAfterLogin - token:', token);
      console.log('🔍 useRedirectAfterLogin - current location:', location.pathname);
      console.log('🔍 useRedirectAfterLogin - hasRedirected:', hasRedirected.current);
      
      // Check for redirect URL regardless of token status
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      console.log('🔍 useRedirectAfterLogin - checking redirect URL:', redirectUrl);
      
      // Always log the current state for debugging
      console.log('🔍 useRedirectAfterLogin - current state:', {
        token: !!token,
        hasRedirected: hasRedirected.current,
        redirectUrl,
        currentPath: location.pathname
      });
      
      // Only run this effect if we have a token (user is logged in) and we haven't redirected yet
      if (token && !hasRedirected.current) {
        if (redirectUrl) {
          console.log('🔍 useRedirectAfterLogin - token exists and redirect URL found, redirecting to:', redirectUrl);
          localStorage.removeItem('redirectAfterLogin');
          hasRedirected.current = true;
          
          // Use a small delay to ensure the app is fully loaded
          setTimeout(() => {
            console.log('🔍 useRedirectAfterLogin - executing redirect to:', redirectUrl);
            navigate(redirectUrl);
          }, 300);
        } else {
          console.log('🔍 useRedirectAfterLogin - token exists but no redirect URL found, going to dashboard');
          // If no redirect URL, go to dashboard
          hasRedirected.current = true;
          setTimeout(() => {
            console.log('🔍 useRedirectAfterLogin - redirecting to dashboard');
            navigate("/dash");
          }, 200);
        }
      } else if (!token) {
        console.log('🔍 useRedirectAfterLogin - no token found');
        hasRedirected.current = false; // Reset when token is lost
      } else if (hasRedirected.current) {
        console.log('🔍 useRedirectAfterLogin - already redirected, skipping');
      }
    }, [token, navigate, location.pathname]);

    console.log('🔍 useRedirectAfterLogin - hook setup complete');
    return null;
  } catch (error) {
    console.error('❌ useRedirectAfterLogin - error in hook:', error);
    return null;
  }
};

export default useRedirectAfterLogin;
