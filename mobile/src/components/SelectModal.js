/**
 * Select Modal
 * Generic themed bottom-sheet picker used by PostForm for the Type, Category
 * and Country dropdowns (search-as-you-type over an already-loaded list -
 * unlike CityPickerModal, which also hits a remote type-ahead endpoint).
 * Supports both single-select (tap an option, sheet closes immediately) and
 * multi-select (checkable rows + a Done button, capped at `maxSelected`).
 * Visual language (surfaceRaised sheet, ink-alpha borders, brandPrimary
 * accents) mirrors HomeScreen.js/AppHeader.js's colorTokens-based styling.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';

const SelectModal = ({
  visible,
  onClose,
  title,
  searchPlaceholder,
  noResultsText,
  options,
  getId,
  getLabel,
  renderLeading,
  multiple = false,
  selectedIds = [],
  onSelect,
  onConfirm,
  maxSelected,
  confirmLabel,
  isRTL,
}) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark), [tokens, isDark]);
  const textStyle = isRTL ? styles.textRTL : null;

  const [query, setQuery] = useState('');
  const [draftIds, setDraftIds] = useState(selectedIds);

  // Reset local search/draft state each time the sheet opens, so it never
  // shows a stale query or an out-of-sync draft from the previous opening.
  const handleShow = () => {
    setQuery('');
    setDraftIds(selectedIds);
  };

  const filtered = query.trim()
    ? options.filter((item) => getLabel(item).toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const isChecked = (id) => draftIds.includes(id);

  const handleRowPress = (item) => {
    const id = getId(item);
    if (multiple) {
      setDraftIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (maxSelected && prev.length >= maxSelected) return prev;
        return [...prev, id];
      });
    } else {
      onSelect(id);
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(draftIds);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleShow}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color={tokens.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={`${tokens.ink}80`} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, textStyle]}
              placeholder={searchPlaceholder}
              placeholderTextColor={`${tokens.ink}80`}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item, index) => String(getId(item) ?? index)}
            renderItem={({ item }) => {
              const id = getId(item);
              const checked = isChecked(id);
              return (
                <TouchableOpacity style={styles.row} onPress={() => handleRowPress(item)} activeOpacity={0.7}>
                  {renderLeading ? <View style={styles.rowLeading}>{renderLeading(item)}</View> : null}
                  <Text style={[styles.rowLabel, textStyle]} numberOfLines={1}>
                    {getLabel(item)}
                  </Text>
                  {multiple ? (
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? <Ionicons name="checkmark" size={14} color={tokens.surfaceRaised} /> : null}
                    </View>
                  ) : checked ? (
                    <Ionicons name="checkmark-circle" size={20} color={tokens.brandPrimary} />
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={[styles.emptyText, textStyle]}>{noResultsText}</Text>}
            style={styles.list}
            contentContainerStyle={multiple ? styles.listContentWithFooter : styles.listContent}
            keyboardShouldPersistTaps="handled"
          />

          {multiple ? (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.85}>
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      maxHeight: '80%',
      minHeight: '45%',
      paddingBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
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
      marginStart: 8,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${tokens.ink}0A`,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 6,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginEnd: 8,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
    },
    textRTL: {
      textAlign: 'right',
    },
    list: {
      paddingHorizontal: 16,
    },
    listContent: {
      paddingVertical: 8,
      paddingBottom: 16,
    },
    listContentWithFooter: {
      paddingVertical: 8,
      paddingBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '14' : '0F'}`,
    },
    rowLeading: {
      marginEnd: 12,
    },
    rowLabel: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radiusTokens.sm / 1.5,
      borderWidth: 1.5,
      borderColor: `${tokens.ink}40`,
      justifyContent: 'center',
      alignItems: 'center',
      marginStart: 8,
    },
    checkboxChecked: {
      backgroundColor: tokens.brandPrimary,
      borderColor: tokens.brandPrimary,
    },
    emptyText: {
      textAlign: 'center',
      color: `${tokens.ink}80`,
      fontFamily: fontFamilies.body,
      marginTop: 32,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    confirmButton: {
      height: 50,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    confirmButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
    },
  });

export default SelectModal;
