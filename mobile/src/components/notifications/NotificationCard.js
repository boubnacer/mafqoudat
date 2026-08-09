/**
 * One match alert in the notifications inbox.
 * Mirrors: client/src/features/notifications/NotificationItem.jsx
 *
 * Built around a single question - is the listing on the other side mine? - so
 * it leads with that listing's photo and category, states the confidence,
 * explains the pairing, and keeps the reader's own listing underneath as
 * context rather than as the subject.
 *
 * Container treatment follows CLAUDE.md Phase 9: no border and no shadow on the
 * card itself; depth reads from the thumbnail, the confidence badge and the
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
import { formatDaysApart, formatMatchLocation, getMatchHeadlineKey } from './matchDisplay';

const NotificationCard = ({ notification, onOpen, onDismiss, isBusy = false }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const { post, matchedPost } = notification || {};
  // Both sides are required to render anything meaningful. The server already
  // drops notifications whose posts are gone, so this is belt-and-braces.
  if (!post || !matchedPost) return null;

  const daysApartLabel = formatDaysApart(notification.daysApart, t, currentLanguage);
  const location = formatMatchLocation(matchedPost);
  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <TouchableOpacity
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      onPress={() => onOpen?.(notification)}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <MatchThumbnail post={matchedPost} size={76} />

      <View style={styles.body}>
        <View style={styles.headlineRow}>
          <Text style={[styles.headline, textStyle]} numberOfLines={2}>
            {t(getMatchHeadlineKey(post.foundLostCode), {
              item: matchedPost.categoryLabel || t('unknownCategory'),
            })}
          </Text>

          {onDismiss ? (
            <TouchableOpacity
              onPress={() => onDismiss(notification)}
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
          <ConfidenceBadge tier={notification.tier} score={notification.score} compact />
          {daysApartLabel ? (
            <Text style={[styles.daysApart, textStyle]} numberOfLines={1}>
              {daysApartLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.reasonsRow}>
          <MatchReasons reasons={notification.reasons} max={4} />
        </View>

        {/* The reader's own listing, stated plainly - without it the pairing is
            ambiguous for anyone with several open listings. */}
        <Text style={[styles.footnote, textStyle]} numberOfLines={2}>
          {t('notifAgainstYourListing', { item: post.categoryLabel || t('unknownCategory') })}
          {' · '}
          {formatRelativeTime(notification.createdAt, t, currentLanguage)}
        </Text>
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
    card: {
      flexDirection: row(isRTL),
      backgroundColor: tokens.surfaceCard,
      borderRadius: radiusTokens.lg,
      padding: 12,
      marginBottom: 10,
      // No border, no shadow on the parent - see the file header.
    },
    cardUnread: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '1F' : '0F'}`,
      ...logical(isRTL, { borderStartWidth: 4, borderStartColor: tokens.brandPrimary }),
    },
    body: {
      flex: 1,
      ...logical(isRTL, { marginStart: 12 }),
    },
    headlineRow: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
    },
    headline: {
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
      marginTop: 3,
    },
    badgeRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    daysApart: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}99`,
    },
    reasonsRow: {
      marginTop: 8,
    },
    footnote: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}80`,
      marginTop: 8,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default NotificationCard;
