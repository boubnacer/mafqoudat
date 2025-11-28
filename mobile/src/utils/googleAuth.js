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
    // This tells the server to redirect to mobile deep link
    const authUrl = `${API_BASE_URL}/auth/google?mobile=true`;
    
    console.log('Starting Google OAuth with URL:', authUrl);
    
    // Server redirects to web URL: https://mafqoudat.com/auth/callback?token=...&mobile=true
    // WebBrowser.openAuthSessionAsync should catch this if redirectUrl matches
    const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://mafqoudat.com';
    const redirectUrl = `${frontendUrl}/auth/callback`;
    
    console.log('📱 Mobile OAuth Configuration:');
    console.log('📱 Server will redirect to:', `${frontendUrl}/auth/callback?token=...&mobile=true`);
    console.log('📱 Expected redirect URL (must match):', redirectUrl);
    console.log('📱 WebBrowser should catch this redirect');
    
    // Set up listeners for both deep links and web URLs BEFORE opening browser
    // Keep this active throughout the OAuth flow as a fallback
    let callbackReceived = null;
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      const { url } = event;
      console.log('🔗 URL received via Linking (during OAuth):', url);
      if (url && (url.includes('/auth/callback') || url.startsWith('mafqoudat://auth/callback'))) {
        console.log('✅ OAuth callback URL detected via Linking:', url);
        callbackReceived = url;
        // Also resolve oauthState immediately if we get it via Linking
        if (url.startsWith('mafqoudat://')) {
          const parsed = parseAuthCallback(url);
          if (parsed.type === 'success' || parsed.type === 'pending') {
            console.log('✅ Resolving oauthState from Linking callback');
            oauthState.resolveCallback(parsed);
          }
        } else {
          const parsed = parseWebCallback(url);
          if (parsed.type === 'success' || parsed.type === 'pending') {
            console.log('✅ Resolving oauthState from Linking callback');
            oauthState.resolveCallback(parsed);
          }
        }
      }
    });
    
    try {
      // Open browser and wait for redirect
      // WebBrowser.openAuthSessionAsync requires the redirect URL to match EXACTLY
      // The server redirects to: ${frontendUrl}/auth/callback?token=...&mobile=true
      // So we need to match: ${frontendUrl}/auth/callback (without query params)
      // 
      // IMPORTANT: On some platforms, WebBrowser might not catch web redirects properly
      // If it doesn't work, the deep link handler in App.js will catch it as fallback
      console.log('📱 Opening WebBrowser with:');
      console.log('📱   authUrl:', authUrl);
      console.log('📱   redirectUrl:', redirectUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl, // This should match the base URL the server redirects to
        {
          showInRecents: true,
        }
      );
      
      console.log('📱 WebBrowser result type:', result.type);
      console.log('📱 WebBrowser result:', JSON.stringify(result, null, 2));

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
        console.log('⚠️ Browser was dismissed - checking for callback...');
        
        // Check if we got a callback URL while browser was open (via Linking listener)
        if (callbackReceived) {
          console.log('✅ Browser dismissed but callback URL was received via Linking:', callbackReceived);
          linkingSubscription?.remove();
          if (callbackReceived.startsWith('mafqoudat://')) {
            return parseAuthCallback(callbackReceived);
          } else {
            return parseWebCallback(callbackReceived);
          }
        }
        
        // Browser dismissed - server redirected to web URL
        // WebBrowser might not have caught it, but Linking listener or App.js handler should
        console.log('⏳ Waiting for callback via Linking listener or App.js handler...');
        console.log('📋 Server redirected to:', `${frontendUrl}/auth/callback?token=...&mobile=true`);
        console.log('📋 This should be caught by either:');
        console.log('📋   1. WebBrowser (if it worked)');
        console.log('📋   2. Linking listener (fallback)');
        console.log('📋   3. App.js deep link handler (fallback)');
        
        // Keep Linking listener active and wait
        return Promise.race([
          oauthState.waitForCallback(),
          new Promise((resolve) => {
            // Also check callbackReceived periodically
            const checkInterval = setInterval(() => {
              if (callbackReceived) {
                clearInterval(checkInterval);
                linkingSubscription?.remove();
                console.log('✅ Callback received via periodic check:', callbackReceived);
                if (callbackReceived.startsWith('mafqoudat://')) {
                  resolve(parseAuthCallback(callbackReceived));
                } else {
                  resolve(parseWebCallback(callbackReceived));
                }
              }
            }, 500);
            
            setTimeout(() => {
              clearInterval(checkInterval);
              linkingSubscription?.remove();
              console.log('⏱️ Timeout waiting for callback');
              console.log('❌ TROUBLESHOOTING:');
              console.log('❌ 1. Check Railway logs for "🔵 MOBILE REDIRECT:" to see actual redirect URL');
              console.log('❌ 2. Check mobile logs for "🔗 URL received via Linking" messages');
              console.log('❌ 3. Verify server FRONTEND_URL matches mobile EXPO_PUBLIC_FRONTEND_URL');
              console.log('❌ 4. WebBrowser might not be catching the redirect - Linking should catch it');
              resolve({
                type: 'error',
                error: 'OAuth callback not received. Check logs for redirect URL and Linking messages.',
              });
            }, 20000); // Wait 20 seconds
          }),
        ]).finally(() => {
          linkingSubscription?.remove();
        });
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

