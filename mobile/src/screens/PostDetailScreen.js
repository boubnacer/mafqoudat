/**
 * Post Detail Screen
 * Mirrors: client/src/features/posts/PostPage/SinglePost.js (feature parity subset)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import apiClient from '../api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { getCategoryConfig } from '../config/categories';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/translations';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import ReportPostSheet from '../components/ReportPostSheet';
import PromotePostSheet from '../components/PromotePostSheet';
import DataStateView from '../components/DataStateView';

const TOAST_DURATION_MS = 3000;

const STATUS_KEYS = {
  active: 'statusActive',
  resolved: 'statusResolved',
  expired: 'statusExpired',
  suspended: 'statusSuspended',
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

// `contact` is a single free-text field (see contactPreferences backend bug), so the
// contact type is inferred from its shape rather than trusted from contactPreferences.
const getContactAction = (rawContact) => {
  const contact = (rawContact || '').trim();
  if (!contact) return { type: 'none' };

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return { type: 'email', contact };
  }

  const digits = contact.replace(/[^\d]/g, '');
  if (digits.length >= 6) {
    return { type: 'phone', contact, digits };
  }

  return { type: 'unknown', contact };
};

const openLink = (url, t) => {
  Linking.openURL(url).catch(() => {
    Alert.alert(t('error'), t('failedToLoadPost'));
  });
};

const PostDetailScreen = ({ navigation, route }) => {
  const { id } = route.params || {};
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isRTL = currentLanguage === 'ar';

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  const [promoteSheetVisible, setPromoteSheetVisible] = useState(false);
  const [toast, setToast] = useState('');

  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), TOAST_DURATION_MS);
  };

  const loadPost = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setError(t('postNotFound'));
        setIsLoading(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      try {
        const response = await apiClient.get(API_ENDPOINTS.POSTS.GET_BY_ID(id), {
          params: { language: currentLanguage || 'en' },
        });
        setPost(response.data);
      } catch (err) {
        console.error('Error loading post:', err);
        setError(err.response?.status === 404 ? t('postNotFound') : !err.response ? t('networkError') : t('failedToLoadPost'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, currentLanguage]
  );

  useEffect(() => {
    loadPost(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentLanguage]);

  const handleRefresh = () => loadPost(true);

  const renderHeader = (showMenu = false) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>{isRTL ? '›' : '‹'}</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {t('postDetails')}
      </Text>
      {showMenu ? (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.backButton}
          accessibilityLabel={t('moreOptions')}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t('loadingPost')}</Text>
        </View>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <DataStateView
            variant="error"
            message={error || t('postNotFound')}
            actionLabel={t('retry')}
            onAction={() => loadPost(false)}
            isRTL={isRTL}
          />
        </View>
      </View>
    );
  }

  const imageUri = post.image
    ? post.image.startsWith('http')
      ? post.image
      : `${API_BASE_URL}/${post.image}`
    : null;

  const floption = Array.isArray(post.Floptions) && post.Floptions.length > 0 ? post.Floptions[0] : null;
  const foundLostCode = (floption?.code || '').toUpperCase();
  const isFoundType = foundLostCode === 'FOUND';
  const isLostType = foundLostCode === 'LOST';
  const badgeLabel =
    (floption && getLocalizedLabel(floption, currentLanguage)) ||
    (isFoundType ? t('foundItem') : isLostType ? t('lostItem') : t('unknownStatus'));
  const badgeColor = isFoundType ? '#4CAF50' : isLostType ? '#F44336' : '#FF9800';

  const categories = Array.isArray(post.Categories) ? post.Categories : [];

  const cityLabel =
    post.cityName ||
    (typeof post.city === 'string' ? post.city : getLocalizedLabel(post.city, currentLanguage)) ||
    null;

  const description = post.description && post.description.trim() ? post.description.trim() : t('noDescriptionProvided');

  const isResolved = post.returned === true || (!!post.status && post.status !== 'active');
  const statusLabel = post.status && STATUS_KEYS[post.status] ? t(STATUS_KEYS[post.status]) : null;

  const contactAction = getContactAction(post.contact);

  const isOwner = !!user?.id && !!post.user && String(post.user) === String(user.id);
  const canPromote = isOwner && !post.promotionRequested;

  const openReportSheet = () => {
    setMenuVisible(false);
    setReportSheetVisible(true);
  };

  const openPromoteSheet = () => {
    setMenuVisible(false);
    setPromoteSheetVisible(true);
  };

  return (
    <View style={styles.container}>
      {renderHeader(true)}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2196F3']} />}
      >
        {imageUri ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setImageModalVisible(true)}>
            <Image source={{ uri: imageUri }} style={styles.postImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={styles.postImagePlaceholder}>
            <Text style={styles.placeholderText}>{t('noImage')}</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          </View>

          {isResolved && (
            <View style={styles.resolvedBanner}>
              <Text style={styles.resolvedBannerText}>{statusLabel || t('resolvedBanner')}</Text>
            </View>
          )}

          {categories.length > 0 && (
            <View style={styles.chipsRow}>
              {categories.map((cat) => {
                const config = getCategoryConfig(cat.code);
                const label = getLocalizedLabel(cat, currentLanguage);
                return (
                  <View
                    key={cat._id || cat.code}
                    style={[styles.categoryChip, { backgroundColor: config.backgroundColor }]}
                  >
                    <Text style={[styles.categoryChipText, { color: config.color }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('location')}</Text>
            {cityLabel ? <Text style={[styles.bodyText, isRTL && styles.textRTL]}>{cityLabel}</Text> : null}
            {post.exactLocation ? (
              <Text style={[styles.bodyTextSecondary, isRTL && styles.textRTL]}>{post.exactLocation}</Text>
            ) : null}
            {!cityLabel && !post.exactLocation ? (
              <Text style={[styles.bodyTextSecondary, isRTL && styles.textRTL]}>{t('noLocationProvided')}</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{isLostType ? t('exactDateLost') : t('exactDateFound')}</Text>
            <Text style={[styles.bodyText, isRTL && styles.textRTL]}>
              {post.mainDate && String(post.mainDate).trim() ? String(post.mainDate) : t('noDateProvided')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('description')}</Text>
            <Text style={[styles.bodyText, isRTL && styles.textRTL]}>{description}</Text>
          </View>

          <View style={styles.metaRow}>
            {post.createdAt ? (
              <Text style={styles.metaText}>{t('posted', { time: formatRelativeTime(post.createdAt, t) })}</Text>
            ) : null}
            {typeof post.views === 'number' ? (
              <Text style={styles.metaText}>{t('views', { count: post.views })}</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('contactSeller')}</Text>
            {contactAction.type === 'email' && (
              <TouchableOpacity
                style={[styles.contactButton, styles.emailButton]}
                onPress={() => openLink(`mailto:${contactAction.contact}`, t)}
              >
                <Text style={styles.contactButtonText}>{t('email')}</Text>
              </TouchableOpacity>
            )}
            {contactAction.type === 'phone' && (
              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  style={[styles.contactButton, styles.callButton]}
                  onPress={() => openLink(`tel:${contactAction.contact}`, t)}
                >
                  <Text style={styles.contactButtonText}>{t('call')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, styles.whatsappButton]}
                  onPress={() => openLink(`https://wa.me/${contactAction.digits}`, t)}
                >
                  <Text style={styles.contactButtonText}>{t('whatsapp')}</Text>
                </TouchableOpacity>
              </View>
            )}
            {(contactAction.type === 'none' || contactAction.type === 'unknown') && (
              <Text style={[styles.bodyTextSecondary, isRTL && styles.textRTL]}>{t('noContactProvided')}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.fullscreenImage} resizeMode="contain" />
          ) : null}
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setImageModalVisible(false)}>
            <Text style={styles.modalCloseText}>{t('close')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={openReportSheet}>
              <Text style={[styles.menuItemText, isRTL && styles.textRTL]}>{t('reportThisPost')}</Text>
            </TouchableOpacity>
            {canPromote ? (
              <TouchableOpacity style={styles.menuItem} onPress={openPromoteSheet}>
                <Text style={[styles.menuItemText, isRTL && styles.textRTL]}>{t('promoteThisPost')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      <ReportPostSheet
        visible={reportSheetVisible}
        onClose={() => setReportSheetVisible(false)}
        postId={post._id}
        t={t}
        isRTL={isRTL}
        onSubmitted={showToast}
      />

      <PromotePostSheet
        visible={promoteSheetVisible}
        onClose={() => setPromoteSheetVisible(false)}
        postId={post._id}
        t={t}
        isRTL={isRTL}
        onSubmitted={(message) => {
          setPost((prev) => (prev ? { ...prev, promotionRequested: true } : prev));
          showToast(message);
        }}
      />

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
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
  menuButtonText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 32,
  },
  postImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  postImagePlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  body: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resolvedBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resolvedBannerText: {
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginEnd: 8,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  bodyTextSecondary: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  textRTL: {
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  contactButtonsRow: {
    flexDirection: 'row',
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginEnd: 12,
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#2196F3',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  emailButton: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    end: 20,
    padding: 12,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'flex-end',
  },
  menuCard: {
    marginTop: 90,
    marginEnd: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 180,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
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

export default PostDetailScreen;
