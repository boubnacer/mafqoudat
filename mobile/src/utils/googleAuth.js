/**
 * Google OAuth Utility for Mobile using Expo AuthSession
 * Simplified and more reliable implementation
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../config/api';

// Complete the auth session when done
WebBrowser.maybeCompleteAuthSession();

/**
 * Initiate Google OAuth flow using Expo AuthSession
 * @returns {Promise<Object>} Auth result with type and data
 */
export const initiateGoogleAuth = async () => {
  try {
    // Use Expo AuthSession for more reliable OAuth handling
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'mafqoudat',
      path: 'auth/callback',
    });

    console.log('Redirect URL:', redirectUrl);

    // Construct the OAuth URL with mobile parameter and redirect URL
    const authUrl = `${API_BASE_URL}/auth/google?mobile=true&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    
    console.log('Auth URL:', authUrl);

    // Start the auth session
    const result = await AuthSession.startAsync({
      authUrl,
      returnUrl: redirectUrl,
    });

    console.log('Auth result:', result);

    // Handle the result
    if (result.type === 'success') {
      const { params } = result;
      
      // Check for token (existing user)
      if (params.token) {
        return {
          type: 'success',
          accessToken: params.token,
        };
      }
      
      // Check for pendingToken (new user)
      if (params.pendingToken) {
        return {
          type: 'pending',
          pendingToken: params.pendingToken,
        };
      }
      
      // Check for error
      if (params.error) {
        return {
          type: 'error',
          error: params.error,
        };
      }
      
      return {
        type: 'error',
        error: 'No token or pendingToken in response',
      };
    }
    
    if (result.type === 'cancel') {
      return {
        type: 'cancel',
      };
    }
    
    return {
      type: 'error',
      error: 'Authentication failed',
    };
  } catch (error) {
    console.error('Google Auth Error:', error);
    return {
      type: 'error',
      error: error.message || 'Failed to initiate Google authentication',
    };
  }
};

/**
 * Complete Google OAuth registration
 * @param {string} pendingToken - Pending token from OAuth
 * @param {string} countryId - Selected country ID
 * @returns {Promise<Object>} Result with accessToken or error
 */
export const completeGoogleAuth = async (pendingToken, countryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pendingToken,
        countryId,
      }),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      return {
        success: true,
        accessToken: data.accessToken,
        username: data.username,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to complete registration',
        code: data.code,
      };
    }
  } catch (error) {
    console.error('Complete Google Auth error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};
