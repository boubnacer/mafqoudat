/**
 * Edit Post Screen
 * Thin wrapper around the shared PostForm (edit mode): fetches the post to
 * prefill (GET /posts/:id - same endpoint/shape PostDetailScreen already uses),
 * then owns the submit request. PATCH /posts is JSON unless the image changed,
 * in which case it's multipart (mirrors EditPostForm.js's dual-path submit).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, lightColors, darkColors } from '../theme/tokens';
import PostForm from '../components/PostForm';
import AppHeader from '../components/AppHeader';

const EditPostScreen = ({ navigation, route }) => {
  const { id } = route.params || {};
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const legacy = isDark ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(tokens, legacy), [tokens, legacy]);
  const isRTL = currentLanguage === 'ar';

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadPost = useCallback(async () => {
    if (!id) {
      setLoadError(t('postNotFound'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get(API_ENDPOINTS.POSTS.GET_BY_ID(id), {
        params: { language: currentLanguage || 'en' },
      });
      setPost(response.data);
    } catch (err) {
      console.error('Error loading post to edit:', err);
      setLoadError(err.response?.status === 404 ? t('postNotFound') : t('failedToLoadPost'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleSubmit = async ({ postData, imageAsset, imageRemoved }) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let response;
      if (imageAsset) {
        const formData = new FormData();
        formData.append('postData', JSON.stringify(postData));
        formData.append('image', { uri: imageAsset.uri, name: 'post-image.jpg', type: 'image/jpeg' });
        // See NewPostScreen for why Content-Type must be overridden for FormData.
        response = await apiClient.patch(API_ENDPOINTS.POSTS.UPDATE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = imageRemoved ? { ...postData, image: null } : postData;
        response = await apiClient.patch(API_ENDPOINTS.POSTS.UPDATE, payload);
      }

      navigation.goBack();
      return response;
    } catch (err) {
      if (err.response?.status === 429) {
        setSubmitError({ type: 'ratelimit', message: err.response.data?.message || t('postingLimitReached') });
      } else if (err.response?.status === 403) {
        setSubmitError({ type: 'generic', message: t('notAuthorizedForPost') });
      } else if (err.response?.status === 400) {
        setSubmitError({ type: 'validation', message: err.response.data?.message || t('errorCreatingPostMessage') });
      } else if (!err.response) {
        setSubmitError({ type: 'network', message: t('networkError') });
      } else {
        setSubmitError({ type: 'generic', message: err.response?.data?.message || t('errorCreatingPostMessage') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('editPost')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.brandPrimary} />
        </View>
      ) : loadError ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, isRTL && styles.textRTL]}>{loadError}</Text>
          <TouchableOpacity onPress={loadPost} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PostForm
          mode="edit"
          initialPost={post}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitButtonLabel={t('saveChanges')}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
};

const createStyles = (tokens, legacy) =>
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
      padding: 24,
    },
    errorText: {
      color: legacy.danger,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: legacy.danger,
    },
    retryButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
  });

export default EditPostScreen;
