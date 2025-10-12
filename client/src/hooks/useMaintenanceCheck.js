import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import useAuth from './useAuth';
import { setMaintenanceMode, clearMaintenanceMode } from '../app/state/maintenanceSlice';

/**
 * Custom hook to check maintenance mode status
 * 
 * Features:
 * - Checks /health endpoint on mount
 * - Polls every 60 seconds if in maintenance mode
 * - Automatically handles admin bypass
 * - Updates Redux state for maintenance mode
 * - Handles errors gracefully
 * 
 * @returns {Object} { isMaintenanceMode, isLoading, checkMaintenance, error }
 */
const useMaintenanceCheck = () => {
  const [isMaintenanceMode, setIsMaintenanceModeLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const { isAuthenticated, role } = useAuth();
  
  // Use refs to avoid stale closures in intervals
  const isAuthenticatedRef = useRef(isAuthenticated);
  const roleRef = useRef(role);
  const intervalIdRef = useRef(null);

  // Update refs when auth state changes
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    roleRef.current = role;
  }, [isAuthenticated, role]);

  /**
   * Check if current user is an admin
   * Admins should bypass maintenance mode
   */
  const isAdmin = useCallback(() => {
    return isAuthenticatedRef.current && roleRef.current === 'admin';
  }, []);

  /**
   * Main function to check maintenance mode status
   */
  const checkMaintenance = useCallback(async () => {
    // Admin users bypass maintenance mode
    if (isAdmin()) {
      setIsMaintenanceModeLocal(false);
      dispatch(clearMaintenanceMode());
      setError(null);
      setIsLoading(false); // Clear loading state for admin users
      return false;
    }

    try {
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
      
      // Make a request to the health endpoint
      const response = await axios.get(`${API_URL}/health`, {
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => {
          // Accept both 200 and 503 status codes
          return status === 200 || status === 503;
        }
      });

      // Check if response indicates maintenance mode
      if (response.status === 503 && response.data?.maintenanceMode === true) {
        setIsMaintenanceModeLocal(true);
        
        // Update Redux state
        dispatch(setMaintenanceMode({
          isActive: true,
          message: response.data.message || "We're currently performing scheduled maintenance.",
          estimatedReturn: response.data.estimatedReturn || 'soon'
        }));

        setError(null);
        return true;
      } else {
        setIsMaintenanceModeLocal(false);
        dispatch(clearMaintenanceMode());
        setError(null);
        return false;
      }
    } catch (err) {
      // Network errors or timeouts
      
      // If we get a 503 error with maintenance mode data
      if (err.response?.status === 503 && err.response?.data?.maintenanceMode === true) {
        setIsMaintenanceModeLocal(true);
        dispatch(setMaintenanceMode({
          isActive: true,
          message: err.response.data.message || "We're currently performing scheduled maintenance.",
          estimatedReturn: err.response.data.estimatedReturn || 'soon'
        }));
        
        return true;
      }
      
      // For other errors, assume system is operational
      // (better to show the app than block access due to network issues)
      setError(err.message);
      setIsMaintenanceModeLocal(false);
      dispatch(clearMaintenanceMode());
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, isAdmin]);

  /**
   * Setup polling interval when in maintenance mode
   */
  useEffect(() => {
    // Clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Only poll if we're in maintenance mode and not an admin
    if (isMaintenanceMode && !isAdmin()) {
      // Check every 60 seconds
      intervalIdRef.current = setInterval(() => {
        checkMaintenance();
      }, 60000); // 60 seconds

      // Cleanup function
      return () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      };
    }
  }, [isMaintenanceMode, checkMaintenance, isAdmin]);

  /**
   * Initial check on mount
   */
  useEffect(() => {
    // Set loading to false immediately to prevent infinite loading
    // The global API interceptor will detect maintenance mode from ANY 503 response
    setIsLoading(false);
    
    // Still do the health check for polling setup
    checkMaintenance();

    // Cleanup on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount

  /**
   * Re-check when user authentication status changes
   * If user logs in as admin, we should immediately check and potentially clear maintenance mode
   */
  useEffect(() => {
    if (isAuthenticated) {
      checkMaintenance();
    }
  }, [isAuthenticated, role, checkMaintenance]);

  return {
    isMaintenanceMode,
    isLoading,
    checkMaintenance,
    error,
    isAdmin: isAdmin()
  };
};

export default useMaintenanceCheck;

