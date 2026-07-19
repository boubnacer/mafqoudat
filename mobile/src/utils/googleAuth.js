import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_MOBILE_CALLBACK_URL,
} from '../config/api';

// Minimal query-string parser for the deep-link callback URL - avoids depending on
// URLSearchParams, which isn't guaranteed to exist in every Hermes/RN version.
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

/**
 * Hook wrapping expo-auth-session's native Google ID-token flow.
 *
 * expo-auth-session picks iosClientId/androidClientId/webClientId strictly by
 * `Platform.OS` with no fallback, and throws synchronously (crashing the app on
 * render, not just the sign-in button) if the one it needs is `undefined`. We fall
 * back to the web client ID here purely to keep the app from crashing before the iOS/
 * Android OAuth clients are configured — actually completing native sign-in still
 * requires the real platform-specific client ID (see mobile/AUTH.md).
 */
export const useGoogleIdTokenAuth = () => {
  return Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });
};

class GoogleAuth {
  // Legacy fallback path (behind USE_NATIVE_GOOGLE_AUTH): opens the server's passport
  // Google OAuth flow (GET /auth/google) in an ephemeral auth-session browser. The
  // server's callback redirects through server/views/mobile-callback.html, which
  // navigates to GOOGLE_MOBILE_CALLBACK_URL with ?token= or ?pendingToken= - the
  // auth-session intercepts that navigation directly, without ever handing off to the
  // OS (no Linking listener needed) or actually leaving the app.
  async signInWithGoogleBrowser() {
    try {
      const authUrl = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}?mobile=true&redirect_uri=${encodeURIComponent(GOOGLE_MOBILE_CALLBACK_URL)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, GOOGLE_MOBILE_CALLBACK_URL);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, cancelled: true };
      }

      if (result.type !== 'success' || !result.url) {
        return { success: false, error: 'Google sign-in failed' };
      }

      const { token, pendingToken, error } = parseQueryParams(result.url);

      if (token) {
        return { success: true, accessToken: token, isNewUser: false };
      }

      if (pendingToken) {
        return { success: false, pending: true, pendingToken, isNewUser: true };
      }

      return { success: false, error: error || 'Google sign-in failed' };
    } catch (error) {
      console.error('Browser Google sign-in error:', error);
      return { success: false, error: error.message || 'Google sign-in failed' };
    }
  }

  // Verify a native Google ID token with the server (POST /auth/google/mobile)
  async verifyIdToken(idToken, user) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_MOBILE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken, user }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        return {
          success: true,
          accessToken: data.accessToken,
          isNewUser: false,
        };
      }

      if (response.ok && data.pendingToken) {
        return {
          success: false,
          pending: true,
          pendingToken: data.pendingToken,
          isNewUser: true,
        };
      }

      return {
        success: false,
        error: data.message || 'Google authentication failed',
        code: data.code,
      };
    } catch (error) {
      console.error('Google ID token verification error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Complete Google OAuth registration. The pending token lives in an in-memory map
  // scoped to whichever server route minted it, so completion must hit the matching
  // endpoint: POST /auth/google/mobile/complete for the native flow's pending tokens,
  // POST /auth/complete for the browser-fallback flow's (they are NOT interchangeable).
  async completeRegistration(pendingToken, countryId, method = 'native') {
    const endpoint = method === 'browser'
      ? API_ENDPOINTS.AUTH.GOOGLE_COMPLETE
      : API_ENDPOINTS.AUTH.GOOGLE_MOBILE_COMPLETE;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      }

      return {
        success: false,
        error: data.message || 'Failed to complete registration',
        code: data.code,
      };
    } catch (error) {
      console.error('Complete Google Auth error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Sign out user
  async signOut(token) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign out failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const googleAuth = new GoogleAuth();

export default googleAuth;
