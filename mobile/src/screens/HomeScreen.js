/**
 * Home tab - compact discovery feed.
 * Mirrors client/src/features/dashboard/Dash.js structurally (stats + world
 * activity map header, recent founds/losts, categories) but adapted for a
 * phone: everything is a lean "See all" handoff into PostsListScreen rather
 * than a full section. Data comes from the same GET /dashboard endpoint
 * (useDashboardData.js).
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import WorldActivityMap from '../components/dashboard/WorldActivityMap';
import { useStaggeredFadeIn } from '../hooks/useStaggeredFadeIn';

const SECTION_COUNT = 6;

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

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow
// strings, resolved per light/dark mode) as RN shadow/elevation props -
// same shadow color/opacity the web panels use, not an arbitrary RN default.
const getElevation = (isDark, level = 1) =>
  level === 2
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.45 : 0.1,
        shadowRadius: 16,
        elevation: 4,
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.4 : 0.06,
        shadowRadius: 2,
        elevation: 2,
      };

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

const isFoundType = (item) => {
  if (item?.Floptions?.code) return item.Floptions.code === 'FOUND';
  if (item?.floptionName) return item.floptionName.toUpperCase() === 'FOUND';
  return true;
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

const formatRelativeTime = (dateString, t) => {
  const date = new Date(dateString);
  if (!dateString || isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return t('minutesAgo', { count: diffMin });
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t('hoursAgo', { count: diffHour });
  const diffDay = Math.floor(diffHour / 24);
  return t('daysAgo', { count: diffDay });
};

const SectionHeader = ({ title, onSeeAll, seeAllColor, t, styles }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.panelTitleInline}>{title}</Text>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
        <Text style={[styles.seeAllText, seeAllColor && { color: seeAllColor }]}>{t('seeAll')}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// Mirrors the blurred surfaceRaised panel shell shared by LeftSide.jsx /
// TrendingItem.jsx's SectionPanel on web - every dashboard section now sits
// in the same bordered/elevated card instead of floating on the page background.
const Panel = ({ title, accentColor, style, styles, children }) => (
  <View style={[styles.panelContainer, accentColor && { borderStartWidth: 4, borderStartColor: accentColor }, style]}>
    {title ? <Text style={styles.panelTitleCentered}>{title}</Text> : null}
    {children}
  </View>
);

// Mirrors client/src/components/dashboard/FoundLostStrip.jsx's mobile (xs)
// layout: Found and Lost aren't independent metrics, so they render as one
// connected strip - each a full-width stacked segment (icon, big number,
// "+N today") - rather than two identical small tiles.
const StatSegment = ({ icon, label, value, todayValue, tone, onPress, isLast, styles, t }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.75 } : {})}
      style={[styles.statSegment, !isLast && styles.statSegmentDivider]}
    >
      <View style={styles.statSegmentHeader}>
        <View style={[styles.statSegmentIcon, { backgroundColor: tone.bg }]}>
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

const FoundLostStrip = ({ data, t, styles, tokens, onFoundPress, onLostPress }) => {
  const totalFounds = data?.totalFounds || 0;
  const totalLosts = data?.totalLosts || 0;

  return (
    <View style={styles.foundLostStrip}>
      <StatSegment
        icon="checkmark-circle-outline"
        label={t('foundItems')}
        value={totalFounds}
        todayValue={data?.createdToday?.todaysFoundPosts || 0}
        tone={tokens.status.found}
        onPress={onFoundPress}
        styles={styles}
        t={t}
      />
      <StatSegment
        icon="help-circle-outline"
        label={t('lostItems')}
        value={totalLosts}
        todayValue={data?.createdToday?.todaysLostPosts || 0}
        tone={tokens.status.lost}
        onPress={onLostPress}
        isLast
        styles={styles}
        t={t}
      />
    </View>
  );
};

// Mirrors TotalBox.jsx's mobile treatment (tall card, icon top-corner, big
// value, caption pinned to the bottom) for the two supporting stats below
// the Found/Lost hero strip.
const BigStatCard = ({ icon, title, value, description, tone, styles }) => (
  <View style={styles.bigStatCard}>
    <View style={styles.bigStatCardTop}>
      <Text style={styles.bigStatCardTitle}>{title}</Text>
      <View style={[styles.bigStatCardIcon, { backgroundColor: `${tone}1A` }]}>
        <Ionicons name={icon} size={20} color={tone} />
      </View>
    </View>
    <Text style={[styles.bigStatCardValue, { color: tone }]}>{value}</Text>
    <Text style={styles.bigStatCardDescription}>{description}</Text>
  </View>
);

const StatsSection = ({ data, isLoading, t, styles, tokens, onFoundPress, onLostPress }) => {
  if (isLoading && !data) {
    return (
      <Panel title={t('statistics')} styles={styles}>
        <SkeletonBlock tokens={tokens} style={styles.foundLostSkeleton} />
        <View style={styles.bigStatsRow}>
          <SkeletonBlock tokens={tokens} style={styles.bigStatSkeleton} />
          <SkeletonBlock tokens={tokens} style={styles.bigStatSkeleton} />
        </View>
      </Panel>
    );
  }

  return (
    <Panel title={t('statistics')} style={styles.statsPanelGlass} styles={styles}>
      <FoundLostStrip data={data} t={t} styles={styles} tokens={tokens} onFoundPress={onFoundPress} onLostPress={onLostPress} />
      <View style={styles.bigStatsRow}>
        <BigStatCard
          icon="albums-outline"
          title={t('totalItems')}
          value={data?.totalPosts || 0}
          description={t('sinceLastMonth')}
          tone={tokens.brandPrimary}
          styles={styles}
        />
        <BigStatCard
          icon="ribbon-outline"
          title={t('returnedItems')}
          value={data?.totalReturned || 0}
          description={t('sinceLastMonth')}
          tone={tokens.status.found.main}
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
const RecentPreviewCard = ({ item, currentLanguage, t, styles, tokens, onPress }) => {
  const found = isFoundType(item);
  const tone = found ? tokens.status.found : tokens.status.lost;
  const imageUri = getImageUri(item.image);
  const categoryConfig = getCategoryConfig(getCategoryInfo(item)?.code);
  const categoryLabel = getCategoryLabel(item, currentLanguage) || t('categories');
  const cityLabel = getCityLabel(item, currentLanguage) || t('unknownCity');
  const textColor = imageUri ? '#FFFFFF' : getContrastText(categoryConfig.color);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.posterCard, { backgroundColor: imageUri ? tokens.surfaceBase : categoryConfig.color }]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.posterImage} resizeMode="cover" />
      ) : (
        <View style={styles.posterFallback}>
          <Ionicons name={categoryConfig.icon} size={40} color={textColor} style={{ opacity: 0.9 }} />
        </View>
      )}

      {imageUri ? (
        <>
          <View style={styles.posterScrimTop} pointerEvents="none" />
          <View style={styles.posterScrimBottom} pointerEvents="none" />
        </>
      ) : null}

      <View style={[styles.posterTopRow, { flexDirection: 'row' }]}>
        <Text style={[styles.posterCategoryLabel, { color: textColor }]} numberOfLines={2}>
          {categoryLabel}
        </Text>
        <View style={styles.posterBadgeColumn}>
          <View style={[styles.posterStatusPill, { backgroundColor: tone.main }]}>
            <Ionicons name={found ? 'checkmark-circle' : 'search'} size={12} color={getContrastText(tone.main)} />
            <Text style={[styles.posterStatusPillText, { color: getContrastText(tone.main) }]}>
              {found ? t('found') : t('lost')}
            </Text>
          </View>
          {item.returned ? (
            <View style={[styles.posterReturnedPill, { backgroundColor: tokens.status.found.main }]}>
              <Ionicons name="checkmark-circle" size={11} color={getContrastText(tokens.status.found.main)} />
              <Text style={[styles.posterReturnedPillText, { color: getContrastText(tokens.status.found.main) }]}>
                {t('returned')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.posterBottomRow}>
        <View style={styles.posterLocationRow}>
          <Ionicons name="location-outline" size={13} color={textColor} style={{ opacity: 0.9 }} />
          <Text style={[styles.posterLocationText, { color: textColor }]} numberOfLines={1}>
            {cityLabel}
          </Text>
        </View>
        <Text style={[styles.posterDateText, { color: textColor }]} numberOfLines={1}>
          {formatRelativeTime(item.createdAt, t)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const RecentSection = ({ type, items, isLoading, currentLanguage, t, styles, tokens, onSeeAll, onPressItem }) => {
  const title = type === 'found' ? t('recentFounds') : t('recentLosts');

  return (
    <Panel styles={styles}>
      <SectionHeader
        title={title}
        onSeeAll={items.length > 0 ? onSeeAll : undefined}
        seeAllColor={tokens.status[type].main}
        t={t}
        styles={styles}
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
              currentLanguage={currentLanguage}
              t={t}
              styles={styles}
              tokens={tokens}
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

const CategoryChip = ({ category, currentLanguage, styles, onPress }) => {
  const config = getCategoryConfig(category.code);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.categoryChip}>
      <View style={[styles.categoryChipCircle, { backgroundColor: config.backgroundColor }]}>
        <Ionicons name={config.icon} size={30} color={config.color} />
      </View>
      <Text style={styles.categoryChipLabel} numberOfLines={1}>
        {getLocalizedLabel(category, currentLanguage)}
      </Text>
    </TouchableOpacity>
  );
};

const EmptyStateCallout = ({ t, styles, onCreatePost }) => (
  <View style={styles.emptyCallout}>
    <Ionicons name="file-tray-outline" size={26} color={styles.emptyCalloutIconColor.color} />
    <Text style={styles.emptyCalloutText}>{t('noPostsInArea')}</Text>
    <TouchableOpacity style={styles.emptyCalloutButton} onPress={onCreatePost} activeOpacity={0.85}>
      <Text style={styles.emptyCalloutButtonText}>{t('createPost')}</Text>
    </TouchableOpacity>
  </View>
);

// Mirrors DashFooter.js's social row (same brand icons/links) but reframed
// as its own panel rather than a footer strip, since the mobile Home tab has
// no persistent site footer for it to live in.
const SocialSection = ({ t, styles }) => (
  <View style={styles.socialPanel}>
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
          <View style={[styles.socialIconCircle, { backgroundColor: `${social.brandColor}1A` }]}>
            <Ionicons name={social.icon} size={26} color={social.brandColor} />
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

  // Keyed by ISO2 code so WorldActivityMap can look up a localized country
  // name from the aggregation's { code, count } rows - mirrors
  // Dash.js's countriesByCode (there keyed off countriesData.entities, here
  // off useReferenceData's flat countries array).
  const countriesByCode = useMemo(() => {
    const map = {};
    (countries || []).forEach((c) => {
      if (c?.code) map[c.code] = c;
    });
    return map;
  }, [countries]);

  const currentCountryCode = useMemo(() => {
    const match = (countries || []).find((c) => (c._id || c.id) === countryId);
    return match?.code || null;
  }, [countries, countryId]);

  const currentCountryName =
    countriesByCode?.[currentCountryCode]?.names?.[currentLanguage] ||
    countriesByCode?.[currentCountryCode]?.names?.en ||
    currentCountryCode ||
    '';

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[tokens.brandPrimary]} tintColor={tokens.brandPrimary} />
        }
      >
        {/* Header: Statistics panel, then (below it, its own card - not a
            layered backdrop) the world activity map. Web's Dash.js runs the
            map as a full-bleed backdrop cropped/panned behind a translucent
            LeftSide via CSS percentage positioning; react-native-svg's
            percentage sizing doesn't resolve the same way on a `flex: 1`
            parent (it rendered corrupted, not just imprecisely positioned -
            confirmed live via expo web), so this stays a plain bounded card
            instead of chasing that. TrendingSection has been retired - this
            header now covers the space it and StatsSection used to share. */}
        <Animated.View style={[animatedSectionStyle(0), styles.headerStack]}>
          <StatsSection
            data={data}
            isLoading={isLoading}
            t={t}
            styles={styles}
            tokens={tokens}
            onFoundPress={() => goToPosts({ initialFl: foundOption?._id || '' })}
            onLostPress={() => goToPosts({ initialFl: lostOption?._id || '' })}
          />
          {!hasNoData && (
            <Panel title={t('worldActivityCountries', { country: currentCountryName })} styles={styles}>
              <WorldActivityMap
                worldActivity={data?.worldActivity}
                cityActivity={data?.cityActivity}
                currentCountryCode={currentCountryCode}
                isLoading={isLoading}
                tokens={tokens}
                isDark={isDark}
              />
            </Panel>
          )}
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
            isRTL={isRTL}
            onSeeAll={() => goToPosts({ initialFl: lostOption?._id || '' })}
            onPressItem={goToPost}
          />
        </Animated.View>

        {hasNoData ? (
          <View style={styles.section}>
            <EmptyStateCallout t={t} styles={styles} onCreatePost={goToNewPost} />
          </View>
        ) : null}

        <Animated.View style={[styles.section, animatedSectionStyle(3)]}>
          <Text style={styles.sectionTitle}>{t('browseByCategory')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => (
              <CategoryChip
                key={cat._id}
                category={cat}
                currentLanguage={currentLanguage}
                styles={styles}
                onPress={() => goToPosts({ initialCategoryId: cat._id })}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(4)]}>
          <SocialSection t={t} styles={styles} />
        </Animated.View>

        <Animated.View style={[styles.section, styles.lastSection, animatedSectionStyle(5)]}>
          <SafetyFooter t={t} styles={styles} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    scrollContent: {
      paddingHorizontal: 16,
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
      textAlign: isRTL ? 'right' : 'left',
    },

    // Dashboard header: Statistics panel then the world activity map panel,
    // stacked as two independent bounded cards (see the comment above their
    // render for why this isn't a layered/cropped backdrop like web).
    headerStack: {
      gap: 20,
    },

    // Panel shell - mirrors LeftSide.jsx / TrendingItem.jsx's SectionPanel:
    // blurred-gradient surfaceRaised card, elevation e1.
    panelContainer: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 20,
      ...getElevation(isDark, 1),
    },
    panelTitleCentered: {
      fontFamily: fontFamilies.display,
      fontSize: 22,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 16,
    },
    panelTitleInline: {
      fontFamily: fontFamilies.display,
      fontSize: 19,
      color: tokens.ink,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    seeAllText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.brandPrimary,
    },

    // Found/Lost hero strip
    foundLostStrip: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    foundLostSkeleton: {
      height: 220,
      borderRadius: radiusTokens.lg,
    },
    statSegment: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    statSegmentDivider: {
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}12`,
    },
    statSegmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    statSegmentIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statSegmentLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    statSegmentValue: {
      fontFamily: fontFamilies.display,
      fontSize: 36,
      lineHeight: 40,
    },
    statSegmentToday: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginTop: 4,
    },
    // Total/Returned supporting stats
    bigStatsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
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
      ...getElevation(isDark, 1),
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
    },
    bigStatCardIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bigStatCardValue: {
      fontFamily: fontFamilies.display,
      fontSize: 30,
      marginTop: 20,
    },
    bigStatCardDescription: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 6,
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
    posterCard: {
      flex: 1,
      aspectRatio: 3 / 4,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    posterImage: {
      ...StyleSheet.absoluteFillObject,
    },
    posterFallback: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Approximates the web card's linear-gradient scrim (no gradient lib in
    // mobile) with two flat semi-transparent bands, just enough to keep the
    // overlaid text legible on top of a photo.
    posterScrimTop: {
      position: 'absolute',
      top: 0,
      start: 0,
      end: 0,
      height: '38%',
      backgroundColor: 'rgba(0,0,0,0.32)',
    },
    posterScrimBottom: {
      position: 'absolute',
      bottom: 0,
      start: 0,
      end: 0,
      height: '48%',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    posterTopRow: {
      position: 'absolute',
      top: 0,
      start: 0,
      end: 0,
      padding: 10,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 6,
    },
    posterCategoryLabel: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      textAlign: isRTL ? 'right' : 'left',
    },
    posterBadgeColumn: {
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      gap: 4,
    },
    posterStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radiusTokens.sm,
    },
    posterStatusPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    posterReturnedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radiusTokens.sm,
    },
    posterReturnedPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 9,
      textTransform: 'uppercase',
    },
    posterBottomRow: {
      position: 'absolute',
      bottom: 0,
      start: 0,
      end: 0,
      padding: 10,
      gap: 2,
    },
    posterLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    posterLocationText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      flexShrink: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    posterDateText: {
      fontFamily: fontFamilies.body,
      fontSize: 10,
      opacity: 0.85,
      textAlign: isRTL ? 'right' : 'left',
    },
    recentEmpty: {
      alignItems: 'center',
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}08`,
      padding: 24,
      ...getElevation(isDark, 1),
    },
    recentEmptyText: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      textAlign: isRTL ? 'right' : 'left',
    },

    // Categories
    categoryRow: {
      gap: 16,
      paddingEnd: 4,
    },
    categoryChip: {
      alignItems: 'center',
      width: 88,
    },
    categoryChipCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryChipLabel: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: tokens.ink,
      textAlign: 'center',
    },

    // Empty state callout
    emptyCallout: {
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 20,
    },
    emptyCalloutIconColor: {
      color: `${tokens.ink}66`,
    },
    emptyCalloutText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}CC`,
      textAlign: 'center',
    },
    emptyCalloutButton: {
      marginTop: 4,
      backgroundColor: tokens.brandPrimary,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    emptyCalloutButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: '#FFFFFF',
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
      ...getElevation(isDark, 1),
    },
    socialTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: tokens.ink,
      textAlign: 'center',
    },
    socialSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      maxWidth: 260,
    },
    socialRow: {
      flexDirection: 'row',
      gap: 28,
    },
    socialButton: {
      alignItems: 'center',
      gap: 8,
    },
    socialIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    socialLabel: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: `${tokens.ink}CC`,
    },

    // Safety footer
    safetyFooter: {
      flexDirection: 'row',
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
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: 2,
    },
    safetyFooterBody: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}80`,
      textAlign: isRTL ? 'right' : 'left',
      lineHeight: 16,
    },
  });

export default HomeScreen;
