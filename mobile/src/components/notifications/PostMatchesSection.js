/**
 * "Possible matches" section on a post's own detail screen.
 * Mirrors: client/src/features/notifications/PostMatchesPanel.jsx
 *
 * Owner-only. The server rejects the request from anyone else, and this renders
 * nothing rather than showing an error - a listing you don't own simply has no
 * such section.
 *
 * This is also the retroactive half of the feature: notifications only fire for
 * posts created or edited since the matching engine landed, whereas opening
 * this section scores the post on demand (throttled server-side to once every
 * six hours), so older listings still get their leads.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row, needsDirectionFlip } from '../../utils/rtl';
import { formatRelativeTime } from '../../utils/relativeTime';
import { fetchMatchesForPost, dismissMatch } from '../../api/notificationsApi';
import { ConfidenceBadge, MatchReasons } from './MatchMeta';
import MatchThumbnail from './MatchThumbnail';
import { formatDaysApart, formatMatchLocation } from './matchDisplay';

const PostMatchesSection = ({ postId, isOwner, postReturned = false, onOpenPost }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  // A returned item is no longer a lead worth chasing, and the server has
  // already closed its pairs - don't spend a request asking.
  const shouldLoad = Boolean(isOwner && postId && !postReturned);

  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(shouldLoad);
  const [hasError, setHasError] = useState(false);
  const [dismissingId, setDismissingId] = useState(null);

  const loadMatches = useCallback(async () => {
    if (!shouldLoad) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await fetchMatchesForPost(postId, { language: currentLanguage });
      setMatches(result);
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [shouldLoad, postId, currentLanguage]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleDismiss = async (matchId) => {
    setDismissingId(matchId);
    // Removed straight away: the server call only records a decision the user
    // has already made, so waiting on it would just make the tap feel slow.
    const previous = matches;
    setMatches((current) => current.filter((match) => match.id !== matchId));
    try {
      await dismissMatch(matchId);
    } catch (error) {
      setMatches(previous);
    } finally {
      setDismissingId(null);
    }
  };

  if (!shouldLoad) return null;

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Ionicons name="search-circle-outline" size={22} color={tokens.brandPrimary} style={styles.headerIcon} />
        <Text style={[styles.headerTitle, textStyle]} numberOfLines={2}>
          {t('notifPossibleMatchesTitle')}
        </Text>
      </View>
      <Text style={[styles.headerSubtitle, textStyle]}>{t('notifPossibleMatchesSubtitle')}</Text>

      {isLoading ? (
        <View style={styles.stateBlock}>
          <ActivityIndicator size="small" color={tokens.brandPrimary} />
        </View>
      ) : null}

      {!isLoading && hasError ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.stateText, textStyle]}>{t('notifMatchesLoadError')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMatches} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !hasError && matches.length === 0 ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.emptyTitle, textStyle]}>{t('notifNoMatchesTitle')}</Text>
          <Text style={[styles.stateText, textStyle]}>{t('notifNoMatchesDescription')}</Text>
        </View>
      ) : null}

      {!isLoading && !hasError
        ? matches.map((match) => {
            const other = match.matchedPost;
            if (!other) return null;

            const isFound = String(other.foundLostCode).toUpperCase() === 'FOUND';
            const tone = isFound ? tokens.status.found : tokens.status.lost;
            const daysApartLabel = formatDaysApart(match.daysApart, t, currentLanguage);
            const location = formatMatchLocation(other);

            return (
              <View
                key={match.id}
                style={[styles.matchCard, { ...logical(isRTL, { borderStartColor: tone.main }) }]}
              >
                <TouchableOpacity
                  style={styles.matchTopRow}
                  onPress={() => onOpenPost?.(other.id)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <MatchThumbnail post={other} size={80} />

                  <View style={styles.matchBody}>
                    <Text style={[styles.matchTitle, textStyle]} numberOfLines={2}>
                      {other.categoryLabel || t('unknownCategory')}
                    </Text>
                    {location ? (
                      <Text style={[styles.matchLocation, textStyle]} numberOfLines={2}>
                        {location}
                      </Text>
                    ) : null}
                    <View style={styles.matchBadgeRow}>
                      <ConfidenceBadge tier={match.tier} score={match.score} compact />
                    </View>
                    <Text style={[styles.matchMeta, textStyle]} numberOfLines={1}>
                      {[daysApartLabel, formatRelativeTime(other.createdAt, t, currentLanguage)]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.matchReasons}>
                  <MatchReasons reasons={match.reasons} />
                </View>

                <View style={styles.matchActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => onOpenPost?.(other.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="eye-outline" size={15} color="#FFFFFF" style={styles.actionIcon} />
                    <Text style={styles.viewButtonText}>{t('notifViewMatch')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => handleDismiss(match.id)}
                    disabled={dismissingId === match.id}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={15} color={`${tokens.ink}99`} style={styles.actionIcon} />
                    <Text style={styles.dismissButtonText}>{t('notifNotAMatch')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        : null}
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
    section: {
      marginTop: 24,
    },
    headerRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
    },
    headerIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    headerTitle: {
      flexShrink: 1,
      fontFamily: fontFamilies.display,
      fontSize: 16,
      color: tokens.ink,
    },
    headerSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 4,
      marginBottom: 12,
    },
    stateBlock: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 12,
    },
    emptyTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 4,
    },
    stateText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
    },
    // Parent card: no shadow (Phase 9) and no border except the Found/Lost
    // accent bar, which is the post card DNA's documented exemption.
    matchCard: {
      backgroundColor: tokens.surfaceCard,
      borderRadius: radiusTokens.lg,
      padding: 12,
      marginBottom: 12,
      ...logical(isRTL, { borderStartWidth: 6 }),
    },
    matchTopRow: {
      flexDirection: row(isRTL),
    },
    matchBody: {
      flex: 1,
      ...logical(isRTL, { marginStart: 12 }),
    },
    matchTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    matchLocation: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 3,
    },
    matchBadgeRow: {
      flexDirection: row(isRTL),
      marginTop: 8,
    },
    matchMeta: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}80`,
      marginTop: 6,
    },
    matchReasons: {
      marginTop: 10,
    },
    matchActions: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    actionIcon: {
      ...logical(isRTL, { marginEnd: 5 }),
    },
    viewButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
    },
    viewButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
    },
    dismissButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0F`,
    },
    dismissButtonText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: `${tokens.ink}99`,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default PostMatchesSection;
