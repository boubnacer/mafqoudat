/**
 * New Post Screen
 * Thin wrapper around the shared PostForm (create mode): owns the header, the
 * submit request (always multipart - POST /posts requires it), and error/nav.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import PostForm from '../components/PostForm';

const NewPostScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async ({ postData, imageAsset }) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('postData', JSON.stringify(postData));
      if (imageAsset) {
        formData.append('image', { uri: imageAsset.uri, name: 'post-image.jpg', type: 'image/jpeg' });
      }

      // apiClient defaults to Content-Type: application/json; FormData needs the
      // multipart boundary the RN networking layer generates when it sees this
      // exact content-type family, so this one request must override it (no
      // boundary is set manually here - the runtime fills in the real one).
      const response = await apiClient.post(API_ENDPOINTS.POSTS.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const postId = response.data?.postId;
      navigation.replace('PostDetailScreen', { id: postId });
    } catch (err) {
      if (err.response?.status === 429) {
        setSubmitError({ type: 'ratelimit', message: err.response.data?.message || t('postingLimitReached') });
      } else if (err.response?.status === 400) {
        const missing = err.response.data?.missing;
        setSubmitError({
          type: 'validation',
          message: missing?.length
            ? `${t('pleaseCompleteRequiredFields')}: ${missing.join(', ')}`
            : t('errorCreatingPostMessage'),
        });
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]} numberOfLines={1}>
          {t('createNewPost')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <PostForm
        mode="create"
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitButtonLabel={t('publishPost')}
        onSubmit={handleSubmit}
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
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default NewPostScreen;
