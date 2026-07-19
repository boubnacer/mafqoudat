import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
} from '../config/api';

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

  // Complete Google OAuth registration (POST /auth/google/mobile/complete)
  async completeRegistration(pendingToken, countryId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_MOBILE_COMPLETE}`, {
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
