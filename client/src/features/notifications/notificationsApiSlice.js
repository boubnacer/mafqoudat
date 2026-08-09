import { apiSlice } from "../../app/api/apiSlice";

/**
 * Endpoints for in-app notifications and the lost/found match pairs behind
 * them. Everything here is authenticated; the server scopes each query to the
 * signed-in user, so nothing needs a user id in the arguments.
 *
 * Cache tags:
 *  - "Notification"            the inbox list and the unread badge
 *  - "PostMatch"               the match panels (per post and account-wide)
 *  - "NotificationPreferences" the settings form
 *
 * Acting on a match invalidates both Notification and PostMatch, because
 * dismissing a pair also clears the notification that pointed at it.
 */
export const notificationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, pageSize = 10, filter = 'all', language = 'en' } = {}) => ({
        url: "/notifications",
        method: "GET",
        params: { page, pageSize, filter, language },
      }),
      providesTags: ["Notification"],
      serializeQueryArgs: ({ queryArgs }) =>
        `${queryArgs?.page || 1}-${queryArgs?.pageSize || 10}-${queryArgs?.filter || 'all'}-${queryArgs?.language || 'en'}`,
    }),

    // Polled by the navbar bell. Kept as its own tiny endpoint so the badge
    // never has to pull (and re-render) the whole inbox.
    getUnreadNotificationCount: builder.query({
      query: () => ({ url: "/notifications/unread-count", method: "GET" }),
      providesTags: ["Notification"],
    }),

    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),

    dismissNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),

    getMatchesForPost: builder.query({
      query: ({ postId, language = 'en' }) => ({
        url: `/notifications/matches/post/${postId}`,
        method: "GET",
        params: { language },
      }),
      providesTags: ["PostMatch"],
      serializeQueryArgs: ({ queryArgs }) =>
        `${queryArgs?.postId || ''}-${queryArgs?.language || 'en'}`,
    }),

    getMyMatches: builder.query({
      query: ({ limit = 20, language = 'en' } = {}) => ({
        url: "/notifications/matches",
        method: "GET",
        params: { limit, language },
      }),
      providesTags: ["PostMatch"],
      serializeQueryArgs: ({ queryArgs }) =>
        `${queryArgs?.limit || 20}-${queryArgs?.language || 'en'}`,
    }),

    dismissMatch: builder.mutation({
      query: (matchId) => ({
        url: `/notifications/matches/${matchId}/dismiss`,
        method: "PATCH",
      }),
      invalidatesTags: ["PostMatch", "Notification"],
    }),

    getNotificationPreferences: builder.query({
      query: () => ({ url: "/notifications/preferences", method: "GET" }),
      providesTags: ["NotificationPreferences"],
    }),

    updateNotificationPreferences: builder.mutation({
      query: (preferences) => ({
        url: "/notifications/preferences",
        method: "PATCH",
        body: preferences,
      }),
      // The preference payload comes back on the response, so the form updates
      // from the server's own value rather than the optimistic local one.
      invalidatesTags: ["NotificationPreferences", "Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDismissNotificationMutation,
  useGetMatchesForPostQuery,
  useGetMyMatchesQuery,
  useDismissMatchMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApiSlice;
