/**
 * Post Actions Sheet
 * Bottom-sheet menu for a post's own management actions (Edit, Promote,
 * Delete), reached via the "..." button in PostDetailScreen's header.
 * Shell mirrors PromotePostSheet.js (Modal + backdrop + rounded sheet), row
 * treatment mirrors HeaderMenu.js's renderItem (icon + label, destructive
 * variant in tokens.status.lost for Delete).
 *
 * Kept separate from the viewer-facing actions still on the post body
 * (contact buttons, Report) - those matter to any visitor, these only to the
 * post's owner or an admin, so they're grouped behind their own menu rather
 * than crowding the body with buttons most viewers can't use.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

const PostActionsSheet = ({ visible, onClose, canEdit, canPromote, canDelete, onEdit, onPromote, onDelete, t, isRTL }) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;

  const runAndClose = (action) => {
    onClose();
    action();
  };

  const renderItem = ({ key, label, icon, onPress, destructive }) => (
    <TouchableOpacity key={key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={19}
        color={destructive ? tokens.status.lost.main : `${tokens.ink}99`}
        style={styles.itemIcon}
      />
      <Text style={[styles.itemText, textStyle, destructive && { color: tokens.status.lost.main }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]}>{t('moreOptions')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel={t('close')} hitSlop={8}>
              <Ionicons name="close" size={20} color={`${tokens.ink}CC`} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {canEdit ? renderItem({ key: 'edit', label: t('editPost'), icon: 'create-outline', onPress: () => runAndClose(onEdit) }) : null}
            {canPromote
              ? renderItem({
                  key: 'promote',
                  label: t('promoteThisPost'),
                  icon: 'megaphone-outline',
                  onPress: () => runAndClose(onPromote),
                })
              : null}

            {canDelete ? <View style={styles.divider} /> : null}
            {canDelete
              ? renderItem({
                  key: 'delete',
                  label: t('delete'),
                  icon: 'trash-outline',
                  destructive: true,
                  onPress: () => runAndClose(onDelete),
                })
              : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()), which compensate only when the language's direction
// differs from the one native is already mirroring - see that file.
const createStyles = (tokens, isDark, isRTL) =>
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
      flexDirection: row(isRTL),
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
      paddingTop: 8,
      paddingBottom: 8,
    },
    item: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    itemIcon: {
      ...logical(isRTL, { marginEnd: 12 }),
    },
    itemText: {
      flexShrink: 1,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 15,
      color: tokens.ink,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginVertical: 4,
      marginHorizontal: 16,
    },
  });

export default PostActionsSheet;
