/**
 * Direction Change Dialog
 * Shown after a language change that flips text direction (switching to or from
 * Arabic). Replaces the slim auto-dismissing banner this used to be: applying
 * the new direction properly needs the app to reopen, and that is worth an
 * explicit decision rather than a notice the user can miss in 4 seconds.
 *
 * Why reopening matters: the native RTL preferences are only written as part of
 * the relaunch itself (see LanguageContext - writing them while the app runs
 * flips the live layout out from under every screen). Until the user reopens,
 * the app runs on the manual compensation in utils/rtl.js, which can only reach
 * styles React Native owns - native text input carets and selection handles,
 * keyboard layout, scroll/swipe origin and modal gesture edges keep their old
 * direction until the process actually restarts.
 *
 * Two shapes, so the user is never left tapping a dead button:
 *  - restart available -> "Reopen App" (primary) + "Later"
 *  - restart unavailable (Expo Go, or the native call failed) -> a single
 *    acknowledgement, explaining the change applies next time they open the app.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { row } from '../utils/rtl';

const DirectionChangeDialog = () => {
  const {
    currentLanguage,
    directionChangeNotice,
    dismissDirectionChangeNotice,
    canRestartNatively,
    restartApp,
  } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const [isRestarting, setIsRestarting] = useState(false);

  const styles = createStyles(tokens, isDark, isRTL);

  const handleRestart = async () => {
    setIsRestarting(true);
    const ok = await restartApp();
    // On success the app is on its way down and this never matters; on failure
    // canRestartNatively flips false and the dialog re-renders as the
    // acknowledgement-only variant, so keep it mounted either way.
    if (!ok) setIsRestarting(false);
  };

  if (!directionChangeNotice) return null;

  return (
    <Modal
      transparent
      visible={directionChangeNotice}
      animationType="fade"
      onRequestClose={dismissDirectionChangeNotice}
      // The language change already happened; the dialog itself is laid out with
      // the same compensation every other screen uses until the restart lands.
      supportedOrientations={['portrait']}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('directionChangeTitle')}</Text>
          <Text style={styles.body}>
            {canRestartNatively ? t('directionChangeBodyRestart') : t('languageDirectionNotice')}
          </Text>

          {canRestartNatively ? (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={dismissDirectionChangeNotice}
                style={styles.secondaryButton}
                activeOpacity={0.7}
                disabled={isRestarting}
              >
                <Text style={styles.secondaryButtonText}>{t('directionChangeLater')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRestart}
                style={[styles.primaryButton, isRestarting && styles.primaryButtonDisabled]}
                activeOpacity={0.85}
                disabled={isRestarting}
              >
                <Text style={styles.primaryButtonText}>{t('reopenAppNow')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={dismissDirectionChangeNotice}
                style={styles.primaryButton}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>{t('ok')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    // Surface card per the platform-wide pattern: surfaceRaised, radius.lg,
    // separated by elevation alone rather than a border.
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 22,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.45 : 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 18,
      color: tokens.ink,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    body: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 21,
      color: `${tokens.ink}B3`,
      marginTop: 10,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    actions: {
      flexDirection: row(isRTL),
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      marginTop: 22,
    },
    primaryButton: {
      backgroundColor: tokens.brandPrimary,
      borderRadius: radiusTokens.md,
      paddingVertical: 11,
      paddingHorizontal: 20,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
    secondaryButton: {
      borderRadius: radiusTokens.md,
      paddingVertical: 11,
      paddingHorizontal: 16,
    },
    secondaryButtonText: {
      color: `${tokens.ink}99`,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
  });

export default DirectionChangeDialog;
