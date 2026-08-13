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
 * Phase 9 applies - the badge-sized elements carry the small sub-element
 * shadow, and nothing here draws a border.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const getElevation = (isDark, level) => {
  const opacity = isDark ? 0.4 : 0.08;
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: level },
    shadowOpacity: opacity,
    shadowRadius: level * 2,
    elevation: level,
  };
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
  const styles = createStyles({ tokens, isDark, isRTL });

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

const Metric = ({ styles, tokens, icon, value, label }) => {
  if (value === null) return null;
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={13} color={`${tokens.ink}99`} />
      <Text style={styles.metricText}>{`${value} ${label}`}</Text>
    </View>
  );
};

const PlatformBlock = ({ styles, tokens, icon, tint, name, permalink, linkLabel, children }) => (
  <View style={styles.platformBlock}>
    <View style={styles.platformHeader}>
      <View style={[styles.platformIcon, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={15} color={tint} />
      </View>
      <Text style={styles.platformName}>{name}</Text>
      {permalink ? (
        <TouchableOpacity
          style={styles.platformLink}
          onPress={() => Linking.openURL(permalink).catch(() => {})}
          activeOpacity={0.7}
        >
          <Text style={styles.platformLinkText} numberOfLines={1}>{linkLabel}</Text>
          <Ionicons name="open-outline" size={12} color={tokens.brandPrimary} />
        </TouchableOpacity>
      ) : null}
    </View>
    <View style={styles.metricsRow}>{children}</View>
  </View>
);

/**
 * The full per-platform breakdown, for the post detail screen.
 */
export const SocialReachSection = ({ post }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const { facebook, instagram, hasStats } = summarizeSocialStats(post);

  // Nothing has been read back yet - say nothing rather than render a row of
  // zeros that reads as "this listing is being ignored".
  if (!hasStats) return null;

  const showFacebook = facebook.interactions !== null || facebook.views !== null;
  const showInstagram = instagram.interactions !== null || instagram.views !== null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, isRTL && styles.textRTL]}>{t('socialReach')}</Text>
      <Text style={[styles.sectionNote, isRTL && styles.textRTL]}>{t('socialReachNote')}</Text>

      {showFacebook ? (
        <PlatformBlock
          styles={styles}
          tokens={tokens}
          icon="logo-facebook"
          tint={FACEBOOK_TINT}
          name="Facebook"
          permalink={facebook.unavailable ? null : facebook.permalink}
          linkLabel={t('viewOnFacebook')}
        >
          <Metric styles={styles} tokens={tokens} icon="eye-outline" value={facebook.views} label={t('viewsLabel')} />
          <Metric styles={styles} tokens={tokens} icon="thumbs-up-outline" value={facebook.reactions} label={t('reactions')} />
          <Metric styles={styles} tokens={tokens} icon="chatbubble-outline" value={facebook.comments} label={t('comments')} />
          <Metric styles={styles} tokens={tokens} icon="share-social-outline" value={facebook.shares} label={t('shares')} />
          <Metric styles={styles} tokens={tokens} icon="people-outline" value={facebook.engagedUsers} label={t('engagedUsers')} />
          <Metric styles={styles} tokens={tokens} icon="link-outline" value={facebook.clicks} label={t('clicks')} />
        </PlatformBlock>
      ) : null}

      {showInstagram ? (
        <PlatformBlock
          styles={styles}
          tokens={tokens}
          icon="logo-instagram"
          tint={INSTAGRAM_TINT}
          name="Instagram"
          permalink={instagram.unavailable ? null : instagram.permalink}
          linkLabel={t('viewOnInstagram')}
        >
          <Metric styles={styles} tokens={tokens} icon="eye-outline" value={instagram.views} label={t('viewsLabel')} />
          <Metric styles={styles} tokens={tokens} icon="heart-outline" value={instagram.likes} label={t('likes')} />
          <Metric styles={styles} tokens={tokens} icon="chatbubble-outline" value={instagram.comments} label={t('comments')} />
          <Metric styles={styles} tokens={tokens} icon="bookmark-outline" value={instagram.saved} label={t('saved')} />
        </PlatformBlock>
      ) : null}
    </View>
  );
};

const createStyles = ({ tokens, isDark, isRTL }) => StyleSheet.create({
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

  section: {
    marginTop: 20,
    gap: 6,
  },
  sectionLabel: {
    fontFamily: fontFamilies.display,
    fontSize: 15,
    color: tokens.ink,
    textAlign: isRTL ? 'right' : 'left',
  },
  sectionNote: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    color: `${tokens.ink}99`,
    textAlign: isRTL ? 'right' : 'left',
    marginBottom: 4,
  },
  platformBlock: {
    gap: 8,
    marginTop: 8,
  },
  platformHeader: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 8,
  },
  platformIcon: {
    width: 26,
    height: 26,
    borderRadius: radiusTokens.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...getElevation(isDark, 1),
  },
  platformName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: tokens.ink,
    flexGrow: 1,
  },
  platformLink: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  platformLinkText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: tokens.brandPrimary,
  },
  metricsRow: {
    flexDirection: row(isRTL),
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: alignStart(isRTL),
    columnGap: 14,
    rowGap: 6,
  },
  metric: {
    flexDirection: row(isRTL),
    alignItems: 'center',
    gap: 5,
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
