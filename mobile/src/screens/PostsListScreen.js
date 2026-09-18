/**
 * Posts List Screen
 * Mirrors: client/src/features/posts/PostsList/PostsList.js and its card,
 * client/src/features/posts/PostsList/Post.js. The card is a photo-top
 * block (status pill + category pill(s) overlaid at its top corners, a
 * resolved badge and a "posted X ago" pill overlaid at its bottom corners),
 * then the city with a location pin, then a 3-column stats bar (site views /
 * reactions / comments). No search bar - web's PostsList.js has none either;
 * `?search=` only ever gets seeded from a URL param there.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { getImageUri } from '../utils/imageUri';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useReferenceData } from '../context/ReferenceDataContext';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { getCategoryConfig } from '../config/categories';
import PostFilterDialog from '../components/PostFilterDialog';
import DataStateView from '../components/DataStateView';
import SkeletonBlock from '../components/SkeletonBlock';
import AppHeader from '../components/AppHeader';
import { summarizeSocialStats, readSiteViews } from '../utils/socialStats';
import { useStaggeredFadeIn } from '../hooks/useStaggeredFadeIn';
import { logical, row } from '../utils/rtl';
import { formatRelativeTime } from '../utils/relativeTime';

const PAGE_SIZE = 5;
const SECTION_COUNT = 1;
const SKELETON_CARD_COUNT = 3;

// Shaped like the real postCard below - the inset photo block, then the city
// line, then the stats bar - with neutral blocks, since the skeleton doesn't
// know the post type (or its city) yet. No search-bar placeholder: the
// screen has no search bar, mirroring web's PostsList.js.
const PostsListSkeleton = ({ styles, tokens }) => (
  <View style={styles.skeletonWrap}>
    {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
      <View key={i} style={styles.postCardSkeleton}>
        <SkeletonBlock tokens={tokens} style={styles.photoSkeleton} />
        <SkeletonBlock tokens={tokens} style={styles.cityLineSkeleton} />
        <SkeletonBlock tokens={tokens} style={styles.statsBarSkeleton} />
      </View>
    ))}
  </View>
);

/** Mixes a hex color toward white - RN has no equivalent of MUI's lighten(),
 * which the web filter launcher pill uses for its gradient fill. */
const lighten = (hex, amount) => {
  const value = hex.replace('#', '');
  const channel = (index) => {
    const start = parseInt(value.slice(index * 2, index * 2 + 2), 16);
    return Math.round(start + (255 - start) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow strings)
// as RN shadow/elevation props - same shadow color/opacity the web cards use.
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

// getAllPosts's aggregation returns a Categories array (new format) with a
// Category/categoryname fallback for legacy posts - same shape the dashboard
// aggregation projects (see server/controllers/postsController.js), and the
// same shape client/src/features/posts/PostsList/Post.js's own `categories`
// reads, since a listing can carry more than one. Never empty, same as web's
// own fallback - a post with nothing resolvable still gets one OTHER entry,
// so callers never have to special-case a zero-length list.
const getCategoriesList = (item) => {
  if (Array.isArray(item?.Categories) && item.Categories.length > 0) return item.Categories;
  if (item?.Category?.code) return [item.Category];
  if (item?.categoryname) return [{ code: item.categoryname, labels: null }];
  return [{ code: 'OTHER', labels: null }];
};

// No-image state: category icon on a frosted circle backdrop with the
// category name beneath it as a matching pill, centered - mirrors web
// Post.js's CategoryIconLabel. Sized up when it's the only category on the
// card, same as web's single-vs-multiple split.
const CategoryIconLabel = ({ icon, label, color, single, tokens }) => (
  <View style={{ alignItems: 'center', gap: 6 }}>
    <View
      style={{
        width: single ? 72 : 48,
        height: single ? 72 : 48,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${tokens.surfaceRaised}8C`,
      }}
    >
      <Ionicons name={icon} size={single ? 40 : 26} color={color} />
    </View>
    <Text
      numberOfLines={1}
      style={{
        maxWidth: 110,
        backgroundColor: `${tokens.surfaceRaised}8C`,
        color,
        fontFamily: fontFamilies.bodySemiBold,
        fontSize: single ? 12 : 11,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      {label}
    </Text>
  </View>
);

// city here can be an object ({ labels, code, ... }) or absent - never a bare
// ObjectId string like the dashboard aggregation's city field.
const getCityLabel = (item, currentLanguage) => {
  if (item?.cityLabels && typeof item.cityLabels === 'object') {
    const label = item.cityLabels[currentLanguage] || item.cityLabels.en;
    if (label && label.trim()) return label.trim();
  }
  if (item?.city?.labels && typeof item.city.labels === 'object') {
    const label = item.city.labels[currentLanguage] || item.city.labels.en;
    if (label && label.trim()) return label.trim();
  }
  if (item?.cityName && item.cityName.trim()) return item.cityName.trim();
  return null;
};

// getAllPosts doesn't unwind its Floptions lookup, so it stays an array here
// (unlike the dashboard aggregation's unwound single object) - fall back to
// matching the post's raw foundLost id against the floptions reference list
// when neither shape is present.
const isFoundType = (item, floptions) => {
  if (Array.isArray(item?.Floptions) && item.Floptions.length > 0) {
    return item.Floptions[0].code !== 'LOST';
  }
  if (item?.Floptions?.code) return item.Floptions.code !== 'LOST';
  const match = floptions?.find((fl) => fl._id === item?.foundLost);
  if (match?.code) return match.code !== 'LOST';
  return true;
};

const PostsListScreen = ({ navigation, route }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { floptions, categories, getCities } = useReferenceData();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getSectionStyle = useStaggeredFadeIn(SECTION_COUNT, hasLoadedOnce);

  const [countryId, setCountryId] = useState(null);
  const [selectedFl, setSelectedFl] = useState('');
  const [isFlRestored, setIsFlRestored] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCityLabel, setSelectedCityLabel] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const isFirstFocusRef = useRef(true);
  const isFirstInitialFlParamRef = useRef(true);
  const isFirstInitialCategoryParamRef = useRef(true);
  const listRef = useRef(null);

  // Resolve the browsing country once: the onboarding-selected country (Prompt 0.3)
  // takes priority, falling back to the account's registered country.
  useEffect(() => {
    let isMounted = true;
    const resolveCountry = async () => {
      const onboardingCountry = await storage.getCurrentCountry();
      if (onboardingCountry) {
        if (isMounted) setCountryId(onboardingCountry);
        return;
      }
      const userData = await storage.getUserData();
      if (userData?.country) {
        if (isMounted) setCountryId(userData.country);
        return;
      }
      if (isMounted) {
        setError(t('countryNotSet'));
        setIsLoading(false);
      }
    };
    resolveCountry();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the last-selected post-type segment (All/Lost/Found) before the
  // first fetch fires - the composing effect below waits on isFlRestored so
  // the initial load already uses the right filter instead of fetching twice.
  // A caller that pushed this screen with an explicit initialFl (HomeScreen's
  // stat cards / "See all" links) takes priority over the stored segment.
  useEffect(() => {
    let isMounted = true;
    const initialFl = route.params?.initialFl;
    if (initialFl !== undefined) {
      setSelectedFl(initialFl || '');
      setIsFlRestored(true);
      return undefined;
    }
    storage.getSelectedFl().then((storedFl) => {
      if (isMounted) {
        setSelectedFl(storedFl || '');
        setIsFlRestored(true);
      }
    });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HomeScreen's category quick-access strip pushes this screen with an
  // explicit initialCategoryId to pre-filter by - applied once on mount,
  // same as initialFl above.
  useEffect(() => {
    const initialCategoryId = route.params?.initialCategoryId;
    if (initialCategoryId) {
      setSelectedCategoryIds([initialCategoryId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // navigate() to a screen already present on the stack pops back to that existing
  // instance instead of pushing (and remounting) a new one - see App.js. Mirrors the initialFl effect
  // above: applies a category change from a second visit to an already-mounted
  // instance (e.g. tapping a different category chip on Home after already having
  // browsed once) instead of silently keeping the stale filter from the first visit.
  useEffect(() => {
    if (isFirstInitialCategoryParamRef.current) {
      isFirstInitialCategoryParamRef.current = false;
      return;
    }
    const requestedCategoryId = route.params?.initialCategoryId;
    if (!requestedCategoryId) return;
    setSelectedCategoryIds([requestedCategoryId]);
    navigation.setParams({ initialCategoryId: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.initialCategoryId]);

  // Any filter/country/language change resets to page 1 and recomposes the query.
  // Waits on isFlRestored too, so the very first fetch already carries the
  // restored post-type filter instead of firing once with the default ('')
  // and again once storage resolves.
  useEffect(() => {
    if (!countryId || !isFlRestored) return;
    loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, isFlRestored, selectedFl, selectedCategoryIds, selectedCityId, currentLanguage]);

  // Regaining focus (e.g. returning from creating a post, from a post's detail
  // screen, or from changing the account country in EditProfileScreen) re-syncs
  // the browsing country from storage first - storage.setCurrentCountry is the
  // single source of truth for it, written by both handleSelectCountry above
  // and EditProfileScreen - then quietly refreshes the current page. Skips the
  // very first focus since the composing effect above already covers initial mount.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      let isActive = true;
      const resync = async () => {
        const storedCountry = await storage.getCurrentCountry();
        if (!isActive) return;
        if (storedCountry && storedCountry !== countryId) {
          // The composing effect (countryId is a dependency) reloads posts.
          setCountryId(storedCountry);
          return;
        }
        if (countryId) {
          loadPosts(page);
        }
      };
      resync();
      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countryId, selectedFl, selectedCategoryIds, selectedCityId, currentLanguage])
  );

  const loadPosts = async (pageNum, isRefresh = false) => {
    if (!countryId) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    // A page change means the filters/search/country/page changed - cancel
    // whatever previous request is still in flight so a slow stale response can't win the race.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      const response = await apiClient.get(API_ENDPOINTS.POSTS.GET_ALL, {
        signal: controller.signal,
        params: {
          page: pageNum,
          pageSize: PAGE_SIZE,
          fl: selectedFl || '',
          currentCountry: countryId,
          ...(selectedCategoryIds.length > 0 && { categoryIds: selectedCategoryIds.join(',') }),
          ...(selectedCityId && { cityId: selectedCityId }),
          language: currentLanguage || 'en',
        },
      });

      // A newer request has since started - this response is stale, ignore it.
      if (requestId !== requestIdRef.current) return;

      const responseData = response.data;
      const postsArray = responseData.postsWithUser;

      if (!Array.isArray(postsArray)) {
        console.error('Posts data is not an array:', postsArray);
        setPosts([]);
        setError(t('failedToLoadPosts'));
        return;
      }

      setPosts(postsArray);
      setTotalPages(responseData.totalPages || 1);
      setPage(responseData.page || pageNum);
      setError('');
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err) {
      if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        return;
      }
      if (requestId !== requestIdRef.current) return;

      console.error('Error loading posts:', err);
      if (err.response?.status === 401) {
        setError(t('sessionExpired'));
        await signOut();
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || t('countryNotSet'));
      } else {
        setError(t('failedToLoadPosts'));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setHasLoadedOnce(true);
      }
    }
  };

  const handleRefresh = () => {
    loadPosts(page, true);
  };

  const handlePrevPage = () => {
    if (page > 1 && !isLoading) loadPosts(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages && !isLoading) loadPosts(page + 1);
  };

  const handleSelectCountry = (id) => {
    if (!id || id === countryId) return;
    setCountryId(id);
    setSelectedCityId(null);
    setSelectedCityLabel('');
    // Persisted so it's the single source of truth for "current browsing
    // country" - the focus-resync below reads this same value, and an
    // EditProfileScreen country change writes to it too (see there for why).
    storage.setCurrentCountry(id);
  };

  // Single write path for selectedFl - used by the filter sheet's post-type
  // section, the active-filter chip's remove button, and the route-param
  // effect below (HeaderMenu's Browse section), so every surface reads/writes
  // the same state and the persisted value never goes stale relative to
  // what's on screen.
  const handleSelectFl = (id) => {
    setSelectedFl(id);
    storage.setSelectedFl(id);
  };

  // HeaderMenu's Browse section navigates here via navigation.navigate('PostsListScreen',
  // { initialFl }). If this screen is already the focused route, that only merges the
  // new param in place (no remount) - the mount-time restore effect above has already
  // run by then, so this effect is what applies a filter change on an already-mounted
  // screen. Skips its own first firing since the mount effect already covers initial
  // load; the param is cleared right after so refocusing doesn't re-apply a stale value.
  useEffect(() => {
    if (isFirstInitialFlParamRef.current) {
      isFirstInitialFlParamRef.current = false;
      return;
    }
    const requestedFl = route.params?.initialFl;
    if (requestedFl === undefined) return;
    handleSelectFl(requestedFl);
    navigation.setParams({ initialFl: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.initialFl]);

  const handleNewPostPress = async () => {
    // PostsListScreen only renders once signed in (RootNavigator swaps to the
    // auth stack otherwise), so this is a defensive check, not the primary gate.
    const token = await storage.getToken();
    if (!token) {
      await signOut();
      return;
    }
    navigation.navigate('NewPost');
  };

  const handleClearAllFilters = () => {
    handleSelectFl('');
    setSelectedCategoryIds([]);
    setSelectedCityId(null);
    setSelectedCityLabel('');
  };

  const isFilterActive = Boolean(selectedFl || selectedCategoryIds.length > 0 || selectedCityId);
  const activeFilterCount =
    (selectedFl ? 1 : 0) + selectedCategoryIds.length + (selectedCityId ? 1 : 0);

  // Commits the filter dialog's staged draft into the applied filters (which
  // is what the posts query reads) and closes it - mirrors web's
  // handleApplyFilters. selectedFl still goes through handleSelectFl so it
  // stays persisted the same way a chip removal or HeaderMenu pick would.
  const handleApplyFilters = ({ fl, categoryIds, cityId, cityLabel }) => {
    handleSelectFl(fl);
    setSelectedCategoryIds(categoryIds);
    setSelectedCityId(cityId);
    setSelectedCityLabel(cityLabel || '');
    setFilterDialogOpen(false);
  };

  // Floating filter launcher - mirrors web's mobile/tablet pop-up launcher: a
  // pill docked to the inline-start edge (flush there, rounded on the
  // protruding side), floating above the list as a fixed overlay rather than
  // an in-flow row, so cards scroll underneath it exactly like web's
  // `position: fixed` launcher. No separate active-filter chip strip below it
  // (unlike web) - the applied count lives entirely in the pill's own badge.
  const filterLauncher = (
    <TouchableOpacity
      style={styles.filterLauncher}
      onPress={() => setFilterDialogOpen(true)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('filters')}
    >
      <LinearGradient
        colors={[tokens.brandPrimary, lighten(tokens.brandPrimary, 0.15)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.filterLauncherFill}
      >
        <Ionicons name="options" size={16} color="#FFFFFF" />
        <Text style={styles.filterLauncherText}>{t('filters')}</Text>
        {activeFilterCount > 0 ? (
          <View style={styles.filterLauncherBadge}>
            <Text style={styles.filterLauncherBadgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderPost = ({ item }) => {
    const found = isFoundType(item, floptions);
    const tone = found ? tokens.status.found : tokens.status.lost;
    const imageUri = getImageUri(item.image);
    const categoriesList = getCategoriesList(item);
    const categoryConfigs = categoriesList.map((cat) => getCategoryConfig(cat.code));
    const categoryLabels = categoriesList.map((cat) =>
      cat.labels ? cat.labels[currentLanguage] || cat.labels.en || cat.code : cat.code
    );
    const cityLabel = getCityLabel(item, currentLanguage);

    // Same three-number stats bar as web Post.js - site views alongside
    // reactions/comments combined across Facebook + Instagram (never summed
    // with views: a page visit and a social impression are different units).
    const siteViews = readSiteViews(item);
    const socialStats = summarizeSocialStats(item);
    const combineCounts = (a, b) => (a === null && b === null ? null : (a || 0) + (b || 0));
    const reactionsCount = combineCounts(socialStats.facebook.reactions, socialStats.instagram.likes);
    const commentsCount = combineCounts(socialStats.facebook.comments, socialStats.instagram.comments);
    const statsBarItems = [
      { key: 'views', label: t('viewsLabel'), value: siteViews },
      { key: 'reactions', label: t('reactions'), value: reactionsCount },
      { key: 'comments', label: t('comments'), value: commentsCount },
    ];

    // No-image backdrop: a translucent tint of the category's own color(s),
    // blended across every category on a multi-category post - mirrors web's
    // noImageBackground gradient.
    const noImageTints = categoryConfigs.map((cfg) => `${cfg.color}${isDark ? '52' : '38'}`);

    return (
      <TouchableOpacity
        style={styles.postCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PostDetailScreen', { id: item?._id || item?.id })}
      >
        {/* Photo: the card's top block, inset from the card's own edges. */}
        <View style={styles.photoWrap}>
          <View style={styles.photoBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.postImage} resizeMode="cover" />
            ) : (
              <>
                {noImageTints.length > 1 ? (
                  <LinearGradient
                    colors={noImageTints}
                    start={{ x: isRTL ? 1 : 0, y: 0 }}
                    end={{ x: isRTL ? 0 : 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: noImageTints[0] }]} />
                )}
                <View style={styles.categoryIconsWrap}>
                  {categoriesList.slice(0, 4).map((cat, index) => (
                    <CategoryIconLabel
                      key={cat.code || index}
                      icon={categoryConfigs[index].icon}
                      label={categoryLabels[index]}
                      color={categoryConfigs[index].color}
                      single={categoriesList.length <= 1}
                      tokens={tokens}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Status: found/lost, solid tone.main pill, top-start. */}
            <View style={[styles.statusTag, { backgroundColor: tone.main }]}>
              <Ionicons name={found ? 'checkmark-circle' : 'search'} size={16} color="#FFFFFF" />
              <Text style={styles.statusTagText}>{found ? t('found') : t('lost')}</Text>
            </View>

            {/* Category pill(s), top-end - photo-only, same as web: with no
                photo the centered CategoryIconLabel above already carries the
                category name, and stacking this on top would duplicate it. */}
            {imageUri ? (
              <View style={styles.categoryBadgesWrap}>
                {categoriesList.map((cat, index) => (
                  <View
                    key={cat.code || index}
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: `${categoryConfigs[index].color}${isDark ? '33' : '1F'}`,
                        borderColor: `${categoryConfigs[index].color}59`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.categoryBadgeText, { color: categoryConfigs[index].color }]}
                      numberOfLines={1}
                    >
                      {categoryLabels[index]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Resolved/returned - dashboard-specific, bottom-start. */}
            {item.returned ? (
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                <Text style={styles.resolvedBadgeText}>{t('returned')}</Text>
              </View>
            ) : null}

            {/* Date posted, bottom-end. */}
            <View style={styles.dateBadge}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.dateBadgeText} numberOfLines={1}>
                {formatRelativeTime(item.createdAt, t, currentLanguage)}
              </Text>
            </View>
          </View>
        </View>

        {/* City, below the photo. */}
        {cityLabel ? (
          <View style={styles.cityRow}>
            <Ionicons name="location" size={18} color={tokens.ink} />
            <Text style={styles.cityText} numberOfLines={1}>
              {cityLabel}
            </Text>
          </View>
        ) : null}

        {/* Stats bar: the same reach metrics as web's, spelled out as a
            3-column grid. */}
        <View style={styles.statsBar}>
          {statsBarItems.map((stat, index) => (
            <View
              key={stat.key}
              style={[styles.statsBarCell, index < statsBarItems.length - 1 && styles.statsBarCellDivider]}
            >
              <Text style={styles.statsBarLabel}>{stat.label}</Text>
              <Text style={styles.statsBarValue}>{stat.value !== null ? stat.value : '—'}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={t('posts')}
        countryId={countryId}
        onSelectCountry={handleSelectCountry}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.body}>
      {!hasLoadedOnce ? (
        <PostsListSkeleton styles={styles} tokens={tokens} />
      ) : (
        <>
          {error && !isLoading && posts.length === 0 ? (
            <DataStateView
              variant="error"
              message={error}
              actionLabel={t('retry')}
              onAction={() => loadPosts(page)}
              isRTL={isRTL}
            />
          ) : (
            <Animated.View style={[styles.listWrap, getSectionStyle(0)]}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {isLoading && hasLoadedOnce ? (
                <ActivityIndicator size="small" color={tokens.brandPrimary} style={styles.inlineLoader} />
              ) : null}

              <FlatList
                ref={listRef}
                style={styles.list}
                data={Array.isArray(posts) ? posts : []}
                renderItem={renderPost}
                keyExtractor={(item, index) => item?._id || item?.id || `post-${index}`}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={[tokens.brandPrimary]}
                    tintColor={tokens.brandPrimary}
                  />
                }
                ListEmptyComponent={
                  !isLoading ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={48} color={`${tokens.brandPrimary}99`} />
                      <Text style={styles.emptyStateTitle}>
                        {isFilterActive ? t('noResultsFilters') : t('noPostsFound')}
                      </Text>
                      <Text style={styles.emptyStateBody}>
                        {isFilterActive ? t('adjustFilters') : t('noPostsInArea')}
                      </Text>
                      <View style={styles.emptyStateActions}>
                        {isFilterActive ? (
                          <TouchableOpacity style={styles.emptyStateSecondaryButton} onPress={handleClearAllFilters}>
                            <Text style={styles.emptyStateSecondaryButtonText}>{t('clearFilters')}</Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity style={styles.emptyStatePrimaryButton} onPress={handleNewPostPress}>
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                          <Text style={styles.emptyStatePrimaryButtonText}>{t('createPost')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null
                }
                // "Shown at the end of posts", mirroring client/src/features/posts/PostsList/PostsList.js -
                // only appears once the current page's posts have actually rendered (i.e. the user has
                // browsed all of them), not as a persistent floating action button.
                ListFooterComponent={
                  !isLoading && posts.length > 0 && page >= totalPages ? (
                    <TouchableOpacity style={styles.addPostButton} onPress={handleNewPostPress} activeOpacity={0.85}>
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                      <Text style={styles.addPostButtonText}>{t('createPost')}</Text>
                    </TouchableOpacity>
                  ) : null
                }
              />

              {totalPages > 1 ? (
                <View style={styles.paginationBar}>
                  <TouchableOpacity
                    style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                    onPress={handlePrevPage}
                    disabled={page <= 1}
                  >
                    <Ionicons
                      name={isRTL ? 'chevron-forward' : 'chevron-back'}
                      size={18}
                      color={page <= 1 ? `${tokens.ink}40` : tokens.brandPrimary}
                    />
                    <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
                      {t('previous')}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicatorText}>
                    {t('page')} {page} {t('of')} {totalPages}
                  </Text>

                  <TouchableOpacity
                    style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                    onPress={handleNextPage}
                    disabled={page >= totalPages}
                  >
                    <Text style={[styles.pageButtonText, page >= totalPages && styles.pageButtonTextDisabled]}>
                      {t('next')}
                    </Text>
                    <Ionicons
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={18}
                      color={page >= totalPages ? `${tokens.ink}40` : tokens.brandPrimary}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}
            </Animated.View>
          )}
        </>
      )}

      <View style={styles.filterLauncherFloating} pointerEvents="box-none">
        {filterLauncher}
      </View>
      </View>

      <PostFilterDialog
        visible={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleApplyFilters}
        t={t}
        currentLanguage={currentLanguage}
        isRTL={isRTL}
        floptions={floptions}
        categories={categories}
        getCities={getCities}
        countryId={countryId}
        appliedSelectedFl={selectedFl}
        appliedSelectedCategoryIds={selectedCategoryIds}
        appliedSelectedCityId={selectedCityId}
        appliedSelectedCityLabel={selectedCityLabel}
      />
    </View>
  );
};

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.postsListBackdrop,
    },
    // Wraps everything below the header so the floating launcher below can be
    // positioned absolutely relative to it, on top of the list rather than
    // pushing it down.
    body: {
      flex: 1,
      position: 'relative',
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    // Floating filter launcher: docked to the inline-start edge, matching
    // web's mobile/tablet pop-up launcher - flush (no radius) there, since
    // that's the edge it touches, rounded only on the inline-end side that
    // protrudes into the screen (i.e. the left edge is square in LTR, and
    // that mirrors to the right edge in RTL), and pinned with `position:
    // absolute` so it floats over the list exactly like web's `position:
    // fixed` launcher - cards scroll underneath it instead of it pushing the
    // list down. The wrapper itself carries no fill (fully transparent) so
    // only the pill's own gradient reads against whatever scrolls behind it;
    // `box-none` lets touches outside the pill's own bounds fall through to
    // the list beneath.
    filterLauncherFloating: {
      position: 'absolute',
      top: 12,
      zIndex: 20,
      elevation: 20,
      ...logical(isRTL, { start: 0 }),
    },
    filterLauncher: {
      ...logical(isRTL, {
        borderTopStartRadius: 0,
        borderBottomStartRadius: 0,
        borderTopEndRadius: radiusTokens.xl,
        borderBottomEndRadius: radiusTokens.xl,
      }),
      ...getElevation(isDark, 2),
    },
    filterLauncherFill: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      ...logical(isRTL, {
        paddingStart: 20,
        paddingEnd: 18,
        borderTopStartRadius: 0,
        borderBottomStartRadius: 0,
        borderTopEndRadius: radiusTokens.xl,
        borderBottomEndRadius: radiusTokens.xl,
      }),
    },
    filterLauncherText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: '#FFFFFF',
      fontSize: 14,
    },
    filterLauncherBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterLauncherBadgeText: {
      fontSize: 11,
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
    },
    inlineLoader: {
      marginTop: 12,
    },
    listWrap: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },

    // Initial-load skeleton - shaped like a handful of postCard-shaped
    // placeholders (photo block, city line, stats bar), so the transition
    // into real content doesn't jump. Visible immediately (see
    // useStaggeredFadeIn), the real content is what fades/slides in once
    // hasLoadedOnce flips.
    skeletonWrap: {
      padding: 16,
    },
    postCardSkeleton: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.xl,
      marginBottom: 16,
      paddingBottom: 14,
      overflow: 'hidden',
    },
    photoSkeleton: {
      margin: 10,
      aspectRatio: 4 / 3,
      borderRadius: radiusTokens.xl,
    },
    cityLineSkeleton: {
      height: 16,
      width: '45%',
      marginTop: 4,
      marginHorizontal: 16,
    },
    statsBarSkeleton: {
      height: 56,
      borderRadius: 18,
      marginHorizontal: 16,
      marginTop: 14,
    },

    // Post card - mirrors the actual web card in
    // client/src/features/posts/PostsList/Post.js: the photo leads as an
    // inset top block with the status/category badges, a resolved badge and
    // a "posted X ago" pill overlaid on it, then a plain city row, then a
    // 3-column stats bar. Phase 8/9 still hold - the card itself is
    // borderless and shadowless, and the badges/pills inside it are what
    // carry depth. The screen behind it uses postsListBackdrop (not plain
    // surfaceBase) so this plain-white card stands out from it.
    postCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.xl,
      marginBottom: 16,
      paddingBottom: 10,
      overflow: 'hidden',
    },
    photoWrap: {
      padding: 10,
    },
    photoBox: {
      position: 'relative',
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radiusTokens.xl,
      overflow: 'hidden',
      backgroundColor: tokens.surfaceBase,
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    categoryIconsWrap: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      // `flexWrap: 'wrap'` puts cross-axis placement of the (single) wrapped
      // line under `alignContent`, not `alignItems` - `alignItems` only
      // centers content *within* a line. Without this the lone line pins to
      // the top of the box (alignContent's default 'flex-start') instead of
      // sitting dead-center in the photo container.
      alignContent: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 12,
    },
    // Status: solid tone.main pill, top-start overlay on the photo - same
    // radius as the photo container itself (radius.xl) so the pill's outer
    // corner reads as part of the same rounded shape.
    statusTag: {
      position: 'absolute',
      top: 10,
      ...logical(isRTL, { start: 10 }),
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: radiusTokens.xl,
      ...getElevation(isDark, 1),
    },
    statusTagText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    // Category pill(s): same top row as the status tag, opposite end -
    // translucent per-category tint, config/categories.js's backgroundColor
    // being light-mode-only is why this washes the category's own color
    // instead (same fix as the web card).
    categoryBadgesWrap: {
      position: 'absolute',
      top: 10,
      ...logical(isRTL, { end: 10 }),
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 6,
      maxWidth: '55%',
    },
    categoryBadge: {
      borderWidth: 1,
      borderRadius: radiusTokens.sm,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    categoryBadgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
    },
    // Resolved/returned - bottom-start overlay, opposite the date pill.
    resolvedBadge: {
      position: 'absolute',
      bottom: 10,
      ...logical(isRTL, { start: 10 }),
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radiusTokens.sm,
      backgroundColor: tokens.status.found.main,
    },
    resolvedBadgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: '#FFFFFF',
    },
    // Date posted: translucent grey scrim pill, bottom-end overlay - same
    // '#78808E' scrim the web card uses (the reference design's own
    // translucent overlay color, not a design token - it exists only on top
    // of a photo).
    dateBadge: {
      position: 'absolute',
      bottom: 10,
      ...logical(isRTL, { end: 10 }),
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: '#78808E8C',
    },
    dateBadgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: '#FFFFFF',
    },
    // City, below the photo - a plain row (pin icon + bold text), not a
    // headline treatment: the actual web card doesn't gradient-style it.
    cityRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    cityText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
      flexShrink: 1,
    },
    // Stats bar: site views / reactions / comments, a 3-column grid -
    // mirrors web's reach metrics spelled out the same way.
    statsBar: {
      flexDirection: 'row',
      borderRadius: 18,
      backgroundColor: tokens.surfaceBase,
      marginHorizontal: 6,
      marginTop: 12,
      paddingVertical: 10,
    },
    statsBarCell: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    statsBarCellDivider: {
      ...logical(isRTL, { borderEndWidth: StyleSheet.hairlineWidth, borderEndColor: `${tokens.ink}1A` }),
    },
    statsBarLabel: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 11,
      color: `${tokens.ink}99`,
    },
    statsBarValue: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.brandLogo,
    },

    errorContainer: {
      backgroundColor: tokens.status.lost.bg,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: radiusTokens.md,
    },
    errorText: {
      color: tokens.status.lost.main,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      textAlign: 'center',
    },

    // Pagination footer - 5-posts-per-page prev/next controls, mirrors the
    // web PostsList.js "Page X of Y" + Pagination footer bar.
    // Manually driven by isRTL (see filterLauncher above) so prev/next swap
    // sides, and each button's own icon/label order flips, immediately on a
    // live language switch rather than only after an app restart.
    paginationBar: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: tokens.surfaceRaised,
      ...getElevation(isDark, 1),
    },
    pageButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radiusTokens.md,
    },
    pageButtonDisabled: {
      opacity: 0.5,
    },
    pageButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.brandPrimary,
    },
    pageButtonTextDisabled: {
      color: `${tokens.ink}40`,
    },
    pageIndicatorText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: `${tokens.ink}CC`,
    },

    // "Add new post" - shown after the last card once the user has browsed
    // all of the current page's posts, mirroring PostsList.js's button placed
    // right after the grid, rather than a persistent floating action button.
    addPostButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'center',
      marginTop: 4,
      marginBottom: 8,
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      ...getElevation(isDark, 1),
    },
    addPostButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    // Empty state - locally tokenized (bespoke, not the shared untokenized
    // DataStateView) so it can carry two actions like the web empty state:
    // clear filters (when a filter/search is active) and always an add-post CTA.
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
      color: tokens.ink,
      textAlign: 'center',
      marginTop: 14,
    },
    emptyStateBody: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 20,
      maxWidth: 320,
    },
    emptyStateActions: {
      flexDirection: 'row',
      gap: 10,
    },
    emptyStatePrimaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
    },
    emptyStatePrimaryButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    emptyStateSecondaryButton: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.brandPrimary,
    },
    emptyStateSecondaryButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.brandPrimary,
    },
  });

export default PostsListScreen;
