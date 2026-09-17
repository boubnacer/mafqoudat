/**
 * How much attention a listing has had.
 * Mirrors: client/src/features/posts/PostPage/SocialReach.jsx and the reach row
 * on client/src/features/posts/PostsList/Post.js.
 *
 * Every listing is auto-posted to the Facebook Page and the Instagram account
 * on creation (server/services/facebookService.js, instagramService.js) and,
 * until now, that was the end of it - whatever attention a post collected there
 * was invisible in the app. server/services/socialStatsService.js reads the
 * numbers back; these two pieces render them.
 *
 * Counts are shown per platform rather than pooled into one figure, and app
 * views are never added to social views: a screen opened here, a Facebook
 * reaction and an impression in someone's feed are three different units, and
 * one merged total would state a measurement nobody took.
 *
 * SocialReachSection is reskinned to match web's SocialReach.jsx "SaaS panel"
 * look: the whole section is one glowing card (surfaceRaised + brand-tinted
 * border + shadow, mirroring PostFilterDialog's own card treatment - RN has no
 * radial-gradient glow, so border+shadow carry the accent), a gradient icon
 * badge heads it, and each platform block/chip is tinted from that platform's
 * own color instead of a flat neutral fill. This is a deliberate departure
 * from Phase 9's "parent borderless/shadowless" rule, same as PostFilterDialog's.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { row, alignStart } from '../utils/rtl';
import { summarizeSocialStats, readSiteViews } from '../utils/socialStats';

// Meta's own brand colors: these rows point somewhere else, so they are the one
// place the palette is not ours to choose.
const FACEBOOK_TINT = '#1877F2';
const INSTAGRAM_TINT = '#E1306C';
// The header badge's violet-to-pink gradient is a one-off decorative accent
// (mirrors client's SocialReach.jsx "SaaS panel" reskin), not a token.
const HEADER_GRADIENT_ACCENT = '#EC4899';

// Mirrors PostFilterDialog's own local getElevation (client's designTokens.js
// elevationTokens as RN shadow/elevation props) - a true CSS radial-gradient
// glow has no RN equivalent, so the brand-tinted border + this shadow are what
// carry the "SaaS panel" accent web's card gets from its glow.
const getElevation = (isDark, level = 1) =>
  level === 2
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.14,
        shadowRadius: 24,
        elevation: 8,
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 6,
        elevation: 3,
      };

/**
 * The compact pair shown on a post card: visits to this listing in the app,
 * and how many interactions its social copies picked up.
 *
 * Renders nothing when neither number is known, so listings that predate view
 * tracking look exactly as they did before.
 */
export const PostReachRow = ({ post }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isRTL, isDark });

  const siteViews = readSiteViews(post);
  const { interactions } = summarizeSocialStats(post);

  if (siteViews === null && interactions === null) return null;

  return (
    <View style={styles.reachRow}>
      {siteViews !== null ? (
        <View style={styles.reachItem}>
          <Ionicons name="eye-outline" size={14} color={`${tokens.ink}99`} />
          <Text style={styles.reachText}>{t('views', { count: siteViews })}</Text>
        </View>
      ) : null}
      {interactions !== null ? (
        <View style={styles.reachItem}>
          <Ionicons name="heart-outline" size={14} color={tokens.brandPrimary} />
          <Text style={[styles.reachText, styles.reachTextBrand]}>
            {t('socialInteractions', { count: interactions })}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// One count, as a pill tinted from its platform's own color - mirrors client's
// SocialReach.jsx Metric chip (fill + border at the platform's tint rather than
// a flat neutral chip), so Facebook's numbers and Instagram's read as belonging
// to their own block even at a glance.
const Metric = ({ styles, icon, value, label, tint, isDark }) => {
  if (value === null) return null;
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: `${tint}${isDark ? '29' : '14'}`,
          borderColor: `${tint}${isDark ? '59' : '38'}`,
        },
      ]}
    >
      <Ionicons name={icon} size={13} color={tint} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricText}>{label}</Text>
    </View>
  );
};

const PlatformBlock = ({ styles, tokens, isDark, icon, tint, name, permalink, linkLabel, children }) => (
  <View
    style={[
      styles.platformBlock,
      {
        backgroundColor: `${tint}${isDark ? '1A' : '0D'}`,
        borderColor: `${tint}${isDark ? '4D' : '2E'}`,
      },
    ]}
  >
    <View style={styles.platformHeader}>
      <View style={[styles.platformIcon, { backgroundColor: `${tint}29` }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.platformName}>{name}</Text>
      {permalink ? (
        <TouchableOpacity
          style={styles.platformLink}
          onPress={() => Linking.openURL(permalink).catch(() => {})}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel={linkLabel}
          hitSlop={6}
        >
          <Ionicons name="open-outline" size={13} color={tokens.brandPrimary} />
        </TouchableOpacity>
      ) : null}
    </View>
    <View style={styles.metricsRow}>{children}</View>
  </View>
);

/**
 * Identifies this section as a navigation destination: PostDetailScreen scrolls
 * here when it is given `section: SOCIAL_REACH_SECTION`, which is what a social
 * publish notification (tapped in the inbox, or in the tray) passes. Same
 * string the server puts in that push's `section` field and the same one web's
 * ?section= link uses, so both platforms land in the same place.
 */
export const SOCIAL_REACH_SECTION = 'social-reach';

/**
 * Whether a platform has anything to show.
 *
 * A copy that exists counts, even with no numbers on it yet - mirrors
 * client/src/features/posts/PostPage/SocialReach.jsx, and for the same reason:
 * the author arrives here from the "your listing is live on our Facebook page"
 * alert, before any engagement has been read back, and an empty screen would
 * read as if the listing had never been shared. Each Metric still drops itself
 * when its own value is null, so no count is invented.
 */
const showsPlatform = (platform) => (
  platform.interactions !== null || platform.views !== null || !!platform.permalink
);

/**
 * Whether this section will render anything for a listing. Exported so
 * PostDetailScreen can skip mounting it - and so a social publish
 * notification never scrolls to an empty spot on the page.
 */
export const hasSocialReach = (post) => {
  const { facebook, instagram } = summarizeSocialStats(post);
  return showsPlatform(facebook) || showsPlatform(instagram);
};

/**
 * The full per-platform breakdown, for the post detail screen.
 */
export const SocialReachSection = ({ post }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isRTL, isDark });

  const { facebook, instagram, hasStats } = summarizeSocialStats(post);

  const showFacebook = showsPlatform(facebook);
  const showInstagram = showsPlatform(instagram);

  if (!showFacebook && !showInstagram) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[tokens.brandPrimary, HEADER_GRADIENT_ACCENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIcon}
        >
          <Ionicons name="stats-chart" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.sectionHeaderText}>
          <Text style={[styles.sectionLabel, isRTL && styles.textRTL]}>{t('socialReach')}</Text>
          <Text style={[styles.sectionNote, isRTL && styles.textRTL]}>{t('socialReachNote')}</Text>
          {!hasStats ? (
            <Text style={[styles.sectionNote, isRTL && styles.textRTL]}>{t('socialReachPending')}</Text>
          ) : null}
        </View>
      </View>

      {showFacebook ? (
        <PlatformBlock
          styles={styles}
          tokens={tokens}
          isDark={isDark}
          icon="logo-facebook"
          tint={FACEBOOK_TINT}
          name="Facebook"
          permalink={facebook.unavailable ? null : facebook.permalink}
          linkLabel={t('viewOnFacebook')}
        >
          <Metric styles={styles} isDark={isDark} tint={FACEBOOK_TINT} icon="eye-outline" value={facebook.views} label={t('viewsLabel')} />
          <Metric styles={styles} isDark={isDark} tint={FACEBOOK_TINT} icon="thumbs-up-outline" value={facebook.reactions} label={t('reactions')} />
          <Metric styles={styles} isDark={isDark} tint={FACEBOOK_TINT} icon="chatbubble-outline" value={facebook.comments} label={t('comments')} />
          <Metric styles={styles} isDark={isDark} tint={FACEBOOK_TINT} icon="share-social-outline" value={facebook.shares} label={t('shares')} />
          <Metric styles={styles} isDark={isDark} tint={FACEBOOK_TINT} icon="people-outline" value={facebook.engagedUsers} label={t('engagedUsers')} />
          <Metric styles={styles} isDark={isDark} tint={FACEBOOK_TINT} icon="link-outline" value={facebook.clicks} label={t('clicks')} />
        </PlatformBlock>
      ) : null}

      {showInstagram ? (
        <PlatformBlock
          styles={styles}
          tokens={tokens}
          isDark={isDark}
          icon="logo-instagram"
          tint={INSTAGRAM_TINT}
          name="Instagram"
          permalink={instagram.unavailable ? null : instagram.permalink}
          linkLabel={t('viewOnInstagram')}
        >
          <Metric styles={styles} isDark={isDark} tint={INSTAGRAM_TINT} icon="eye-outline" value={instagram.views} label={t('viewsLabel')} />
          <Metric styles={styles} isDark={isDark} tint={INSTAGRAM_TINT} icon="heart-outline" value={instagram.likes} label={t('likes')} />
          <Metric styles={styles} isDark={isDark} tint={INSTAGRAM_TINT} icon="chatbubble-outline" value={instagram.comments} label={t('comments')} />
          <Metric styles={styles} isDark={isDark} tint={INSTAGRAM_TINT} icon="bookmark-outline" value={instagram.saved} label={t('saved')} />
        </PlatformBlock>
      ) : null}
    </View>
  );
};

const createStyles = ({ tokens, isRTL, isDark }) => StyleSheet.create({
  reachRow: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  reachItem: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 5,
  },
  reachText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: `${tokens.ink}99`,
  },
  reachTextBrand: {
    color: tokens.brandPrimary,
  },

  // The "SaaS panel" card - surfaceRaised + a brand-tinted border, mirroring
  // web's glowing card (client's SocialReach.jsx). A true CSS radial-gradient
  // glow has no RN equivalent, so the border + shadow alone carry the accent,
  // same treatment as PostFilterDialog's card.
  section: {
    marginTop: 20,
    padding: 16,
    borderRadius: radiusTokens.lg,
    backgroundColor: tokens.surfaceRaised,
    borderWidth: 1,
    borderColor: `${tokens.brandPrimary}${isDark ? '59' : '2E'}`,
    ...getElevation(isDark, 2),
  },
  sectionHeader: {
    flexDirection: row(isRTL),
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: radiusTokens.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    color: tokens.ink,
    textAlign: isRTL ? 'right' : 'left',
  },
  sectionNote: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    color: `${tokens.ink}99`,
    textAlign: isRTL ? 'right' : 'left',
  },
  // Each platform is its own tinted-by-color block (backgroundColor/borderColor
  // set inline per platform in PlatformBlock, mirroring client's SocialReach.jsx
  // alpha(tint, ...) fills) rather than a flat neutral card.
  platformBlock: {
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
  },
  platformHeader: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 8,
  },
  platformIcon: {
    width: 30,
    height: 30,
    borderRadius: radiusTokens.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: tokens.ink,
    flexGrow: 1,
  },
  // Icon-only: the platform it opens is named on the same row, and the full
  // "View on Facebook/Instagram" wording is on the accessibility label.
  platformLink: {
    width: 30,
    height: 30,
    borderRadius: radiusTokens.sm,
    backgroundColor: `${tokens.brandPrimary}24`,
    borderWidth: 1,
    borderColor: `${tokens.brandPrimary}4D`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: row(isRTL),
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: alignStart(isRTL),
    columnGap: 8,
    rowGap: 8,
  },
  // Full pill, tinted from the platform's own color (backgroundColor/
  // borderColor set inline in Metric) - mirrors web's chip.
  metric: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  metricValue: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: tokens.ink,
  },
  metricText: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: `${tokens.ink}99`,
  },
  textRTL: {
    writingDirection: 'rtl',
  },
});

export default SocialReachSection;
