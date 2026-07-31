/**
 * Post Detail Screen
 * Mirrors: client/src/features/posts/PostPage/SinglePost.js (feature parity subset)
 * Visual language matches HomeScreen.js/AppHeader.js's colorTokens-based
 * styling (surfaceRaised cards, brandPrimary accents, status.found/lost
 * tones) rather than the screen's original ad-hoc blue/grey palette.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { getCategoryConfig } from '../config/categories';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies, lightColors, darkColors } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import ReportPostSheet from '../components/ReportPostSheet';
import PromotePostSheet from '../components/PromotePostSheet';
import DataStateView from '../components/DataStateView';
import SkeletonBlock from '../components/SkeletonBlock';
import { useStaggeredFadeIn } from '../hooks/useStaggeredFadeIn';

const TOAST_DURATION_MS = 3000;
const SECTION_COUNT = 2;

// Shaped like the real image + body block below (badge, resolved banner slot,
// category chips, the location/date/description/contact sections).
const PostDetailSkeleton = ({ styles, tokens }) => (
  <View>
    <SkeletonBlock tokens={tokens} style={styles.postImageSkeleton} />
    <View style={styles.body}>
      <SkeletonBlock tokens={tokens} style={styles.badgeSkeleton} />
      <View style={styles.chipsRowSkeleton}>
        <SkeletonBlock tokens={tokens} style={styles.chipSkeleton} />
        <SkeletonBlock tokens={tokens} style={styles.chipSkeleton} />
      </View>
      {[
        { labelWidth: 60, lines: 1 },
        { labelWidth: 90, lines: 1 },
        { labelWidth: 80, lines: 3 },
      ].map((section, i) => (
        <View key={i} style={styles.section}>
          <SkeletonBlock tokens={tokens} style={[styles.sectionLabelSkeleton, { width: section.labelWidth }]} />
          {Array.from({ length: section.lines }).map((_, j) => (
            <SkeletonBlock
              key={j}
              tokens={tokens}
              style={[styles.sectionBodyLineSkeleton, j === section.lines - 1 && styles.sectionBodyLineLastSkeleton]}
            />
          ))}
        </View>
      ))}
      <SkeletonBlock tokens={tokens} style={styles.contactButtonSkeleton} />
    </View>
  </View>
);

const STATUS_KEYS = {
  active: 'statusActive',
  resolved: 'statusResolved',
  expired: 'statusExpired',
  suspended: 'statusSuspended',
};

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow
// strings) as RN shadow/elevation props - same values HomeScreen.js/
// PostsListScreen.js use for their surfaceRaised cards.
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
  const { user, setLoginNotice } = useAuth();
  const { isDark } = useTheme();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const legacyColors = isDark ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  const [promoteSheetVisible, setPromoteSheetVisible] = useState(false);
  const [toast, setToast] = useState('');

  const toastTimerRef = useRef(null);

  const getSectionStyle = useStaggeredFadeIn(SECTION_COUNT, !isLoading);

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('postDetails')} showMenu={false} onBack={() => navigation.goBack()} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <PostDetailSkeleton styles={styles} tokens={tokens} />
        </ScrollView>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('postDetails')} showMenu={false} onBack={() => navigation.goBack()} />
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
  const badgeTone = isFoundType
    ? tokens.status.found
    : isLostType
    ? tokens.status.lost
    : { main: legacyColors.warning, bg: legacyColors.warningBackground };

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
    if (!user) {
      setLoginNotice('loginRequiredReportPost');
      navigation.navigate('Login');
      return;
    }
    setReportSheetVisible(true);
  };

  const openPromoteSheet = () => {
    setPromoteSheetVisible(true);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('postDetails')} showMenu={false} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[tokens.brandPrimary]}
            tintColor={tokens.brandPrimary}
          />
        }
      >
        <Animated.View style={getSectionStyle(0)}>
          {imageUri ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setImageModalVisible(true)}>
              <Image source={{ uri: imageUri }} style={styles.postImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={styles.postImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={`${tokens.ink}40`} />
              <Text style={styles.placeholderText}>{t('noImage')}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.body, getSectionStyle(1)]}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: badgeTone.main }]}>
              <Ionicons
                name={isFoundType ? 'checkmark-circle' : isLostType ? 'search' : 'help-circle'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          </View>

          {isResolved && (
            <View style={[styles.resolvedBanner, { backgroundColor: tokens.status.found.bg }]}>
              <Ionicons name="ribbon-outline" size={16} color={tokens.status.found.main} />
              <Text style={[styles.resolvedBannerText, { color: tokens.status.found.main }]}>
                {statusLabel || t('resolvedBanner')}
              </Text>
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
                    <Ionicons name={config.icon} size={13} color={config.color} style={styles.categoryChipIcon} />
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
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={`${tokens.ink}80`} />
                <Text style={styles.metaText}>{t('posted', { time: formatRelativeTime(post.createdAt, t) })}</Text>
              </View>
            ) : null}
            {typeof post.views === 'number' ? (
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={14} color={`${tokens.ink}80`} />
                <Text style={styles.metaText}>{t('views', { count: post.views })}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('contactSeller')}</Text>
            {contactAction.type === 'email' && (
              <TouchableOpacity
                style={[styles.contactButton, styles.brandButton]}
                onPress={() => openLink(`mailto:${contactAction.contact}`, t)}
                activeOpacity={0.85}
              >
                <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>{t('email')}</Text>
              </TouchableOpacity>
            )}
            {contactAction.type === 'phone' && (
              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  style={[styles.contactButton, styles.brandButton]}
                  onPress={() => openLink(`tel:${contactAction.contact}`, t)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>{t('call')}</Text>
                </TouchableOpacity>
                {/* #25D366 is WhatsApp's own brand color, kept literal rather than
                    tokenized since it identifies the service, not this app's theme. */}
                <TouchableOpacity
                  style={[styles.contactButton, styles.whatsappButton]}
                  onPress={() => openLink(`https://wa.me/${contactAction.digits}`, t)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>{t('whatsapp')}</Text>
                </TouchableOpacity>
              </View>
            )}
            {(contactAction.type === 'none' || contactAction.type === 'unknown') && (
              <Text style={[styles.bodyTextSecondary, isRTL && styles.textRTL]}>{t('noContactProvided')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.contactButtonsRow}>
              <TouchableOpacity
                style={[styles.contactButton, styles.reportButton]}
                onPress={openReportSheet}
                activeOpacity={0.85}
              >
                <Ionicons name="flag-outline" size={16} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>{t('reportThisPost')}</Text>
              </TouchableOpacity>
              {canPromote ? (
                <TouchableOpacity
                  style={[styles.contactButton, styles.brandButton]}
                  onPress={openPromoteSheet}
                  activeOpacity={0.85}
                >
                  <Ionicons name="megaphone-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>{t('promoteThisPost')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Animated.View>
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
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
            accessibilityLabel={t('close')}
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
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

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      paddingBottom: 32,
    },
    postImage: {
      width: '100%',
      height: 300,
      backgroundColor: tokens.surfaceBase,
    },
    postImagePlaceholder: {
      width: '100%',
      height: 300,
      backgroundColor: tokens.surfaceBase,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    placeholderText: {
      fontFamily: fontFamilies.body,
      color: `${tokens.ink}66`,
      fontSize: 13,
    },
    body: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      marginTop: -24,
      paddingTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 8,
      ...getElevation(isDark, 2),
    },
    badgeRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    // Manually driven by isRTL rather than left to RN's native auto-mirror:
    // forceRTL only takes visual effect after a real app restart (see
    // LanguageContext), so a live language switch needs icon+label order to
    // flip immediately. `gap` (not marginEnd) handles the spacing either way.
    badge: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radiusTokens.sm,
    },
    badgeText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      textTransform: 'uppercase',
    },
    resolvedBanner: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: radiusTokens.md,
      paddingVertical: 12,
      marginBottom: 14,
    },
    resolvedBannerText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      textAlign: 'center',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    categoryChip: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radiusTokens.sm,
      marginEnd: 8,
      marginBottom: 8,
    },
    // Gap between the chip's own icon and label, so it needs to flip with
    // categoryChip's manual reversal above - marginEnd resolves just as
    // statically as flexDirection does (see comment on `badge` above).
    categoryChipIcon: {
      marginRight: isRTL ? 0 : 5,
      marginLeft: isRTL ? 5 : 0,
    },
    categoryChipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
    },
    section: {
      marginTop: 16,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: `${tokens.ink}99`,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    bodyText: {
      fontFamily: fontFamilies.body,
      fontSize: 16,
      color: tokens.ink,
      lineHeight: 22,
    },
    bodyTextSecondary: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      marginTop: 2,
    },
    textRTL: {
      textAlign: 'right',
    },
    metaRow: {
      flexDirection: 'row',
      gap: 18,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    metaItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}80`,
    },
    contactButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    contactButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: radiusTokens.md,
      marginTop: 4,
    },
    brandButton: {
      backgroundColor: tokens.brandPrimary,
    },
    whatsappButton: {
      backgroundColor: '#25D366',
    },
    reportButton: {
      backgroundColor: tokens.status.lost.main,
    },
    contactButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
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
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toast: {
      position: 'absolute',
      bottom: 24,
      start: 24,
      end: 24,
      backgroundColor: `${tokens.ink}E6`,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    toastText: {
      // Contrast text for the toast chip - inverse of `ink` the same way
      // HomeScreen's statusTagText/dateBadgeText use literal contrast colors
      // over a solid-fill background rather than a themed token.
      color: isDark ? '#0B1220' : '#FFFFFF',
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      textAlign: 'center',
    },

    // Initial-load skeleton - mirrors the image + body block above (badge,
    // category chips, location/date/description/contact sections). Visible
    // immediately (see useStaggeredFadeIn); the real content fades/slides in
    // once loading finishes.
    postImageSkeleton: {
      width: '100%',
      height: 300,
      borderRadius: 0,
    },
    badgeSkeleton: {
      width: 100,
      height: 27,
      marginBottom: 14,
    },
    chipsRowSkeleton: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    chipSkeleton: {
      width: 74,
      height: 24,
    },
    sectionLabelSkeleton: {
      height: 12,
      marginBottom: 8,
    },
    sectionBodyLineSkeleton: {
      height: 16,
      width: '80%',
      marginBottom: 6,
    },
    sectionBodyLineLastSkeleton: {
      width: '45%',
      marginBottom: 0,
    },
    contactButtonSkeleton: {
      height: 46,
      width: '50%',
      borderRadius: radiusTokens.md,
      marginTop: 16,
    },
  });

export default PostDetailScreen;
