import * as WebBrowser from 'expo-web-browser';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  MOBILE_OAUTH_CALLBACK_URL,
} from '../config/api';
import { exchangeOAuthCode } from './oauthExchange';

// Minimal query-string parser for the deep-link callback URL - avoids depending on
// URLSearchParams, which isn't guaranteed to exist in every Hermes/RN version.
// Mirrors googleAuth.js's copy exactly.
const parseQueryParams = (url) => {
  const queryString = url.split('?')[1] || '';
  const params = {};
  queryString.split('&').forEach((pair) => {
    if (!pair) return;
    const [key, value = ''] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  });
  return params;
};

WebBrowser.maybeCompleteAuthSession();

// Unlike Google, there's no native ID-token flow here: the server's Facebook
// strategy (server/config/passport.js) does the whole token exchange itself
// via passport-facebook, so the app never needs a Facebook App ID or SDK -
// it only ever opens the server's own /auth/facebook in an ephemeral
// auth-session browser and catches the deep-link redirect back, exactly like
// googleAuth.js's signInWithGoogleBrowser() legacy fallback.
class FacebookAuth {
  async signInWithFacebookBrowser() {
    try {
      const authUrl = `${API_BASE_URL}${API_ENDPOINTS.AUTH.FACEBOOK}?mobile=true&redirect_uri=${encodeURIComponent(MOBILE_OAUTH_CALLBACK_URL)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, MOBILE_OAUTH_CALLBACK_URL);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, cancelled: true };
      }

      if (result.type !== 'success' || !result.url) {
        return { success: false, error: 'Facebook sign-in failed' };
      }

      const { code, pendingToken, error } = parseQueryParams(result.url);

      if (code) {
        // One-time opaque code, not the tokens themselves - see oauthExchange.js.
        const tokens = await exchangeOAuthCode(code);
        if (!tokens) {
          return { success: false, error: 'Facebook sign-in failed' };
        }
        return {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isNewUser: false,
        };
      }

      if (pendingToken) {
        return { success: false, pending: true, pendingToken, isNewUser: true };
      }

      return { success: false, error: error || 'Facebook sign-in failed' };
    } catch (error) {
      console.error('Browser Facebook sign-in error:', error);
      return { success: false, error: error.message || 'Facebook sign-in failed' };
    }
  }

  // Complete Facebook OAuth registration - always the browser-flow endpoint,
  // since there's only one Facebook flow (see class comment above).
  async completeRegistration(pendingToken, countryId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.FACEBOOK_COMPLETE}`, {
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
          refreshToken: data.refreshToken,
          username: data.username,
        };
      }

      return {
        success: false,
        error: data.message || 'Failed to complete registration',
        code: data.code,
      };
    } catch (error) {
      console.error('Complete Facebook Auth error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }
}

// Create singleton instance
const facebookAuth = new FacebookAuth();

export default facebookAuth;
