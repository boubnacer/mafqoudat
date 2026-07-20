/**
 * My Posts Screen
 * Mirrors: client/src/features/posts/MyPostsPage/MyPostsPage.jsx
 * Lists the current user's own posts (GET /posts/user) with per-post Edit,
 * Mark as Returned, and Delete actions. All three mutations update the local
 * list optimistically and roll back with a toast if the request fails.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import apiClient from '../api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import PromotePostSheet from '../components/PromotePostSheet';
import DataStateView from '../components/DataStateView';
import AppHeader from '../components/AppHeader';

const PAGE_SIZE = 10;
const TOAST_DURATION_MS = 3000;

// markPostAsReturned only flips `returned`, not `status` (a real backend
// inconsistency) - `returned` is the reliable "resolved" signal.
const displayStatus = (post) => (post.returned ? 'resolved' : post.status || 'active');

const STATUS_COLORS = {
  active: '#4CAF50',
  resolved: '#2196F3',
  expired: '#FF9800',
  suspended: '#9E9E9E',
};

const MyPostsScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  const renderPost = ({ item }) => {
    const status = displayStatus(item);
    const statusColor = STATUS_COLORS[status] || STATUS_COLORS.active;
    const statusLabelKey = { active: 'statusActive', resolved: 'statusResolved', expired: 'statusExpired', suspended: 'statusSuspended' }[status];

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetailScreen', { id: item._id })}
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
          <View style={styles.titleRow}>
            <Text style={[styles.postTitle, isRTL && styles.textRTL]} numberOfLines={1}>
              {item.title || t('untitledPost')}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>{t(statusLabelKey)}</Text>
            </View>
          </View>
          <Text style={[styles.postLocation, isRTL && styles.textRTL]} numberOfLines={1}>
            {item.exactLocation}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
              <Text style={styles.actionButtonText}>{t('edit')}</Text>
            </TouchableOpacity>
            {!item.returned ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleMarkReturned(item)}>
                <Text style={styles.actionButtonText}>{t('markAsReturned')}</Text>
              </TouchableOpacity>
            ) : null}
            {!item.promotionRequested ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => handlePromote(item)}>
                <Text style={styles.actionButtonText}>{t('promoteThisPost')}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>{t('delete')}</Text>
            </TouchableOpacity>
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
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('myPosts')} />

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
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2196F3']} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? <ActivityIndicator size="small" color="#2196F3" style={styles.footerLoader} /> : null
            }
            ListEmptyComponent={!isLoading ? <DataStateView message={t('noMyPosts')} isRTL={isRTL} /> : null}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  textRTL: {
    textAlign: 'right',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  postImagePlaceholder: {
    width: '100%',
    height: 160,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  postTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginEnd: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  postLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginEnd: 8,
  },
  actionButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    borderColor: '#c62828',
  },
  deleteButtonText: {
    color: '#c62828',
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
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MyPostsScreen;
