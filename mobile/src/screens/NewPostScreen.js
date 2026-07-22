/**
 * New Post Screen
 * Thin wrapper around the shared PostForm (create mode): owns the header, the
 * submit request (always multipart - POST /posts requires it), and error/nav.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/translations';
import { useTheme } from '../context/ThemeContext';
import { colorTokens } from '../theme/tokens';
import PostForm from '../components/PostForm';
import AppHeader from '../components/AppHeader';
import GuestGate from '../components/GuestGate';

const NewPostScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens), [tokens]);

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
      // Land on the new post's detail with Home as the underlying tab, so
      // back from the detail screen returns to Home rather than to this
      // now-submitted form. NewPost, Home and PostDetailScreen are all tabs
      // of the same Tab.Navigator (MainTabs), so navigating there directly
      // (rather than reset()-ing a parent that doesn't own PostDetailScreen
      // as a top-level route) moves Home to the front of the "history"
      // backBehavior order before landing on PostDetailScreen.
      navigation.navigate('Home');
      navigation.navigate('PostDetailScreen', { id: postId });
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

  if (!isSignedIn) {
    return <GuestGate title={t('createNewPost')} />;
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('createNewPost')} />

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

const createStyles = (tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
  });

export default NewPostScreen;
