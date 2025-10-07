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
        debugLog('Starting refresh token verification');
        
        // Check if refresh is already in progress
        if (isRefreshInProgress) {
          debugLog('Refresh already in progress, skipping duplicate attempt');
          console.warn('🔄 PERSIST-LOGIN: Refresh already in progress, skipping duplicate attempt');
          return;
        }
        
        // Clear any existing debounce timeout
        if (refreshDebounceTimeout) {
          clearTimeout(refreshDebounceTimeout);
          refreshDebounceTimeout = null;
        }
        
        // Set refresh in progress flag
        isRefreshInProgress = true;
        
        try {
          debugLog('Making refresh request');
          await refresh();
          debugLog('Refresh token verification successful');
          setTrueSuccess(true);
        } catch (err) {
          debugLog('Refresh token verification failed', { error: err });
          
          // Handle rate limiting errors gracefully
          if (err?.status === 429) {
            debugLog('Rate limited during refresh, will retry later');
            console.warn('🔄 PERSIST-LOGIN: Rate limited during refresh, will retry later');
            // Don't show error state for rate limiting - preserve auth state
            return;
          }
          
          console.error('Refresh token verification failed:', err);
        } finally {
          // Clear refresh in progress flag after debounce period
          refreshDebounceTimeout = setTimeout(() => {
            isRefreshInProgress = false;
            refreshDebounceTimeout = null;
            debugLog('Refresh debounce period completed');
          }, REFRESH_DEBOUNCE_TIME);
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

      // Check if token is expired and logout if necessary
      const checkTokenExpiry = () => {
        debugLog('Checking token expiry', { hasToken: !!token });
        
        if (token) {
          const tokenValidation = getOptimizedTokenValidation(token);
          debugLog('Token validation result', { 
            isValid: tokenValidation.isValid, 
            reason: tokenValidation.reason 
          });
          
          if (!tokenValidation.isValid && tokenValidation.reason === 'TOKEN_EXPIRED') {
            debugLog('Token expired on page load, logging out user');
            console.log('Token expired on page load, logging out user');
            dispatch(logOut());
            authStorage.setLoggedOut();
            return false; // Token is expired
          }
        }
        debugLog('Token is valid or no token present');
        return true; // Token is valid or no token
      };

      // Verify auth persistence on component mount
      verifyAuthPersistence();
      
      // Check token expiry first, then attempt refresh if needed
      const tokenIsValid = checkTokenExpiry();
      debugLog('Token validation decision', { 
        hasToken: !!token, 
        tokenIsValid, 
        willRefresh: !token || !tokenIsValid 
      });
      
      if (!token || !tokenIsValid) {
        debugLog('Proceeding with refresh token verification');
        verifyRefreshToken();
      } else {
        debugLog('Token is valid, skipping refresh');
      }
    }

    return () => {
      debugLog('useEffect cleanup - setting effectRan to true');
      effectRan.current = true;
    };

    // eslint-disable-next-line
  }, []);

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
