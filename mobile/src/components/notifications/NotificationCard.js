/**
 * One counterpart listing inside a notification group.
 * Mirrors: client/src/features/notifications/NotificationItem.jsx
 *
 * The group header already says which of the reader's own listings this is
 * about, so this row answers only the follow-up question: is *this* the item?
 * Photo first, then what it is and where, then the confidence and the reasons
 * behind the pairing.
 *
 * Container treatment follows CLAUDE.md Phase 9: no border and no shadow on the
 * row itself; depth reads from the thumbnail, the confidence badge and the
 * reason chips, which carry their own. The unread accent bar is the same
 * borderStart exemption the post cards use for their Found/Lost tone.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row, needsDirectionFlip } from '../../utils/rtl';
import { formatRelativeTime } from '../../utils/relativeTime';
import { ConfidenceBadge, MatchReasons } from './MatchMeta';
import MatchThumbnail from './MatchThumbnail';
import { formatDaysApart, formatMatchLocation } from './matchDisplay';

const NotificationCard = ({ match, onOpen, onDismiss, isBusy = false }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const matchedPost = match?.matchedPost;
  // The server already drops matches whose posts are gone; this is
  // belt-and-braces against a partially-rendered payload.
  if (!matchedPost) return null;

  const daysApartLabel = formatDaysApart(match.daysApart, t, currentLanguage);
  const location = formatMatchLocation(matchedPost);
  const textStyle = isRTL ? styles.textRTL : null;

  const metaLine = [daysApartLabel, formatRelativeTime(match.createdAt, t, currentLanguage)]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={[styles.row, !match.isRead && styles.rowUnread]}
      onPress={() => onOpen?.(match)}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <MatchThumbnail post={matchedPost} size={64} />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, textStyle]} numberOfLines={2}>
            {matchedPost.categoryLabel || t('unknownCategory')}
          </Text>

          {onDismiss ? (
            <TouchableOpacity
              onPress={() => onDismiss(match)}
              disabled={isBusy}
              hitSlop={10}
              style={styles.dismissButton}
              accessibilityLabel={t('notifDismiss')}
            >
              <Ionicons name="close" size={16} color={`${tokens.ink}80`} />
            </TouchableOpacity>
          ) : null}
        </View>

        {location ? (
          <Text style={[styles.location, textStyle]} numberOfLines={1}>
            {location}
          </Text>
        ) : null}

        <View style={styles.badgeRow}>
          <ConfidenceBadge tier={match.tier} score={match.score} compact />
          {metaLine ? (
            <Text style={[styles.meta, textStyle]} numberOfLines={1}>
              {metaLine}
            </Text>
          ) : null}
        </View>

        <View style={styles.reasonsRow}>
          <MatchReasons reasons={match.reasons} max={4} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()), which compensate only when the language's direction
// differs from the one native is already mirroring - see that file. Do NOT
// write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
// cancels out native mirroring once forceRTL has taken effect on relaunch.
const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    row: {
      flexDirection: row(isRTL),
      borderRadius: radiusTokens.md,
      padding: 10,
      marginTop: 6,
      // No border, no shadow on the row - see the file header.
    },
    rowUnread: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '1F' : '0F'}`,
      ...logical(isRTL, { borderStartWidth: 3, borderStartColor: tokens.brandPrimary }),
    },
    body: {
      flex: 1,
      ...logical(isRTL, { marginStart: 10 }),
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
    location: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 2,
    },
    badgeRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    meta: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}99`,
    },
    reasonsRow: {
      marginTop: 8,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default NotificationCard;
