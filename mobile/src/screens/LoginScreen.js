import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import LanguageDropdown from '../components/LanguageDropdown';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { IS_GOOGLE_AUTH_CONFIGURED } from '../utils/googleAuth';

// Mirrors client/src/features/auth/SingUp/NewUserForm.js's own patterns, so the
// mobile and web apps agree on what counts as a plausible email/phone.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{7,20}$/;

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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const textStyle = isRTL ? styles.textRTL : null;

  const passwordInputRef = useRef(null);

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ emailOrPhone: '', password: '' });
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

  const handleEmailChange = (value) => {
    setEmailOrPhone(value);
    if (fieldErrors.emailOrPhone) setFieldErrors((prev) => ({ ...prev, emailOrPhone: '' }));
    if (error) setError('');
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
    if (error) setError('');
  };

  const validateForm = () => {
    const trimmedId = emailOrPhone.trim();
    const nextErrors = { emailOrPhone: '', password: '' };

    if (!trimmedId) {
      nextErrors.emailOrPhone = `${t('emailOrPhone')} ${t('required')}`;
    } else if (!EMAIL_REGEX.test(trimmedId) && !PHONE_REGEX.test(trimmedId)) {
      nextErrors.emailOrPhone = t('invalidEmailOrPhone');
    }

    if (!password.trim()) {
      nextErrors.password = `${t('password')} ${t('required')}`;
    }

    setFieldErrors(nextErrors);
    return !nextErrors.emailOrPhone && !nextErrors.password;
  };

  // Handle traditional login (username/password)
  const handleLogin = async () => {
    if (!validateForm()) {
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

      // server/controllers/authcontroller.js rejects a password login on a
      // Google-only account with this exact code (400), before ever getting to
      // the generic INVALID_CREDENTIALS case - needs its own translated copy.
      const serverErrorCode = err.response?.data?.error?.message;

      if (serverErrorCode === 'OAUTH_LOGIN_ATTEMPT') {
        setError(t('oauthLoginAttempt'));
      } else if (err.response?.status === 400 || err.response?.status === 401) {
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

  // SignUpScreen doesn't exist yet - guarded so this screen keeps working once
  // it's wired up, and doesn't crash the app in the meantime.
  const handleSignUpPress = () => {
    try {
      navigation.navigate('SignUp');
    } catch (navError) {
      console.warn('SignUp screen is not registered yet:', navError);
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.languageRow}>
            <LanguageDropdown />
          </View>

          <View style={styles.brandSection}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
            <Text style={styles.brandName}>{t('brandName')}</Text>
            <Text style={[styles.tagline, textStyle]}>{t('loginToAccount')}</Text>
          </View>

          <View style={styles.card}>
            {sessionExpired ? (
              <View style={styles.noticeContainer}>
                <Text style={styles.noticeText}>{t('sessionExpiredNotice')}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Traditional Login Form */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>{t('emailOrPhone')}</Text>
              <TextInput
                style={[
                  styles.input,
                  isRTL && styles.textRTL,
                  fieldErrors.emailOrPhone && styles.inputError,
                ]}
                placeholder={t('emailOrPhonePlaceholder')}
                placeholderTextColor={colors.placeholder}
                value={emailOrPhone}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {fieldErrors.emailOrPhone ? (
                <Text style={[styles.fieldError, textStyle]}>{fieldErrors.emailOrPhone}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>{t('password')}</Text>
              <View style={[styles.passwordWrapper, fieldErrors.password && styles.inputError]}>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.passwordInput, isRTL && styles.textRTL]}
                  placeholder={t('passwordPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.togglePasswordButton}
                  activeOpacity={0.6}
                >
                  <Text style={styles.togglePasswordText}>
                    {showPassword ? t('hidePassword') : t('showPassword')}
                  </Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text style={[styles.fieldError, textStyle]}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.buttonText}>{t('login')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

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
          </View>

          <View style={styles.signUpRow}>
            <Text style={[styles.signUpPrompt, textStyle]}>{t('signUpPrompt')}</Text>
            <TouchableOpacity onPress={handleSignUpPress} activeOpacity={0.6} hitSlop={8}>
              <Text style={styles.signUpLink}>{t('signup')}</Text>
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

const createStyles = ({ colors, spacing, radii, fontSizes, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0 : 0.25,
    shadowRadius: 12,
    elevation: isDark ? 0 : 6,
  },
  brandName: {
    fontSize: fontSizes.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.08,
    shadowRadius: 16,
    elevation: isDark ? 0 : 3,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
    paddingStart: spacing.md,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  togglePasswordButton: {
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  togglePasswordText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldError: {
    marginTop: spacing.xs,
    fontSize: fontSizes.xs,
    color: colors.danger,
  },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.25,
    shadowRadius: 8,
    elevation: isDark ? 0 : 3,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: fontSizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorContainer: {
    backgroundColor: colors.dangerBackground,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  noticeContainer: {
    backgroundColor: colors.warningBackground,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    color: colors.warning,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'right',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  googleIcon: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  googleAuthHint: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
  },
  signUpPrompt: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginEnd: spacing.xs,
  },
  signUpLink: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  debugInfo: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  debugText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  debugError: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

export default LoginScreen;
