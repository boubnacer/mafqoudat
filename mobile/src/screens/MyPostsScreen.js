/**
 * My Posts Screen
 * Mirrors: client/src/features/posts/MyPostsPage/MyPostsPage.jsx
 * Lists the current user's own posts (GET /posts/user) with per-post Edit,
 * Mark as Returned, Promote, and Delete actions. All three mutations update the
 * local list optimistically and roll back with a toast if the request fails.
 *
 * Visuals follow the same "post card DNA" as PostsListScreen/HomeScreen's
 * trending card (surfaceRaised + radius.lg, a borderStart accent bar in the
 * post's Found/Lost tone, a solid status tag overlay + translucent date badge
 * on the image) - see CLAUDE.md's "Established component patterns" section -
 * plus an owner-only lifecycle pill (active/resolved/expired/suspended) in the
 * content area, since that status only matters to the post's own author.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies, lightColors, darkColors } from '../theme/tokens';
import { getCategoryConfig } from '../config/categories';
import PromotePostSheet from '../components/PromotePostSheet';
import DataStateView from '../components/DataStateView';
import AppHeader from '../components/AppHeader';

const PAGE_SIZE = 10;
const TOAST_DURATION_MS = 3000;

// markPostAsReturned only flips `returned`, not `status` (a real backend
// inconsistency) - `returned` is the reliable "resolved" signal.
const displayStatus = (post) => (post.returned ? 'resolved' : post.status || 'active');

const STATUS_LABEL_KEYS = {
  active: 'statusActive',
  resolved: 'statusResolved',
  expired: 'statusExpired',
  suspended: 'statusSuspended',
};

// Lifecycle status is a distinct axis from Found/Lost (tokens.status), so it
// gets its own tone map - reusing brandPrimary/status.found where the meaning
// lines up (active = ongoing/brand, resolved = success) and the app's existing
// warning color (tokens.js's lightColors/darkColors.warning) for expired,
// rather than inventing new hardcoded hex values.
const getLifecycleTones = (tokens, isDark) => {
  const warning = isDark ? darkColors.warning : lightColors.warning;
  return {
    active: { main: tokens.brandPrimary, bg: `${tokens.brandPrimary}1F` },
    resolved: { main: tokens.status.found.main, bg: tokens.status.found.bg },
    expired: { main: warning, bg: `${warning}${isDark ? '29' : '1F'}` },
    suspended: { main: `${tokens.ink}99`, bg: `${tokens.ink}14` },
  };
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

const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

const isFoundType = (item) => item?.foundLost?.code !== 'LOST';

const getCategoryLabel = (item, currentLanguage) => {
  const cat = item?.category;
  if (!cat) return null;
  return cat.labels ? cat.labels[currentLanguage] || cat.labels.en || cat.code : cat.code;
};

const getCityLabel = (item, currentLanguage) => {
  if (item?.city?.labels && typeof item.city.labels === 'object') {
    const label = item.city.labels[currentLanguage] || item.city.labels.en;
    if (label && label.trim()) return label.trim();
  }
  return null;
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

const ActionButton = ({ icon, label, tone, onPress, styles }) => (
  <TouchableOpacity
    style={[styles.actionButton, { borderColor: tone }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Ionicons name={icon} size={14} color={tone} />
    <Text style={[styles.actionButtonText, { color: tone }]}>{label}</Text>
  </TouchableOpacity>
);

const MyPostsScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const lifecycleTones = useMemo(() => getLifecycleTones(tokens, isDark), [tokens, isDark]);
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState('');
  const [promotePost, setPromotePost] = useState(null);

  const isFirstFocusRef = useRef(true);
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), TOAST_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const loadPosts = async (pageNum, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    try {
      const response = await apiClient.get(API_ENDPOINTS.POSTS.GET_USER_POSTS, {
        params: { page: pageNum, pageSize: PAGE_SIZE, language: currentLanguage || 'en' },
      });

      const postsArray = response.data?.postsWithUser;
      if (!Array.isArray(postsArray)) {
        setPosts([]);
        setError(t('failedToLoadPosts'));
        return;
      }

      const totalPages = response.data.totalPages || 1;
      const currentPage = response.data.page || pageNum;

      setPosts((prev) => (pageNum === 1 ? postsArray : [...prev, ...postsArray]));
      setHasMore(currentPage < totalPages);
      setPage(currentPage);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error('Error loading my posts:', err);
      setError(t('failedToLoadPosts'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  // Regaining focus (e.g. returning from editing a post) quietly refreshes page 1.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      loadPosts(1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLanguage])
  );

  const handleRefresh = () => loadPosts(1, true);

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      loadPosts(page + 1);
    }
  };

  const getErrorMessage = (err, fallback) => {
    if (err.response?.status === 429) return err.response.data?.message || t('postingLimitReached');
    if (err.response?.status === 403) return t('notAuthorizedForPost');
    if (!err.response) return t('networkError');
    return err.response?.data?.message || fallback;
  };

  const handleEdit = (post) => {
    navigation.navigate('EditPostScreen', { id: post._id });
  };

  const handlePromote = (post) => {
    setPromotePost(post);
  };

  const handlePromotionSubmitted = (message) => {
    const promotedId = promotePost?._id;
    setPosts((prev) => prev.map((p) => (p._id === promotedId ? { ...p, promotionRequested: true } : p)));
    setPromotePost(null);
    showToast(message);
  };

  const handleMarkReturned = (post) => {
    Alert.alert(t('markReturnedTitle'), t('markReturnedConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirm'), onPress: () => confirmMarkReturned(post) },
    ]);
  };

  const confirmMarkReturned = async (post) => {
    const previousPosts = posts;
    setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, returned: true } : p)));
    try {
      await apiClient.patch(API_ENDPOINTS.POSTS.MARK_RETURNED(post._id));
    } catch (err) {
      console.error('Error marking post as returned:', err);
      setPosts(previousPosts);
      showToast(getErrorMessage(err, t('failedToMarkReturned')));
    }
  };

  const handleDelete = (post) => {
    Alert.alert(t('deletePostTitle'), t('deletePostConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => confirmDelete(post) },
    ]);
  };

  const confirmDelete = async (post) => {
    const previousPosts = posts;
    setPosts((prev) => prev.filter((p) => p._id !== post._id));
    try {
      await apiClient.delete(API_ENDPOINTS.POSTS.DELETE, { data: { id: post._id } });
    } catch (err) {
      console.error('Error deleting post:', err);
      setPosts(previousPosts);
      showToast(getErrorMessage(err, t('failedToDeletePost')));
    }
  };

  const handleNewPostPress = () => navigation.navigate('NewPost');

  const renderPost = ({ item }) => {
    const found = isFoundType(item);
    const tone = found ? tokens.status.found : tokens.status.lost;
    const imageUri = getImageUri(item.image);
    const categoryConfig = getCategoryConfig(item?.category?.code);
    const categoryLabel = getCategoryLabel(item, currentLanguage);
    const cityLabel = getCityLabel(item, currentLanguage);

    const status = displayStatus(item);
    const statusTone = lifecycleTones[status] || lifecycleTones.active;
    const statusLabelKey = STATUS_LABEL_KEYS[status] || STATUS_LABEL_KEYS.active;

    return (
      <TouchableOpacity
        style={[styles.postCard, { borderStartColor: tone.main }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PostDetailScreen', { id: item._id })}
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
          <View style={styles.titleRow}>
            <Text style={[styles.postTitle, isRTL && styles.textRTL]} numberOfLines={1}>
              {item.title || t('untitledPost')}
            </Text>
            <View style={[styles.lifecycleBadge, { backgroundColor: statusTone.bg }]}>
              <Text style={[styles.lifecycleBadgeText, { color: statusTone.main }]}>{t(statusLabelKey)}</Text>
            </View>
          </View>

          <View style={styles.postMetaRow}>
            {cityLabel || item.exactLocation ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color={`${tokens.ink}99`} />
                <Text style={styles.infoRowText} numberOfLines={1}>
                  {cityLabel || item.exactLocation}
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

          <View style={styles.actionsRow}>
            <ActionButton
              icon="create-outline"
              label={t('edit')}
              tone={tokens.brandPrimary}
              onPress={() => handleEdit(item)}
              styles={styles}
            />
            {!item.returned ? (
              <ActionButton
                icon="checkmark-done-outline"
                label={t('markAsReturned')}
                tone={tokens.status.found.main}
                onPress={() => handleMarkReturned(item)}
                styles={styles}
              />
            ) : null}
            {!item.promotionRequested ? (
              <ActionButton
                icon="megaphone-outline"
                label={t('promoteThisPost')}
                tone={tokens.brandPrimary}
                onPress={() => handlePromote(item)}
                styles={styles}
              />
            ) : null}
            <ActionButton
              icon="trash-outline"
              label={t('delete')}
              tone={tokens.status.lost.main}
              onPress={() => handleDelete(item)}
              styles={styles}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('myPosts')} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.brandPrimary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('myPosts')} />

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
          onAction={() => loadPosts(1)}
          isRTL={isRTL}
        />
      ) : (
        <>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item, index) => item?._id || `mypost-${index}`}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[tokens.brandPrimary]}
                tintColor={tokens.brandPrimary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator size="small" color={tokens.brandPrimary} style={styles.footerLoader} />
              ) : posts.length > 0 && !hasMore ? (
                <TouchableOpacity style={styles.addPostButton} onPress={handleNewPostPress} activeOpacity={0.85}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addPostButtonText}>{t('createPost')}</Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="person-outline" size={48} color={`${tokens.brandPrimary}99`} />
                  <Text style={[styles.emptyStateTitle, isRTL && styles.textRTL]}>{t('noMyPosts')}</Text>
                  <TouchableOpacity style={styles.emptyStatePrimaryButton} onPress={handleNewPostPress}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyStatePrimaryButtonText}>{t('createPost')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        </>
      )}

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <PromotePostSheet
        visible={!!promotePost}
        onClose={() => setPromotePost(null)}
        postId={promotePost?._id}
        t={t}
        isRTL={isRTL}
        onSubmitted={handlePromotionSubmitted}
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
    textRTL: {
      textAlign: 'right',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    list: {
      padding: 16,
    },

    // Post card - mirrors PostsListScreen's post card DNA: surfaceRaised,
    // radius.lg, 1px border, borderStart accent bar in the Found/Lost tone,
    // elevation e1.
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 10,
    },
    postTitle: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: tokens.ink,
    },
    lifecycleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
    },
    lifecycleBadgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      textTransform: 'uppercase',
    },
    postMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      marginBottom: 14,
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

    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1A' : '0F'}`,
      paddingTop: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
    },
    actionButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
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

    footerLoader: {
      marginVertical: 16,
    },

    // "Add new post" - mirrors PostsListScreen's addPostButton, shown once
    // the user has browsed all of their own posts.
    addPostButton: {
      flexDirection: 'row',
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

    emptyState: {
      alignItems: 'center',
      paddingVertical: 56,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
      color: tokens.ink,
      textAlign: 'center',
      marginTop: 14,
      marginBottom: 20,
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

    // Toast - background/text swap between tokens.ink and tokens.surfaceRaised
    // so it stays high-contrast in both light and dark mode without a
    // hardcoded color.
    toast: {
      position: 'absolute',
      bottom: 24,
      start: 24,
      end: 24,
      backgroundColor: tokens.ink,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...getElevation(isDark, 2),
    },
    toastText: {
      fontFamily: fontFamilies.bodyMedium,
      color: tokens.surfaceRaised,
      fontSize: 14,
      textAlign: 'center',
    },
  });

export default MyPostsScreen;
