/**
 * New Post Screen
 * Thin wrapper around the shared PostForm (create mode): owns the header, the
 * submit request (always multipart - POST /posts requires it), and error/nav.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useReferenceData } from '../context/ReferenceDataContext';
import { useTranslation } from '../utils/translations';
import { useTheme } from '../context/ThemeContext';
import { colorTokens } from '../theme/tokens';
import PostForm from '../components/PostForm';
import AppHeader from '../components/AppHeader';
import ConfirmExitModal from '../components/ConfirmExitModal';

const NewPostScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSignedIn, requireLogin } = useAuth();
  const { floptions } = useReferenceData();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  // Mirrors web's NewPostForm.js getDefaultFoundLost(): Home's Report Lost /
  // Report Found quick actions hand off an `initialType` param the way
  // web's `?type=lost|found` query param does, resolved here to the
  // matching floption id and fed into PostForm through its existing
  // initialPost mechanism - no new prop needed.
  const initialType = route?.params?.initialType;
  const initialFoundLostId = useMemo(() => {
    if (initialType !== 'lost' && initialType !== 'found') return null;
    const code = initialType === 'found' ? 'FOUND' : 'LOST';
    const match = floptions.find((fl) => fl.code === code);
    return match?._id || null;
  }, [initialType, floptions]);
  const initialPost = initialFoundLostId ? { foundLost: initialFoundLostId } : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const pendingActionRef = useRef(null);
  const isSubmittedRef = useRef(false);

  // Intercept back navigation (hardware back button, swipe gesture, or AppHeader back button)
  // when the user has started filling the form.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isSubmittedRef.current || !isFormDirty) {
        return;
      }

      e.preventDefault();
      pendingActionRef.current = e.data.action;
      setShowExitDialog(true);
    });

    return unsubscribe;
  }, [navigation, isFormDirty]);

  const handleConfirmExit = () => {
    setShowExitDialog(false);
    isSubmittedRef.current = true;
    if (pendingActionRef.current) {
      navigation.dispatch(pendingActionRef.current);
    } else {
      navigation.goBack();
    }
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
    pendingActionRef.current = null;
  };

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
      isSubmittedRef.current = true;
      // Land on the new post's detail with Home underneath it, so back from
      // the detail screen returns to Home rather than to this now-submitted
      // form. NewPost, Home and PostDetailScreen are all screens on the same
      // stack, so navigating to Home first pops back to that existing screen
      // instead of pushing a duplicate, then PostDetailScreen pushes on top.
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

  // Guest tapping the New Post tab is bounced straight to Login (mirrors
  // client's ProtectedRoute) instead of showing an inline gate.
  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn) {
        requireLogin('loginRequiredCreatePost', { screen: 'NewPost' });
        navigation.navigate('Login');
      }
    }, [isSignedIn, navigation, requireLogin])
  );

  if (!isSignedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('createNewPost')} onBack={() => navigation.goBack()} />

      <PostForm
        mode="create"
        initialPost={initialPost}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitButtonLabel={t('publishPost')}
        onSubmit={handleSubmit}
        onDirtyChange={setIsFormDirty}
      />

      <ConfirmExitModal
        visible={showExitDialog}
        onConfirmExit={handleConfirmExit}
        onCancelExit={handleCancelExit}
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
