import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID, API_BASE_URL } from '../config/api';

WebBrowser.maybeCompleteAuthSession();

// Configuration
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

class GoogleAuthNew {
  constructor() {
    this.request = null;
    // Use a simple, fixed redirect URI that Google will accept
    this.redirectUri = 'mafqoudat://auth';
  }

  // Initialize the auth request
  async initAuthRequest() {
    try {
      console.log('🔧 Initializing AuthRequest with config:', {
        clientId: GOOGLE_WEB_CLIENT_ID?.substring(0, 10) + '...',
        redirectUri: this.redirectUri,
        responseType: 'code'
      });

      this.request = new AuthSession.AuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: this.redirectUri,
        responseType: 'code',
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      console.log('🔗 Auth request created, prompting user...');
      const result = await this.request.promptAsync(discovery);
      console.log('📱 Auth prompt result:', result.type);
      return result;
    } catch (error) {
      console.error('❌ Auth request initialization failed:', error);
      throw error;
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mobile/exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: this.redirectUri,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token exchange failed');
      }

      return data;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  // Complete the authentication flow
  async authenticate() {
    try {
      console.log('🚀 Starting Google OAuth flow...');
      console.log('📍 Redirect URI:', this.redirectUri);

      // Step 1: Get authorization code
      const result = await this.initAuthRequest();
      
      if (result.type === 'success') {
        console.log('✅ Authorization successful');
        
        const { code } = result.params;
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Step 2: Exchange code for tokens
        const tokenData = await this.exchangeCodeForTokens(code);
        
        console.log('✅ Token exchange successful');
        
        return {
          success: true,
          user: tokenData.user,
          token: tokenData.token,
        };
      } else if (result.type === 'cancel') {
        console.log('❌ User cancelled authentication');
        return {
          success: false,
          error: 'Authentication cancelled by user',
        };
      } else {
        console.log('❌ Authentication failed:', result);
        return {
          success: false,
          error: result.params?.error_description || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  // Sign out user
  async signOut(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mobile/signout`, {
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
