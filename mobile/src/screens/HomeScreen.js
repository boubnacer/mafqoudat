/**
 * Home tab - compact discovery feed.
 * Mirrors client/src/features/dashboard/Dash.js structurally (stats, trending,
 * recent founds/losts, categories) but adapted for a phone: everything is a
 * lean "See all" handoff into PostsListScreen rather than a full section.
 * Data comes from the same GET /dashboard endpoint (useDashboardData.js).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const SECTION_COUNT = 7;

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

const SkeletonBlock = ({ style, tokens }) => (
  <View style={[{ backgroundColor: `${tokens.ink}14`, borderRadius: radiusTokens.sm }, style]} />
);

const SectionHeader = ({ title, onSeeAll, t, styles }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.panelTitleInline}>{title}</Text>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
        <Text style={styles.seeAllText}>{t('seeAll')}</Text>
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
// "+N today") - with a proportional fill bar underneath carrying the
// found:lost balance, rather than two identical small tiles.
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
  const total = totalFounds + totalLosts;
  const foundPct = total > 0 ? (totalFounds / total) * 100 : 50;
  const lostPct = 100 - foundPct;

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
      <View style={styles.foundLostFillRow}>
        <View style={{ flex: foundPct, backgroundColor: tokens.status.found.main }} />
        <View style={{ flex: lostPct, backgroundColor: tokens.status.lost.main }} />
      </View>
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
    <Panel title={t('statistics')} styles={styles}>
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

const TrendingSection = ({ trend, isLoading, t, currentLanguage, styles, tokens, onPress }) => {
  if (isLoading && !trend) {
    return (
      <Panel title={t('trending')} styles={styles}>
        <SkeletonBlock tokens={tokens} style={styles.trendingSkeleton} />
      </Panel>
    );
  }

  if (!trend || !trend._id) {
    return (
      <Panel title={t('trending')} styles={styles}>
        <View style={styles.trendingEmpty}>
          <Ionicons name="trending-up-outline" size={40} color={`${tokens.ink}40`} />
          <Text style={styles.trendingEmptyTitle}>{t('noTrendingItems')}</Text>
          <Text style={styles.trendingEmptyBody}>{t('noTrendingItemsDescription')}</Text>
        </View>
      </Panel>
    );
  }

  const found = isFoundType(trend);
  const tone = found ? tokens.status.found : tokens.status.lost;
  const imageUri = getImageUri(trend.image);
  const categoryLabel = getCategoryLabel(trend, currentLanguage);
  const categoryConfig = getCategoryConfig(getCategoryInfo(trend)?.code);
  const cityLabel = getCityLabel(trend, currentLanguage);

  return (
    <Panel title={t('trending')} styles={styles}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.trendingCard, { borderStartColor: tone.main }]}
      >
        <View style={styles.trendingMedia}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.trendingImage} resizeMode="cover" />
          ) : (
            <View style={[styles.trendingImagePlaceholder, { backgroundColor: categoryConfig.backgroundColor }]}>
              <Ionicons name={categoryConfig.icon} size={64} color={categoryConfig.color} />
            </View>
          )}
          <View style={[styles.statusTag, { backgroundColor: tone.main }]}>
            <Ionicons name={found ? 'checkmark-circle' : 'search'} size={14} color="#FFFFFF" />
            <Text style={styles.statusTagText}>{found ? t('found') : t('lost')}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatRelativeTime(trend.createdAt, t)}</Text>
          </View>
        </View>
        <View style={styles.trendingBody}>
          {cityLabel ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={`${tokens.ink}90`} />
              <Text style={styles.infoRowText} numberOfLines={1}>
                {cityLabel}
              </Text>
            </View>
          ) : null}
          {categoryLabel ? (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={16} color={`${tokens.ink}90`} />
              <Text style={styles.infoRowText} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Panel>
  );
};

const RecentPreviewCard = ({ item, currentLanguage, t, styles, tokens, onPress }) => {
  const found = isFoundType(item);
  const tone = found ? tokens.status.found : tokens.status.lost;
  const imageUri = getImageUri(item.image);
  const categoryConfig = getCategoryConfig(getCategoryInfo(item)?.code);
  const categoryLabel = getCategoryLabel(item, currentLanguage);
  const cityLabel = getCityLabel(item, currentLanguage);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.recentCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.recentThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.recentThumb, styles.recentThumbPlaceholder, { backgroundColor: categoryConfig.backgroundColor }]}>
          <Ionicons name={categoryConfig.icon} size={32} color={categoryConfig.color} />
        </View>
      )}
      <View style={styles.recentContent}>
        <View style={[styles.recentStatusPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.recentStatusPillText, { color: tone.main }]}>{found ? t('found') : t('lost')}</Text>
        </View>
        <Text style={styles.recentTitle} numberOfLines={1}>
          {categoryLabel || t('categories')}
        </Text>
        {cityLabel ? (
          <Text style={styles.recentMeta} numberOfLines={1}>
            {cityLabel}
          </Text>
        ) : null}
        <Text style={styles.recentMeta} numberOfLines={1}>
          {formatRelativeTime(item.createdAt, t)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const RecentSection = ({ type, items, isLoading, currentLanguage, t, styles, tokens, onSeeAll, onPressItem }) => {
  const title = type === 'found' ? t('recentFounds') : t('recentLosts');
  const tone = type === 'found' ? tokens.status.found.main : tokens.status.lost.main;

  return (
    <Panel accentColor={tone} styles={styles}>
      <SectionHeader title={title} onSeeAll={items.length > 0 ? onSeeAll : undefined} t={t} styles={styles} />
      {isLoading && items.length === 0 ? (
        <View style={styles.recentColumn}>
          <SkeletonBlock tokens={tokens} style={styles.recentCardSkeleton} />
          <SkeletonBlock tokens={tokens} style={styles.recentCardSkeleton} />
        </View>
      ) : items.length > 0 ? (
        <View style={styles.recentColumn}>
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
  const { floptions, categories } = useReferenceData();
  const { data, isLoading, isError, refetch, countryId, handleSelectCountry } = useDashboardData();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const sectionAnims = useRef([...Array(SECTION_COUNT)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isLoading && !data) return;
    Animated.stagger(
      70,
      sectionAnims.map((value) =>
        Animated.timing(value, { toValue: 1, duration: 320, useNativeDriver: true })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading && !data]);

  const animatedSectionStyle = (index) => ({
    opacity: sectionAnims[index],
    transform: [
      {
        translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
      },
    ],
  });

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

  const trend = Array.isArray(data?.trendingPost) ? data.trendingPost[0] : data?.trendingPost;
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
        <Animated.View style={animatedSectionStyle(0)}>
          <StatsSection
            data={data}
            isLoading={isLoading}
            t={t}
            styles={styles}
            tokens={tokens}
            onFoundPress={() => goToPosts({ initialFl: foundOption?._id || '' })}
            onLostPress={() => goToPosts({ initialFl: lostOption?._id || '' })}
          />
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(1)]}>
          <TrendingSection
            trend={trend}
            isLoading={isLoading}
            t={t}
            currentLanguage={currentLanguage}
            styles={styles}
            tokens={tokens}
            onPress={() => trend?._id && goToPost(trend._id)}
          />
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(2)]}>
          <RecentSection
            type="found"
            items={recentFounds}
            isLoading={isLoading}
            currentLanguage={currentLanguage}
            t={t}
            styles={styles}
            tokens={tokens}
            onSeeAll={() => goToPosts({ initialFl: foundOption?._id || '' })}
            onPressItem={goToPost}
          />
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(3)]}>
          <RecentSection
            type="lost"
            items={recentLosts}
            isLoading={isLoading}
            currentLanguage={currentLanguage}
            t={t}
            styles={styles}
            tokens={tokens}
            onSeeAll={() => goToPosts({ initialFl: lostOption?._id || '' })}
            onPressItem={goToPost}
          />
        </Animated.View>

        {hasNoData ? (
          <View style={styles.section}>
            <EmptyStateCallout t={t} styles={styles} onCreatePost={goToNewPost} />
          </View>
        ) : null}

        <Animated.View style={[styles.section, animatedSectionStyle(4)]}>
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

        <Animated.View style={[styles.section, animatedSectionStyle(5)]}>
          <SocialSection t={t} styles={styles} />
        </Animated.View>

        <Animated.View style={[styles.section, styles.lastSection, animatedSectionStyle(6)]}>
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

    // Panel shell - mirrors LeftSide.jsx / TrendingItem.jsx's SectionPanel:
    // blurred-gradient surfaceRaised card, 1px ink-alpha border, elevation e1.
    panelContainer: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
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
    foundLostFillRow: {
      flexDirection: 'row',
      height: 6,
      backgroundColor: `${tokens.ink}0F`,
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

    // Trending
    trendingSkeleton: {
      height: 320,
      borderRadius: radiusTokens.lg,
    },
    trendingEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 36,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: `${tokens.ink}26`,
    },
    trendingEmptyTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    trendingEmptyBody: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      maxWidth: 260,
    },
    trendingCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
      borderStartWidth: 6,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
      ...getElevation(isDark, 1),
    },
    trendingMedia: {
      width: '100%',
      height: 260,
      backgroundColor: tokens.surfaceBase,
    },
    trendingImage: {
      width: '100%',
      height: '100%',
    },
    trendingImagePlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusTag: {
      position: 'absolute',
      top: 12,
      start: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radiusTokens.sm,
    },
    statusTagText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    dateBadge: {
      position: 'absolute',
      top: 12,
      end: 12,
      backgroundColor: 'rgba(255,255,255,0.85)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radiusTokens.sm,
    },
    dateBadgeText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: '#0B1220',
    },
    trendingBody: {
      padding: 18,
      gap: 10,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoRowText: {
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: `${tokens.ink}CC`,
      flexShrink: 1,
    },

    // Recent founds/losts
    recentColumn: {
      gap: 14,
    },
    recentCardSkeleton: {
      height: 112,
      borderRadius: radiusTokens.lg,
    },
    recentCard: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    // No fixed height - stretches (flexDirection: 'row' default cross-axis
    // align) to match recentContent's natural height, so the image always
    // fills the card top-to-bottom instead of stopping partway down a card
    // that grew taller than a hardcoded thumbnail size.
    recentThumb: {
      width: 112,
    },
    recentThumbPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    recentContent: {
      flex: 1,
      padding: 14,
      justifyContent: 'center',
      gap: 4,
    },
    recentStatusPill: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radiusTokens.sm,
      marginBottom: 3,
    },
    recentStatusPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      textTransform: 'uppercase',
    },
    recentTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
      color: tokens.ink,
      textAlign: isRTL ? 'right' : 'left',
    },
    recentMeta: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: isRTL ? 'right' : 'left',
    },
    recentEmpty: {
      alignItems: 'center',
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: `${tokens.ink}26`,
      padding: 24,
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
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
