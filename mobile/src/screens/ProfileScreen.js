/**
 * Profile Screen
 * Mirrors: client/src/features/userSettings/UserProfile/UserProfile.jsx
 * Acts as a small hub: profile summary + links out to My Posts and Settings.
 * Styling mirrors HomeScreen.js / LoginScreen.js's shared design language
 * (colorTokens/radiusTokens/fontFamilies + surfaceRaised panels).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import DataStateView from '../components/DataStateView';
import AppHeader from '../components/AppHeader';

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow strings)
// as RN shadow/elevation props - same shadow color/opacity HomeScreen/LoginScreen use.
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

const ProfileScreen = ({ navigation }) => {
  const { user: authUser, setLoginNotice } = useAuth();
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { countries } = useReferenceData();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isFirstFocusRef = useRef(true);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (!authUser?.id) return;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      try {
        const response = await apiClient.get(`/users/${authUser.id}`);
        setProfile(response.data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(!err.response ? t('networkError') : t('failedToLoadProfile'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authUser?.id]
  );

  const handleRefresh = () => loadProfile(true);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refresh after returning from EditProfileScreen.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      loadProfile();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser?.id])
  );

  const textStyle = isRTL ? styles.textRTL : null;

  // Guest tapping the Profile tab is bounced straight to Login (mirrors
  // client's ProtectedRoute) instead of showing an inline gate.
  useFocusEffect(
    useCallback(() => {
      if (!authUser) {
        setLoginNotice('loginRequiredProfile');
        navigation.navigate('Login');
      }
    }, [authUser, navigation, setLoginNotice])
  );

  if (!authUser) {
    return null;
  }

  if (isLoading && !profile) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('profile')} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.brandPrimary} />
        </View>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('profile')} />
        <View style={styles.centerContainer}>
          <DataStateView
            variant="error"
            message={error}
            actionLabel={t('retry')}
            onAction={() => loadProfile(false)}
            isRTL={isRTL}
          />
        </View>
      </View>
    );
  }

  const displayName = [profile?.profile?.firstName, profile?.profile?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const initial = (profile?.username || '?').charAt(0).toUpperCase();
  const contactLine = profile?.email || profile?.phone || t('noContactInfo');
  const isGoogleAccount = profile?.authProvider === 'google';

  const countryId = (profile?.country && (profile.country._id || profile.country)) || null;
  const countryRef = countries.find((c) => (c._id || c.id) === countryId);
  const countryLabel =
    profile?.country && typeof profile.country === 'object'
      ? getLocalizedLabel(profile.country, currentLanguage)
      : countryRef
        ? getLocalizedLabel(countryRef, currentLanguage)
        : '';
  const countryFlag = countryRef?.flag || '';

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(currentLanguage)
    : '';

  const chevronIcon = isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <View style={styles.container}>
      <AppHeader title={t('profile')} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[tokens.brandPrimary]}
            tintColor={tokens.brandPrimary}
          />
        }
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.displayName, textStyle]}>{displayName || profile?.username}</Text>
          <Text style={[styles.username, textStyle]}>@{profile?.username}</Text>
          <View style={styles.providerBadge}>
            <Ionicons
              name={isGoogleAccount ? 'logo-google' : 'lock-closed-outline'}
              size={13}
              color={tokens.brandPrimary}
            />
            <Text style={styles.providerBadgeText}>
              {isGoogleAccount ? t('googleAccount') : t('localAccount')}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoRowIcon}>
              <Ionicons name="mail-outline" size={18} color={tokens.brandPrimary} />
            </View>
            <View style={styles.infoRowTextWrap}>
              <Text style={[styles.infoLabel, textStyle]}>{t('contactSeller')}</Text>
              <Text style={[styles.infoValue, textStyle]} numberOfLines={1}>
                {contactLine}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.infoRowDivider]}>
            <View style={styles.infoRowIcon}>
              <Ionicons name="earth-outline" size={18} color={tokens.brandPrimary} />
            </View>
            <View style={styles.infoRowTextWrap}>
              <Text style={[styles.infoLabel, textStyle]}>{t('country')}</Text>
              <Text style={[styles.infoValue, textStyle]} numberOfLines={1}>
                {countryFlag ? `${countryFlag} ` : ''}
                {countryLabel || '-'}
              </Text>
            </View>
          </View>

          {joinDate ? (
            <View style={[styles.infoRow, styles.infoRowDivider]}>
              <View style={styles.infoRowIcon}>
                <Ionicons name="calendar-outline" size={18} color={tokens.brandPrimary} />
              </View>
              <View style={styles.infoRowTextWrap}>
                <Text style={[styles.infoLabel, textStyle]}>{t('memberSince')}</Text>
                <Text style={[styles.infoValue, textStyle]} numberOfLines={1}>
                  {joinDate}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('EditProfileScreen', { user: profile })}
        >
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{t('editProfile')}</Text>
        </TouchableOpacity>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyPosts')}
          >
            <View style={styles.menuRowIcon}>
              <Ionicons name="albums-outline" size={19} color={tokens.brandPrimary} />
            </View>
            <Text style={[styles.menuRowText, textStyle]}>{t('myPosts')}</Text>
            <Ionicons name={chevronIcon} size={18} color={`${tokens.ink}66`} />
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SettingsScreen')}
          >
            <View style={styles.menuRowIcon}>
              <Ionicons name="settings-outline" size={19} color={tokens.brandPrimary} />
            </View>
            <Text style={[styles.menuRowText, textStyle]}>{t('settings')}</Text>
            <Ionicons name={chevronIcon} size={18} color={`${tokens.ink}66`} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    textRTL: {
      textAlign: 'right',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },

    // Avatar header
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 4,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
      ...getElevation(isDark, 2),
      shadowColor: tokens.brandPrimary,
    },
    avatarText: {
      fontFamily: fontFamilies.display,
      color: '#FFFFFF',
      fontSize: 36,
    },
    displayName: {
      fontFamily: fontFamilies.display,
      fontSize: 21,
      color: tokens.ink,
      textAlign: 'center',
    },
    username: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}80`,
      marginTop: 2,
      textAlign: 'center',
    },
    providerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.brandPrimary}1A`,
    },
    providerBadgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
      fontSize: 12,
    },

    // Info panel - mirrors HomeScreen.js's panelContainer shell.
    infoCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
      padding: 8,
      marginBottom: 20,
      ...getElevation(isDark, 1),
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    infoRowDivider: {
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}12`,
    },
    infoRowIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      backgroundColor: `${tokens.brandPrimary}14`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoRowTextWrap: {
      flex: 1,
    },
    infoLabel: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}80`,
    },
    infoValue: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
      marginTop: 2,
    },

    // Primary CTA - mirrors LoginScreen.js's button.
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      marginBottom: 20,
      shadowColor: tokens.brandPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0 : 0.25,
      shadowRadius: 8,
      elevation: isDark ? 0 : 3,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
    },

    // Menu list
    menuCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    menuRowDivider: {
      height: 1,
      backgroundColor: `${tokens.ink}12`,
      marginHorizontal: 14,
    },
    menuRowIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      backgroundColor: `${tokens.brandPrimary}14`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuRowText: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
      textAlign: isRTL ? 'right' : 'left',
    },
  });

export default ProfileScreen;
