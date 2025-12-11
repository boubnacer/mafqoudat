/**
 * Login Screen
 * Mirrors: client/src/features/auth/Login/Login.js
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { storage } from '../utils/storage';
import { decodeToken } from '../utils/tokenUtils';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import LanguageDropdown from '../components/LanguageDropdown';
import { initiateGoogleAuth } from '../utils/googleAuth';

const LoginScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  const handleLogin = async () => {
    // Validation
    if (!emailOrPhone.trim()) {
      setError(t('emailOrPhone') + ' ' + t('required'));
      return;
    }

    if (!password.trim()) {
      setError(t('password') + ' ' + t('required'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call login API (mirrors web app: POST /auth)
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        emailOrPhone: emailOrPhone.trim(),
        password: password,
      });

      const { accessToken } = response.data;

      if (accessToken) {
        // Store token securely
        await storage.setToken(accessToken);

        // Decode and store user data
        const userData = decodeToken(accessToken);
        if (userData) {
          await storage.setUserData(userData);
        }

        // Navigate to posts list
        navigation.replace('PostsList');
      } else {
        setError(t('invalidCredentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different error types
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError(t('invalidCredentials'));
      } else if (err.response?.status === 429) {
        setError(t('tooManyAttempts'));
      } else if (err.response?.status === 503) {
        setError(t('maintenanceMode'));
      } else {
        setError(t('networkError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      console.log('Initiating Google login with simple redirect approach...');
      
      const result = await initiateGoogleAuth();
      console.log('Google login result:', result);

      if (result.type === 'cancel') {
        console.log('User cancelled OAuth');
        // User cancelled - do nothing
        setError('');
      } else if (result.type === 'error') {
        console.error('OAuth error:', result.error);
        // Error occurred
        const errorMessage = result.error || t('oauthError') || 'Google authentication failed';
        setError(errorMessage);
      } else {
        // For 'pending' or other types, we rely on deep linking in App.js
        console.log('OAuth initiated, waiting for deep link callback...');
        setError('Please complete authentication in the browser...');
        
        // Show token input as fallback after a delay
        setTimeout(() => {
          if (isGoogleLoading) {
            setShowTokenInput(true);
            setError('If automatic redirect fails, please copy the token from the browser and paste it below');
          }
        }, 10000); // 10 seconds delay
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || t('oauthError') || 'Google authentication failed');
    } finally {
      // Don't set loading to false immediately - wait for callback or timeout
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 15000); // 15 seconds timeout
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('brandName')}</Text>
          <LanguageDropdown />
        </View>
        <Text style={styles.subtitle}>{t('loginToAccount')}</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Google OAuth Button */}
        <TouchableOpacity
          style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading}
          activeOpacity={0.7}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                {t('continueWithGoogle')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Token Input (for manual OAuth token entry) */}
        <TouchableOpacity
          style={styles.tokenToggleButton}
          onPress={() => setShowTokenInput(!showTokenInput)}
        >
          <Text style={styles.tokenToggleText}>
            {showTokenInput ? 'Hide' : 'Paste'} OAuth Token
          </Text>
        </TouchableOpacity>

        {showTokenInput && (
          <View style={styles.tokenInputContainer}>
            <Text style={styles.tokenInputLabel}>
              Paste your authentication token here:
            </Text>
            <Text style={styles.tokenInputHint}>
              (Copy it from the browser page after selecting your Google account)
            </Text>
            <TextInput
              style={styles.tokenInput}
              placeholder="Paste token here..."
              placeholderTextColor="#999"
              value={tokenInput}
              onChangeText={(text) => {
                setTokenInput(text);
                setError(''); // Clear error when user types
              }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
            />
            <TouchableOpacity
              style={[styles.button, styles.tokenButton, !tokenInput.trim() && styles.buttonDisabled]}
              onPress={async () => {
                if (!tokenInput.trim()) {
                  setError('Please paste a token');
                  return;
                }
                setIsLoading(true);
                setError('');
                try {
                  const token = tokenInput.trim();
                  
                  // Store token securely
                  await storage.setToken(token);
                  
                  // Decode and store user data
                  const userData = decodeToken(token);
                  if (userData) {
                    await storage.setUserData(userData);
                    // Navigate to posts list
                    navigation.replace('PostsList');
                  } else {
                    setError('Invalid token format. Please check the token and try again.');
                  }
                } catch (err) {
                  console.error('Token login error:', err);
                  setError('Invalid token. Please make sure you copied the complete token.');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={!tokenInput.trim() || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Verifying...' : 'Use Token'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowTokenInput(false)}
              style={styles.hideTokenButton}
            >
              <Text style={styles.hideTokenText}>Hide Token Input</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('or') || 'OR'}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('emailOrPhonePlaceholder')}
            placeholderTextColor="#999"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder={t('passwordPlaceholder')}
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('login')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2196F3',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 16,
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  tokenToggleButton: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    alignItems: 'center',
  },
  tokenToggleText: {
    fontSize: 14,
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  tokenInputContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tokenInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tokenInputHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tokenInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 12,
    backgroundColor: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlignVertical: 'top',
  },
  tokenButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  hideTokenButton: {
    padding: 8,
    alignItems: 'center',
  },
  hideTokenText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
