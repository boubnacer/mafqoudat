import React, { useEffect, useState, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import LanguageDropdown from '../components/LanguageDropdown';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { IS_GOOGLE_AUTH_CONFIGURED } from '../utils/googleAuth';

const LoginScreen = ({ navigation }) => {
  const {
    signInWithGoogle,
    completeLogin,
    isLoading: googleLoading,
    error: googleError,
    clearError,
    sessionExpired,
    clearSessionExpired,
  } = useAuth();
  const { currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (googleError) {
      Alert.alert(t('authenticationError'), googleError, [
        { text: t('ok'), onPress: clearError }
      ]);
    }
  }, [googleError, clearError]);

  // Shows the notice for as long as this screen stays mounted; cleared on unmount
  // (successful login, or navigating away) so it doesn't resurface on a later visit.
  useEffect(() => {
    return () => {
      if (sessionExpired) clearSessionExpired();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setError(result.error || t('oauthError'));
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || t('oauthError'));
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
            <Text style={styles.title}>{t('brandName')}</Text>
            <LanguageDropdown />
          </View>
          <Text style={styles.subtitle}>{t('loginToAccount')}</Text>

          {sessionExpired ? (
            <View style={styles.sessionExpiredContainer}>
              <Text style={styles.sessionExpiredText}>{t('sessionExpiredNotice')}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Google OAuth Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              (isGoogleLoading || !IS_GOOGLE_AUTH_CONFIGURED) && styles.buttonDisabled,
            ]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || !IS_GOOGLE_AUTH_CONFIGURED}
            activeOpacity={0.7}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>
                  {t('continueWithGoogle')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {!IS_GOOGLE_AUTH_CONFIGURED ? (
            <Text style={styles.googleAuthHint}>{t('googleAuthNotConfigured')}</Text>
          ) : null}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Traditional Login Form */}
          <View style={styles.form}>
            <TextInput
              style={[styles.input, isRTL && styles.textRTL]}
              placeholder={t('emailOrPhonePlaceholder')}
              placeholderTextColor={colors.placeholder}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <TextInput
              style={[styles.input, isRTL && styles.textRTL]}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor={colors.placeholder}
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
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.buttonText}>{t('login')}</Text>
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

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
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
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  button: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.dangerBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  sessionExpiredContainer: {
    backgroundColor: colors.warningBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionExpiredText: {
    color: colors.warning,
    fontSize: 14,
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'right',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  googleAuthHint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.textPrimary,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  debugError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 5,
  },
});

export default LoginScreen;
