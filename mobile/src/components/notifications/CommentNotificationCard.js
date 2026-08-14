/**
 * One "someone commented on your post" alert, as a top-level inbox entry.
 * Mirrors: client/src/features/notifications/CommentNotificationItem.jsx
 *
 * A comment notification isn't a counterpart listing to judge (no found/lost
 * tag, no confidence score) - it's one person's words about a post the reader
 * already owns, so this leads with who said what rather than the match
 * vocabulary NotificationGroupCard/NotificationCard use.
 *
 * Container treatment follows the same convention NotificationGroupCard uses:
 * the outer card is borderless and shadowless, and the thumbnail carries a
 * hairline outline (matching MatchThumbnail) rather than a shadow - the same
 * departure CLAUDE.md documents for this directory's other sub-elements.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { API_BASE_URL } from '../../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row, needsDirectionFlip } from '../../utils/rtl';
import { formatRelativeTime } from '../../utils/relativeTime';

const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

const CommentNotificationCard = ({ item, onOpen, onDismiss, isBusy = false }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const { post, comment } = item || {};
  if (!post || !comment) return null;

  const username = comment.author?.username;
  const headline = username
    ? t('notifCommentHeadline', { username })
    : t('notifCommentHeadlineAnon');
  const imageUri = getImageUri(post.image);
  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onOpen?.(item)}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={[styles.row, !item.isRead && styles.rowUnread]}>
        <View style={styles.thumb}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={18} color={`${tokens.ink}40`} />
          )}
          <View style={styles.thumbBadge}>
            <Ionicons name="chatbubble-outline" size={10} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, textStyle]} numberOfLines={2}>
              {headline}
            </Text>

            {onDismiss ? (
              <TouchableOpacity
                onPress={() => onDismiss(item)}
                disabled={isBusy}
                hitSlop={10}
                style={styles.dismissButton}
                accessibilityLabel={t('notifDismiss')}
              >
                <Ionicons name="close" size={16} color={`${tokens.ink}80`} />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.preview, textStyle]} numberOfLines={2}>
            {comment.text}
          </Text>

          <Text style={styles.meta}>
            {formatRelativeTime(comment.createdAt, t, currentLanguage)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()) - see NotificationCard.js's note on why a bare isRTL
// ternary breaks once native mirroring is active.
const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.surfaceCard,
      borderRadius: radiusTokens.lg,
      marginBottom: 12,
      overflow: 'hidden',
    },
    row: {
      flexDirection: row(isRTL),
      padding: 12,
    },
    rowUnread: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '1F' : '0F'}`,
      ...logical(isRTL, { borderStartWidth: 3, borderStartColor: tokens.brandPrimary }),
    },
    thumb: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: radiusTokens.md,
      overflow: 'hidden',
      backgroundColor: `${tokens.ink}0F`,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${tokens.ink}${isDark ? '33' : '1F'}`,
      ...logical(isRTL, { marginEnd: 12 }),
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    thumbBadge: {
      position: 'absolute',
      bottom: -2,
      ...logical(isRTL, { end: -2 }),
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: tokens.brandPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: tokens.surfaceCard,
    },
    body: {
      flex: 1,
    },
    titleRow: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
    },
    title: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      lineHeight: 19,
      color: tokens.ink,
    },
    dismissButton: {
      ...logical(isRTL, { marginStart: 8 }),
      marginTop: 1,
    },
    preview: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginTop: 3,
    },
    meta: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}99`,
      marginTop: 6,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default CommentNotificationCard;
