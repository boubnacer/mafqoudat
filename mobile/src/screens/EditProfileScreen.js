/**
 * Edit Profile Screen
 * Mirrors: client/src/features/userSettings/UserProfile/UserProfile.jsx (edit mode)
 * PATCH /users only accepts { id, username, country, email, phone, password } plus
 * (as of this feature) { firstName, lastName } - username/email/phone aren't exposed
 * as editable here (out of this screen's scope) but must still be resent unchanged,
 * since the endpoint requires id/username/country on every request.
 * Styling mirrors LoginScreen.js/ProfileScreen.js's shared design language
 * (colorTokens/radiusTokens/fontFamilies + surfaceRaised card); the country field
 * reuses SelectModal (same component PostForm.js's Country field uses).
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { storage } from '../utils/storage';
import { colorTokens, radiusTokens, fontFamilies, lightColors, darkColors } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import SelectModal from '../components/SelectModal';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

const EditProfileScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { refreshSession } = useAuth();
  const { currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { countries } = useReferenceData();
  const isRTL = currentLanguage === 'ar';
  const isLocalAccount = user?.authProvider === 'local';

  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const legacy = isDark ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(tokens, legacy, isDark, isRTL), [tokens, legacy, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;

  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [countryId, setCountryId] = useState((user?.country && (user.country._id || user.country)) || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errors = {};
    if (!countryId) errors.country = true;
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) errors.newPassword = t('passwordTooShort');
      else if (newPassword !== confirmPassword) errors.confirmPassword = t('passwordsDoNotMatch');
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError({ type: 'validation', message: t('pleaseCompleteRequiredFields') });
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        id: user._id,
        username: user.username,
        country: countryId,
        email: user.email,
        phone: user.phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (newPassword) {
        payload.password = newPassword;
      }

      const response = await apiClient.patch('/users', payload);

      if (response.data?.accessToken) {
        await refreshSession(response.data.accessToken, response.data.refreshToken);
      }

      // PostsListScreen prefers the onboarding-selected browsing country over
      // the account country (see storage.getCurrentCountry). Without this, the
      // country-change warning above would be a lie: the account country would
      // update, but browsing would silently keep using the old country.
      const originalCountryId = (user?.country && (user.country._id || user.country)) || '';
      if (countryId !== originalCountryId) {
        await storage.setCurrentCountry(countryId);
      }

      navigation.goBack();
    } catch (err) {
      if (err.response?.status === 403) {
        setSubmitError({ type: 'generic', message: t('notAuthorizedForPost') });
      } else if (err.response?.status === 409) {
        setSubmitError({ type: 'generic', message: err.response.data?.message || t('errorCreatingPostMessage') });
      } else if (err.response?.status === 400) {
        setSubmitError({ type: 'validation', message: err.response.data?.message || t('errorCreatingPostMessage') });
      } else if (!err.response) {
        setSubmitError({ type: 'network', message: t('networkError') });
      } else {
        setSubmitError({ type: 'generic', message: err.response?.data?.message || t('errorCreatingPostMessage') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = countries.find((c) => (c._id || c.id) === countryId) || null;

  return (
    <View style={styles.container}>
      <AppHeader title={t('editProfile')} showMenu={false} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>{t('firstName')}</Text>
              <TextInput
                style={[styles.input, textStyle]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('firstName')}
                placeholderTextColor={styles.placeholderColor.color}
                maxLength={50}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>{t('lastName')}</Text>
              <TextInput
                style={[styles.input, textStyle]}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('lastName')}
                placeholderTextColor={styles.placeholderColor.color}
                maxLength={50}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, textStyle]}>
                {t('country')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.warningText, textStyle]}>{t('countryChangeWarning')}</Text>
              <TouchableOpacity
                style={[styles.selectButton, fieldErrors.country && styles.inputError]}
                onPress={() => setCountryPickerVisible(true)}
                activeOpacity={0.7}
              >
                {selectedCountry?.flag ? (
                  <Text style={styles.countryFlagText}>{selectedCountry.flag}</Text>
                ) : (
                  <Ionicons name="flag-outline" size={18} color={`${tokens.ink}99`} style={styles.selectButtonIcon} />
                )}
                <Text
                  style={[styles.selectButtonText, !selectedCountry && styles.selectButtonPlaceholder, textStyle]}
                  numberOfLines={1}
                >
                  {selectedCountry ? getLocalizedLabel(selectedCountry, currentLanguage) : t('selectCountry')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={`${tokens.ink}80`} />
              </TouchableOpacity>
              {fieldErrors.country ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
            </View>

            {isLocalAccount ? (
              <>
                <View style={styles.divider} />
                <Text style={[styles.sectionHeading, textStyle]}>{t('changePassword')}</Text>
                <Text style={[styles.helperText, textStyle]}>{t('changePasswordOptional')}</Text>

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[styles.input, textStyle, fieldErrors.newPassword && styles.inputError]}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      clearFieldError('newPassword');
                      clearFieldError('confirmPassword');
                    }}
                    placeholder={t('newPassword')}
                    placeholderTextColor={styles.placeholderColor.color}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  {fieldErrors.newPassword ? <Text style={styles.fieldError}>{fieldErrors.newPassword}</Text> : null}
                </View>

                <View style={styles.fieldGroupLast}>
                  <TextInput
                    style={[styles.input, textStyle, fieldErrors.confirmPassword && styles.inputError]}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearFieldError('confirmPassword');
                    }}
                    placeholder={t('confirmPassword')}
                    placeholderTextColor={styles.placeholderColor.color}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  {fieldErrors.confirmPassword ? (
                    <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>

          {submitError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{submitError.message}</Text>
              {submitError.type !== 'validation' ? (
                <TouchableOpacity onPress={handleSubmit} style={styles.retryButton} activeOpacity={0.85}>
                  <Text style={styles.retryButtonText}>{t('retry')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('saveChanges')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        title={t('country')}
        searchPlaceholder={t('searchCountry')}
        noResultsText={t('countryNoResults')}
        options={countries}
        getId={(c) => c._id || c.id}
        getLabel={(c) => getLocalizedLabel(c, currentLanguage)}
        renderLeading={(c) => <Text style={styles.countryFlagText}>{c.flag || '🌍'}</Text>}
        multiple={false}
        selectedIds={countryId ? [countryId] : []}
        onSelect={(id) => {
          setCountryId(id);
          clearFieldError('country');
        }}
        isRTL={isRTL}
      />
    </View>
  );
};

const createStyles = (tokens, legacy, isDark, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    flex: {
      flex: 1,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.xl,
      padding: 20,
      marginBottom: 20,
    },
    fieldGroup: {
      marginBottom: 18,
    },
    fieldGroupLast: {
      marginBottom: 2,
    },
    label: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginBottom: 8,
    },
    requiredMark: {
      color: legacy.danger,
    },
    sectionHeading: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
      marginBottom: 4,
    },
    helperText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}80`,
      marginBottom: 14,
    },
    warningText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: legacy.warning,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginBottom: 18,
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 14,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      backgroundColor: `${tokens.ink}0A`,
      color: tokens.ink,
    },
    placeholderColor: {
      color: `${tokens.ink}66`,
    },
    inputError: {
      borderColor: legacy.danger,
    },
    fieldError: {
      color: legacy.danger,
      fontFamily: fontFamilies.body,
      fontSize: 12,
      marginTop: 6,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    selectButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      height: 52,
      paddingHorizontal: 14,
      backgroundColor: `${tokens.ink}0A`,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    selectButtonIcon: {
      ...logical(isRTL, { marginEnd: 10 }),
    },
    countryFlagText: {
      fontSize: 18,
      ...logical(isRTL, { marginEnd: 10 }),
    },
    selectButtonText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
    },
    selectButtonPlaceholder: {
      color: `${tokens.ink}66`,
    },
    errorBanner: {
      backgroundColor: legacy.dangerBackground,
      borderRadius: radiusTokens.md,
      padding: 14,
      marginBottom: 16,
    },
    errorBannerText: {
      color: legacy.danger,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 10,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: radiusTokens.md,
      backgroundColor: legacy.danger,
    },
    retryButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
    },
    submitButton: {
      height: 52,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: tokens.brandPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0 : 0.25,
      shadowRadius: 8,
      elevation: isDark ? 0 : 3,
    },
    submitButtonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    submitButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
    },
  });

export default EditProfileScreen;
