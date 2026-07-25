/**
 * Restart Notice
 * Slim, non-blocking banner shown after a text-direction change (switching to
 * or from Arabic). When a real native restart is available (canRestartNatively -
 * dev-client/production build, not Expo Go), it offers a "Reopen app" button that
 * actually restarts the app. Otherwise it falls back to a passive, auto-dismissing
 * notice - never a blocking "please restart manually" instruction either way.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens } from '../theme/tokens';

const AUTO_DISMISS_MS = 4000;

const RestartNotice = () => {
  const insets = useSafeAreaInsets();
  const {
    directionChangeNotice,
    dismissDirectionChangeNotice,
    canRestartNatively,
    restartApp,
  } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const tokens = colorTokens[isDark ? 'dark' : 'light'];

  useEffect(() => {
    // With a working restart button, leave the notice up until the user acts
    // (taps restart or dismisses) instead of timing it out under them.
    if (!directionChangeNotice || canRestartNatively) return undefined;
    const timer = setTimeout(dismissDirectionChangeNotice, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [directionChangeNotice, canRestartNatively, dismissDirectionChangeNotice]);

  if (!directionChangeNotice) return null;

  return (
    <View
      pointerEvents={canRestartNatively ? 'box-none' : 'none'}
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
      {canRestartNatively && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={restartApp} hitSlop={8} style={styles.restartButton}>
            <Text style={styles.restartButtonText}>{t('reopenAppNow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismissDirectionChangeNotice} hitSlop={8} style={styles.dismissButton}>
            <Text style={styles.dismissButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  restartButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dismissButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RestartNotice;
