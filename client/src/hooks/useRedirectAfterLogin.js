import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../features/auth/authSlice';

const useRedirectAfterLogin = () => {
  const navigate = useNavigate();
  const token = useSelector(selectCurrentToken);

  useEffect(() => {
    // Only run this effect if we have a token (user is logged in)
    if (token) {
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      console.log('useRedirectAfterLogin - token exists, checking redirect URL:', redirectUrl);
      
      if (redirectUrl) {
        console.log('useRedirectAfterLogin - redirecting to:', redirectUrl);
        localStorage.removeItem('redirectAfterLogin');
        
        // Use a small delay to ensure the app is fully loaded
        setTimeout(() => {
          navigate(redirectUrl);
        }, 200);
      }
    }
  }, [token, navigate]);

  return null;
};

export default useRedirectAfterLogin;
