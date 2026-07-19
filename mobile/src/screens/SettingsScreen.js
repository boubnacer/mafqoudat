/**
 * Settings Screen
 * Language picker (wired to LanguageContext, which persists the selection and
 * handles the RTL reload prompt), sign out, and a placeholder About section
 * linking out to the website's privacy/terms pages.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { WEB_BASE_URL } from '../config/api';

const LANGUAGES = [
  { code: 'en', labelKey: 'english' },
  { code: 'fr', labelKey: 'french' },
  { code: 'ar', labelKey: 'arabic' },
];

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const textStyle = isRTL ? styles.textRTL : null;

  const handleSignOut = () => {
    Alert.alert(t('logout'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: signOut },
    ]);
  };

  const openLink = (path) => {
    Linking.openURL(`${WEB_BASE_URL}${path}`).catch(() => {
      Alert.alert(t('error'), t('failedToLoadFormData'));
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
          {t('settings')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, textStyle]}>{t('language')}</Text>
          <View style={styles.chipsRow}>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{t(lang.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, textStyle]}>{t('about')}</Text>
          <TouchableOpacity style={styles.menuRow} onPress={() => openLink('/privacy')}>
            <Text style={[styles.menuRowText, textStyle]}>{t('privacyPolicy')}</Text>
            <Text style={styles.menuRowChevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => openLink('/terms')}>
            <Text style={[styles.menuRowText, textStyle]}>{t('termsOfService')}</Text>
            <Text style={styles.menuRowChevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginEnd: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
  },
  menuRowChevron: {
    fontSize: 20,
    color: '#999',
  },
  signOutButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c62828',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SettingsScreen;
