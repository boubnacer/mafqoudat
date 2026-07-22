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
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
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

const SignUpScreen = ({ navigation }) => {
  const { signInWithGoogle, completeLogin } = useAuth();
  const { currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark), [tokens, isDark]);
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
        // Same storage/state path as password login. Login/SignUp share a
        // stack with MainTabs (guest browsing - see App.js), so isSignedIn
        // flipping doesn't remount the tree; navigate to Home explicitly.
        await completeLogin(accessToken);
        navigation.navigate('MainTabs');
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
        navigation.navigate('MainTabs');
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
                  placeholderTextColor={styles.placeholderColor.color}
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
                <ActivityIndicator color="#FFFFFF" />
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
                <ActivityIndicator color={tokens.ink} />
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
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  brandName: {
    fontFamily: fontFamilies.display,
    fontSize: 26,
    color: tokens.brandPrimary,
    marginBottom: 6,
    textAlign: 'center',
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
  passwordHint: {
    marginTop: 6,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: `${tokens.ink}99`,
  },
  passwordHintValid: {
    color: tokens.status.found.main,
  },
  passwordHintError: {
    color: tokens.status.lost.main,
  },
  countryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryInputText: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: tokens.ink,
  },
  countryInputPlaceholder: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: `${tokens.ink}66`,
  },
  countryInputChevron: {
    fontSize: 18,
    color: `${tokens.ink}99`,
    marginStart: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouchable: {
    paddingTop: 2,
    paddingEnd: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: radiusTokens.sm,
    borderWidth: 1.5,
    borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    backgroundColor: `${tokens.ink}0A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: tokens.brandPrimary,
    borderColor: tokens.brandPrimary,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: tokens.ink,
    lineHeight: 20,
  },
  termsLink: {
    color: tokens.brandPrimary,
    fontFamily: fontFamilies.bodySemiBold,
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
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  signInPrompt: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: `${tokens.ink}99`,
    marginEnd: 6,
  },
  signInLink: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: tokens.brandPrimary,
  },
});

export default SignUpScreen;
