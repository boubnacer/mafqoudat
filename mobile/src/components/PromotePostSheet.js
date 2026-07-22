/**
 * Promote Post Sheet
 * Bottom-sheet modal for requesting post promotion, mirroring
 * client/src/components/PromotionDialog.jsx (server: POST /promotion/request).
 * Only offered to the post's owner - the server independently enforces
 * ownership (403 if the caller isn't post.user) regardless of this UI gate.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';

const PromotePostSheet = ({ visible, onClose, postId, t, isRTL, onSubmitted }) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark), [tokens, isDark]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const textStyle = isRTL ? styles.textRTL : null;

  const resetAndClose = () => {
    setPhoneNumber('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      setError(t('phoneNumberRequired'));
      return;
    }
    if (!/^[0-9]+$/.test(trimmed)) {
      setError(t('invalidPhoneNumber'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post(API_ENDPOINTS.PROMOTION.REQUEST, {
        postId,
        phoneNumber: trimmed,
      });
      resetAndClose();
      onSubmitted?.(t('promotionRequestSuccess'));
    } catch (err) {
      console.error('Error requesting promotion:', err);
      if (err.response?.status === 403) {
        setError(t('notAuthorizedForPost'));
      } else if (!err.response) {
        setError(t('networkError'));
      } else {
        setError(err.response?.data?.message || t('promotionRequestError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={resetAndClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]}>{t('promotePostTitle')}</Text>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color={`${tokens.ink}CC`} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={[styles.description, textStyle]}>{t('promotePostDescription')}</Text>

            <Text style={[styles.sectionLabel, textStyle]}>{t('phoneNumberForContact')}</Text>
            <TextInput
              style={[styles.input, textStyle]}
              placeholder={t('enterPhoneNumber')}
              placeholderTextColor={`${tokens.ink}66`}
              value={phoneNumber}
              onChangeText={(value) => {
                setPhoneNumber(value);
                setError('');
              }}
              keyboardType="phone-pad"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetAndClose} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('requestPromotion')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (tokens, isDark) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      paddingBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    headerTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 18,
      color: tokens.ink,
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
    },
    description: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      marginTop: 16,
      marginBottom: 8,
      lineHeight: 20,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: `${tokens.ink}80`,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      height: 48,
      backgroundColor: tokens.surfaceBase,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 16,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    errorText: {
      fontFamily: fontFamilies.bodyMedium,
      color: tokens.status.lost.main,
      fontSize: 14,
      marginTop: 12,
    },
    textRTL: {
      textAlign: 'right',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.brandPrimary,
      alignItems: 'center',
      marginEnd: 8,
    },
    cancelButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
      fontSize: 15,
    },
    submitButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: '#FFFFFF',
      fontSize: 15,
    },
  });

export default PromotePostSheet;
