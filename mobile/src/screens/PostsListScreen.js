/**
 * Posts List Screen
 * Mirrors: client/src/features/posts/PostsList/PostsList.js
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';

const PostsListScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentCountry, setCurrentCountry] = useState(null);

  useEffect(() => {
    // Get user's country from stored data
    loadUserCountry();
    loadPosts();
  }, []);

  // Reload posts when language changes (only if we have a country)
  useEffect(() => {
    if (currentCountry && !isLoading) {
      // Reset to first page and reload
      setPage(1);
      loadPosts(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  const loadUserCountry = async () => {
    const userData = await storage.getUserData();
    if (userData?.country) {
      setCurrentCountry(userData.country);
    } else {
      // Fallback: check stored country from Welcome screen
      const storedCountry = await storage.getCurrentCountry();
      if (storedCountry) {
        setCurrentCountry(storedCountry);
      }
    }
  };

  const loadPosts = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Get current country (required by API)
      const userData = await storage.getUserData();
      let country = userData?.country || currentCountry;
      
      // Fallback: check stored country from Welcome screen
      if (!country) {
        country = await storage.getCurrentCountry();
      }

      if (!country) {
        setError(t('countryNotSet'));
        return;
      }

      // Call posts API (mirrors web app: GET /posts)
      const response = await apiClient.get(API_ENDPOINTS.POSTS.GET_ALL, {
        params: {
          page: pageNum,
          pageSize: 10,
          currentCountry: country,
          language: currentLanguage || 'en',
        },
      });

      // Handle API response structure
      // API returns: { postsWithUser, page, totalPages, total }
      const responseData = response.data;
      
      // Extract posts - API uses 'postsWithUser' not 'posts'
      const postsArray = responseData.postsWithUser;
      
      // Ensure postsArray is an array
      if (!Array.isArray(postsArray)) {
        console.error('Posts data is not an array:', postsArray);
        setPosts([]);
        setError(t('failedToLoadPosts'));
        return;
      }
      
      const totalPages = responseData.totalPages || 1;
      const currentPage = responseData.page || pageNum;
      
      console.log('Posts API Response:', {
        postsCount: postsArray.length,
        totalPages,
        currentPage,
        total: responseData.total
      });

      if (pageNum === 1) {
        setPosts(postsArray);
      } else {
        setPosts((prev) => [...prev, ...postsArray]);
      }

      setHasMore(currentPage < totalPages);
      setPage(pageNum);
      setError('');
    } catch (err) {
      console.error('Error loading posts:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 401) {
        setError(t('sessionExpired'));
        // Clearing auth via context flips isSignedIn, which drives RootNavigator
        // back to the Login screen automatically.
        await signOut();
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || t('countryNotSet'));
      } else {
        setError(t('failedToLoadPosts'));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    loadPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadPosts(page + 1);
    }
  };

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
          <Text style={styles.placeholderText}>No Image</Text>
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

  if (isLoading && (!Array.isArray(posts) || posts.length === 0)) {
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
        <TouchableOpacity
          onPress={signOut}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={Array.isArray(posts) ? posts : []}
        renderItem={renderPost}
        keyExtractor={(item, index) => item?._id || item?.id || `post-${index}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !isRefreshing ? (
            <ActivityIndicator size="small" color="#2196F3" style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noPostsFound')}</Text>
            </View>
          ) : null
        }
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
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
  },
});

export default PostsListScreen;

