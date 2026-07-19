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
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import LanguageDropdown from '../components/LanguageDropdown';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS } from '../config/api';

const LoginScreen = ({ navigation }) => {
  const { signInWithGoogle, completeLogin, isLoading: googleLoading, error: googleError, clearError } = useAuth();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (googleError) {
      Alert.alert('Authentication Error', googleError, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [googleError, clearError]);

  // Handle traditional login (username/password)
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
        // Persisting via context flips isSignedIn, which drives RootNavigator to
        // PostsListScreen automatically (that screen only exists in the signed-in stack).
        await completeLogin(accessToken);
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

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      console.log('🚀 Initiating Google Sign In from LoginScreen...');

      const result = await signInWithGoogle();

      if (result.success) {
        console.log('✅ Google sign in successful');
        // Navigation will be handled by AuthContext (isSignedIn flip)
      } else if (result.pending) {
        console.log('⏳ New Google user, navigating to country selection...');
        navigation.navigate('CountrySelection');
      } else if (!result.cancelled) {
        console.error('❌ Google sign in failed:', result.error);
        setError(result.error || 'Google authentication failed');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('brandName') || 'Mafqoudat'}</Text>
            <LanguageDropdown />
          </View>
          <Text style={styles.subtitle}>{t('loginToAccount') || 'Login to your account'}</Text>

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
                  {t('continueWithGoogle') || 'Continue with Google'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or') || 'OR'}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Traditional Login Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('emailOrPhonePlaceholder') || 'Email or Phone'}
              placeholderTextColor="#999"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder={t('passwordPlaceholder') || 'Password'}
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
                <Text style={styles.buttonText}>{t('login') || 'Login'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Debug Info */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Debug Information:</Text>
              <Text style={styles.debugText}>Google Loading: {googleLoading.toString()}</Text>
              <Text style={styles.debugText}>Form Loading: {isLoading.toString()}</Text>
              <Text style={styles.debugText}>Google Signing In: {isGoogleLoading.toString()}</Text>
              {googleError && <Text style={styles.debugError}>Google Error: {googleError}</Text>}
              {error && <Text style={styles.debugError}>Form Error: {error}</Text>}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
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
  debugInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  debugError: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 5,
  },
});

export default LoginScreen;
