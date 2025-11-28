/**
 * OAuth Callback Screen
 * Handles Google OAuth callback and extracts token
 * Mirrors: client/src/features/auth/OAuthCallback.jsx
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { storage } from '../utils/storage';
import { decodeToken } from '../utils/tokenUtils';

const OAuthCallbackScreen = ({ route, navigation }) => {
  const { token, error, pendingToken } = route.params || {};

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('OAuthCallbackScreen - Handling callback:', { token: !!token, pendingToken: !!pendingToken, error });
      
      // Handle error case
      if (error) {
        console.error('OAuth error:', error);
        navigation.replace('Login', { error });
        return;
      }

      // Handle pending token (new user - needs country selection)
      if (pendingToken) {
        console.log('OAuthCallbackScreen - Navigating to CountrySelection');
        navigation.replace('CountrySelection', { pendingToken });
        return;
      }

      // Handle token (existing user)
      if (token) {
        console.log('OAuthCallbackScreen - Storing token and navigating to PostsList');
        // Store token securely
        await storage.setToken(token);

        // Decode and store user data
        const userData = decodeToken(token);
        if (userData) {
          await storage.setUserData(userData);
        }

        // Navigate to posts list
        navigation.replace('PostsList');
        return;
      }

      // No token or error - redirect to login
      console.warn('OAuthCallbackScreen - No token, pendingToken, or error found');
      navigation.replace('Login', { error: 'no_token' });
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      navigation.replace('Login', { error: 'authentication_failed' });
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.text}>
        Completing authentication...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default OAuthCallbackScreen;

