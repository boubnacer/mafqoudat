/**
 * Every alert about one of the reader's listings, as a single inbox entry.
 * Mirrors: client/src/features/notifications/NotificationGroup.jsx
 *
 * A new lost-cat listing in a city that already holds several found-cat
 * listings produces one notification per pair, all at once. Shown flat, that
 * reads as a wall of near-identical rows; shown as a group it reads as what it
 * is - one listing of yours, with these candidates.
 *
 * Read and dismiss stay per-counterpart: accepting or rejecting one lead says
 * nothing about the others.
 */

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { API_BASE_URL } from '../../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row, needsDirectionFlip } from '../../utils/rtl';
import { ConfidenceBadge } from './MatchMeta';
import NotificationCard from './NotificationCard';
import { getGroupHeadlineKey } from './matchDisplay';

// How many counterparts show before the group has to be expanded. Three is
// enough to judge whether the batch is worth opening without turning one
// listing's leads into a full screen of scrolling.
const COLLAPSED_COUNT = 3;

// Same rule the post screens use: absolute Cloudinary URL for anything recent,
// server-relative path for older rows.
const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

const NotificationGroupCard = ({ group, onOpenMatch, onDismissMatch, busyId }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const [isExpanded, setIsExpanded] = useState(false);

  const { post, matches = [] } = group || {};
  if (!post || matches.length === 0) return null;

  const visibleMatches = isExpanded ? matches : matches.slice(0, COLLAPSED_COUNT);
  const hiddenCount = matches.length - visibleMatches.length;
  const hasUnread = group.unreadCount > 0;
  const ownLocation = [post.cityLabel, post.exactLocation].filter(Boolean).join(' · ');
  const ownImageUri = getImageUri(post.image);
  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <View style={styles.card}>
      {/* Header: which listing of mine is this about, and how strong is the
          best lead in the batch. */}
      <View style={[styles.header, hasUnread && styles.headerUnread]}>
        <View style={styles.ownThumb}>
          {ownImageUri ? (
            <Image source={{ uri: ownImageUri }} style={styles.ownThumbImage} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={18} color={`${tokens.ink}40`} />
          )}
        </View>

        <View style={styles.headerBody}>
          <View style={styles.headlineRow}>
            <Text style={[styles.headline, textStyle]} numberOfLines={2}>
              {t(getGroupHeadlineKey(post.foundLostCode), {
                item: post.categoryLabel || t('unknownCategory'),
              })}
            </Text>
            {hasUnread ? (
              <View style={styles.newTag}>
                <Text style={styles.newTagText}>{t('notifNewTag')}</Text>
              </View>
            ) : null}
          </View>

          {ownLocation ? (
            <Text style={[styles.ownLocation, textStyle]} numberOfLines={1}>
              {ownLocation}
            </Text>
          ) : null}

          <View style={styles.headerMetaRow}>
            <ConfidenceBadge tier={group.topTier} score={group.topScore} compact />
            {/* Count as a pill rather than inside the sentence: a bare number
                sidesteps the singular/dual/plural agreement that "{n} matches"
                would need in Arabic. */}
            <View
              style={styles.countPill}
              accessibilityLabel={`${group.matchCount} ${t('notifGroupMatchCountLabel')}`}
            >
              <Ionicons name="layers-outline" size={13} color={`${tokens.ink}99`} style={styles.countPillIcon} />
              <Text style={styles.countPillText}>{String(group.matchCount)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.matchesWrap}>
        {visibleMatches.map((match) => (
          <NotificationCard
            key={match.notificationId}
            match={match}
            onOpen={onOpenMatch}
            onDismiss={onDismissMatch}
            isBusy={busyId === match.notificationId}
          />
        ))}

        {matches.length > COLLAPSED_COUNT ? (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded((current) => !current)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? t('notifShowLess') : `${t('notifShowAll')} (${hiddenCount})`}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={tokens.brandPrimary}
              style={styles.expandButtonIcon}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()), which compensate only when the language's direction
// differs from the one native is already mirroring - see that file. Do NOT
// write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
// cancels out native mirroring once forceRTL has taken effect on relaunch.
const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    // Parent container: borderless and shadowless per Phase 9 - the badges and
    // thumbnails inside carry the depth.
    card: {
      backgroundColor: tokens.surfaceCard,
      borderRadius: radiusTokens.lg,
      marginBottom: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: row(isRTL),
      padding: 12,
      paddingBottom: 10,
    },
    headerUnread: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '1A' : '0D'}`,
    },
    ownThumb: {
      width: 44,
      height: 44,
      borderRadius: radiusTokens.md,
      overflow: 'hidden',
      backgroundColor: `${tokens.ink}0F`,
      alignItems: 'center',
      justifyContent: 'center',
      ...logical(isRTL, { marginEnd: 12 }),
    },
    ownThumbImage: {
      width: '100%',
      height: '100%',
    },
    headerBody: {
      flex: 1,
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
    newTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radiusTokens.sm,
      backgroundColor: tokens.brandPrimary,
      ...logical(isRTL, { marginStart: 8 }),
    },
    newTagText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      letterSpacing: 0.3,
    },
    ownLocation: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 2,
    },
    headerMetaRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    countPill: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '0F'}`,
    },
    countPillIcon: {
      ...logical(isRTL, { marginEnd: 4 }),
    },
    countPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: tokens.ink,
    },
    matchesWrap: {
      paddingHorizontal: 8,
      paddingBottom: 10,
    },
    expandButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      marginTop: 4,
      borderRadius: radiusTokens.md,
    },
    expandButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.brandPrimary,
    },
    expandButtonIcon: {
      ...logical(isRTL, { marginStart: 4 }),
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default NotificationGroupCard;
