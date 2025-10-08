import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../features/auth/authSlice';

const useRedirectAfterLogin = () => {
  try {
    const navigate = useNavigate();
    const location = useLocation();
    const token = useSelector(selectCurrentToken);
    const hasRedirected = useRef(false);

    useEffect(() => {
      // Check for redirect URL regardless of token status
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      
      // Only run this effect if we have a token (user is logged in) and we haven't redirected yet
      if (token && !hasRedirected.current) {
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          hasRedirected.current = true;
          
          // Use a small delay to ensure the app is fully loaded
          setTimeout(() => {
            navigate(redirectUrl);
          }, 300);
        } else {
          // If no redirect URL, go to dashboard
          hasRedirected.current = true;
          setTimeout(() => {
            navigate("/dash");
          }, 200);
        }
      } else if (!token) {
        hasRedirected.current = false; // Reset when token is lost
      }
    }, [token, navigate, location.pathname]);

    return null;
  } catch (error) {
    console.error('❌ useRedirectAfterLogin - error in hook:', error);
    return null;
  }
};

export default useRedirectAfterLogin;
