import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useRefreshMutation } from "../authApiSlice";
import usePersist from "../../../hooks/usePersist";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentToken, logOut } from "../authSlice";
import { LoadingState, ErrorState } from "../../../components/LoadingStates";
import { Button } from "@mui/material";
import { authStorage } from "../../../utils/authStorage";
import { getOptimizedTokenValidation } from "../../../utils/optimizedTokenUtils";

// Debug configuration
const DEBUG_AUTH = true;

// Debug logging function
const debugLog = (message, data = null) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔍 [PERSIST-LOGIN] ${message}`, { timestamp, ...data });
    } else {
      console.log(`🔍 [PERSIST-LOGIN] ${message} - ${timestamp}`);
    }
  }
};

// Request debouncing to prevent multiple simultaneous refresh attempts
let refreshDebounceTimeout = null;
let isRefreshInProgress = false;
const REFRESH_DEBOUNCE_TIME = 2000; // 2 seconds debounce for refresh attempts

// to stay logged in when refreshing page
const PersistLogin = () => {
  const [persist] = usePersist();
  const token = useSelector(selectCurrentToken);
  const dispatch = useDispatch();
  const effectRan = useRef(false);

  const [trueSuccess, setTrueSuccess] = useState(false);

  const [refresh, { isUninitialized, isLoading, isSuccess, isError, error }] =
    useRefreshMutation();

  const navigate = useNavigate();

  // Debug initial state
  debugLog('Component initialized', {
    persist,
    hasToken: !!token,
    tokenLength: token?.length,
    effectRan: effectRan.current,
    trueSuccess,
    refreshState: { isUninitialized, isLoading, isSuccess, isError }
  });

  useEffect(() => {
    debugLog('useEffect triggered', {
      effectRan: effectRan.current,
      nodeEnv: process.env.NODE_ENV,
      willExecute: effectRan.current === true || process.env.NODE_ENV !== "development"
    });

    if (effectRan.current === true || process.env.NODE_ENV !== "development") {
      // React 18 Strict Mode
      debugLog('Effect execution started');

      const verifyRefreshToken = async () => {
        try {
          // Check if token is missing or expired
          if (!token) {
            debugLog('No token found, attempting refresh...');
            console.log('🔄 No token found, attempting refresh...');
            const result = await refresh();
            debugLog('Refresh result:', result);
            console.log('✅ Refresh result:', result);
            return;
          }

          // Check if token is expired
          const tokenValidation = getOptimizedTokenValidation(token);
          if (!tokenValidation.isValid) {
            debugLog('Token expired, attempting refresh...');
            console.log('🔄 Token expired, attempting refresh...');
            const result = await refresh();
            debugLog('Refresh result:', result);
            console.log('✅ Refresh result:', result);
            return;
          }

          debugLog('Token exists and is valid, skipping refresh');
          console.log('✅ Token exists and is valid, skipping refresh');
        } catch (error) {
          debugLog('Refresh token verification failed:', error);
          console.error('❌ Refresh token verification failed:', error);
        }
      };

      // Verify authentication state persistence after page refresh (e.g., from language change)
      const verifyAuthPersistence = () => {
        debugLog('Starting auth persistence verification');
        const authVerification = authStorage.verifyAuthPersistence();
        debugLog('Auth persistence verification result', { 
          success: authVerification.success, 
          details: authVerification.details 
        });
        
        if (authVerification.success) {
          // Only log success in development mode to avoid console spam
          if (process.env.NODE_ENV === 'development') {
            console.log('Authentication state successfully preserved after page refresh');
          }
        } else {
          // Always log warnings for debugging
          console.warn('Authentication state verification failed:', authVerification.details);
        }
      };

      // Verify auth persistence on component mount
      verifyAuthPersistence();
      
      // Always attempt refresh if no token or token is expired
      if (!token) {
        debugLog('No token available, verifying refresh token...');
        console.log('🚨 No token available, verifying refresh token...');
        verifyRefreshToken();
      } else {
        // Check if token is expired
        const tokenValidation = getOptimizedTokenValidation(token);
        if (!tokenValidation.isValid) {
          debugLog('Token expired, verifying refresh token...');
          console.log('🚨 Token expired, verifying refresh token...');
          verifyRefreshToken();
        } else {
          debugLog('Token available and valid, no refresh needed');
          console.log('✅ Token available and valid, no refresh needed');
        }
      }
    }

    return () => {
      debugLog('useEffect cleanup - setting effectRan to true');
      effectRan.current = true;
    };

    // eslint-disable-next-line
  }, [token, refresh]);

  let content;
  
  // Debug render decision
  debugLog('Render decision', {
    isLoading,
    isError,
    isSuccess,
    trueSuccess,
    hasToken: !!token,
    isUninitialized,
    error: error?.data?.message
  });
  
  // persist option is removed
  if (isLoading) {
    //persist: yes, token: no
    debugLog('Rendering loading state');
    content = <LoadingState message="Refreshing session..." />;
  } else if (isError) {
    //persist: yes, token: no
    debugLog('Rendering error state', { error: error?.data?.message });
    
    // Handle rate limiting errors gracefully - don't show error state
    if (error?.status === 429 || error?.data?.code === 'RATE_LIMIT_EXCEEDED') {
      debugLog('Rate limiting error detected, preserving auth state');
      console.warn('🔄 PERSIST-LOGIN: Rate limiting error detected, preserving auth state');
      
      // Show loading state instead of error for rate limiting
      content = <LoadingState message="Please wait, too many requests..." />;
    } else {
      content = (
        <ErrorState
          title="Session expired"
          message={error?.data?.message || "Please login again"}
          action={
            <Link to="/login">
              <Button variant="contained">Login Again</Button>
            </Link>
          }
        />
      );
    }
  } else if (isSuccess && trueSuccess) {
    //persist: yes, token: yes
    debugLog('Rendering success state - Outlet');
    content = <Outlet />;
  } else if (token && isUninitialized) {
    //persist: yes, token: yes
    debugLog('Rendering token + uninitialized state - Outlet');
    content = <Outlet />;
  }

  return content;
};
export default PersistLogin;
