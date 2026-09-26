/**
 * Claim Item Sheet
 * Bottom-sheet modal for claiming an item or helping return it, mirroring
 * client/src/components/ClaimItemDialog.jsx.
 *
 * Provides a two-step flow:
 *   Step 1: Safety Notice with prominent trust/verification advice and "Continue" button
 *   Step 2: Contact Details (revealed only after clicking Continue)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

const openLink = (url, t) => {
  Linking.openURL(url).catch(() => {
    Alert.alert(t('error') || 'Error', t('failedToLoadPost') || 'Could not open link');
  });
};

const ClaimItemSheet = ({
  visible,
  onClose,
  isFoundType,
  contactAction,
  t,
  isRTL,
  onContinue,
}) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);

  const [step, setStep] = useState('safety'); // 'safety' | 'contacts'

  useEffect(() => {
    if (visible) {
      setStep('safety');
    }
  }, [visible]);

  const resetAndClose = () => {
    setStep('safety');
    onClose();
  };

  const handleContinue = () => {
    setStep('contacts');
    onContinue?.();
  };

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={resetAndClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconCircle,
                  step === 'safety' ? styles.headerIconCircleBrand : styles.headerIconCircleSuccess,
                ]}
              >
                {step === 'safety' ? (
                  <Ionicons name="shield-checkmark" size={20} color={tokens.brandPrimary} />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color={tokens.status.found.main} />
                )}
              </View>
              <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
                {step === 'safety'
                  ? t('safetyNotice')
                  : isFoundType
                  ? t('claimYourItem')
                  : t('helpReturnItem')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={resetAndClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
            >
              <Ionicons name="close" size={20} color={`${tokens.ink}CC`} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.body} bounces={false}>
            {step === 'safety' ? (
              <View>
                <Text style={[styles.subtitle, textStyle]}>{t('safetyReminderDesc')}</Text>

                <View style={styles.safetyCard}>
                  <View style={styles.safetyIconBadge}>
                    <Ionicons name="shield-checkmark" size={24} color={tokens.brandPrimary} />
                  </View>
                  <View style={styles.safetyCardContent}>
                    <Text style={[styles.safetyCardTitle, textStyle]}>{t('safetyFirst')}</Text>
                    <Text style={[styles.safetyCardText, textStyle]}>
                      {isFoundType ? t('contactSafetyNote') : t('contactSafetyNoteFinder')}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                {/* Celebration Message */}
                <View style={styles.celebrationBox}>
                  <Text style={[styles.celebrationTitle, textStyle]}>
                    {isFoundType ? t('wonderfulNews') : t('amazingThankYou')}
                  </Text>
                  <Text style={[styles.celebrationSubtitle, textStyle]}>
                    {isFoundType ? t('gladYouFoundYourItem') : t('thankYouForHelping')}
                  </Text>
                </View>

                {/* Compact Safety Reminder */}
                <View style={styles.compactNoteRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={tokens.brandPrimary} />
                  <Text style={[styles.compactNoteText, textStyle]}>
                    {isFoundType ? t('contactSafetyNote') : t('contactSafetyNoteFinder')}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Contact Details */}
                <Text style={[styles.sectionLabel, textStyle]}>{t('claimItemContactDetails')}</Text>

                {contactAction?.type === 'email' && (
                  <TouchableOpacity
                    style={[styles.contactButton, styles.brandButton]}
                    onPress={() => openLink(`mailto:${contactAction.contact}`, t)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.contactButtonText}>{contactAction.contact}</Text>
                  </TouchableOpacity>
                )}

                {contactAction?.type === 'phone' && (
                  <View style={styles.contactButtonsRow}>
                    <TouchableOpacity
                      style={[styles.contactButton, styles.contactButtonHalf, styles.brandButton]}
                      onPress={() => openLink(`tel:${contactAction.contact}`, t)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.contactButtonText}>{t('call')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.contactButton, styles.contactButtonHalf, styles.whatsappButton]}
                      onPress={() => openLink(`https://wa.me/${contactAction.digits}`, t)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                      <Text style={styles.contactButtonText}>{t('whatsapp')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(!contactAction ||
                  contactAction.type === 'none' ||
                  contactAction.type === 'unknown') && (
                  <Text style={[styles.noContactText, textStyle]}>{t('noContactProvided')}</Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {step === 'safety' ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetAndClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueButtonText}>{t('continue')}</Text>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={18}
                    color="#FFFFFF"
                    style={isRTL ? { marginRight: 6 } : { marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.closeFullButton}
                onPress={resetAndClose}
                activeOpacity={0.85}
              >
                <Text style={styles.closeFullButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      paddingBottom: 24,
      maxHeight: '90%',
    },
    header: {
      flexDirection: row(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    headerLeft: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    headerIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerIconCircleBrand: {
      backgroundColor: `${tokens.brandPrimary}1F`,
    },
    headerIconCircleSuccess: {
      backgroundColor: `${tokens.status.found.main}1F`,
    },
    headerTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 17,
      color: tokens.ink,
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${tokens.ink}0A`,
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    subtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      lineHeight: 20,
      marginBottom: 14,
    },
    safetyCard: {
      flexDirection: row(isRTL),
      backgroundColor: `${tokens.brandPrimary}0D`,
      borderWidth: 1,
      borderColor: `${tokens.brandPrimary}33`,
      borderRadius: radiusTokens.lg,
      padding: 16,
      gap: 12,
      alignItems: 'flex-start',
    },
    safetyIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${tokens.brandPrimary}1A`,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    safetyCardContent: {
      flex: 1,
    },
    safetyCardTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
      marginBottom: 4,
    },
    safetyCardText: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}CC`,
      lineHeight: 21,
    },
    celebrationBox: {
      marginBottom: 14,
    },
    celebrationTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 17,
      color: tokens.status.found.main,
      marginBottom: 4,
    },
    celebrationSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      lineHeight: 20,
    },
    compactNoteRow: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
      backgroundColor: `${tokens.brandPrimary}0A`,
      borderWidth: 1,
      borderColor: `${tokens.brandPrimary}26`,
      borderRadius: radiusTokens.sm,
      padding: 10,
      gap: 8,
      marginBottom: 12,
    },
    compactNoteText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 12.5,
      color: `${tokens.ink}99`,
      lineHeight: 18,
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginVertical: 12,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: `${tokens.ink}80`,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: radiusTokens.md,
      gap: 8,
      minHeight: 48,
    },
    contactButtonsRow: {
      flexDirection: row(isRTL),
      gap: 10,
    },
    contactButtonHalf: {
      flex: 1,
    },
    brandButton: {
      backgroundColor: tokens.brandPrimary,
    },
    whatsappButton: {
      backgroundColor: '#25D366',
    },
    contactButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: '#FFFFFF',
      fontSize: 15,
    },
    noContactText: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}80`,
      fontStyle: 'italic',
      paddingVertical: 8,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    footer: {
      flexDirection: row(isRTL),
      paddingHorizontal: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: `${tokens.ink}99`,
      fontSize: 15,
    },
    continueButton: {
      flex: 1.4,
      flexDirection: row(isRTL),
      paddingVertical: 13,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: '#FFFFFF',
      fontSize: 15,
    },
    closeFullButton: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.status.found.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeFullButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: '#FFFFFF',
      fontSize: 15,
    },
  });

export default ClaimItemSheet;
