/**
 * Settings Screen
 * Language picker (wired to LanguageContext, which persists the selection and
 * handles the RTL reload prompt), theme picker, sign out, and a placeholder
 * About section linking out to the website's privacy/terms pages.
 * Styling mirrors ProfileScreen.js's shared design language (colorTokens/
 * radiusTokens/fontFamilies + surfaceRaised panels).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { WEB_BASE_URL } from '../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import { logical, row } from '../utils/rtl';

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow strings)
// as RN shadow/elevation props - same shadow color/opacity ProfileScreen/LoginScreen use.
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

const LANGUAGES = [
  { code: 'en', labelKey: 'english' },
  { code: 'fr', labelKey: 'french' },
  { code: 'ar', labelKey: 'arabic' },
];

const THEME_MODES = [
  { code: 'system', labelKey: 'themeSystem', icon: 'phone-portrait-outline' },
  { code: 'light', labelKey: 'themeLight', icon: 'sunny-outline' },
  { code: 'dark', labelKey: 'themeDark', icon: 'moon-outline' },
];

const SettingsScreen = ({ navigation }) => {
  const { isSignedIn, signOut } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;
  const chevronIcon = isRTL ? 'chevron-back' : 'chevron-forward';

  const handleSignOut = () => {
    Alert.alert(t('logout'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: signOut },
    ]);
  };

  const handleAuthButtonPress = () => {
    if (isSignedIn) {
      handleSignOut();
    } else {
      navigation.navigate('Login');
    }
  };

  const openLink = (path) => {
    Linking.openURL(`${WEB_BASE_URL}${path}`).catch(() => {
      Alert.alert(t('error'), t('failedToLoadFormData'));
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('settings')} showMenu={false} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, textStyle]}>{t('theme')}</Text>
        <View style={styles.card}>
          <View style={styles.chipsRow}>
            {THEME_MODES.map((themeOption) => {
              const isSelected = themeMode === themeOption.code;
              return (
                <TouchableOpacity
                  key={themeOption.code}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setThemeMode(themeOption.code)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={themeOption.icon}
                    size={15}
                    color={isSelected ? '#FFFFFF' : tokens.ink}
                    style={styles.chipIcon}
                  />
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {t(themeOption.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, textStyle]}>{t('language')}</Text>
        <View style={styles.card}>
          <View style={styles.chipsRow}>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{t(lang.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, textStyle]}>{t('about')}</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => openLink('/privacy')}>
            <Text style={[styles.menuRowText, textStyle]}>{t('privacyPolicy')}</Text>
            <Ionicons name={chevronIcon} size={18} color={`${tokens.ink}66`} />
          </TouchableOpacity>
          <View style={styles.menuRowDivider} />
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => openLink('/terms')}>
            <Text style={[styles.menuRowText, textStyle]}>{t('termsOfService')}</Text>
            <Ionicons name={chevronIcon} size={18} color={`${tokens.ink}66`} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleAuthButtonPress} activeOpacity={0.85}>
          <Text style={styles.signOutButtonText}>{isSignedIn ? t('logout') : t('login')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    textRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginBottom: 10,
      marginTop: 4,
    },
    card: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 14,
      marginBottom: 22,
      ...getElevation(isDark, 1),
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    chip: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    chipSelected: {
      backgroundColor: tokens.brandPrimary,
      borderColor: tokens.brandPrimary,
    },
    chipIcon: {
      ...logical(isRTL, { marginEnd: 6 }),
    },
    chipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: tokens.ink,
    },
    chipTextSelected: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
    },
    menuCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
      marginBottom: 26,
      ...getElevation(isDark, 1),
    },
    menuRow: {
      flexDirection: row(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    menuRowDivider: {
      height: 1,
      backgroundColor: `${tokens.ink}12`,
      marginHorizontal: 16,
    },
    menuRowText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
      textAlign: isRTL ? 'right' : 'left',
    },
    signOutButton: {
      height: 50,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.status.lost.main,
      justifyContent: 'center',
      alignItems: 'center',
    },
    signOutButtonText: {
      color: tokens.status.lost.main,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
    },
  });

export default SettingsScreen;
