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
    // Verify deep link scheme can be opened
    const canOpen = await Linking.canOpenURL('mafqoudat://auth/callback');
    console.log('🔗 Can open deep link scheme:', canOpen);
    if (!canOpen) {
      console.warn('⚠️ Deep link scheme might not be registered properly');
    }
    
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
      const url = event?.url || (typeof event === 'string' ? event : null);
      console.log('🔗 URL received via Linking (during OAuth):', url);
      console.log('🔗 Event object:', event);
      if (url && url.startsWith('mafqoudat://auth/callback')) {
        console.log('✅ OAuth callback deep link detected via Linking:', url);
        callbackReceived = url;
        // Parse and resolve oauthState immediately
        const parsed = parseAuthCallback(url);
        console.log('📋 Parsed callback result:', parsed.type);
        if (parsed.type === 'success' || parsed.type === 'pending') {
          console.log('✅ Resolving oauthState from Linking callback');
          oauthState.resolveCallback(parsed);
        } else {
          console.warn('⚠️ Parsed callback is not success or pending:', parsed);
        }
      } else {
        console.log('ℹ️ URL received but not an OAuth callback:', url);
      }
    });
    
    // Also set up a periodic check for deep links (in case Linking event doesn't fire)
    let checkCount = 0;
    const maxChecks = 60; // Check for 30 seconds (every 500ms)
    const periodicCheck = setInterval(() => {
      checkCount++;
      Linking.getInitialURL().then((url) => {
        if (url && url.startsWith('mafqoudat://auth/callback') && !callbackReceived) {
          console.log(`✅ Found deep link via periodic check (attempt ${checkCount}):`, url);
          callbackReceived = url;
          clearInterval(periodicCheck);
          const parsed = parseAuthCallback(url);
          if (parsed.type === 'success' || parsed.type === 'pending') {
            console.log('✅ Resolving oauthState from periodic check');
            oauthState.resolveCallback(parsed);
          }
        }
      }).catch((err) => {
        console.error('Error in periodic check:', err);
      });
      
      if (checkCount >= maxChecks) {
        clearInterval(periodicCheck);
        console.log('⏱️ Periodic check timeout');
      }
    }, 500);
    
    try {
      // Open browser - server will redirect to mobile-callback page which triggers deep link
      console.log('📱 Opening WebBrowser...');
      
      // Open browser without redirectUrl - we're using deep links directly
      const result = await WebBrowser.openBrowserAsync(authUrl, {
        showInRecents: true,
      });
      
      console.log('📱 WebBrowser result:', result.type);

      // Check if we received a callback URL while browser was open
      if (callbackReceived) {
        console.log('✅ Processing callback URL received while browser was open:', callbackReceived);
        clearInterval(periodicCheck);
        linkingSubscription?.remove();
        return parseAuthCallback(callbackReceived);
      }

      // When browser closes/dismisses OR stays open, check for deep link
      // The browser might stay open showing the callback page, and user needs to manually return
      // We check both when browser closes and periodically while waiting
      if (result.type === 'dismiss' || result.type === 'cancel' || result.type === 'opened') {
        if (result.type === 'opened') {
          console.log('📱 Browser opened (may stay open). User should return to app after selecting account.');
          console.log('📱 The callback page will show the token - user can copy it if deep link fails.');
        } else {
          console.log('📱 Browser was dismissed, checking for deep link immediately...');
        }
        console.log('📱 Browser was dismissed, checking for deep link immediately...');
        
        // Give a small delay for the deep link to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check multiple times with increasing delays (deep link might arrive slightly after)
        for (let i = 0; i < 5; i++) {
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl && initialUrl.startsWith('mafqoudat://auth/callback')) {
              console.log(`✅ Found deep link after browser dismiss (check ${i + 1}):`, initialUrl);
              clearInterval(periodicCheck);
              linkingSubscription?.remove();
              return parseAuthCallback(initialUrl);
            }
          } catch (err) {
            console.error('Error checking initial URL:', err);
          }
          
          // Wait before next check
          if (i < 4) {
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
          }
        }
      }

      // Browser was opened - now wait for deep link to be caught by App.js
      // App.js will call oauthState.resolveCallback() when it receives the deep link
      console.log('⏳ Waiting for deep link to be caught by App.js...');
      console.log('📋 Server should redirect to: mafqoudat://auth/callback?token=...');
      console.log('📋 App.js Linking handler will catch it and resolve oauthState');
      console.log('📋 Also checking periodically for deep link...');
      
      // Set up AppState listener to check for deep link when app comes to foreground
      let appStateSubscription = null;
      const checkDeepLinkOnForeground = async () => {
        try {
          const url = await Linking.getInitialURL();
          if (url && url.startsWith('mafqoudat://auth/callback') && !callbackReceived) {
            console.log('✅ Found deep link when app came to foreground:', url);
            callbackReceived = url;
            const parsed = parseAuthCallback(url);
            if (parsed.type === 'success' || parsed.type === 'pending') {
              oauthState.resolveCallback(parsed);
            }
          }
        } catch (err) {
          console.error('Error checking deep link on foreground:', err);
        }
      };
      
      const currentAppState = AppState.currentState;
      appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
          console.log('📱 App came to foreground, checking for deep link...');
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
              console.log('✅ Callback received via check interval:', callbackReceived);
              resolve(parseAuthCallback(callbackReceived));
            }
          }, 300);
          
          // Also periodically check getInitialURL as fallback
          const urlCheckInterval = setInterval(async () => {
            try {
              const url = await Linking.getInitialURL();
              if (url && url.startsWith('mafqoudat://auth/callback') && !callbackReceived) {
                console.log('✅ Found deep link via URL check interval:', url);
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
            console.log('⏱️ Timeout waiting for deep link callback (45 seconds)');
            console.log('❌ TROUBLESHOOTING:');
            console.log('❌ 1. Check Railway logs for "🔵 MOBILE REDIRECT:" to see redirect URL');
            console.log('❌ 2. Check mobile logs for "🔗 Deep link received:" in App.js');
            console.log('❌ 3. Verify deep link scheme is configured: mafqoudat://');
            console.log('❌ 4. Make sure App.js Linking handler is active');
            console.log('❌ 5. Try manually returning to the app - AppState listener should catch it');
            console.log('❌ 6. Check if browser shows the mobile-callback page with token');
            console.log('📱 EXPO GO USERS:');
            console.log('📱 - Deep links may not work in Expo Go');
            console.log('📱 - Use the manual token entry option that should appear');
            console.log('📱 - Copy token from browser and paste in the app');
            console.log('📱 - To see logs: Shake device > "Debug Remote JS" or check Metro bundler terminal');
            resolve({
              type: 'error',
              error: 'Deep link callback not received. Please return to the app manually after selecting your Google account.',
            });
          }, 45000); // Wait 45 seconds (increased from 30)
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
    // Handle deep link format: mafqoudat://auth/callback?token=...
    let urlObj;
    let searchParams;
    
    try {
      // Try parsing as-is first
      urlObj = new URL(url);
      searchParams = new URLSearchParams(urlObj.search);
    } catch (e) {
      // If URL parsing fails, try to construct it for deep links
      console.log('URL parsing failed, trying alternative format...');
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
      console.log('✅ Token found in callback URL');
      return {
        type: 'success',
        accessToken: token.trim(),
      };
    }

    // Check for pendingToken (new user)
    const pendingToken = searchParams.get('pendingToken');
    if (pendingToken && pendingToken.trim()) {
      console.log('✅ PendingToken found in callback URL');
      return {
        type: 'pending',
        pendingToken: pendingToken.trim(),
      };
    }

    // Check for error
    const error = searchParams.get('error');
    if (error) {
      console.log('❌ Error found in callback URL:', error);
      return {
        type: 'error',
        error: error,
      };
    }

    console.warn('⚠️ No token, pendingToken, or error in callback URL');
    console.warn('⚠️ URL was:', url);
    console.warn('⚠️ Search params:', Array.from(searchParams.entries()));
    return {
      type: 'error',
      error: 'No token or pendingToken in callback',
    };
  } catch (error) {
    console.error('Error parsing callback URL:', error);
    console.error('URL that failed:', url);
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

