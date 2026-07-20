import React, { useState, useMemo, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import LanguageDropdown from '../components/LanguageDropdown';
import CountryPickerModal from '../components/CountryPickerModal';
import apiClient from '../api/apiService';
import { API_ENDPOINTS, WEB_BASE_URL } from '../config/api';
import { IS_GOOGLE_AUTH_CONFIGURED } from '../utils/googleAuth';

// Same shape rules as LoginScreen.js (mirrors client/src/features/auth/SingUp/NewUserForm.js's
// EMAIL_REGEX/PHONE_REGEX) - deliberately NOT the web form's buggy PWD_REGEX
// (/^[A-z0-9!@#$%]{4,12}$/, whose A-z range silently accepts stray punctuation).
// Server schema minimum is 6 chars; this exceeds it with a letter+number requirement.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{7,20}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const SignUpScreen = ({ navigation }) => {
  const { signInWithGoogle, completeLogin } = useAuth();
  const { currentLanguage } = useLanguage();
  const theme = useTheme();
  const { colors, isDark, setThemeMode } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const textStyle = isRTL ? styles.textRTL : null;

  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    country: '',
    terms: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordMeetsRequirements = PASSWORD_REGEX.test(password);

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    if (error) setError('');
  };

  const handleEmailChange = (value) => {
    setEmailOrPhone(value);
    clearFieldError('emailOrPhone');
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    clearFieldError('password');
    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    clearFieldError('confirmPassword');
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setCountryPickerVisible(false);
    clearFieldError('country');
  };

  const handleToggleTerms = () => {
    setAcceptTerms((prev) => !prev);
    clearFieldError('terms');
  };

  const openLegalLink = (path) => {
    Linking.openURL(`${WEB_BASE_URL}${path}`).catch(() => {
      Alert.alert(t('error'), t('failedToLoadFormData'));
    });
  };

  const validateForm = () => {
    const trimmedId = emailOrPhone.trim();
    const nextErrors = { emailOrPhone: '', password: '', confirmPassword: '', country: '', terms: '' };

    if (!trimmedId) {
      nextErrors.emailOrPhone = `${t('emailOrPhone')} ${t('required')}`;
    } else if (!EMAIL_REGEX.test(trimmedId) && !PHONE_REGEX.test(trimmedId)) {
      nextErrors.emailOrPhone = t('invalidEmailOrPhone');
    }

    if (!password) {
      nextErrors.password = `${t('password')} ${t('required')}`;
    } else if (!PASSWORD_REGEX.test(password)) {
      nextErrors.password = t('passwordRequirements');
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = `${t('confirmPassword')} ${t('required')}`;
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    if (!selectedCountry) {
      nextErrors.country = t('pleaseSelectCountry');
    }

    if (!acceptTerms) {
      nextErrors.terms = t('termsRequired');
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  // Handle account creation (mirrors server/controllers/usersController.js createNewUser)
  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE, {
        username: emailOrPhone.trim(),
        password,
        country: selectedCountry.id,
      });

      const { accessToken } = response.data;

      if (accessToken) {
        // Same storage/state path as password login - lands signed-in on PostsListScreen.
        await completeLogin(accessToken);
      } else {
        setError(t('networkError'));
      }
    } catch (err) {
      console.error('Sign up error:', err);

      // usersController.createNewUser responds with a plain { message, code } body
      // (no simpleAuthErrorHandler wrapper, unlike /auth's login) - read it directly.
      const serverBody = err.response?.data;
      const serverMessage = serverBody?.message;
      const serverCode = serverBody?.code;

      if (serverCode === 'OAUTH_USER' || serverMessage === 'OAUTH_EMAIL_EXISTS') {
        setError(t('oauthEmailExists'));
      } else if (serverMessage === 'Email already exists') {
        setError(t('emailAlreadyExists'));
      } else if (serverMessage === 'Phone number already exists') {
        setError(t('phoneAlreadyExists'));
      } else if (serverMessage === 'Email or phone number already exists') {
        setError(t('accountAlreadyExists'));
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

  // Google sign-up and sign-in are the same entry point - a brand-new Google
  // account gets routed to CountrySelectionScreen automatically (see AuthContext).
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();

      if (result.success) {
        // Navigation will be handled by AuthContext (isSignedIn flip)
      } else if (result.pending) {
        navigation.navigate('CountrySelection');
      } else if (!result.cancelled) {
        setError(result.error || t('oauthError'));
      }
    } catch (err) {
      console.error('Google sign up error:', err);
      setError(err.message || t('oauthError'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignInPress = () => {
    try {
      navigation.navigate('Login');
    } catch (navError) {
      console.warn('Login screen is not registered:', navError);
    }
  };

  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
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
          <View style={styles.topControlsRow}>
            <TouchableOpacity
              onPress={handleToggleTheme}
              style={styles.themeToggleButton}
              activeOpacity={0.7}
              accessibilityLabel={isDark ? t('themeLight') : t('themeDark')}
              hitSlop={8}
            >
              <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <LanguageDropdown />
          </View>

          <View style={styles.brandSection}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandName}>{t('brandName')}</Text>
            <Text style={[styles.tagline, textStyle]}>{t('createAccountTagline')}</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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
                  autoComplete="password-new"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  blurOnSubmit={false}
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
              {fieldErrors.password && !password ? (
                <Text style={[styles.fieldError, textStyle]}>{fieldErrors.password}</Text>
              ) : (
                <Text
                  style={[
                    styles.passwordHint,
                    textStyle,
                    passwordMeetsRequirements && styles.passwordHintValid,
                    !passwordMeetsRequirements && fieldErrors.password && styles.passwordHintError,
                  ]}
                >
                  {passwordMeetsRequirements ? `✓ ${t('passwordRequirements')}` : t('passwordRequirements')}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>{t('confirmPassword')}</Text>
              <View style={[styles.passwordWrapper, fieldErrors.confirmPassword && styles.inputError]}>
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={[styles.passwordInput, isRTL && styles.textRTL]}
                  placeholder={t('confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.togglePasswordButton}
                  activeOpacity={0.6}
                >
                  <Text style={styles.togglePasswordText}>
                    {showConfirmPassword ? t('hidePassword') : t('showPassword')}
                  </Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword ? (
                <Text style={[styles.fieldError, textStyle]}>{fieldErrors.confirmPassword}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>{t('country')}</Text>
              <TouchableOpacity
                style={[styles.input, styles.countryInput, fieldErrors.country && styles.inputError]}
                onPress={() => setCountryPickerVisible(true)}
                activeOpacity={0.7}
              >
                {selectedCountry ? (
                  <Text style={[styles.countryInputText, textStyle]} numberOfLines={1}>
                    {selectedCountry.flag ? `${selectedCountry.flag} ` : ''}
                    {selectedCountry.label}
                  </Text>
                ) : (
                  <Text style={[styles.countryInputPlaceholder, textStyle]}>{t('selectCountry')}</Text>
                )}
                <Text style={styles.countryInputChevron}>{isRTL ? '‹' : '›'}</Text>
              </TouchableOpacity>
              {fieldErrors.country ? (
                <Text style={[styles.fieldError, textStyle]}>{fieldErrors.country}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={handleToggleTerms}
                  activeOpacity={0.7}
                  hitSlop={8}
                  style={styles.checkboxTouchable}
                >
                  <View style={[styles.checkboxBox, acceptTerms && styles.checkboxBoxChecked]}>
                    {acceptTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.termsText, textStyle]} onPress={handleToggleTerms}>
                  {t('acceptTermsPrefix')}{' '}
                  <Text style={styles.termsLink} onPress={() => openLegalLink('/terms')}>
                    {t('termsOfService')}
                  </Text>{' '}
                  {t('termsAndConnector')}{' '}
                  <Text style={styles.termsLink} onPress={() => openLegalLink('/privacy')}>
                    {t('privacyPolicy')}
                  </Text>
                </Text>
              </View>
              {fieldErrors.terms ? (
                <Text style={[styles.fieldError, textStyle]}>{fieldErrors.terms}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.buttonText}>{t('createAccount')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[
                styles.googleButton,
                (isGoogleLoading || !IS_GOOGLE_AUTH_CONFIGURED) && styles.buttonDisabled,
              ]}
              onPress={handleGoogleSignUp}
              disabled={isGoogleLoading || !IS_GOOGLE_AUTH_CONFIGURED}
              activeOpacity={0.7}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>{t('signUpWithGoogle')}</Text>
                </>
              )}
            </TouchableOpacity>
            {!IS_GOOGLE_AUTH_CONFIGURED ? (
              <Text style={styles.googleAuthHint}>{t('googleAuthNotConfigured')}</Text>
            ) : null}
          </View>

          <View style={styles.signInRow}>
            <Text style={[styles.signInPrompt, textStyle]}>{t('signInPrompt')}</Text>
            <TouchableOpacity onPress={handleSignInPress} activeOpacity={0.6} hitSlop={8}>
              <Text style={styles.signInLink}>{t('signin')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={handleCountrySelect}
        selectedCountryId={selectedCountry?.id}
        t={t}
        currentLanguage={currentLanguage}
        isRTL={isRTL}
      />
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
    justifyContent: 'center',
  },
  content: {
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  topControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  themeToggleButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleIcon: {
    fontSize: fontSizes.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  brandName: {
    fontSize: fontSizes.xxl,
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
  passwordHint: {
    marginTop: spacing.xs,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  passwordHintValid: {
    color: colors.success,
  },
  passwordHintError: {
    color: colors.danger,
  },
  countryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryInputText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  countryInputPlaceholder: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.placeholder,
  },
  countryInputChevron: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    marginStart: spacing.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouchable: {
    paddingTop: 2,
    paddingEnd: spacing.sm,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: colors.primaryText,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
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
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
  },
  signInPrompt: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginEnd: spacing.xs,
  },
  signInLink: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default SignUpScreen;
