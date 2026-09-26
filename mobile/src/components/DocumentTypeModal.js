/**
 * Document Type Modal
 * Themed bottom-sheet picker for selecting and adding document types.
 *
 * Replaces the photo step on DOCUMENTS listings with document type selection.
 * Users can search and select from existing document types (multi-select up to
 * maxSelected) or add a new document type directly inside the dialog if it does
 * not already exist (matching the web DocumentTypePickerField.jsx).
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import { createDocumentType } from '../api/documentTypesApi';

const DocumentTypeModal = ({
  visible,
  onClose,
  documentTypes = [],
  selectedIds = [],
  onConfirm,
  onDocumentTypeCreated,
  maxSelected = 3,
  currentLanguage,
  isRTL,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;

  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [query, setQuery] = useState('');
  const [draftIds, setDraftIds] = useState(selectedIds);

  // "Add new document" inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [arabicLabel, setArabicLabel] = useState('');
  const [latinLabel, setLatinLabel] = useState('');
  const [addError, setAddError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const scrollViewRef = useRef(null);

  // Keyboard height listener
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const resetAddForm = () => {
    setShowAddForm(false);
    setArabicLabel('');
    setLatinLabel('');
    setAddError('');
    setIsSaving(false);
  };

  const handleShow = () => {
    setQuery('');
    setDraftIds(selectedIds);
    resetAddForm();
  };

  useEffect(() => {
    if (visible) {
      setQuery('');
      setDraftIds(selectedIds);
      resetAddForm();
    }
  }, [visible, selectedIds]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return documentTypes;
    return documentTypes.filter((documentType) => {
      const label = getLocalizedLabel(documentType, currentLanguage).toLowerCase();
      const arLabel = (documentType?.labels?.ar || '').toLowerCase();
      const frLabel = (documentType?.labels?.fr || '').toLowerCase();
      const enLabel = (documentType?.labels?.en || '').toLowerCase();
      return (
        label.includes(term) ||
        arLabel.includes(term) ||
        frLabel.includes(term) ||
        enLabel.includes(term)
      );
    });
  }, [documentTypes, query, currentLanguage]);

  const isChecked = (id) => draftIds.includes(String(id));
  const atLimit = draftIds.length >= maxSelected;

  const handleRowPress = (id) => {
    const stringId = String(id);
    setDraftIds((prev) => {
      if (prev.includes(stringId)) return prev.filter((x) => x !== stringId);
      if (prev.length >= maxSelected) return prev;
      return [...prev, stringId];
    });
  };

  const handleSaveCustomDocument = async () => {
    const arabic = arabicLabel.trim();
    const latin = latinLabel.trim();

    if (!arabic || !latin) {
      setAddError(t('documentTitleBothNamesRequired'));
      return;
    }
    if (!/[\u0600-\u06FF]/.test(arabic)) {
      setAddError(t('documentTitleArabicScriptRequired'));
      return;
    }
    if (!/[A-Za-z\u00C0-\u024F]/.test(latin)) {
      setAddError(t('documentTitleLatinScriptRequired'));
      return;
    }

    setAddError('');
    setIsSaving(true);
    try {
      const created = await createDocumentType({ arabicLabel: arabic, latinLabel: latin });
      if (created?._id) {
        onDocumentTypeCreated?.(created);
        const createdId = String(created._id);
        setDraftIds((prev) => {
          if (prev.includes(createdId) || prev.length >= maxSelected) return prev;
          return [...prev, createdId];
        });
      }
      Keyboard.dismiss();
      resetAddForm();
    } catch (err) {
      const fieldMessage = err?.response?.data?.fields?.[0]?.message;
      setAddError(fieldMessage || err?.response?.data?.message || t('documentTitleSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(draftIds);
    onClose();
  };

  const maxSheetHeight = keyboardHeight > 0
    ? Math.max(windowHeight - keyboardHeight - 32, 280)
    : windowHeight * 0.85;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleShow}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              maxHeight: maxSheetHeight,
              ...(Platform.OS === 'android' && keyboardHeight > 0 ? { marginBottom: keyboardHeight } : {}),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="document-text-outline" size={20} color={tokens.brandPrimary} style={styles.headerIcon} />
              <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
                {t('selectDocumentTitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
            >
              <Ionicons name="close" size={20} color={tokens.ink} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Privacy notice banner */}
            <View style={styles.noticeBox}>
              <Ionicons name="lock-closed-outline" size={16} color={tokens.brandPrimary} style={styles.noticeIcon} />
              <Text style={[styles.noticeText, textStyle]}>{t('documentPrivacyNotice')}</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={`${tokens.ink}80`} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, textStyle]}
                placeholder={t('searchDocumentTitle')}
                placeholderTextColor={`${tokens.ink}80`}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={`${tokens.ink}66`} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Document types list */}
            <View style={styles.list}>
              {filtered.map((documentType) => {
                const id = String(documentType._id);
                const checked = isChecked(id);
                const disabled = !checked && atLimit;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.row,
                      checked && styles.rowChecked,
                      disabled && styles.rowDisabled,
                    ]}
                    onPress={() => !disabled && handleRowPress(id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={checked ? tokens.brandPrimary : `${tokens.ink}66`}
                      style={styles.rowIcon}
                    />
                    <Text
                      style={[
                        styles.rowLabel,
                        checked && styles.rowLabelChecked,
                        disabled && styles.rowLabelDisabled,
                        textStyle,
                      ]}
                      numberOfLines={1}
                    >
                      {getLocalizedLabel(documentType, currentLanguage)}
                    </Text>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {filtered.length === 0 ? (
                <Text style={[styles.emptyText, textStyle]}>
                  {query ? t('noDocumentTitleFound') : t('noDocumentTitlesYet')}
                </Text>
              ) : null}
            </View>

            {atLimit ? (
              <Text style={[styles.limitWarning, textStyle]}>
                {t('maxDocumentTitlesReached', { max: maxSelected })}
              </Text>
            ) : null}

            {/* Divider */}
            <View style={styles.divider} />

            {/* "Can't find document?" and "Add new document" section */}
            {!showAddForm ? (
              <View style={styles.cantFindSection}>
                <Text style={[styles.cantFindText, textStyle]}>{t('cantFindDocument')}</Text>
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => {
                    setShowAddForm(true);
                    setAddError('');
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add-circle-outline" size={20} color={tokens.brandPrimary} />
                  <Text style={[styles.addNewButtonText, textStyle]}>{t('addNewDocument')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addFormContainer}>
                <View style={styles.addFormHeader}>
                  <Ionicons name="add-circle" size={20} color={tokens.brandPrimary} style={styles.addFormHeaderIcon} />
                  <Text style={[styles.addFormTitle, textStyle]}>{t('addNewDocument')}</Text>
                </View>
                <Text style={[styles.addFormHint, textStyle]}>{t('otherDocumentHint')}</Text>

                {/* Arabic Label */}
                <Text style={[styles.fieldLabel, textStyle]}>{t('documentNameArabic')}</Text>
                <Text style={[styles.fieldHint, textStyle]}>{t('documentNameArabicHelper')}</Text>
                <TextInput
                  style={[styles.textInput, styles.textRTL]}
                  placeholder={t('documentNameArabicPlaceholder')}
                  placeholderTextColor={`${tokens.ink}80`}
                  value={arabicLabel}
                  onChangeText={(text) => {
                    setArabicLabel(text);
                    if (addError) setAddError('');
                  }}
                  maxLength={80}
                  returnKeyType="next"
                  onFocus={() => {
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                />

                {/* Latin Label */}
                <Text style={[styles.fieldLabel, textStyle, { marginTop: 12 }]}>{t('documentNameLatin')}</Text>
                <Text style={[styles.fieldHint, textStyle]}>{t('documentNameLatinHelper')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('documentNameLatinPlaceholder')}
                  placeholderTextColor={`${tokens.ink}80`}
                  value={latinLabel}
                  onChangeText={(text) => {
                    setLatinLabel(text);
                    if (addError) setAddError('');
                  }}
                  maxLength={80}
                  returnKeyType="done"
                  onFocus={() => {
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  onSubmitEditing={handleSaveCustomDocument}
                />

                {addError ? <Text style={[styles.addErrorText, textStyle]}>{addError}</Text> : null}

                {/* Actions */}
                <View style={styles.addFormActions}>
                  <TouchableOpacity
                    style={styles.addCancelButton}
                    onPress={resetAddForm}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addCancelButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addSaveButton, isSaving && { opacity: 0.7 }]}
                    onPress={handleSaveCustomDocument}
                    disabled={isSaving}
                    activeOpacity={0.85}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.addSaveButtonText}>{t('addDocumentTitle')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>
                {t('confirm')}
                {draftIds.length > 0 ? ` (${draftIds.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      maxHeight: '85%',
      paddingBottom: 16,
    },
    header: {
      flexDirection: row(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    headerTitleWrap: {
      flex: 1,
      flexDirection: row(isRTL),
      alignItems: 'center',
    },
    headerIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    headerTitle: {
      flex: 1,
      fontFamily: fontFamilies.displayRegular,
      fontWeight: '700',
      fontSize: 18,
      color: tokens.ink,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginStart: 8 }),
    },
    body: {
      paddingHorizontal: 20,
    },
    bodyContent: {
      paddingTop: 16,
      paddingBottom: 24,
    },
    noticeBox: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
      padding: 12,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.brandPrimary}${isDark ? '20' : '0F'}`,
      borderWidth: 1,
      borderColor: `${tokens.brandPrimary}${isDark ? '40' : '20'}`,
      marginBottom: 14,
      gap: 8,
    },
    noticeIcon: {
      marginTop: 2,
    },
    noticeText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 12,
      lineHeight: 18,
      color: `${tokens.ink}CC`,
    },
    searchRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      height: 44,
      paddingHorizontal: 12,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '26' : '14'}`,
      marginBottom: 12,
    },
    searchIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    searchInput: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
      paddingVertical: 0,
    },
    list: {
      gap: 6,
    },
    row: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '10'}`,
      backgroundColor: `${tokens.ink}05`,
    },
    rowChecked: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '20' : '0F'}`,
      borderColor: `${tokens.brandPrimary}${isDark ? '55' : '3D'}`,
    },
    rowDisabled: {
      opacity: 0.5,
    },
    rowIcon: {
      ...logical(isRTL, { marginEnd: 10 }),
    },
    rowLabel: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
    },
    rowLabelChecked: {
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
    },
    rowLabelDisabled: {
      color: `${tokens.ink}66`,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: `${tokens.ink}4D`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginStart: 10 }),
    },
    checkboxChecked: {
      backgroundColor: tokens.brandPrimary,
      borderColor: tokens.brandPrimary,
    },
    emptyText: {
      textAlign: 'center',
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}80`,
      paddingVertical: 20,
    },
    limitWarning: {
      marginTop: 8,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: tokens.status.pending.main,
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginVertical: 16,
    },
    cantFindSection: {
      paddingBottom: 8,
    },
    cantFindText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginBottom: 10,
    },
    addNewButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: radiusTokens.md,
      borderWidth: 1.5,
      borderColor: `${tokens.brandPrimary}${isDark ? '55' : '3D'}`,
      backgroundColor: `${tokens.brandPrimary}${isDark ? '1F' : '0F'}`,
    },
    addNewButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.brandPrimary,
    },
    addFormContainer: {
      padding: 16,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}${isDark ? '12' : '06'}`,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '24' : '14'}`,
      marginBottom: 8,
    },
    addFormHeader: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      marginBottom: 6,
    },
    addFormHeaderIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    addFormTitle: {
      fontFamily: fontFamilies.displayRegular,
      fontWeight: '700',
      fontSize: 16,
      color: tokens.ink,
    },
    addFormHint: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      lineHeight: 18,
      color: `${tokens.ink}99`,
      marginBottom: 14,
    },
    fieldLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.ink,
      marginBottom: 4,
    },
    fieldHint: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}80`,
      marginBottom: 6,
    },
    textInput: {
      height: 44,
      borderRadius: radiusTokens.sm,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '30' : '20'}`,
      backgroundColor: `${tokens.ink}0A`,
      paddingHorizontal: 12,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    addErrorText: {
      marginTop: 8,
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: tokens.status.lost.main,
    },
    addFormActions: {
      flexDirection: row(isRTL),
      gap: 10,
      marginTop: 16,
    },
    addCancelButton: {
      flex: 1,
      height: 42,
      borderRadius: radiusTokens.sm,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '30' : '20'}`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addCancelButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.ink,
    },
    addSaveButton: {
      flex: 1,
      height: 42,
      borderRadius: radiusTokens.sm,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addSaveButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: '#fff',
    },
    footer: {
      flexDirection: row(isRTL),
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    secondaryButton: {
      flex: 1,
      height: 48,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '30' : '20'}`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    primaryButton: {
      flex: 1,
      height: 48,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
    },
  });

export default DocumentTypeModal;
