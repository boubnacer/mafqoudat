/**
 * Home tab - compact discovery feed.
 * Mirrors client/src/features/dashboard/Dash.js structurally (stats, trending,
 * recent founds/losts, categories) but adapted for a phone: everything is a
 * lean "See all" handoff into PostsListScreen rather than a full section.
 * Data comes from the same GET /dashboard endpoint (useDashboardData.js).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, RefreshControl } from 'react-native';
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

const SECTION_COUNT = 6;

const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

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
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
        <Text style={styles.seeAllText}>{t('seeAll')}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const StatCard = ({ icon, label, value, tone, onPress, styles, tokens }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
      style={[styles.statCard, { borderColor: `${tone}33` }]}
    >
      <View style={[styles.statIconCircle, { backgroundColor: `${tone}1A` }]}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
  );
};

const StatsStrip = ({ data, isLoading, t, styles, tokens, onFoundPress, onLostPress }) => {
  if (isLoading && !data) {
    return (
      <View style={styles.statsRow}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} tokens={tokens} style={styles.statCardSkeleton} />
        ))}
      </View>
    );
  }

  const todayCount = (data?.createdToday?.todaysFoundPosts || 0) + (data?.createdToday?.todaysLostPosts || 0);

  return (
    <View style={styles.statsRow}>
      <StatCard
        icon="checkmark-circle-outline"
        label={t('found')}
        value={data?.totalFounds || 0}
        tone={tokens.status.found.main}
        onPress={onFoundPress}
        styles={styles}
        tokens={tokens}
      />
      <StatCard
        icon="help-circle-outline"
        label={t('lost')}
        value={data?.totalLosts || 0}
        tone={tokens.status.lost.main}
        onPress={onLostPress}
        styles={styles}
        tokens={tokens}
      />
      <StatCard
        icon="ribbon-outline"
        label={t('returnedItems')}
        value={data?.totalReturned || 0}
        tone={tokens.brandPrimary}
        styles={styles}
        tokens={tokens}
      />
      <StatCard
        icon="today-outline"
        label={t('today')}
        value={todayCount}
        tone={tokens.ink}
        styles={styles}
        tokens={tokens}
      />
    </View>
  );
};

const TrendingSection = ({ trend, isLoading, t, currentLanguage, styles, tokens, onPress }) => {
  if (isLoading && !trend) {
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('trending')}</Text>
        <SkeletonBlock tokens={tokens} style={styles.trendingSkeleton} />
      </View>
    );
  }

  if (!trend || !trend._id) {
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('trending')}</Text>
        <View style={styles.trendingEmpty}>
          <Ionicons name="trending-up-outline" size={32} color={`${tokens.ink}40`} />
          <Text style={styles.trendingEmptyTitle}>{t('noTrendingItems')}</Text>
          <Text style={styles.trendingEmptyBody}>{t('noTrendingItemsDescription')}</Text>
        </View>
      </View>
    );
  }

  const found = isFoundType(trend);
  const tone = found ? tokens.status.found : tokens.status.lost;
  const imageUri = getImageUri(trend.image);
  const categoryLabel = getCategoryLabel(trend, currentLanguage);
  const categoryConfig = getCategoryConfig(getCategoryInfo(trend)?.code);
  const cityLabel = getCityLabel(trend, currentLanguage);

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('trending')}</Text>
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
              <Ionicons name={categoryConfig.icon} size={40} color={categoryConfig.color} />
            </View>
          )}
          <View style={[styles.statusTag, { backgroundColor: tone.main }]}>
            <Ionicons name={found ? 'checkmark-circle' : 'search'} size={12} color="#FFFFFF" />
            <Text style={styles.statusTagText}>{found ? t('found') : t('lost')}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatRelativeTime(trend.createdAt, t)}</Text>
          </View>
        </View>
        <View style={styles.trendingBody}>
          {cityLabel ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={`${tokens.ink}90`} />
              <Text style={styles.infoRowText} numberOfLines={1}>
                {cityLabel}
              </Text>
            </View>
          ) : null}
          {categoryLabel ? (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={14} color={`${tokens.ink}90`} />
              <Text style={styles.infoRowText} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
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
          <Ionicons name={categoryConfig.icon} size={22} color={categoryConfig.color} />
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
    <View>
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
        <View style={[styles.recentEmpty, { borderStartColor: tone }]}>
          <Text style={styles.recentEmptyText}>{t('noPostsFound')}</Text>
        </View>
      )}
    </View>
  );
};

const CategoryChip = ({ category, currentLanguage, styles, onPress }) => {
  const config = getCategoryConfig(category.code);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.categoryChip}>
      <View style={[styles.categoryChipCircle, { backgroundColor: config.backgroundColor }]}>
        <Ionicons name={config.icon} size={22} color={config.color} />
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
  const styles = useMemo(() => createStyles(tokens, isRTL), [tokens, isRTL]);

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
      <AppHeader title={t('home')} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[tokens.brandPrimary]} tintColor={tokens.brandPrimary} />
        }
      >
        <Animated.View style={animatedSectionStyle(0)}>
          <StatsStrip
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

        <Animated.View style={[styles.section, styles.lastSection, animatedSectionStyle(5)]}>
          <SafetyFooter t={t} styles={styles} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens, isRTL) =>
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
      marginTop: 24,
    },
    lastSection: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: tokens.ink,
      marginBottom: 12,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    seeAllText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: tokens.brandPrimary,
    },

    // Stats strip
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    statCardSkeleton: {
      flex: 1,
      height: 84,
      borderRadius: radiusTokens.md,
    },
    statIconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    statValue: {
      fontFamily: fontFamilies.display,
      fontSize: 16,
      color: tokens.ink,
    },
    statLabel: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}99`,
      marginTop: 2,
    },

    // Trending
    trendingSkeleton: {
      height: 200,
      borderRadius: radiusTokens.lg,
    },
    trendingEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 28,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: `${tokens.ink}26`,
    },
    trendingEmptyTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },
    trendingEmptyBody: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      maxWidth: 240,
    },
    trendingCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
      borderStartWidth: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    trendingMedia: {
      width: '100%',
      height: 160,
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
      top: 8,
      start: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
    },
    statusTagText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    dateBadge: {
      position: 'absolute',
      top: 8,
      end: 8,
      backgroundColor: 'rgba(255,255,255,0.85)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
    },
    dateBadgeText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 11,
      color: '#0B1220',
    },
    trendingBody: {
      padding: 14,
      gap: 6,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoRowText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}CC`,
      flexShrink: 1,
    },

    // Recent founds/losts
    recentColumn: {
      gap: 10,
    },
    recentCardSkeleton: {
      height: 76,
      borderRadius: radiusTokens.md,
    },
    recentCard: {
      flexDirection: 'row',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    recentThumb: {
      width: 76,
      height: 76,
    },
    recentThumbPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    recentContent: {
      flex: 1,
      padding: 10,
      justifyContent: 'center',
      gap: 3,
    },
    recentStatusPill: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radiusTokens.sm,
      marginBottom: 2,
    },
    recentStatusPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      textTransform: 'uppercase',
    },
    recentTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
      textAlign: isRTL ? 'right' : 'left',
    },
    recentMeta: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      textAlign: isRTL ? 'right' : 'left',
    },
    recentEmpty: {
      borderStartWidth: 4,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      padding: 16,
    },
    recentEmptyText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: isRTL ? 'right' : 'left',
    },

    // Categories
    categoryRow: {
      gap: 14,
      paddingEnd: 4,
    },
    categoryChip: {
      alignItems: 'center',
      width: 76,
    },
    categoryChipCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    categoryChipLabel: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
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
