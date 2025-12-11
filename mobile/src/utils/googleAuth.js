/**
 * Google OAuth Utility for Mobile - Simple Redirect Approach
 * Mirrors the website implementation for consistency
 */

import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { API_BASE_URL } from '../config/api';

// Complete the auth session when done
WebBrowser.maybeCompleteAuthSession();

/**
 * Initiate Google OAuth flow using simple redirect (like website)
 * @returns {Promise<Object>} Auth result with type and data
 */
export const initiateGoogleAuth = async () => {
  try {
    console.log('Initiating Google OAuth with simple redirect approach...');
    
    // Use the same approach as website - direct redirect to server
    // This will handle the OAuth flow server-side and redirect back
    const authUrl = `${API_BASE_URL}/auth/google`;
    
    console.log('Auth URL:', authUrl);

    // Open browser for OAuth - let server handle everything
    const result = await WebBrowser.openBrowserAsync(authUrl, {
      // Enable JavaScript for proper redirects
      enableJavaScript: true,
      // Allow popups for Google OAuth
      enableDefaultShareMenus: false,
      // Set a reasonable timeout
      dismissButtonStyle: 'close',
      // Reader mode should be disabled for OAuth
      readerMode: false,
    });

    console.log('Browser result:', result);

    // For simple redirect approach, we rely on deep linking to catch the callback
    // The result type doesn't matter as much as the deep link handling
    if (result.type === 'cancel') {
      return {
        type: 'cancel',
      };
    }
    
    // For dismiss or closed, we'll rely on deep link handling in App.js
    return {
      type: 'pending',
      message: 'OAuth initiated, waiting for callback...',
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
 * Alternative approach using WebBrowser with auth session
 * This is more like the original implementation but simplified
 */
export const initiateGoogleAuthWithSession = async () => {
  try {
    // Create redirect URL for deep linking
    const redirectUrl = 'mafqoudat://auth/callback';
    console.log('Redirect URL:', redirectUrl);

    // Construct the OAuth URL with mobile parameter
    const authUrl = `${API_BASE_URL}/auth/google?mobile=true&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    
    console.log('Auth URL:', authUrl);

    // Open browser for OAuth with session
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    console.log('Auth result:', result);

    // Handle the result
    if (result.type === 'success') {
      const url = result.url;
      
      // Parse the URL to extract parameters
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      
      const token = urlParams.get('token');
      const pendingToken = urlParams.get('pendingToken');
      const error = urlParams.get('error');
      
      // Check for token (existing user)
      if (token) {
        return {
          type: 'success',
          accessToken: token,
        };
      }
      
      // Check for pendingToken (new user)
      if (pendingToken) {
        return {
          type: 'pending',
          pendingToken: pendingToken,
        };
      }
      
      // Check for error
      if (error) {
        return {
          type: 'error',
          error: error,
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
      type: 'dismiss',
      error: 'Browser closed without successful redirect. Please use manual token entry.',
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
