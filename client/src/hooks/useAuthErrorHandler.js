import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logOut } from '../features/auth/authSlice';

/**
 * Hook to handle authentication errors globally
 * This ensures UI state is properly cleared when authentication fails
 */
const useAuthErrorHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for authentication errors in the global error handler
    const handleAuthError = (event) => {
      const { detail } = event;
      
      // Check if this is an authentication error
      if (detail?.error?.status === 401 || detail?.error?.status === 403) {
        console.log('Authentication error detected, clearing auth state');
        dispatch(logOut());
        localStorage.setItem('isLoggedIn', 'false');
      }
    };

    // Listen for custom authentication error events
    window.addEventListener('authError', handleAuthError);

    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, [dispatch]);

  // Function to dispatch authentication errors
  const dispatchAuthError = (error) => {
    if (error?.status === 401 || error?.status === 403) {
      window.dispatchEvent(new CustomEvent('authError', { detail: { error } }));
    }
  };

  return { dispatchAuthError };
};

export default useAuthErrorHandler;
