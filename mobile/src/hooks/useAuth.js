/**
 * Authentication Hook
 * Mirrors: client/src/hooks/useAuth.js
 */

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { decodeToken, isTokenExpired } from '../utils/tokenUtils';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUserData();

      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Decode token if user data not stored
          const decodedUser = decodeToken(storedToken);
          if (decodedUser) {
            setUser(decodedUser);
            await storage.setUserData(decodedUser);
          }
        }
        
        setIsAuthenticated(true);
      } else {
        // Token expired or invalid
        await storage.clearAll();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken) => {
    try {
      await storage.setToken(accessToken);
      const userData = decodeToken(accessToken);
      
      if (userData) {
        await storage.setUserData(userData);
        setUser(userData);
        setToken(accessToken);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await storage.clearAll();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
};

