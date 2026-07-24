/**
 * Restart Notice
 * Slim, non-blocking banner shown after a text-direction change (switching to
 * or from Arabic) when the app has no automatic-reload path available (see
 * LanguageContext.js's promptForRestart) - it never asks the user to do
 * anything, just notes that the layout finishes applying on next app open,
 * and auto-dismisses itself.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens } from '../theme/tokens';

const AUTO_DISMISS_MS = 4000;

const RestartNotice = () => {
  const insets = useSafeAreaInsets();
  const { directionChangeNotice, dismissDirectionChangeNotice } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const tokens = colorTokens[isDark ? 'dark' : 'light'];

  useEffect(() => {
    if (!directionChangeNotice) return undefined;
    const timer = setTimeout(dismissDirectionChangeNotice, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [directionChangeNotice, dismissDirectionChangeNotice]);

  if (!directionChangeNotice) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          bottom: insets.bottom + 16,
          backgroundColor: tokens.brandPrimary,
          borderRadius: radiusTokens.md,
        },
      ]}
    >
      <Text style={styles.text}>{t('languageDirectionNotice')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    start: 16,
    end: 16,
    zIndex: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RestartNotice;
