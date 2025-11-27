/**
 * API Service
 * Mirrors the web app's API slice functionality
 * Reference: client/src/app/api/apiSlice.js
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../../config/api';
import * as SecureStore from 'expo-secure-store';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401) {
      try {
        // Clear stored token
        await SecureStore.deleteItemAsync('accessToken');
        // You can dispatch a logout action here if using Redux
      } catch (storageError) {
        console.error('Error clearing token:', storageError);
      }
    }

    // Handle 503 Maintenance Mode
    if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
      // Handle maintenance mode
      console.warn('Maintenance mode active');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

