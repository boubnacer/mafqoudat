import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logOut } from '../features/auth/authSlice';
import authErrorHandler from '../utils/authErrorHandler';
import authStateCleanup from '../utils/authStateCleanup';

/**
 * Hook to handle authentication errors globally
 * This ensures UI state is properly cleared when authentication fails
 */
const useAuthErrorHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for authentication errors from the centralized error handler
    const handleAuthError = async (errorInfo) => {
      // If error requires logout, perform cleanup
      if (errorInfo.requiresLogout) {
        try {
          // Use the comprehensive cleanup utility
          await authStateCleanup.performQuickCleanup();
          
          // Dispatch logout to Redux
          dispatch(logOut());
          
          // Navigate to login if needed
          if (errorInfo.shouldRedirect) {
            window.location.href = errorInfo.redirectPath || '/login';
          }
        } catch (cleanupError) {
          console.error('Error during global auth cleanup:', cleanupError);
          // Fallback: just dispatch logout
          dispatch(logOut());
        }
      }
    };

    // Add listener to the centralized error handler
    authErrorHandler.addErrorListener(handleAuthError);

    return () => {
      authErrorHandler.removeErrorListener(handleAuthError);
    };
  }, [dispatch]);

  // Function to dispatch authentication errors (legacy support)
  const dispatchAuthError = (error) => {
    if (error?.status === 401 || error?.status === 403) {
      // Use the centralized error handler instead of custom events
      authErrorHandler.handleAuthError(error, {
        cleanupState: true,
        redirect: true
      });
    }
  };

  return { dispatchAuthError };
};

export default useAuthErrorHandler;
