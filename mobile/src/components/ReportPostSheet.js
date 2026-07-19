/**
 * Report Post Sheet
 * Bottom-sheet modal for reporting a post, mirroring the reason list and payload
 * shape of client/src/components/ReportDialog.jsx (server: POST /posts/report).
 * The `reason`/`reasonType` sent must be one of the Report model's enum values;
 * the optional details text is folded into `reasonLabel`, which is what ends up
 * stored (and shown to admins) as the report's `reason` field.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS } from '../config/api';

const REPORT_REASONS = [
  'inappropriate_content',
  'spam_fake',
  'duplicate',
  'wrong_category',
  'suspicious_activity',
  'personal_info',
  'other',
];

const ReportPostSheet = ({ visible, onClose, postId, t, isRTL, onSubmitted }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const textStyle = isRTL ? styles.textRTL : null;

  const resetAndClose = () => {
    setSelectedReason('');
    setDetails('');
    setError('');
    onClose();
  };

  const handleSelectReason = (reason) => {
    setSelectedReason(reason);
    setError('');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedReason) {
      setError(t('pleaseSelectReason'));
      return;
    }
    if (selectedReason === 'other' && !details.trim()) {
      setError(t('pleaseProvideReason'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    const reasonLabel =
      selectedReason === 'other'
        ? details.trim()
        : details.trim()
        ? `${t(`reportReason_${selectedReason}`)}: ${details.trim()}`
        : t(`reportReason_${selectedReason}`);

    try {
      await apiClient.post(API_ENDPOINTS.POSTS.REPORT, {
        postId,
        reason: selectedReason,
        reasonType: selectedReason,
        reasonLabel,
      });
      resetAndClose();
      onSubmitted?.(t('reportSubmittedSuccessfully'));
    } catch (err) {
      console.error('Error submitting report:', err);
      if (err.response?.status === 429) {
        setError(err.response.data?.message || t('errorSubmittingReport'));
      } else if (!err.response) {
        setError(t('networkError'));
      } else {
        setError(err.response?.data?.message || t('errorSubmittingReport'));
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
            <Text style={[styles.headerTitle, textStyle]}>{t('reportPost')}</Text>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.description, textStyle]}>{t('reportPostDescription')}</Text>

            <Text style={[styles.sectionLabel, textStyle]}>{t('selectReportReason')}</Text>
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                  onPress={() => handleSelectReason(reason)}
                >
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={[styles.reasonText, textStyle]}>{t(`reportReason_${reason}`)}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, textStyle]}>
              {selectedReason === 'other' ? t('describeReasonPlaceholder') : t('additionalDetails')}
            </Text>
            <TextInput
              style={[styles.detailsInput, textStyle]}
              placeholder={
                selectedReason === 'other' ? t('describeReasonPlaceholder') : t('additionalDetailsPlaceholder')
              }
              placeholderTextColor="#999"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

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
                <Text style={styles.submitButtonText}>{t('submitReport')}</Text>
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
    maxHeight: '85%',
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
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  reasonRowSelected: {
    backgroundColor: '#E3F2FD',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 12,
  },
  radioOuterSelected: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  detailsInput: {
    minHeight: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
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
    paddingTop: 12,
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
    backgroundColor: '#c62828',
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

export default ReportPostSheet;
