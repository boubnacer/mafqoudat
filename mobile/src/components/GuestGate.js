/**
 * Shown in place of a protected tab/screen's real content when the user is
 * browsing as a guest (country picked, not signed in) - e.g. NewPost, MyPosts,
 * Profile, SettingsScreen. Keeps those screens from firing authenticated API
 * calls (POST /posts, GET /posts/user, ...) that would just 401 for a guest.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import AppHeader from './AppHeader';

const GuestGate = ({ title }) => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {title ? <AppHeader title={title} /> : null}
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={30} color={tokens.brandPrimary} />
        </View>
        <Text style={[styles.title, isRTL && styles.textRTL]}>{t('signInRequiredTitle')}</Text>
        <Text style={[styles.message, isRTL && styles.textRTL]}>{t('signInRequiredMessage')}</Text>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>{t('login')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${tokens.brandPrimary}14`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 19,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    textRTL: {
      textAlign: 'center',
    },
    button: {
      height: 48,
      paddingHorizontal: 28,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: tokens.brandPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    buttonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
    },
  });

export default GuestGate;
