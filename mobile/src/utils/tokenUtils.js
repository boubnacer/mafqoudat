/**
 * Token Utilities
 * For decoding and validating JWT tokens
 * Mirrors: client/src/utils/tokenUtils.js
 */

import { jwtDecode } from 'jwt-decode';

/**
 * Decode JWT token and extract user information
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded user info or null
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    const decoded = jwtDecode(token);
    
    // Extract user info (matching web app structure)
    if (decoded.UserInfo) {
      return {
        id: decoded.UserInfo.usernameId,
        username: decoded.UserInfo.username,
        country: decoded.UserInfo.country,
        role: decoded.UserInfo.role || 'user',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
export const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

