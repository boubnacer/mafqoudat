/**
 * Posts List Screen
 * Mirrors: client/src/features/posts/PostsList/PostsList.js
 * Card visuals mirror the same "post card DNA" used on HomeScreen's trending
 * card / client's PublicPostsPage: surfaceRaised + radius.lg card, a
 * borderStart accent bar in the post's status color, a solid status tag
 * overlay on the image, and a translucent date badge - see CLAUDE.md's
 * "Established component patterns" section.
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
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import apiClient from '../api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { getCategoryConfig } from '../config/categories';
import PostFilterSheet from '../components/PostFilterSheet';
import DataStateView from '../components/DataStateView';
import AppHeader from '../components/AppHeader';

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 5;

const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

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
// aggregation projects (see server/controllers/postsController.js).
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

const PostsListScreen = ({ navigation, route }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { floptions, categories, countries, getCities } = useReferenceData();
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
  const [total, setTotal] = useState(0);

  const [countryId, setCountryId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFl, setSelectedFl] = useState('');
  const [isFlRestored, setIsFlRestored] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCityLabel, setSelectedCityLabel] = useState('');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

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

  // This screen now lives inside MainTabs (a hidden tab, so the bottom bar stays
  // visible while browsing - see App.js), which means it's never remounted between
  // visits the way a stack push used to remount it. Mirrors the initialFl effect
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

  // Debounce free-text search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Any filter/search/country/language change resets to page 1 and recomposes the query.
  // Waits on isFlRestored too, so the very first fetch already carries the
  // restored post-type filter instead of firing once with the default ('')
  // and again once storage resolves.
  useEffect(() => {
    if (!countryId || !isFlRestored) return;
    loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, isFlRestored, selectedFl, selectedCategoryIds, selectedCityId, debouncedSearch, currentLanguage]);

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
    }, [countryId, selectedFl, selectedCategoryIds, selectedCityId, debouncedSearch, currentLanguage])
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
          ...(debouncedSearch && { search: debouncedSearch }),
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
      setTotal(responseData.total || 0);
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

  const handleToggleCategory = (id) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSelectCity = (city) => {
    if (city) {
      setSelectedCityId(city.id);
      setSelectedCityLabel(city.label);
    } else {
      setSelectedCityId(null);
      setSelectedCityLabel('');
    }
  };

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
    setSearchText('');
    setDebouncedSearch('');
  };

  const isFilterActive = Boolean(
    selectedFl || selectedCategoryIds.length > 0 || selectedCityId || debouncedSearch
  );
  const activeFilterCount =
    (selectedFl ? 1 : 0) + selectedCategoryIds.length + (selectedCityId ? 1 : 0);

  const selectedFloption = floptions.find((fl) => fl._id === selectedFl);
  const selectedCategoryChips = categories.filter((cat) => selectedCategoryIds.includes(cat._id));

  const filterButton = (
    <TouchableOpacity style={styles.filterButton} onPress={() => setFilterSheetVisible(true)}>
      <Ionicons name="options-outline" size={16} color={tokens.brandPrimary} />
      <Text style={styles.filterButtonText}>{t('filters')}</Text>
      {activeFilterCount > 0 ? (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderPost = ({ item }) => {
    const found = isFoundType(item, floptions);
    const tone = found ? tokens.status.found : tokens.status.lost;
    const imageUri = getImageUri(item.image);
    const categoryConfig = getCategoryConfig(getCategoryInfo(item)?.code);
    const categoryLabel = getCategoryLabel(item, currentLanguage);
    const cityLabel = getCityLabel(item, currentLanguage);

    return (
      <TouchableOpacity
        style={[styles.postCard, { borderStartColor: tone.main }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PostDetailScreen', { id: item?._id || item?.id })}
      >
        <View style={styles.postMedia}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.postImage} resizeMode="cover" />
          ) : (
            <View style={[styles.postImagePlaceholder, { backgroundColor: categoryConfig.backgroundColor }]}>
              <Ionicons name={categoryConfig.icon} size={44} color={categoryConfig.color} />
            </View>
          )}
          <View style={[styles.statusTag, { backgroundColor: tone.main }]}>
            <Ionicons name={found ? 'checkmark-circle' : 'search'} size={13} color="#FFFFFF" />
            <Text style={styles.statusTagText}>{found ? t('found') : t('lost')}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatRelativeTime(item.createdAt, t)}</Text>
          </View>
        </View>
        <View style={styles.postContent}>
          <Text style={[styles.postTitle, isRTL && styles.textRTL]} numberOfLines={2}>
            {item.title || t('untitledPost')}
          </Text>
          <Text style={[styles.postDescription, isRTL && styles.textRTL]} numberOfLines={2}>
            {item.description || t('noDescriptionProvided')}
          </Text>
          <View style={styles.postMetaRow}>
            {cityLabel ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color={`${tokens.ink}99`} />
                <Text style={styles.infoRowText} numberOfLines={1}>
                  {cityLabel}
                </Text>
              </View>
            ) : null}
            {categoryLabel ? (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={14} color={`${tokens.ink}99`} />
                <Text style={styles.infoRowText} numberOfLines={1}>
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={styles.container}>
        <AppHeader
          title={t('posts')}
          countryId={countryId}
          onSelectCountry={handleSelectCountry}
          rightActions={filterButton}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.brandPrimary} />
          <Text style={styles.loadingText}>{t('loadingPosts')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={t('posts')}
        countryId={countryId}
        onSelectCountry={handleSelectCountry}
        rightActions={filterButton}
      />

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={`${tokens.ink}80`} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isRTL && styles.textRTL]}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={`${tokens.ink}66`}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
      </View>

      {isFilterActive ? (
        <View style={styles.activeFiltersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {debouncedSearch ? (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => {
                  setSearchText('');
                  setDebouncedSearch('');
                }}
              >
                <Text style={styles.activeChipText}>"{debouncedSearch}"</Text>
                <Text style={styles.activeChipRemove}>✕</Text>
              </TouchableOpacity>
            ) : null}
            {selectedFloption ? (
              <TouchableOpacity style={styles.activeChip} onPress={() => handleSelectFl('')}>
                <Text style={styles.activeChipText}>{getLocalizedLabel(selectedFloption, currentLanguage)}</Text>
                <Text style={styles.activeChipRemove}>✕</Text>
              </TouchableOpacity>
            ) : null}
            {selectedCategoryChips.map((cat) => (
              <TouchableOpacity key={cat._id} style={styles.activeChip} onPress={() => handleToggleCategory(cat._id)}>
                <Text style={styles.activeChipText}>{getLocalizedLabel(cat, currentLanguage)}</Text>
                <Text style={styles.activeChipRemove}>✕</Text>
              </TouchableOpacity>
            ))}
            {selectedCityId ? (
              <TouchableOpacity style={styles.activeChip} onPress={() => handleSelectCity(null)}>
                <Text style={styles.activeChipText}>{selectedCityLabel}</Text>
                <Text style={styles.activeChipRemove}>✕</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={handleClearAllFilters} style={styles.clearAllLink}>
              <Text style={styles.clearAllLinkText}>{t('clearFilters')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : null}

      {total > 0 ? (
        <Text style={[styles.resultsCount, isRTL && styles.textRTL]}>
          {total} {t('posts')}
        </Text>
      ) : null}

      {error && !isLoading && posts.length === 0 ? (
        <DataStateView
          variant="error"
          message={error}
          actionLabel={t('retry')}
          onAction={() => loadPosts(page)}
          isRTL={isRTL}
        />
      ) : (
        <View style={styles.listWrap}>
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
                <DataStateView
                  message={isFilterActive ? t('noResultsFilters') : t('noPostsFound')}
                  actionLabel={isFilterActive ? t('clearFilters') : undefined}
                  onAction={isFilterActive ? handleClearAllFilters : undefined}
                  isRTL={isRTL}
                />
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
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewPostPress}
        accessibilityLabel={t('newPost')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <PostFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        t={t}
        currentLanguage={currentLanguage}
        isRTL={isRTL}
        floptions={floptions}
        categories={categories}
        countries={countries}
        getCities={getCities}
        countryId={countryId}
        onSelectCountry={handleSelectCountry}
        selectedFl={selectedFl}
        onSelectFl={handleSelectFl}
        selectedCategoryIds={selectedCategoryIds}
        onToggleCategory={handleToggleCategory}
        onClearCategories={() => setSelectedCategoryIds([])}
        selectedCityId={selectedCityId}
        onSelectCity={handleSelectCity}
        onClearAll={handleClearAllFilters}
      />
    </View>
  );
};

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: tokens.surfaceBase,
    },
    searchIcon: {
      position: 'absolute',
      start: 28,
      zIndex: 1,
    },
    searchInput: {
      flex: 1,
      height: 44,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      paddingStart: 40,
      paddingEnd: 16,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    textRTL: {
      textAlign: 'right',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.surfaceRaised,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    filterButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
      fontSize: 13,
    },
    filterBadge: {
      marginStart: 2,
      borderRadius: radiusTokens.sm,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      backgroundColor: tokens.brandPrimary,
    },
    filterBadgeText: {
      fontSize: 11,
      fontFamily: fontFamilies.bodySemiBold,
      color: '#FFFFFF',
    },
    activeFiltersRow: {
      paddingTop: 10,
    },
    activeFiltersContent: {
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    activeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${tokens.brandPrimary}1F`,
      borderRadius: radiusTokens.xl,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginEnd: 8,
    },
    activeChipText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      marginEnd: 6,
    },
    activeChipRemove: {
      color: tokens.brandPrimary,
      fontSize: 12,
      fontFamily: fontFamilies.bodySemiBold,
    },
    clearAllLink: {
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    clearAllLinkText: {
      color: tokens.status.lost.main,
      fontSize: 13,
      fontFamily: fontFamilies.bodySemiBold,
    },
    resultsCount: {
      paddingHorizontal: 16,
      paddingTop: 12,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: `${tokens.ink}99`,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontFamily: fontFamilies.body,
      color: `${tokens.ink}99`,
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

    // Post card - mirrors the web post card DNA: surfaceRaised, radius.lg,
    // 1px border, borderStart accent bar in the status color, elevation e1.
    postCard: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '14' : '26'}`,
      borderStartWidth: 6,
      marginBottom: 16,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    postMedia: {
      width: '100%',
      height: 180,
      backgroundColor: tokens.surfaceBase,
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    postImagePlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusTag: {
      position: 'absolute',
      top: 10,
      start: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
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
      top: 10,
      end: 10,
      backgroundColor: `${tokens.surfaceRaised}D9`,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: radiusTokens.sm,
    },
    dateBadgeText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 11,
      color: tokens.ink,
    },
    postContent: {
      padding: 14,
    },
    postTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: tokens.ink,
      marginBottom: 6,
    },
    postDescription: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginBottom: 10,
      lineHeight: 19,
    },
    postMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
    },
    infoRowText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      flexShrink: 1,
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
    paginationBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: tokens.surfaceRaised,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    pageButton: {
      flexDirection: 'row',
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

    fab: {
      position: 'absolute',
      bottom: 24,
      end: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      ...getElevation(isDark, 2),
    },
  });

export default PostsListScreen;
