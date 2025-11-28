/**
 * Google OAuth Utility for Mobile
 * Uses Expo WebBrowser to handle Google OAuth flow
 * Mirrors: client/src/features/auth/Login/Login.js (Google button)
 * 
 * Note: The server's GOOGLE_CALLBACK_URL environment variable should be set to:
 * - For development: mafqoudat://auth/callback
 * - For production: https://your-domain.com/auth/callback (or use deep link)
 */

import * as WebBrowser from 'expo-web-browser';
import { Linking, AppState } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { oauthState } from './oauthState';

// Complete the auth session when done
WebBrowser.maybeCompleteAuthSession();

/**
 * Initiate Google OAuth flow
 * @returns {Promise<Object>} Auth result with type and data
 */
export const initiateGoogleAuth = async () => {
  try {
    // Construct the OAuth URL with mobile parameter
    // This tells the server to redirect to mobile deep link
    const authUrl = `${API_BASE_URL}/auth/google?mobile=true`;
    
    console.log('Starting Google OAuth with URL:', authUrl);
    
    // IMPORTANT: The redirectUrl must match EXACTLY what the server redirects to
    // Server uses: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'
    // Then redirects to: ${frontendUrl}/auth/callback?token=...&mobile=true
    // 
    // Get frontend URL from environment variable (set in .env file)
    const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://mafqoudat.com';
    const redirectUrl = `${frontendUrl}/auth/callback`;
    
    console.log('⚠️ Expected redirect URL:', redirectUrl);
    console.log('⚠️ IMPORTANT: Server must redirect to this EXACT URL for WebBrowser to catch it');
    console.log('⚠️ If server redirects to a different URL, WebBrowser will dismiss without catching it');
    console.log('⚠️ Check server logs to see what URL it actually redirects to');
    
    // Set up listeners for both deep links and web URLs BEFORE opening browser
    let callbackReceived = null;
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      const { url } = event;
      console.log('🔗 URL received via Linking:', url);
      if (url && (url.includes('/auth/callback') || url.startsWith('mafqoudat://auth/callback'))) {
        console.log('✅ Callback URL detected via Linking:', url);
        callbackReceived = url;
      }
    });
    
    try {
      // Open browser and wait for redirect
      // Try with the expected redirect URL first
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          showInRecents: true,
        }
      );

      console.log('OAuth result:', result);

      // Remove the listener
      linkingSubscription?.remove();

      // Check if we received a callback URL while browser was open
      if (callbackReceived) {
        console.log('✅ Processing callback URL received while browser was open:', callbackReceived);
        if (callbackReceived.startsWith('mafqoudat://')) {
          return parseAuthCallback(callbackReceived);
        } else {
          return parseWebCallback(callbackReceived);
        }
      }

      if (result.type === 'success') {
        // Parse the callback URL (could be deep link or web URL)
        const { url } = result;
        console.log('✅ Callback URL received from WebBrowser:', url);
        
        if (!url) {
          console.error('❌ Result type is success but no URL provided');
          return {
            type: 'error',
            error: 'No callback URL received',
          };
        }
        
        // Check if it's a web URL (server redirected to web instead of deep link)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          console.log('✅ Detected web URL callback, parsing...');
          // Extract token/pendingToken from web URL
          return parseWebCallback(url);
        } else if (url.startsWith('mafqoudat://')) {
          console.log('✅ Detected deep link callback, parsing...');
          // It's a deep link, parse normally
          return parseAuthCallback(url);
        } else {
          console.error('❌ Unexpected callback URL format:', url);
          return {
            type: 'error',
            error: `Unexpected callback URL format: ${url}`,
          };
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled OAuth');
        return {
          type: 'cancel',
          error: 'User cancelled authentication',
        };
      } else if (result.type === 'dismiss') {
        console.log('Browser was dismissed - checking for callback URL...');
        
        // Check if we got a callback URL while browser was open
        if (callbackReceived) {
          console.log('✅ Browser dismissed but callback URL was received:', callbackReceived);
          linkingSubscription?.remove();
          if (callbackReceived.startsWith('mafqoudat://')) {
            return parseAuthCallback(callbackReceived);
          } else {
            return parseWebCallback(callbackReceived);
          }
        }
        
        // Wait for callback via shared state (App.js deep link handler will catch it)
        console.log('⏳ Waiting for callback via shared state (App.js will handle redirect)...');
        linkingSubscription?.remove(); // Remove this listener, App.js will handle it
        
        return Promise.race([
          oauthState.waitForCallback(),
          new Promise((resolve) => {
            setTimeout(() => {
              console.log('⏱️ Timeout waiting for callback');
              resolve({
                type: 'error',
                error: 'Authentication was dismissed - no callback received. Please check if the server redirected correctly. Check server logs for redirect URL.',
              });
            }, 15000); // Wait 15 seconds
          }),
        ]);
      } else {
        console.error('OAuth failed with type:', result.type, 'result:', result);
        return {
          type: 'error',
          error: result.error || `Authentication failed: ${result.type}`,
        };
      }
    } finally {
      // Make sure to remove listener
      linkingSubscription?.remove();
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return {
      type: 'error',
      error: error.message || 'Failed to initiate Google authentication',
    };
  }
};

/**
 * Parse the OAuth callback URL (deep link format)
 * @param {string} url - Callback URL from OAuth
 * @returns {Object} Parsed result with type and data
 */
const parseAuthCallback = (url) => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    // Check for token (existing user)
    const token = params.get('token');
    if (token) {
      return {
        type: 'success',
        accessToken: token,
      };
    }

    // Check for pendingToken (new user)
    const pendingToken = params.get('pendingToken');
    if (pendingToken) {
      return {
        type: 'pending',
        pendingToken: pendingToken,
      };
    }

    // Check for error
    const error = params.get('error');
    if (error) {
      return {
        type: 'error',
        error: error,
      };
    }

    return {
      type: 'error',
      error: 'No token or pendingToken in callback',
    };
  } catch (error) {
    console.error('Error parsing callback URL:', error);
    return {
      type: 'error',
      error: 'Invalid callback URL',
    };
  }
};

/**
 * Parse web URL callback (when server redirects to web URL instead of deep link)
 * @param {string} url - Web callback URL
 * @returns {Object} Parsed result with type and data
 */
const parseWebCallback = (url) => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    // Check for token (existing user)
    const token = params.get('token');
    if (token) {
      return {
        type: 'success',
        accessToken: token,
      };
    }

    // Check for pendingToken (new user)
    // For web URLs, pendingToken might be in the path or query
    let pendingToken = params.get('pendingToken');
    
    // Also check if it's in the path like /auth/select-country?pendingToken=...
    if (!pendingToken && urlObj.pathname.includes('select-country')) {
      pendingToken = params.get('pendingToken');
    }
    
    if (pendingToken) {
      return {
        type: 'pending',
        pendingToken: pendingToken,
      };
    }

    // Check for error
    const error = params.get('error');
    if (error) {
      return {
        type: 'error',
        error: error,
      };
    }

    return {
      type: 'error',
      error: 'No token or pendingToken in callback',
    };
  } catch (error) {
    console.error('Error parsing web callback URL:', error);
    return {
      type: 'error',
      error: 'Invalid callback URL',
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

