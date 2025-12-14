import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const SimpleAuthContext = createContext();

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Storage keys
  const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'user_data',
  };

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        await verifyToken(storedToken);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token is invalid');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Token verification failed');
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      await clearAuthData();
      return false;
    }
  };

  const login = async (loginData) => {
    try {
      const { token: newToken, user: userData } = loginData;

      if (!newToken || !userData) {
        throw new Error('Invalid login response: missing token or user data');
      }

      // Store in state
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Store in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      await clearAuthData();
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call server logout endpoint if we have a token
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Server logout error:', error);
          // Continue with local logout even if server logout fails
        }
      }

      await clearAuthData();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const clearAuthData = async () => {
    try {
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // Clear AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const updateUser = async (newUserData) => {
    try {
      setUser(newUserData);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUserData));
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const getAuthHeaders = () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Platform': 'mobile',
    };
  };

  const refreshToken = async () => {
    try {
      if (!token) {
        throw new Error('No token to refresh');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        setToken(data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        return { success: true, token: data.token };
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await clearAuthData();
      throw error;
    }
  };

  const value = {
    // State
    user,
    token,
    loading,
    isAuthenticated,

    // Methods
    login,
    logout,
    updateUser,
    getAuthHeaders,
    refreshToken,
    clearAuthData,

    // Utilities
    verifyToken,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

export default SimpleAuthContext;
