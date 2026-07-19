/**
 * Edit Profile Screen
 * Mirrors: client/src/features/userSettings/UserProfile/UserProfile.jsx (edit mode)
 * PATCH /users only accepts { id, username, country, email, phone, password } plus
 * (as of this feature) { firstName, lastName } - username/email/phone aren't exposed
 * as editable here (out of this screen's scope) but must still be resent unchanged,
 * since the endpoint requires id/username/country on every request.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiClient from '../app/api/apiService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { storage } from '../utils/storage';

const EditProfileScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { refreshSession } = useAuth();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { countries } = useReferenceData();
  const isRTL = currentLanguage === 'ar';
  const isLocalAccount = user?.authProvider === 'local';

  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [countryId, setCountryId] = useState((user?.country && (user.country._id || user.country)) || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textStyle = isRTL ? styles.textRTL : null;

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
        await refreshSession(response.data.accessToken);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
          {t('editProfile')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, textStyle]}>{t('firstName')}</Text>
          <TextInput
            style={[styles.textInput, textStyle]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('firstName')}
            placeholderTextColor="#999"
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, textStyle]}>{t('lastName')}</Text>
          <TextInput
            style={[styles.textInput, textStyle]}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('lastName')}
            placeholderTextColor="#999"
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, textStyle]}>{t('country')} *</Text>
          <Text style={[styles.warningText, textStyle]}>{t('countryChangeWarning')}</Text>
          <View style={styles.chipsRow}>
            {countries.map((country) => {
              const id = country._id || country.id;
              const isSelected = id === countryId;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => {
                    setCountryId(id);
                    clearFieldError('country');
                  }}
                >
                  {country.flag ? <Text style={styles.chipFlag}>{country.flag}</Text> : null}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {getLocalizedLabel(country, currentLanguage)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {fieldErrors.country ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
        </View>

        {isLocalAccount ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('changePassword')}</Text>
            <Text style={[styles.helperText, textStyle]}>{t('changePasswordOptional')}</Text>
            <TextInput
              style={[styles.textInput, textStyle, fieldErrors.newPassword && styles.inputError]}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                clearFieldError('newPassword');
                clearFieldError('confirmPassword');
              }}
              placeholder={t('newPassword')}
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
            {fieldErrors.newPassword ? <Text style={styles.fieldError}>{fieldErrors.newPassword}</Text> : null}
            <TextInput
              style={[styles.textInput, styles.spacedInput, textStyle, fieldErrors.confirmPassword && styles.inputError]}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError('confirmPassword');
              }}
              placeholder={t('confirmPassword')}
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
            {fieldErrors.confirmPassword ? <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text> : null}
          </View>
        ) : null}

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError.message}</Text>
            {submitError.type !== 'validation' ? (
              <TouchableOpacity onPress={handleSubmit} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t('saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'right',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#EF6C00',
    marginBottom: 10,
  },
  textInput: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  spacedInput: {
    marginTop: 10,
  },
  inputError: {
    borderColor: '#c62828',
  },
  fieldError: {
    color: '#c62828',
    fontSize: 12,
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    marginEnd: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#2196F3',
  },
  chipFlag: {
    marginEnd: 4,
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#c62828',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  submitButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditProfileScreen;
