import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { API_BASE_URL } from '../config/api';

WebBrowser.maybeCompleteAuthSession();

class GoogleAuthNew {
  constructor() {
    // Use the same redirect URI as web version
    this.redirectUri = `${API_BASE_URL}/auth/google/callback`;
  }

  // Use the same Google OAuth flow as web version
  async authenticate() {
    try {
      console.log('🚀 Starting Google OAuth flow (same as web)...');
      
      // Use the same endpoint as web version with mobile parameter
      // The server will handle mobile detection and redirect appropriately
      const authUrl = `${API_BASE_URL}/auth/google?mobile=true`;
      
      console.log('🔗 Opening Google OAuth URL:', authUrl);

      // Open browser for OAuth - let server handle everything like web version
      const result = await WebBrowser.openBrowserAsync(authUrl, {
        enableJavaScript: true,
        enableDefaultShareMenus: false,
        dismissButtonStyle: 'close',
        readerMode: false,
      });

      console.log('📱 Browser result:', result);

      if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Authentication cancelled by user',
        };
      }
      
      // For other result types, we rely on deep linking to catch the callback
      // The server will redirect to mobile-callback page which triggers deep link
      return {
        success: false,
        error: 'Authentication in progress - waiting for callback...',
        pending: true,
      };
    } catch (error) {
      console.error('❌ Google Auth Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate Google authentication',
      };
    }
  }

  // Complete Google OAuth registration (same as web version)
  async completeRegistration(pendingToken, countryId) {
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
  }

  // Sign out user
  async signOut(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
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

  // Get current redirect URI (for debugging)
  getRedirectUri() {
    return this.redirectUri;
  }
}

// Create singleton instance
const googleAuthNew = new GoogleAuthNew();

export default googleAuthNew;
