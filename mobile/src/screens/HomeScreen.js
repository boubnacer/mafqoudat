/**
 * Home tab - compact discovery feed.
 * Mirrors client/src/features/dashboard/Dash.js structurally (stats + world
 * activity map header, recent founds/losts, categories) but adapted for a
 * phone: everything is a lean "See all" handoff into PostsListScreen rather
 * than a full section. Data comes from the same GET /dashboard endpoint
 * (useDashboardData.js).
 *
 * Visually this screen is skeuomorphic, and it is the one screen that is:
 * every surface is a lit physical object - beveled slabs casting shadows onto
 * the page, glossy domed tiles, grooves cut between segments, photo cards in
 * frames, type embossed or stamped into its surface. The recipes all live in
 * theme/skeuomorph.js and are pure lighting (white/black alpha rims, gloss
 * gradients, shadows) layered over the same `colorTokens` palette every other
 * screen uses, so the treatment changes how surfaces read, never what color
 * they are. See the "Design phases" section of CLAUDE.md for how this relates
 * to the flat, borderless treatment on the rest of the app.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { getCategoryConfig } from '../config/categories';
import { API_BASE_URL } from '../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import DataStateView from '../components/DataStateView';
import SkeletonBlock from '../components/SkeletonBlock';
import SkeuoGloss from '../components/SkeuoGloss';
import WorldActivityMap from '../components/dashboard/WorldActivityMap';
import {
  PAGE_WASH_LOCATIONS,
  bevelRim,
  embossText,
  engraveText,
  glassRim,
  groove,
  insetWell,
  pageWashColors,
  skeuoShadow,
} from '../theme/skeuomorph';
import { useStaggeredFadeIn } from '../hooks/useStaggeredFadeIn';
import { alignEnd, alignStart, logical, needsDirectionFlip, row } from '../utils/rtl';
import { formatRelativeTime } from '../utils/relativeTime';

const SECTION_COUNT = 6;

// Horizontal padding of the scroll content - kept as a constant so the
// header's map backdrop can cancel it out and bleed to the screen edges.
const SCREEN_PADDING = 16;

// Same accounts as client/src/components/Footer/DashFooter.js's socialLinks -
// kept in sync manually since the mobile app has no shared config module yet.
const SOCIAL_LINKS = [
  {
    key: 'facebook',
    labelKey: 'socialFacebook',
    icon: 'logo-facebook',
    brandColor: '#1877F2',
    url: 'https://www.facebook.com/profile.php?id=100075968495897',
  },
  {
    key: 'instagram',
    labelKey: 'socialInstagram',
    icon: 'logo-instagram',
    brandColor: '#E1306C',
    url: 'https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu',
  },
  {
    key: 'whatsapp',
    labelKey: 'socialWhatsapp',
    icon: 'logo-whatsapp',
    brandColor: '#25D366',
    url: 'https://wa.me/212711621132',
  },
];

const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

// Same scrim as web's RecentPosts.jsx card:
// `linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.05) 45%, rgba(0,0,0,.4) 100%)`.
// CSS `to top` reads bottom -> top while LinearGradient's default axis reads
// top -> bottom, so the stops are listed in reverse here.
const POSTER_SCRIM_COLORS = ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)'];
const POSTER_SCRIM_LOCATIONS = [0, 0.55, 1];

// Dashboard aggregation projects Categories (array, new format) with a
// Category/categoryname fallback for legacy posts - same shape trending and
// recent items share (see server/controllers/dependenciesController.js).
const getCategoryInfo = (item) => {
  if (Array.isArray(item?.Categories) && item.Categories.length > 0) return item.Categories[0];
  if (item?.Category?.code) return item.Category;
  if (item?.categoryname) return { code: item.categoryname, labels: null };
  return null;
};

const getCategoryLabel = (item, currentLanguage) => {
  const cat = getCategoryInfo(item);
  if (!cat) return null;
  return cat.labels ? cat.labels[currentLanguage] || cat.labels.en || cat.code : cat.code;
};

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const getCityLabel = (item, currentLanguage) => {
  if (item?.cityLabels && typeof item.cityLabels === 'object') {
    const label = item.cityLabels[currentLanguage] || item.cityLabels.en;
    if (label && label.trim()) return label.trim();
  }
  if (item?.cityName && item.cityName.trim()) return item.cityName.trim();
  if (typeof item?.city === 'string' && item.city.trim() && !OBJECT_ID_RE.test(item.city.trim())) {
    return item.city.trim();
  }
  return null;
};

// Mirrors MUI's theme.palette.getContrastText() used by web's RecentPosts.jsx
// to pick legible text/icon color against a solid category-color card fill.
const getContrastText = (hexColor) => {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B1220' : '#FFFFFF';
};

// Mirrors client/src/components/dashboard/RecentSection.jsx's header: a
// tone-colored status icon paired with the section title on the start edge,
// "See all" + chevron on the end edge.
const SectionHeader = ({ title, icon, iconColor, onSeeAll, seeAllColor, t, styles, isRTL }) => (
  <View style={[styles.sectionHeaderRow, { flexDirection: row(isRTL) }]}>
    <View style={[styles.sectionTitleGroup, { flexDirection: row(isRTL) }]}>
      {icon ? <Ionicons name={icon} size={24} color={iconColor} /> : null}
      <Text style={styles.panelTitleInline} numberOfLines={1}>
        {title}
      </Text>
    </View>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll} hitSlop={8} style={styles.seeAllRow}>
        <Text style={[styles.seeAllText, seeAllColor && { color: seeAllColor }]}>{t('seeAll')}</Text>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={seeAllColor || styles.seeAllText.color} />
      </TouchableOpacity>
    ) : null}
  </View>
);

// The section shell: a beveled surfaceRaised slab casting a shadow onto the
// page, with a convex gloss across its face. `sheen={false}` turns it back
// into a bare wrapper for sections (the statistics header) whose own children
// are the objects that should read.
const Panel = ({ title, accentColor, style, styles, isDark, isRTL, sheen = true, children }) => (
  <View
    style={[
      styles.panelContainer,
      accentColor && logical(isRTL, { borderStartWidth: 4, borderStartColor: accentColor }),
      style,
    ]}
  >
    {sheen ? <SkeuoGloss isDark={isDark} radius={radiusTokens.lg} /> : null}
    {title ? <Text style={styles.panelTitleCentered}>{title}</Text> : null}
    {children}
  </View>
);

// Mirrors client/src/components/dashboard/FoundLostStrip.jsx's mobile (xs)
// layout: Found and Lost aren't independent metrics, so they render as one
// connected strip - each a full-width stacked segment (icon, big number,
// "+N today") - rather than two identical small tiles.
const StatSegment = ({ icon, label, value, todayValue, tone, onPress, isDark, styles, t }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper {...(onPress ? { onPress, activeOpacity: 0.75 } : {})} style={styles.statSegment}>
      <View style={styles.statSegmentHeader}>
        {/* Domed tile rather than the flat tinted square the rest of the app
            uses: on this screen the small parts are objects too. */}
        <View style={[styles.statSegmentIcon, { backgroundColor: tone.bg }]}>
          <SkeuoGloss isDark={isDark} radius={radiusTokens.sm} variant="dome" />
          <Ionicons name={icon} size={20} color={tone.main} />
        </View>
        <Text style={styles.statSegmentLabel}>{label}</Text>
      </View>
      <Text style={[styles.statSegmentValue, { color: tone.main }]}>{value}</Text>
      <Text style={styles.statSegmentToday}>
        + {todayValue} {t('today')}
      </Text>
    </Wrapper>
  );
};

const FoundLostStrip = ({ data, t, styles, tokens, isDark, onFoundPress, onLostPress }) => {
  const totalFounds = data?.totalFounds || 0;
  const totalLosts = data?.totalLosts || 0;

  return (
    <View style={styles.foundLostStrip}>
      <SkeuoGloss isDark={isDark} radius={radiusTokens.lg} />
      <StatSegment
        icon="checkmark-circle-outline"
        label={t('foundItems')}
        value={totalFounds}
        todayValue={data?.createdToday?.todaysFoundPosts || 0}
        tone={tokens.status.found}
        onPress={onFoundPress}
        isDark={isDark}
        styles={styles}
        t={t}
      />
      {/* The two halves are one slab with a seam cut across it, not two
          stacked cards - so the divider is a groove, not a hairline. */}
      <View style={styles.statGroove} />
      <StatSegment
        icon="search-outline"
        label={t('lostItems')}
        value={totalLosts}
        todayValue={data?.createdToday?.todaysLostPosts || 0}
        tone={tokens.status.lost}
        onPress={onLostPress}
        isDark={isDark}
        styles={styles}
        t={t}
      />
    </View>
  );
};

// Mirrors TotalBox.jsx's mobile treatment (tall card, icon top-corner, big
// value, caption pinned to the bottom) for the two supporting stats below
// the Found/Lost hero strip.
const BigStatCard = ({ icon, title, value, description, tone, cardStyle, isDark, styles }) => (
  <View style={[styles.bigStatCard, cardStyle]}>
    <SkeuoGloss isDark={isDark} radius={radiusTokens.lg} />
    <View style={styles.bigStatCardTop}>
      <Text style={styles.bigStatCardTitle}>{title}</Text>
      <View style={[styles.bigStatCardIcon, { backgroundColor: `${tone}26` }]}>
        <SkeuoGloss isDark={isDark} radius={radiusTokens.sm} variant="dome" />
        <Ionicons name={icon} size={20} color={tone} />
      </View>
    </View>
    <Text style={[styles.bigStatCardValue, { color: tone }]}>{value}</Text>
    <Text style={styles.bigStatCardDescription}>{description}</Text>
  </View>
);

const StatsSection = ({ data, isLoading, t, styles, tokens, isDark, onFoundPress, onLostPress }) => {
  if (isLoading && !data) {
    return (
      <Panel title={t('statistics')} style={styles.statsPanelGlass} styles={styles} isDark={isDark} sheen={false}>
        <SkeletonBlock tokens={tokens} style={styles.foundLostSkeleton} />
        <View style={styles.bigStatsRow}>
          <SkeletonBlock tokens={tokens} style={styles.bigStatSkeleton} />
          <SkeletonBlock tokens={tokens} style={styles.bigStatSkeleton} />
        </View>
      </Panel>
    );
  }

  return (
    <Panel title={t('statistics')} style={styles.statsPanelGlass} styles={styles} isDark={isDark} sheen={false}>
      <FoundLostStrip
        data={data}
        t={t}
        styles={styles}
        tokens={tokens}
        isDark={isDark}
        onFoundPress={onFoundPress}
        onLostPress={onLostPress}
      />
      <View style={styles.bigStatsRow}>
        <BigStatCard
          icon="albums-outline"
          title={t('totalItems')}
          value={data?.totalPosts || 0}
          description={t('sinceLastMonth')}
          tone={tokens.brandPrimary}
          cardStyle={styles.bigStatCardBrand}
          isDark={isDark}
          styles={styles}
        />
        <BigStatCard
          icon="ribbon-outline"
          title={t('returnedItems')}
          value={data?.totalReturned || 0}
          description={t('sinceLastMonth')}
          tone={tokens.status.found.main}
          isDark={isDark}
          styles={styles}
        />
      </View>
    </Panel>
  );
};

// Poster-style preview card - mirrors web's
// client/src/components/dashboard/RecentPosts.jsx: full-bleed image (or solid
// category-color fill) with a dark scrim, category label + status tag
// overlaid top, location + relative date overlaid bottom (stacked, matching
// the web card's own xs/mobile layout since these are always narrow 2-up
// cards here). Laid out 2-up by RecentSection, same as web's Recent.jsx grid.
const RecentPreviewCard = ({ item, type, currentLanguage, t, styles, tokens, isDark, isRTL, onPress }) => {
  const found = type === 'found';
  const tone = found ? tokens.status.found : tokens.status.lost;
  const imageUri = getImageUri(item.image);
  const categoryConfig = getCategoryConfig(getCategoryInfo(item)?.code);
  const categoryLabel = getCategoryLabel(item, currentLanguage) || t('categories');
  const cityLabel = getCityLabel(item, currentLanguage) || t('unknownCity');
  const textColor = imageUri ? '#FFFFFF' : getContrastText(categoryConfig.color);
  // Direction-dependent styles go through the helpers in utils/rtl.js
  // (row()/logical()), which compensate only when the language's direction
  // differs from the one native is already mirroring - see that file. Do NOT
  // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
  // cancels out native mirroring once forceRTL has taken effect on relaunch.
  const rowDirection = row(isRTL);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.posterCard}>
      {/* The photo sits in a frame: the touchable is the beveled mount that
          casts the shadow, and this clipped inner box is the print behind
          glass. Split in two because a view with `overflow: 'hidden'` loses
          its own iOS shadow, and both are needed here. */}
      <View style={[styles.posterClip, { backgroundColor: imageUri ? tokens.surfaceBase : categoryConfig.color }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.posterImage} resizeMode="cover" />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons name={categoryConfig.icon} size={40} color={textColor} style={{ opacity: 0.9 }} />
          </View>
        )}

        {imageUri ? (
          <LinearGradient
            colors={POSTER_SCRIM_COLORS}
            locations={POSTER_SCRIM_LOCATIONS}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        ) : null}

        {/* Reflection on the glass, plus the rim where the glass meets the
            frame. Kept to a single top sweep so the photo stays readable. */}
        <SkeuoGloss isDark={isDark} radius={radiusTokens.md} variant="glass" />
        <View style={styles.posterInnerRim} pointerEvents="none" />
      </View>

      <View style={[styles.posterTopRow, { flexDirection: rowDirection }]}>
        <Text style={[styles.posterCategoryLabel, { color: textColor }]} numberOfLines={2}>
          {categoryLabel}
        </Text>
        <View style={styles.posterBadgeColumn}>
          <View style={[styles.posterStatusPill, { backgroundColor: tone.main }]}>
            <SkeuoGloss isDark={isDark} radius={radiusTokens.sm} variant="dome" />
            <Ionicons name={found ? 'checkmark-circle' : 'search'} size={14} color={getContrastText(tone.main)} />
            <Text style={[styles.posterStatusPillText, { color: getContrastText(tone.main) }]}>
              {found ? t('found') : t('lost')}
            </Text>
          </View>
          {item.returned ? (
            <View style={[styles.posterReturnedPill, { backgroundColor: tokens.status.found.main }]}>
              <SkeuoGloss isDark={isDark} radius={radiusTokens.sm} variant="dome" />
              <Ionicons name="checkmark-circle" size={12} color={getContrastText(tokens.status.found.main)} />
              <Text style={[styles.posterReturnedPillText, { color: getContrastText(tokens.status.found.main) }]}>
                {t('returned')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.posterBottomRow}>
        <View style={[styles.posterLocationRow, { flexDirection: rowDirection }]}>
          <Ionicons name="location-outline" size={14} color={textColor} style={{ opacity: 0.9 }} />
          <Text style={[styles.posterLocationText, { color: textColor }]} numberOfLines={1}>
            {cityLabel}
          </Text>
        </View>
        <Text style={[styles.posterDateText, { color: textColor }]} numberOfLines={1}>
          {formatRelativeTime(item.createdAt, t, currentLanguage)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const RecentSection = ({ type, items, isLoading, currentLanguage, t, styles, tokens, isDark, isRTL, onSeeAll, onPressItem }) => {
  const title = type === 'found' ? t('recentFounds') : t('recentLosts');

  return (
    <Panel styles={styles} isDark={isDark}>
      <SectionHeader
        title={title}
        icon={type === 'found' ? 'checkmark-circle-outline' : 'search-outline'}
        iconColor={tokens.status[type].main}
        onSeeAll={items.length > 0 ? onSeeAll : undefined}
        seeAllColor={tokens.status[type].main}
        t={t}
        styles={styles}
        isRTL={isRTL}
      />
      {isLoading && items.length === 0 ? (
        <View style={styles.recentGrid}>
          <SkeletonBlock tokens={tokens} style={styles.recentCardSkeleton} />
          <SkeletonBlock tokens={tokens} style={styles.recentCardSkeleton} />
        </View>
      ) : items.length > 0 ? (
        <View style={styles.recentGrid}>
          {items.map((item) => (
            <RecentPreviewCard
              key={item._id}
              item={item}
              type={type}
              currentLanguage={currentLanguage}
              t={t}
              styles={styles}
              tokens={tokens}
              isDark={isDark}
              isRTL={isRTL}
              onPress={() => onPressItem(item._id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.recentEmpty}>
          <Text style={styles.recentEmptyText}>{t('noPostsFound')}</Text>
        </View>
      )}
    </Panel>
  );
};

const CategoryChip = ({ category, currentLanguage, styles, isDark, onPress }) => {
  const config = getCategoryConfig(category.code);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.categoryChip}>
      {/* Physical button: domed cap, beveled rim, its own shadow on the rail. */}
      <View style={[styles.categoryChipCircle, { backgroundColor: config.backgroundColor }]}>
        <SkeuoGloss isDark={isDark} radius={34} variant="dome" />
        <Ionicons name={config.icon} size={30} color={config.color} />
      </View>
      <Text style={styles.categoryChipLabel} numberOfLines={1}>
        {getLocalizedLabel(category, currentLanguage)}
      </Text>
    </TouchableOpacity>
  );
};

const EmptyStateCallout = ({ t, styles, isDark, onCreatePost }) => (
  <View style={styles.emptyCallout}>
    <SkeuoGloss isDark={isDark} radius={radiusTokens.lg} />
    <Ionicons name="file-tray-outline" size={26} color={styles.emptyCalloutIconColor.color} />
    <Text style={styles.emptyCalloutText}>{t('noPostsInArea')}</Text>
    <TouchableOpacity style={styles.emptyCalloutButton} onPress={onCreatePost} activeOpacity={0.85}>
      <SkeuoGloss isDark={isDark} radius={radiusTokens.md} variant="dome" />
      <Text style={styles.emptyCalloutButtonText}>{t('createPost')}</Text>
    </TouchableOpacity>
  </View>
);

// Mirrors DashFooter.js's social row (same brand icons/links) but reframed
// as its own panel rather than a footer strip, since the mobile Home tab has
// no persistent site footer for it to live in.
const SocialSection = ({ t, styles, isDark }) => (
  <View style={styles.socialPanel}>
    <SkeuoGloss isDark={isDark} radius={radiusTokens.lg} />
    <Text style={styles.socialTitle}>{t('followUsTitle')}</Text>
    <Text style={styles.socialSubtitle}>{t('followUsSubtitle')}</Text>
    <View style={styles.socialRow}>
      {SOCIAL_LINKS.map((social) => (
        <TouchableOpacity
          key={social.key}
          style={styles.socialButton}
          activeOpacity={0.75}
          onPress={() => Linking.openURL(social.url)}
        >
          <View style={styles.socialIconCircleShadow}>
            <View style={[styles.socialIconCircle, { backgroundColor: `${social.brandColor}1A` }]}>
              <SkeuoGloss isDark={isDark} radius={28} variant="dome" />
              <Ionicons name={social.icon} size={26} color={social.brandColor} />
            </View>
          </View>
          <Text style={styles.socialLabel}>{t(social.labelKey)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SafetyFooter = ({ t, styles }) => (
  <View style={styles.safetyFooter}>
    <Ionicons name="shield-checkmark-outline" size={18} color={styles.safetyFooterIconColor.color} />
    <View style={styles.safetyFooterTextWrap}>
      <Text style={styles.safetyFooterTitle}>{t('securePlatform')}</Text>
      <Text style={styles.safetyFooterBody}>{t('securePlatformDesc')}</Text>
    </View>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { floptions, categories, countries } = useReferenceData();
  const { data, isLoading, isError, refetch, countryId, handleSelectCountry } = useDashboardData();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const isReady = !isLoading || !!data;
  const animatedSectionStyle = useStaggeredFadeIn(SECTION_COUNT, isReady);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const foundOption = floptions.find((fl) => fl.code === 'FOUND');
  const lostOption = floptions.find((fl) => fl.code === 'LOST');

  const goToPosts = (params) => navigation.navigate('PostsListScreen', params);
  const goToPost = (id) => navigation.navigate('PostDetailScreen', { id });
  const goToNewPost = () => navigation.navigate('NewPost');

  const currentCountryCode = useMemo(() => {
    const match = (countries || []).find((c) => (c._id || c.id) === countryId);
    return match?.code || null;
  }, [countries, countryId]);

  const recentFounds = Array.isArray(data?.recentFounds) ? data.recentFounds.slice(0, 2) : [];
  const recentLosts = Array.isArray(data?.recentLosts) ? data.recentLosts.slice(0, 2) : [];

  const hasNoData =
    !isLoading &&
    !data?.totalFounds &&
    !data?.totalLosts &&
    !data?.totalPosts &&
    recentFounds.length === 0 &&
    recentLosts.length === 0;

  if (isError && !data) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('home')} countryId={countryId} onSelectCountry={handleSelectCountry} />
        <DataStateView variant="error" message={t('failedToLoadPosts')} actionLabel={t('retry')} onAction={refetch} isRTL={isRTL} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('home')} countryId={countryId} onSelectCountry={handleSelectCountry} />
      {/* The sheet everything else sits on, lit from the top and falling off
          towards the bottom - without it the objects above cast their shadows
          onto a perfectly flat, unlit background. Scoped to the area below
          AppHeader (which paints its own surface) by this wrapper. */}
      <View style={styles.scrollWrap}>
        <LinearGradient
          colors={pageWashColors(isDark)}
          locations={PAGE_WASH_LOCATIONS}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[tokens.brandPrimary]} tintColor={tokens.brandPrimary} />
          }
        >
          {/* Header: statistics over a full-bleed world activity map, matching
              web's Dash.js mobile layout - the map is a chrome-less backdrop
              (no panel card, no title), not a card of its own, and it bleeds
              past the scroll view's horizontal padding to the screen edges.
              Web crops/pans an oversized map with CSS percentages so the
              country lands below LeftSide; react-native-svg's percentage
              sizing doesn't resolve the same way (verified live via expo web),
              so the same result is built from layout instead: the map keeps
              its natural square, is bottom-anchored in this section, and a
              spacer below the stats reserves the room it occupies.
              TrendingSection has been retired - this header now covers the
              space it and StatsSection used to share. */}
          <Animated.View style={[animatedSectionStyle(0), styles.headerStack]}>
            {!hasNoData && (
              <View style={styles.mapBackdrop} pointerEvents="none">
                <WorldActivityMap
                  worldActivity={data?.worldActivity}
                  cityActivity={data?.cityActivity}
                  currentCountryCode={currentCountryCode}
                  isLoading={isLoading}
                  tokens={tokens}
                  isDark={isDark}
                />
              </View>
            )}
            <StatsSection
              data={data}
              isLoading={isLoading}
              t={t}
              styles={styles}
              tokens={tokens}
              isDark={isDark}
              onFoundPress={() => goToPosts({ initialFl: foundOption?._id || '' })}
              onLostPress={() => goToPosts({ initialFl: lostOption?._id || '' })}
            />
            {/* Reserves the vertical room the bottom-anchored map layer above
                occupies, exactly like the spacer row web's mobile header
                keeps below LeftSide. */}
            {!hasNoData && <View style={styles.mapSpacer} />}
          </Animated.View>

          <Animated.View style={[styles.section, animatedSectionStyle(1)]}>
            <RecentSection
              type="found"
              items={recentFounds}
              isLoading={isLoading}
              currentLanguage={currentLanguage}
              t={t}
              styles={styles}
              tokens={tokens}
              isDark={isDark}
              isRTL={isRTL}
              onSeeAll={() => goToPosts({ initialFl: foundOption?._id || '' })}
              onPressItem={goToPost}
            />
          </Animated.View>

          <Animated.View style={[styles.section, animatedSectionStyle(2)]}>
            <RecentSection
              type="lost"
              items={recentLosts}
              isLoading={isLoading}
              currentLanguage={currentLanguage}
              t={t}
              styles={styles}
              tokens={tokens}
              isDark={isDark}
              isRTL={isRTL}
              onSeeAll={() => goToPosts({ initialFl: lostOption?._id || '' })}
              onPressItem={goToPost}
            />
          </Animated.View>

          {hasNoData ? (
            <View style={styles.section}>
              <EmptyStateCallout t={t} styles={styles} isDark={isDark} onCreatePost={goToNewPost} />
            </View>
          ) : null}

          <Animated.View style={[styles.section, animatedSectionStyle(3)]}>
            <Text style={styles.sectionTitle}>{t('browseByCategory')}</Text>
            {/* Recessed tray: the category buttons are objects, so they need
                something to sit in rather than floating on the page. */}
            <View style={styles.categoryTray}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat._id}
                    category={cat}
                    currentLanguage={currentLanguage}
                    styles={styles}
                    isDark={isDark}
                    onPress={() => goToPosts({ initialCategoryId: cat._id })}
                  />
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, animatedSectionStyle(4)]}>
            <SocialSection t={t} styles={styles} isDark={isDark} />
          </Animated.View>

          <Animated.View style={[styles.section, styles.lastSection, animatedSectionStyle(5)]}>
            <SafetyFooter t={t} styles={styles} />
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
};

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    // Holds the page lighting wash behind the scroll, below AppHeader.
    scrollWrap: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 16,
      paddingBottom: 32,
    },
    section: {
      marginTop: 20,
    },
    lastSection: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 20,
      color: tokens.ink,
      marginBottom: 14,
      // Plain `isRTL ? 'right' : 'left'` is wrong here: RN swaps explicit
      // left/right textAlign back once native RTL mirroring is on
      // (I18nManager.doLeftAndRightSwapInRTL) - see posterCategoryLabel/
      // posterDateText below for the same gotcha. needsDirectionFlip
      // compensates so this lands on the right edge in Arabic either way.
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      // Stamped into the page sheet - this title has no plate under it.
      ...engraveText(isDark),
    },

    // Dashboard header: the statistics panel layered over a chrome-less
    // world activity map (see the comment above their render).
    headerStack: {
      gap: 20,
    },
    // The map layer itself: bottom-anchored behind the header, and pulled
    // out past scrollContent's horizontal padding so it bleeds to the
    // screen edges the way web's full-bleed header map does. Height comes
    // from its square aspect ratio, so it stands 2 x SCREEN_PADDING taller
    // than mapSpacer below - mapSpacer's marginTop pays that back so the map
    // clears the stat cards instead of creeping up behind them.
    mapBackdrop: {
      position: 'absolute',
      bottom: 0,
      left: -SCREEN_PADDING,
      right: -SCREEN_PADDING,
      // Explicit square rather than relying on the child's aspect ratio to
      // measure this absolutely-positioned box.
      aspectRatio: 1,
    },
    // Square of the content width, while the map layer above is a square of
    // the full screen width - i.e. 2 x SCREEN_PADDING taller. Absorbing that
    // difference as marginTop keeps headerStack's own 20px gap as the actual
    // breathing room between the stat cards and the top of the map, matching
    // the space web leaves below LeftSide.
    mapSpacer: {
      width: '100%',
      aspectRatio: 1,
      minHeight: 300,
      marginTop: SCREEN_PADDING * 2,
    },

    // Panel shell - a surfaceRaised slab: beveled edge (lit on top, shaded at
    // the bottom) and its own drop shadow on the page sheet, with the gloss
    // gradient painted by the SkeuoGloss layer Panel renders inside it.
    panelContainer: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 20,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 2),
    },
    panelTitleCentered: {
      fontFamily: fontFamilies.display,
      fontSize: 22,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 16,
      ...embossText(isDark),
    },
    panelTitleInline: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: tokens.ink,
      // No explicit textAlign - it gets swapped under native RTL and would
      // detach the title from the status icon it sits next to. Default
      // ('auto') resolves against the layout/text direction instead.
      flexShrink: 1,
      ...embossText(isDark),
    },
    sectionHeaderRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 14,
    },
    sectionTitleGroup: {
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    seeAllRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    seeAllText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.brandPrimary,
    },

    // The statistics panel itself is a bare wrapper, not a card: it sits over
    // the world map, and the objects that should read there are the Found/Lost
    // slab and the two stat plates inside it. Cancels every part of
    // panelContainer's slab treatment (fill, padding, bevel, shadow) rather
    // than only its background, so no rim is left drawn around nothing.
    statsPanelGlass: {
      backgroundColor: 'transparent',
      padding: 0,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },

    // Found/Lost hero slab: the deepest object on the screen, and the one the
    // groove below is cut into. No `overflow: 'hidden'` - that would drop the
    // iOS shadow, and nothing inside it paints over the corners anyway (the
    // gloss layer clips itself).
    foundLostStrip: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 3),
    },
    foundLostSkeleton: {
      height: 220,
      borderRadius: radiusTokens.lg,
    },
    statSegment: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    // Score line cut across the slab between the two segments, replacing the
    // flat hairline divider.
    statGroove: {
      marginHorizontal: 20,
      ...groove(isDark),
    },
    statSegmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    // Domed tile: beveled rim plus the dome gloss SkeuoGloss paints inside it.
    // No drop shadow - the tint is translucent, and a translucent background
    // with `elevation` renders the shadow as a visible octagon on Android (the
    // same bug socialIconCircleShadow below works around).
    statSegmentIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
      ...bevelRim(isDark),
    },
    statSegmentLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
      ...engraveText(isDark),
    },
    statSegmentValue: {
      fontFamily: fontFamilies.display,
      fontSize: 36,
      lineHeight: 40,
      ...embossText(isDark),
    },
    statSegmentToday: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginTop: 4,
      ...engraveText(isDark),
    },
    // Total/Returned supporting stats
    bigStatsRow: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 16,
    },
    bigStatSkeleton: {
      flex: 1,
      height: 158,
      borderRadius: radiusTokens.lg,
    },
    bigStatCard: {
      flex: 1,
      minHeight: 158,
      justifyContent: 'space-between',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 18,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 2),
    },
    // Total items reads as the brand-tinted tile, the same split web's
    // LeftSide.jsx makes between its two TotalBox cards (brandPrimary wash at
    // 8% light / 14% dark vs. plain surfaceRaised for Returned).
    bigStatCardBrand: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '24' : '14'}`,
    },
    bigStatCardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    bigStatCardTitle: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
      ...engraveText(isDark),
    },
    // Domed like statSegmentIcon, and shadowless for the same reason (its
    // tint is a translucent `${tone}26`).
    bigStatCardIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
      ...bevelRim(isDark),
    },
    bigStatCardValue: {
      fontFamily: fontFamilies.display,
      fontSize: 30,
      marginTop: 20,
      ...embossText(isDark),
    },
    bigStatCardDescription: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 6,
      ...engraveText(isDark),
    },

    // Recent founds/losts - poster-style card mirrors web's
    // client/src/components/dashboard/RecentPosts.jsx: full-bleed image (or
    // solid category-color fill), gradient-ish scrim, category label +
    // status tag overlaid top, location + relative date overlaid bottom
    // (stacked, matching the web card's own mobile/xs layout). Always 2-up,
    // same as web's Recent.jsx grid.
    recentGrid: {
      flexDirection: 'row',
      gap: 14,
    },
    recentCardSkeleton: {
      flex: 1,
      aspectRatio: 3 / 4,
      borderRadius: radiusTokens.lg,
    },
    // The frame: beveled mount that carries the padding, the shadow and the
    // rounded outer corners. The print itself lives in posterClip inside it.
    posterCard: {
      flex: 1,
      aspectRatio: 3 / 4,
      borderRadius: radiusTokens.lg,
      backgroundColor: tokens.surfaceRaised,
      padding: 5,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 3),
    },
    posterClip: {
      flex: 1,
      borderRadius: radiusTokens.md,
      overflow: 'hidden',
    },
    // Where the glass meets the frame - a hairline catching the light around
    // the whole opening.
    posterInnerRim: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radiusTokens.md,
      ...glassRim(isDark),
    },
    posterImage: {
      ...StyleSheet.absoluteFillObject,
    },
    posterFallback: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    posterTopRow: {
      position: 'absolute',
      top: 0,
      ...logical(isRTL, { start: 0, end: 0 }),
      padding: 10,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 6,
    },
    posterCategoryLabel: {
      // `flexShrink`, not `flex: 1`: a flex-grown box spans the row and then
      // needs textAlign to pull the text back to the start edge - and an
      // explicit `textAlign: 'right'` is swapped to the left by RN once native
      // RTL mirroring is on (I18nManager.doLeftAndRightSwapInRTL), which is
      // what left the label floating mid-card instead of flush to the start
      // padding. A shrink-only box hugs its text, so `space-between` alone
      // parks it on the correct edge in both directions.
      flexShrink: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
    },
    posterBadgeColumn: {
      alignItems: alignEnd(isRTL),
      flexShrink: 0,
      gap: 4,
      // Explicit margin, not just the row's `gap` - `gap` can fail to apply
      // when flexDirection is 'row-reverse' (RTL live-switch case, see
      // rowDirection above) on some Yoga versions, which left this column
      // flush against the category label with no visible space.
      ...logical(isRTL, { marginStart: 8 }),
    },
    posterStatusPill: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 1),
    },
    posterStatusPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    posterReturnedPill: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 1),
    },
    posterReturnedPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      textTransform: 'uppercase',
    },
    posterBottomRow: {
      position: 'absolute',
      bottom: 0,
      ...logical(isRTL, { start: 0, end: 0 }),
      padding: 10,
      gap: 3,
    },
    posterLocationRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      alignSelf: alignStart(isRTL),
      gap: 5,
    },
    posterLocationText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      flexShrink: 1,
    },
    posterDateText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      opacity: 0.85,
      // Date sits under the location on the same (start) edge, as on web's
      // RecentPosts.jsx card. Cross-axis alignment is resolved against the
      // layout direction by Yoga, so it flips correctly - unlike an explicit
      // `textAlign: 'right'`, which RN swaps back to the left under native
      // RTL and pushed the date to the opposite corner from the location.
      alignSelf: alignStart(isRTL),
    },
    // Empty slot pressed into the panel rather than a lighter box drawn on it.
    recentEmpty: {
      alignItems: 'center',
      borderRadius: radiusTokens.md,
      padding: 24,
      ...insetWell(tokens, isDark),
    },
    recentEmptyText: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      textAlign: isRTL ? 'right' : 'left',
      ...engraveText(isDark),
    },

    // Categories - buttons in a recessed tray
    categoryTray: {
      borderRadius: radiusTokens.lg,
      paddingVertical: 16,
      ...logical(isRTL, { paddingStart: 14 }),
      ...insetWell(tokens, isDark),
    },
    categoryRow: {
      flexDirection: row(isRTL),
      gap: 16,
      ...logical(isRTL, { paddingEnd: 14 }),
    },
    categoryChip: {
      alignItems: 'center',
      width: 88,
    },
    // Round button cap: beveled rim, dome gloss, and its own shadow in the
    // tray. The category tints are opaque, so `elevation` is safe here.
    categoryChipCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 2),
    },
    categoryChipLabel: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: tokens.ink,
      textAlign: 'center',
      ...engraveText(isDark),
    },

    // Empty state callout
    emptyCallout: {
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 20,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 2),
    },
    emptyCalloutIconColor: {
      color: `${tokens.ink}66`,
    },
    emptyCalloutText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}CC`,
      textAlign: 'center',
      ...engraveText(isDark),
    },
    emptyCalloutButton: {
      marginTop: 4,
      backgroundColor: tokens.brandPrimary,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 20,
      paddingVertical: 10,
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 2),
    },
    emptyCalloutButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: '#FFFFFF',
      ...embossText(isDark),
    },

    // Social section - mirrors the panelContainer shell but with a centered
    // title/subtitle pair (like panelTitleCentered) above a row of circular
    // brand-colored icon buttons.
    socialPanel: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      paddingVertical: 22,
      paddingHorizontal: 20,
      alignItems: 'center',
      ...bevelRim(isDark),
      ...skeuoShadow(isDark, 2),
    },
    socialTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: tokens.ink,
      textAlign: 'center',
      ...embossText(isDark),
    },
    socialSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      maxWidth: 260,
      ...engraveText(isDark),
    },
    socialRow: {
      flexDirection: 'row',
      gap: 28,
    },
    socialButton: {
      alignItems: 'center',
      gap: 8,
    },
    // Shadow lives on this opaque wrapper, not the tinted circle below it -
    // elevation + a translucent background is a known RN/Android bug that
    // renders the shadow as a visible octagon bleeding through the tint.
    socialIconCircleShadow: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tokens.surfaceRaised,
      ...skeuoShadow(isDark, 2),
    },
    socialIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...bevelRim(isDark),
    },
    socialLabel: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: `${tokens.ink}CC`,
      ...engraveText(isDark),
    },

    // Safety footer
    safetyFooter: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 4,
    },
    safetyFooterIconColor: {
      color: `${tokens.ink}80`,
    },
    safetyFooterTextWrap: {
      flex: 1,
    },
    safetyFooterTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: tokens.ink,
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      marginBottom: 2,
      ...engraveText(isDark),
    },
    safetyFooterBody: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}80`,
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      lineHeight: 16,
      ...engraveText(isDark),
    },
  });

export default HomeScreen;
