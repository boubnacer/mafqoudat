/**
 * Profile Screen
 * Mirrors: client/src/features/userSettings/UserProfile/UserProfile.jsx
 * Acts as a small hub: profile summary + links out to My Posts and Settings.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import DataStateView from '../components/DataStateView';
import AppHeader from '../components/AppHeader';

const ProfileScreen = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { countries } = useReferenceData();
  const isRTL = currentLanguage === 'ar';

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

  if (isLoading && !profile) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('profile')} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
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

  return (
    <View style={styles.container}>
      <AppHeader title={t('profile')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2196F3']} />}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.displayName, textStyle]}>{displayName || profile?.username}</Text>
          <Text style={[styles.username, textStyle]}>@{profile?.username}</Text>
          <View style={styles.providerBadge}>
            <Text style={styles.providerBadgeText}>
              {isGoogleAccount ? t('googleAccount') : t('localAccount')}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, textStyle]}>{t('contactSeller')}</Text>
            <Text style={[styles.infoValue, isRTL && styles.infoValueRTL]}>{contactLine}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, textStyle]}>{t('country')}</Text>
            <Text style={[styles.infoValue, isRTL && styles.infoValueRTL]}>
              {countryFlag ? `${countryFlag} ` : ''}
              {countryLabel || '-'}
            </Text>
          </View>
          {joinDate ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, textStyle]}>{t('memberSince')}</Text>
              <Text style={[styles.infoValue, isRTL && styles.infoValueRTL]}>{joinDate}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('EditProfileScreen', { user: profile })}
        >
          <Text style={styles.primaryButtonText}>{t('editProfile')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('MyPosts')}>
          <Text style={[styles.menuRowText, textStyle]}>{t('myPosts')}</Text>
          <Text style={styles.menuRowChevron}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('SettingsScreen')}>
          <Text style={[styles.menuRowText, textStyle]}>{t('settings')}</Text>
          <Text style={styles.menuRowChevron}>{isRTL ? '‹' : '›'}</Text>
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
  textRTL: {
    textAlign: 'right',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  providerBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
  },
  providerBadgeText: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginStart: 12,
  },
  infoValueRTL: {
    textAlign: 'left',
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  },
  menuRowText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  menuRowChevron: {
    fontSize: 20,
    color: '#999',
  },
});

export default ProfileScreen;
