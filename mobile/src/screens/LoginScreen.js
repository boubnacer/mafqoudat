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
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { IS_GOOGLE_AUTH_CONFIGURED } from '../utils/googleAuth';

// Mirrors client/src/features/auth/SingUp/NewUserForm.js's own patterns, so the
// mobile and web apps agree on what counts as a plausible email/phone.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{7,20}$/;

// Same wordmark AppHeader uses in place of a text brand name.
const BRAND_WORDMARK = require('../../assets/mafWordmark.png');
const WORDMARK_RATIO = 984 / 213;

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow strings)
// as RN shadow/elevation props - same shadow color/opacity the web cards use.
const getElevation = (isDark, level = 1) =>
  level === 2
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.45 : 0.1,
        shadowRadius: 16,
        elevation: 4,
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.4 : 0.06,
        shadowRadius: 2,
        elevation: 2,
      };

const LoginScreen = ({ navigation }) => {
  const {
    signInWithGoogle,
    completeLogin,
    error: googleError,
    clearError,
    sessionExpired,
    clearSessionExpired,
    loginNotice,
    clearLoginNotice,
  } = useAuth();
  const { currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark), [tokens, isDark]);
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
      if (loginNotice) clearLoginNotice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sessionExpired (forced sign-out) takes priority over a screen-specific
  // loginNotice (e.g. "please log in to create a post") if both are somehow set.
  const noticeKey = sessionExpired ? 'sessionExpiredNotice' : loginNotice;

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
        // Login/SignUp/CountrySelection live in the same stack as MainTabs
        // (guest browsing shares it - see App.js), so isSignedIn flipping
        // doesn't remount into a signed-in tree the way it used to; navigate
        // back to MainTabs (Home) explicitly instead.
        await completeLogin(accessToken);
        navigation.navigate('MainTabs');
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
        navigation.navigate('MainTabs');
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
          <View style={styles.brandSection}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Image
              source={BRAND_WORDMARK}
              style={styles.brandWordmarkImg}
              resizeMode="contain"
              accessibilityLabel={t('brandName')}
            />
            <Text style={[styles.tagline, textStyle]}>{t('loginToAccount')}</Text>
          </View>

          <View style={styles.card}>
            {noticeKey ? (
              <View style={styles.noticeContainer}>
                <Text style={styles.noticeText}>{t(noticeKey)}</Text>
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
                placeholderTextColor={styles.placeholderColor.color}
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
                  placeholderTextColor={styles.placeholderColor.color}
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
                <ActivityIndicator color="#FFFFFF" />
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
                <ActivityIndicator color={tokens.ink} />
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (tokens, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.surfaceBase,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 72,
    height: 72,
    marginTop: 32,
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  brandWordmarkImg: {
    height: 34,
    width: 34 * WORDMARK_RATIO,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: `${tokens.ink}99`,
    textAlign: 'center',
  },
  card: {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: radiusTokens.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
    ...getElevation(isDark, 2),
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: `${tokens.ink}99`,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    borderRadius: radiusTokens.md,
    paddingHorizontal: 14,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    backgroundColor: `${tokens.ink}0A`,
    color: tokens.ink,
  },
  inputError: {
    borderColor: tokens.status.lost.main,
  },
  placeholderColor: {
    color: `${tokens.ink}66`,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    borderRadius: radiusTokens.md,
    backgroundColor: `${tokens.ink}0A`,
    paddingStart: 14,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: tokens.ink,
  },
  togglePasswordButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
  togglePasswordText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: tokens.brandPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldError: {
    marginTop: 6,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: tokens.status.lost.main,
  },
  button: {
    height: 52,
    backgroundColor: tokens.brandPrimary,
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: tokens.brandPrimary,
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
    color: '#FFFFFF',
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  errorContainer: {
    backgroundColor: tokens.status.lost.bg,
    padding: 14,
    borderRadius: radiusTokens.md,
    marginBottom: 14,
  },
  errorText: {
    color: tokens.status.lost.main,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
  },
  noticeContainer: {
    backgroundColor: isDark ? '#3A2E1A' : '#FFF3E0',
    padding: 14,
    borderRadius: radiusTokens.md,
    marginBottom: 14,
  },
  noticeText: {
    color: isDark ? '#FFB74D' : '#EF6C00',
    fontFamily: fontFamilies.body,
    fontSize: 13,
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'right',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
  },
  dividerText: {
    marginHorizontal: 14,
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: `${tokens.ink}80`,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: `${tokens.ink}0A`,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: tokens.ink,
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  googleAuthHint: {
    color: `${tokens.ink}80`,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  signUpPrompt: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: `${tokens.ink}99`,
    marginEnd: 6,
  },
  signUpLink: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: tokens.brandPrimary,
  },
});

export default LoginScreen;
