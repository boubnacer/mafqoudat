/**
 * One "your listing is now on our Facebook page / Instagram account" alert.
 * Mirrors: client/src/features/notifications/SocialPublishNotificationItem.jsx
 *
 * Neither a lead to judge nor someone else's words - it reports what the
 * platform did with the reader's own listing, so the row names the page it
 * reached and points at the screen that answers the next question: that
 * listing's reach section.
 *
 * The platform's own brand color fills the badge - the same documented
 * exception SocialReach.js already carries, since a row pointing at Facebook
 * or Instagram names somewhere else whose palette is not ours. A failed
 * publish takes status.lost's tone instead, which is this design system's own
 * "something went wrong" color rather than a fourth one invented here.
 *
 * Container treatment follows the directory's convention (Phase 9 plus the
 * documented sub-element departure): the card is borderless and shadowless and
 * the thumbnail carries a hairline outline.
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

const PLATFORM_ICONS = {
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
};

// Meta's brand colors, the same values SocialReach.js uses.
const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
};

const SocialPublishNotificationCard = ({ item, onOpen, onDismiss, isBusy = false }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';

  const { post, platform, platformName, status } = item || {};
  if (!post) return null;

  const failed = status === 'failed';
  const accent = failed
    ? tokens.status.lost.main
    : (PLATFORM_COLORS[platform] || tokens.brandPrimary);
  const styles = createStyles({ tokens, isDark, isRTL, accent });

  const name = platformName || platform;
  const headline = failed
    ? t('notifSocialFailedHeadline', { platform: name })
    : t('notifSocialPublishedHeadline', { platform: name });
  const body = failed
    ? t('notifSocialFailedBody', { platform: name })
    : t('notifSocialPublishedBody', { platform: name });

  const imageUri = getImageUri(post.image);
  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onOpen?.(item)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${headline}. ${t('notifSocialSeeReach')}`}
    >
      <View style={[styles.row, !item.isRead && styles.rowUnread]}>
        <View style={styles.thumb}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={18} color={`${tokens.ink}40`} />
          )}
          <View style={styles.thumbBadge}>
            <Ionicons
              name={failed ? 'alert-circle-outline' : (PLATFORM_ICONS[platform] || 'share-social-outline')}
              size={11}
              color="#FFFFFF"
            />
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
            {body}
          </Text>

          <View style={styles.footerRow}>
            {/* The whole card opens the listing's reach section; this labels
                that rather than being a second control beside it. */}
            <Text style={styles.cta} numberOfLines={1}>
              {t('notifSocialSeeReach')}
            </Text>
            <Text style={styles.meta}>{formatRelativeTime(item.createdAt, t, currentLanguage)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Direction-dependent styles go through utils/rtl.js's row()/logical() - see
// NotificationCard.js on why a bare isRTL ternary breaks once native mirroring
// is active.
const createStyles = ({ tokens, isDark, isRTL, accent }) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      marginBottom: 12,
      overflow: 'hidden',
    },
    row: {
      flexDirection: row(isRTL),
      padding: 12,
    },
    rowUnread: {
      backgroundColor: `${accent}${isDark ? '24' : '12'}`,
      ...logical(isRTL, { borderStartWidth: 3, borderStartColor: accent }),
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
      backgroundColor: accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: tokens.surfaceRaised,
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
    footerRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 6,
    },
    cta: {
      flexShrink: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: tokens.brandPrimary,
    },
    meta: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}99`,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default SocialPublishNotificationCard;
