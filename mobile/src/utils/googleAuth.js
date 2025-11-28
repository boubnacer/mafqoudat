/**
 * Google OAuth Utility for Mobile
 * Uses Expo WebBrowser/AuthSession to handle Google OAuth flow
 * Mirrors: client/src/features/auth/Login/Login.js (Google button)
 * 
 * Note: The server's FRONTEND_URL must match mobile EXPO_PUBLIC_FRONTEND_URL
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
    // This tells the server to redirect directly to deep link: mafqoudat://auth/callback?token=...
    const authUrl = `${API_BASE_URL}/auth/google?mobile=true`;
    
    console.log('🚀 Starting Google OAuth flow');
    console.log('📱 Auth URL:', authUrl);
    console.log('📱 Server will redirect directly to: mafqoudat://auth/callback?token=...');
    console.log('📱 App.js Linking handler will catch the deep link');
    
    // Set up a listener to catch the deep link BEFORE opening browser
    // This is critical - the deep link will be caught by App.js, which will resolve oauthState
    let callbackReceived = null;
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      const { url } = event;
      console.log('🔗 URL received via Linking (during OAuth):', url);
      if (url && url.startsWith('mafqoudat://auth/callback')) {
        console.log('✅ OAuth callback deep link detected via Linking:', url);
        callbackReceived = url;
        // Parse and resolve oauthState immediately
        const parsed = parseAuthCallback(url);
        if (parsed.type === 'success' || parsed.type === 'pending') {
          console.log('✅ Resolving oauthState from Linking callback');
          oauthState.resolveCallback(parsed);
        }
      }
    });
    
    try {
      // Open browser - server will redirect directly to deep link
      // The deep link will be caught by App.js Linking handler, which resolves oauthState
      // We wait for oauthState to be resolved
      console.log('📱 Opening WebBrowser...');
      
      // Open browser without redirectUrl - we're using deep links directly
      const result = await WebBrowser.openBrowserAsync(authUrl, {
        showInRecents: true,
      });
      
      console.log('📱 WebBrowser result:', result.type);

      // Remove the listener
      linkingSubscription?.remove();

      // Check if we received a callback URL while browser was open
      if (callbackReceived) {
        console.log('✅ Processing callback URL received while browser was open:', callbackReceived);
        return parseAuthCallback(callbackReceived);
      }

      // Browser was opened - now wait for deep link to be caught by App.js
      // App.js will call oauthState.resolveCallback() when it receives the deep link
      console.log('⏳ Waiting for deep link to be caught by App.js...');
      console.log('📋 Server should redirect to: mafqoudat://auth/callback?token=...');
      console.log('📋 App.js Linking handler will catch it and resolve oauthState');
      
      // Wait for oauthState to be resolved (by App.js)
      return Promise.race([
        oauthState.waitForCallback(),
        new Promise((resolve) => {
          // Also check callbackReceived periodically as fallback
          const checkInterval = setInterval(() => {
            if (callbackReceived) {
              clearInterval(checkInterval);
              console.log('✅ Callback received via periodic check:', callbackReceived);
              resolve(parseAuthCallback(callbackReceived));
            }
          }, 500);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            linkingSubscription?.remove();
            console.log('⏱️ Timeout waiting for deep link callback');
            console.log('❌ TROUBLESHOOTING:');
            console.log('❌ 1. Check Railway logs for "🔵 MOBILE REDIRECT:" to see redirect URL');
            console.log('❌ 2. Check mobile logs for "🔗 Deep link received:" in App.js');
            console.log('❌ 3. Verify deep link scheme is configured: mafqoudat://');
            console.log('❌ 4. Make sure App.js Linking handler is active');
            resolve({
              type: 'error',
              error: 'Deep link callback not received. Check logs and ensure App.js is catching deep links.',
            });
          }, 30000); // Wait 30 seconds
        }),
      ]).finally(() => {
        linkingSubscription?.remove();
      });
    } catch (error) {
      linkingSubscription?.remove();
      throw error;
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

