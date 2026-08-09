/**
 * Match-alert API calls.
 * Mirrors: client/src/features/notifications/notificationsApiSlice.js
 *
 * Thin wrappers over apiClient so screens never assemble URLs or unwrap
 * `response.data` themselves. Nothing here catches - callers decide what a
 * failure means for their own UI, and apiService's interceptor still handles
 * the auth/maintenance cases centrally.
 *
 * `language` is sent on every read: the server localizes category and city
 * labels itself and returns stable codes (tier, reason) for everything else,
 * so the wording a user sees comes from translations.js on this side.
 */

import apiClient from './apiService';
import { API_ENDPOINTS } from '../config/api';

const { NOTIFICATIONS } = API_ENDPOINTS;

export const fetchNotifications = async ({ page = 1, pageSize = 10, filter = 'all', language = 'en' } = {}) => {
  const response = await apiClient.get(NOTIFICATIONS.LIST, {
    params: { page, pageSize, filter, language },
  });
  return response.data;
};

export const fetchUnreadCount = async () => {
  const response = await apiClient.get(NOTIFICATIONS.UNREAD_COUNT);
  return response.data?.unreadCount || 0;
};

export const markNotificationRead = async (notificationId) => {
  const response = await apiClient.patch(NOTIFICATIONS.MARK_READ(notificationId));
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.patch(NOTIFICATIONS.MARK_ALL_READ);
  return response.data;
};

export const dismissNotification = async (notificationId) => {
  const response = await apiClient.delete(NOTIFICATIONS.DISMISS(notificationId));
  return response.data;
};

export const fetchNotificationPreferences = async () => {
  const response = await apiClient.get(NOTIFICATIONS.PREFERENCES);
  return response.data;
};

export const updateNotificationPreferences = async (preferences) => {
  const response = await apiClient.patch(NOTIFICATIONS.PREFERENCES, preferences);
  return response.data;
};

/**
 * Scored counterparts for one of the caller's own posts. The server rejects
 * this with 403 for anyone but the post's owner, and scores the post on demand
 * (throttled to once every six hours) when its stored pairs are stale - which
 * is what gives posts created before the matching engine existed their leads.
 */
export const fetchMatchesForPost = async (postId, { language = 'en' } = {}) => {
  const response = await apiClient.get(NOTIFICATIONS.MATCHES_FOR_POST(postId), {
    params: { language },
  });
  return response.data?.matches || [];
};

export const fetchMyMatches = async ({ limit = 20, language = 'en' } = {}) => {
  const response = await apiClient.get(NOTIFICATIONS.MATCHES, {
    params: { limit, language },
  });
  return response.data?.matches || [];
};

/** "Not a match" - hides the pair for the caller only, never for the other owner. */
export const dismissMatch = async (matchId) => {
  const response = await apiClient.patch(NOTIFICATIONS.DISMISS_MATCH(matchId));
  return response.data;
};
