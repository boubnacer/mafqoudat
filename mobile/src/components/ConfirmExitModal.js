import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, fontFamilies, radiusTokens } from '../theme/tokens';

const ConfirmExitModal = ({ visible, onConfirmExit, onCancelExit }) => {
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancelExit}
    >
      <TouchableWithoutFeedback onPress={onCancelExit}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.iconBubble}>
                <Ionicons
                  name="alert-circle-outline"
                  size={32}
                  color={isDark ? '#FBBF24' : '#D97706'}
                />
              </View>

              <Text style={styles.title}>{t('discardPostTitle')}</Text>
              <Text style={styles.message}>{t('discardPostMessage')}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={onCancelExit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>{t('continueFilling')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={onConfirmExit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exitButtonText}>{t('discardAndExit')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.xl,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '26' : '14'}`,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    iconBubble: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: fontFamilies.display,
      fontWeight: '700',
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
      lineHeight: 21,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    buttonContainer: {
      width: '100%',
      gap: 10,
    },
    continueButton: {
      width: '100%',
      height: 48,
      backgroundColor: tokens.brandPrimary,
      borderRadius: radiusTokens.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    continueButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    exitButton: {
      width: '100%',
      height: 44,
      backgroundColor: 'transparent',
      borderRadius: radiusTokens.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exitButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.status?.lost?.main || '#E53E3E',
      fontWeight: '600',
    },
  });

export default ConfirmExitModal;
