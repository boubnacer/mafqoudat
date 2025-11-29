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
    
    // Set up a listener to catch the deep link BEFORE opening browser
    // This is critical - the deep link will be caught by App.js, which will resolve oauthState
    let callbackReceived = null;
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      const url = event?.url || (typeof event === 'string' ? event : null);
      if (url && url.startsWith('mafqoudat://auth/callback')) {
        callbackReceived = url;
        // Parse and resolve oauthState immediately
        const parsed = parseAuthCallback(url);
        if (parsed.type === 'success' || parsed.type === 'pending') {
          oauthState.resolveCallback(parsed);
        }
      }
    });
    
    // Also set up a periodic check for deep links (in case Linking event doesn't fire)
    let checkCount = 0;
    const maxChecks = 60; // Check for 30 seconds (every 500ms)
    const periodicCheck = setInterval(() => {
      checkCount++;
      Linking.getInitialURL().then((url) => {
        if (url && url.startsWith('mafqoudat://auth/callback') && !callbackReceived) {
          callbackReceived = url;
          clearInterval(periodicCheck);
          const parsed = parseAuthCallback(url);
          if (parsed.type === 'success' || parsed.type === 'pending') {
            oauthState.resolveCallback(parsed);
          }
        }
      }).catch(() => {
        // Silent fail
      });
      
      if (checkCount >= maxChecks) {
        clearInterval(periodicCheck);
      }
    }, 500);
    
    try {
      // Open browser - server will redirect to mobile-callback page which triggers deep link
      // Open browser without redirectUrl - we're using deep links directly
      const result = await WebBrowser.openBrowserAsync(authUrl, {
        showInRecents: true,
      });

      // Check if we received a callback URL while browser was open
      if (callbackReceived) {
        clearInterval(periodicCheck);
        linkingSubscription?.remove();
        return parseAuthCallback(callbackReceived);
      }

      // When browser closes/dismisses OR stays open, check for deep link
      // The browser might stay open showing the callback page, and user needs to manually return
      // We check both when browser closes and periodically while waiting
      if (result.type === 'dismiss' || result.type === 'cancel' || result.type === 'opened') {
        // Give a small delay for the deep link to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check multiple times with increasing delays (deep link might arrive slightly after)
        for (let i = 0; i < 5; i++) {
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl && initialUrl.startsWith('mafqoudat://auth/callback')) {
              clearInterval(periodicCheck);
              linkingSubscription?.remove();
              return parseAuthCallback(initialUrl);
            }
          } catch (err) {
            // Silent fail
          }
          
          // Wait before next check
          if (i < 4) {
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
          }
        }
      }

      // Browser was opened - now wait for deep link to be caught by App.js
      // App.js will call oauthState.resolveCallback() when it receives the deep link
      
      // Set up AppState listener to check for deep link when app comes to foreground
      let appStateSubscription = null;
      const checkDeepLinkOnForeground = async () => {
        try {
          const url = await Linking.getInitialURL();
          if (url && url.startsWith('mafqoudat://auth/callback') && !callbackReceived) {
            callbackReceived = url;
            const parsed = parseAuthCallback(url);
            if (parsed.type === 'success' || parsed.type === 'pending') {
              oauthState.resolveCallback(parsed);
            }
          }
        } catch (err) {
          // Silent fail
        }
      };
      
      const currentAppState = AppState.currentState;
      appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
          checkDeepLinkOnForeground();
        }
      });
      
      // Wait for oauthState to be resolved (by App.js or our checks)
      return Promise.race([
        oauthState.waitForCallback(),
        new Promise((resolve) => {
          // Check callbackReceived periodically as fallback
          const checkInterval = setInterval(() => {
            if (callbackReceived) {
              clearInterval(checkInterval);
              clearInterval(periodicCheck);
              linkingSubscription?.remove();
              appStateSubscription?.remove();
              resolve(parseAuthCallback(callbackReceived));
            }
          }, 300);
          
          // Also periodically check getInitialURL as fallback
          const urlCheckInterval = setInterval(async () => {
            try {
              const url = await Linking.getInitialURL();
              if (url && url.startsWith('mafqoudat://auth/callback') && !callbackReceived) {
                callbackReceived = url;
                clearInterval(checkInterval);
                clearInterval(urlCheckInterval);
                clearInterval(periodicCheck);
                linkingSubscription?.remove();
                appStateSubscription?.remove();
                resolve(parseAuthCallback(url));
              }
            } catch (err) {
              // Ignore errors in periodic check
            }
          }, 1000);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            clearInterval(urlCheckInterval);
            clearInterval(periodicCheck);
            linkingSubscription?.remove();
            appStateSubscription?.remove();
            resolve({
              type: 'error',
              error: 'Deep link callback not received. Please return to the app manually after selecting your Google account.',
            });
          }, 45000); // Wait 45 seconds
        }),
      ]).finally(() => {
        clearInterval(periodicCheck);
        linkingSubscription?.remove();
        if (appStateSubscription) {
          appStateSubscription.remove();
        }
      });
    } catch (error) {
      linkingSubscription?.remove();
      throw error;
    }
  } catch (error) {
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
    // Handle deep link format: mafqoudat://auth/callback?token=...
    let urlObj;
    let searchParams;
    
    try {
      // Try parsing as-is first
      urlObj = new URL(url);
      searchParams = new URLSearchParams(urlObj.search);
    } catch (e) {
      // If URL parsing fails, try to construct it for deep links
      if (url.startsWith('mafqoudat://')) {
        // Replace deep link scheme with https for URL parsing
        const httpsUrl = url.replace('mafqoudat://', 'https://');
        urlObj = new URL(httpsUrl);
        searchParams = new URLSearchParams(urlObj.search);
      } else {
        // Try to extract query string manually
        const queryMatch = url.match(/\?(.+)$/);
        if (queryMatch) {
          searchParams = new URLSearchParams(queryMatch[1]);
        } else {
          throw new Error('Could not parse URL');
        }
      }
    }

    // Check for token (existing user)
    const token = searchParams.get('token');
    if (token && token.trim()) {
      return {
        type: 'success',
        accessToken: token.trim(),
      };
    }

    // Check for pendingToken (new user)
    const pendingToken = searchParams.get('pendingToken');
    if (pendingToken && pendingToken.trim()) {
      return {
        type: 'pending',
        pendingToken: pendingToken.trim(),
      };
    }

    // Check for error
    const error = searchParams.get('error');
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
    return {
      type: 'error',
      error: 'Invalid callback URL: ' + error.message,
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

