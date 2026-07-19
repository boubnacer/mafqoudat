/**
 * Posts List Screen
 * Mirrors: client/src/features/posts/PostsList/PostsList.js
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import axios from 'axios';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import PostFilterSheet from '../components/PostFilterSheet';

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 10;

const PostsListScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { floptions, categories, countries, getCities } = useReferenceData();
  const isRTL = currentLanguage === 'ar';

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [countryId, setCountryId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFl, setSelectedFl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCityLabel, setSelectedCityLabel] = useState('');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const isFirstFocusRef = useRef(true);

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

  // Debounce free-text search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Any filter/search/country/language change resets to page 1 and recomposes the query.
  useEffect(() => {
    if (!countryId) return;
    loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, selectedFl, selectedCategoryIds, selectedCityId, debouncedSearch, currentLanguage]);

  // Regaining focus (e.g. returning from creating a post, or from a post's detail
  // screen) quietly refreshes page 1 with the current filters - skips the very
  // first focus since the composing effect above already covers initial mount.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      if (countryId) {
        loadPosts(1);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countryId, selectedFl, selectedCategoryIds, selectedCityId, debouncedSearch, currentLanguage])
  );

  const loadPosts = async (pageNum, isRefresh = false) => {
    if (!countryId) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    // A page-1 fetch means the filters/search/country changed - cancel whatever
    // previous request is still in flight so a slow stale response can't win the race.
    if (pageNum === 1) {
      abortControllerRef.current?.abort();
    }
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

      const totalPages = responseData.totalPages || 1;
      const currentPage = responseData.page || pageNum;

      if (pageNum === 1) {
        setPosts(postsArray);
      } else {
        setPosts((prev) => [...prev, ...postsArray]);
      }

      setHasMore(currentPage < totalPages);
      setPage(currentPage);
      setError('');
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
        setIsLoadingMore(false);
        setIsRefreshing(false);
        setHasLoadedOnce(true);
      }
    }
  };

  const handleRefresh = () => {
    loadPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      loadPosts(page + 1);
    }
  };

  const handleSelectCountry = (id) => {
    if (!id || id === countryId) return;
    setCountryId(id);
    setSelectedCityId(null);
    setSelectedCityLabel('');
  };

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
    navigation.navigate('NewPostScreen');
  };

  const handleClearAllFilters = () => {
    setSelectedFl('');
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

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetailScreen', { id: item?._id || item?.id })}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}/${item.image}` }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.postImagePlaceholder}>
          <Text style={styles.placeholderText}>{t('noImage')}</Text>
        </View>
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={styles.postDescription} numberOfLines={3}>
          {item.description || 'No description'}
        </Text>
        <Text style={styles.postDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('loadingPosts')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('posts')}</Text>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, isRTL && styles.textRTL]}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterSheetVisible(true)}>
          <Text style={styles.filterButtonText}>{t('filters')}</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
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
              <TouchableOpacity style={styles.activeChip} onPress={() => setSelectedFl('')}>
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

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading && hasLoadedOnce ? (
        <ActivityIndicator size="small" color="#2196F3" style={styles.inlineLoader} />
      ) : null}

      <FlatList
        data={Array.isArray(posts) ? posts : []}
        renderItem={renderPost}
        keyExtractor={(item, index) => item?._id || item?.id || `post-${index}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2196F3']} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator size="small" color="#2196F3" style={styles.footerLoader} /> : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{isFilterActive ? t('noResultsFilters') : t('noPostsFound')}</Text>
              {isFilterActive ? (
                <TouchableOpacity style={styles.emptyClearButton} onPress={handleClearAllFilters}>
                  <Text style={styles.emptyClearButtonText}>{t('clearFilters')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={[styles.fab, isRTL ? styles.fabRTL : styles.fabLTR]}
        onPress={handleNewPostPress}
        accessibilityLabel={t('newPost')}
      >
        <Text style={styles.fabIcon}>+</Text>
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
        onSelectFl={setSelectedFl}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textRTL: {
    textAlign: 'right',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: 'bold',
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
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeChipText: {
    color: '#1565C0',
    fontSize: 13,
    marginRight: 6,
  },
  activeChipRemove: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllLink: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  clearAllLinkText: {
    color: '#c62828',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  inlineLoader: {
    marginTop: 12,
  },
  list: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  postImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  postDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    marginVertical: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyClearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  emptyClearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabLTR: {
    right: 20,
  },
  fabRTL: {
    left: 20,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },
});

export default PostsListScreen;
