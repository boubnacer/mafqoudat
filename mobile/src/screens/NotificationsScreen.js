/**
 * Notifications Screen
 * Mirrors: client/src/features/notifications/NotificationsPage.jsx
 *
 * The match-alert inbox: All/Unread tabs, mark-all-read, a collapsible settings
 * panel, and a paged list. Paging uses the same prev/next bar as
 * PostsListScreen rather than infinite scroll, so "unread" stays a stable set
 * while the reader works through it.
 *
 * Requires a session (every /notifications endpoint is behind verifyJWT), so a
 * guest is redirected to Login with a notice, the same self-guard NewPost/
 * MyPosts/Profile use.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import NotificationCard from '../components/notifications/NotificationCard';
import NotificationPreferencesPanel from '../components/notifications/NotificationPreferencesPanel';
import SkeletonBlock from '../components/SkeletonBlock';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '../api/notificationsApi';

const PAGE_SIZE = 10;
const SKELETON_COUNT = 3;

const NotificationsSkeleton = ({ styles, tokens }) => (
  <View>
    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
      <View key={index} style={styles.skeletonCard}>
        <SkeletonBlock tokens={tokens} style={styles.skeletonThumb} />
        <View style={styles.skeletonBody}>
          <SkeletonBlock tokens={tokens} style={styles.skeletonLineWide} />
          <SkeletonBlock tokens={tokens} style={styles.skeletonLineNarrow} />
          <SkeletonBlock tokens={tokens} style={styles.skeletonPill} />
        </View>
      </View>
    ))}
  </View>
);

const NotificationsScreen = ({ navigation }) => {
  const { isSignedIn, setLoginNotice } = useAuth();
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { setUnreadCount, refreshUnreadCount } = useNotifications();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Only the newest request may write state: switching tabs quickly can leave
  // an older page in flight, and letting it land would show the wrong list.
  const requestIdRef = useRef(0);

  // Guest opening this screen is bounced straight to Login with a notice -
  // same self-guard (and same shape) MyPosts/Profile/NewPost use.
  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn) {
        setLoginNotice('loginRequiredNotifications');
        navigation.navigate('Login');
      }
    }, [isSignedIn, navigation, setLoginNotice])
  );

  const load = useCallback(
    async ({ pageNum = 1, nextFilter = filter, isRefresh = false } = {}) => {
      if (!isSignedIn) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setHasError(false);

      try {
        const data = await fetchNotifications({
          page: pageNum,
          pageSize: PAGE_SIZE,
          filter: nextFilter,
          language: currentLanguage,
        });
        if (requestIdRef.current !== requestId) return;

        setNotifications(data?.notifications || []);
        setTotalPages(data?.totalPages || 1);
        setPage(data?.page || pageNum);
        // The list and the badge come from the same server-side pipeline, so
        // adopting the count that arrived with this page keeps the bell exact
        // without waiting for the next poll.
        setUnreadCount(data?.unreadCount || 0);
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        setHasError(true);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [isSignedIn, filter, currentLanguage, setUnreadCount]
  );

  // Reloads whenever the screen regains focus, so acting on a match elsewhere
  // (opening a listing, marking a post returned) is reflected on the way back.
  useFocusEffect(
    useCallback(() => {
      load({ pageNum: 1, nextFilter: filter });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, currentLanguage])
  );

  const handleChangeFilter = (nextFilter) => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
    // Page 1 is the only page guaranteed to exist after the set is re-sliced.
    setPage(1);
  };

  const handleOpen = async (notification) => {
    if (!notification.isRead) {
      // Opening is the read receipt, but reaching the listing matters more:
      // a failed receipt must not block the navigation the user asked for.
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        refreshUnreadCount();
      }
    }
    navigation.navigate('PostDetailScreen', { id: notification.matchedPost.id });
  };

  const handleDismiss = async (notification) => {
    setBusyId(notification.id);
    const previous = notifications;
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    try {
      await dismissNotification(notification.id);
      refreshUnreadCount();
    } catch (error) {
      setNotifications(previous);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      // "Unread" becomes an empty set the moment this succeeds, so that tab has
      // to be re-fetched rather than left showing rows it no longer contains.
      if (filter === 'unread') load({ pageNum: 1, nextFilter: 'unread' });
    } catch (error) {
      refreshUnreadCount();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    load({ pageNum: nextPage, nextFilter: filter });
  };

  const textStyle = isRTL ? styles.textRTL : null;
  const showEmpty = !isLoading && !hasError && notifications.length === 0;

  if (!isSignedIn) return null;

  const listHeader = (
    <View>
      <TouchableOpacity
        style={styles.settingsToggle}
        onPress={() => setShowSettings((current) => !current)}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-outline" size={18} color={tokens.brandPrimary} style={styles.settingsToggleIcon} />
        <Text style={[styles.settingsToggleText, textStyle]}>{t('notifSettingsTitle')}</Text>
        <Ionicons name={showSettings ? 'chevron-up' : 'chevron-down'} size={18} color={`${tokens.ink}99`} />
      </TouchableOpacity>

      {showSettings ? (
        <View style={styles.settingsPanel}>
          <NotificationPreferencesPanel />
        </View>
      ) : null}

      <View style={styles.controlsRow}>
        <View style={styles.tabsRow}>
          {['all', 'unread'].map((value) => {
            const active = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => handleChangeFilter(value)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {value === 'all' ? t('notifTabAll') : t('notifTabUnread')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={isMarkingAll}
          style={styles.markAllButton}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done-outline" size={16} color={tokens.brandPrimary} style={styles.markAllIcon} />
          <Text style={styles.markAllText} numberOfLines={1}>
            {t('notifMarkAllRead')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const listFooter = totalPages > 1 ? (
    <View style={styles.paginationBar}>
      <TouchableOpacity
        style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
        onPress={() => goToPage(page - 1)}
        disabled={page <= 1}
      >
        <Ionicons
          name={isRTL ? 'chevron-forward' : 'chevron-back'}
          size={18}
          color={page <= 1 ? `${tokens.ink}40` : tokens.brandPrimary}
        />
        <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>{t('previous')}</Text>
      </TouchableOpacity>

      <Text style={styles.pageIndicatorText}>
        {t('page')} {page} {t('of')} {totalPages}
      </Text>

      <TouchableOpacity
        style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
        onPress={() => goToPage(page + 1)}
        disabled={page >= totalPages}
      >
        <Text style={[styles.pageButtonText, page >= totalPages && styles.pageButtonTextDisabled]}>{t('next')}</Text>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={18}
          color={page >= totalPages ? `${tokens.ink}40` : tokens.brandPrimary}
        />
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <AppHeader title={t('notifications')} onBack={() => navigation.goBack()} />

      <FlatList
        data={isLoading ? [] : notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onOpen={handleOpen}
            onDismiss={handleDismiss}
            isBusy={busyId === item.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          isLoading ? (
            <NotificationsSkeleton styles={styles} tokens={tokens} />
          ) : hasError ? (
            <View style={styles.stateBlock}>
              <Text style={[styles.stateText, textStyle]}>{t('notifLoadError')}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => load({ pageNum: page, nextFilter: filter })}
                activeOpacity={0.85}
              >
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : showEmpty ? (
            <View style={styles.stateBlock}>
              <Ionicons name="notifications-off-outline" size={40} color={`${tokens.ink}40`} />
              <Text style={[styles.emptyTitle, textStyle]}>
                {filter === 'unread' ? t('notifEmptyUnreadTitle') : t('notifEmptyTitle')}
              </Text>
              <Text style={[styles.stateText, textStyle]}>
                {filter === 'unread' ? t('notifEmptyUnreadDescription') : t('notifEmptyDescription')}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load({ pageNum: page, nextFilter: filter, isRefresh: true })}
            tintColor={tokens.brandPrimary}
            colors={[tokens.brandPrimary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {isMarkingAll ? (
        <View style={styles.blockingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={tokens.brandPrimary} />
        </View>
      ) : null}
    </View>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()), which compensate only when the language's direction
// differs from the one native is already mirroring - see that file. Do NOT
// write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
// cancels out native mirroring once forceRTL has taken effect on relaunch.
const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    settingsToggle: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
    },
    settingsToggleIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    settingsToggleText: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },
    settingsPanel: {
      marginTop: 8,
      padding: 14,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.surfaceRaised,
    },
    controlsRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 12,
      gap: 8,
    },
    tabsRow: {
      flexDirection: row(isRTL),
      backgroundColor: `${tokens.ink}0F`,
      borderRadius: radiusTokens.md,
      padding: 3,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: radiusTokens.sm,
    },
    tabActive: {
      backgroundColor: tokens.brandPrimary,
    },
    tabText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: `${tokens.ink}99`,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    markAllButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      flexShrink: 1,
    },
    markAllIcon: {
      ...logical(isRTL, { marginEnd: 4 }),
    },
    markAllText: {
      flexShrink: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: tokens.brandPrimary,
    },
    stateBlock: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    stateText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 14,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
    },
    paginationBar: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 4,
      paddingVertical: 12,
    },
    pageButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radiusTokens.md,
    },
    pageButtonDisabled: {
      opacity: 0.5,
    },
    pageButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.brandPrimary,
    },
    pageButtonTextDisabled: {
      color: `${tokens.ink}40`,
    },
    pageIndicatorText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: `${tokens.ink}CC`,
    },
    blockingOverlay: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
      padding: 12,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.surfaceRaised,
    },
    skeletonCard: {
      flexDirection: row(isRTL),
      backgroundColor: tokens.surfaceCard,
      borderRadius: radiusTokens.lg,
      padding: 12,
      marginBottom: 10,
    },
    skeletonThumb: {
      width: 76,
      height: 76,
      borderRadius: radiusTokens.md,
    },
    skeletonBody: {
      flex: 1,
      ...logical(isRTL, { marginStart: 12 }),
    },
    skeletonLineWide: {
      height: 14,
      borderRadius: 6,
      marginBottom: 8,
    },
    skeletonLineNarrow: {
      height: 12,
      width: '60%',
      borderRadius: 6,
      marginBottom: 10,
    },
    skeletonPill: {
      height: 20,
      width: 120,
      borderRadius: radiusTokens.sm,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default NotificationsScreen;
