/**
 * Promote Post Sheet
 * Bottom-sheet modal for requesting post promotion, mirroring
 * client/src/components/PromotionDialog.jsx (server: POST /promotion/request).
 * Only offered to the post's owner - the server independently enforces
 * ownership (403 if the caller isn't post.user) regardless of this UI gate.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS } from '../config/api';

const PromotePostSheet = ({ visible, onClose, postId, t, isRTL, onSubmitted }) => {
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
            <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={[styles.description, textStyle]}>{t('promotePostDescription')}</Text>

            <Text style={[styles.sectionLabel, textStyle]}>{t('phoneNumberForContact')}</Text>
            <TextInput
              style={[styles.input, textStyle]}
              placeholder={t('enterPhoneNumber')}
              placeholderTextColor="#999"
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  body: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
  },
  errorText: {
    color: '#c62828',
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
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
    marginEnd: 8,
  },
  cancelButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 15,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default PromotePostSheet;
