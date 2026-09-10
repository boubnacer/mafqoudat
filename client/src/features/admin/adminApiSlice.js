import { apiSlice } from '../../app/api/apiSlice';

/**
 * Every /admin/* endpoint the panel talks to.
 *
 * Two things here are load-bearing and were previously wrong:
 *
 * The tag names all begin with `Admin` and are declared in apiSlice's
 * `tagTypes`. They were not, and an undeclared tag makes RTK Query discard the
 * whole invalidation - so approving a report, deleting a user or suspending a
 * listing all succeeded on the server and left the table showing the old row.
 *
 * And the list endpoints are the panel's own; a page that is not open must not
 * be fetching. Each page passes `skip` from its own route, so opening the panel
 * costs one request (the overview) rather than the fourteen it used to fire on
 * mount regardless of which tab was showing.
 */

const buildQuery = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ------------------------------------------------------------ insights */

    getAdminOverview: builder.query({
      query: () => '/admin/overview',
      providesTags: ['AdminOverview'],
    }),

    getAdminAnalytics: builder.query({
      query: ({ days = 30 } = {}) => `/admin/analytics${buildQuery({ days })}`,
      providesTags: (result, error, arg) => [
        { type: 'AdminAnalytics', id: arg?.days || 30 },
      ],
    }),

    getAdminAudit: builder.query({
      query: ({ page = 1, limit = 20, action, targetType } = {}) =>
        `/admin/audit${buildQuery({ page, limit, action, targetType })}`,
      providesTags: ['AdminAudit'],
    }),

    /* ---------------------------------------------------------- moderation */

    getReports: builder.query({
      query: ({ page = 1, limit = 10, status, reasonType, target, sortBy = 'createdAt', sortOrder = 'desc' } = {}) =>
        `/admin/reports${buildQuery({ page, limit, status, reasonType, target, sortBy, sortOrder })}`,
      providesTags: ['AdminReports'],
    }),

    updateReportStatus: builder.mutation({
      query: ({ reportId, status, adminNotes }) => ({
        url: `/admin/reports/${reportId}`,
        method: 'PATCH',
        body: { status, adminNotes },
      }),
      invalidatesTags: ['AdminReports', 'AdminOverview', 'AdminAudit'],
    }),

    getAdminComments: builder.query({
      query: ({ page = 1, limit = 20, status, search } = {}) =>
        `/admin/comments${buildQuery({ page, limit, status, search })}`,
      providesTags: ['AdminComments'],
    }),

    updateCommentAdmin: builder.mutation({
      query: ({ commentId, status }) => ({
        url: `/admin/comments/${commentId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminComments', 'AdminReports', 'AdminOverview', 'AdminAudit'],
    }),

    /* --------------------------------------------------------------- posts */

    getAllPostsAdmin: builder.query({
      query: ({ page = 1, limit = 10, search, status, category, country, sortBy = 'createdAt', sortOrder = 'desc' } = {}) =>
        `/admin/posts${buildQuery({ page, limit, search, status, category, country, sortBy, sortOrder })}`,
      providesTags: ['AdminPosts'],
    }),

    updatePostStatusAdmin: builder.mutation({
      query: ({ postId, status }) => ({
        url: `/admin/posts/${postId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminPosts', 'AdminOverview', 'AdminReports', 'AdminAudit'],
    }),

    deletePostAdmin: builder.mutation({
      query: (postId) => {
        if (!postId) throw new Error('Post ID is required for deletion');
        return { url: `/admin/posts/${postId}`, method: 'DELETE' };
      },
      invalidatesTags: [
        'AdminPosts',
        'AdminReports',
        'AdminPromotions',
        'AdminComments',
        'AdminOverview',
        'AdminAudit',
      ],
    }),

    getPromotions: builder.query({
      query: ({ page = 1, limit = 10, status, sortBy = 'promotionRequestedAt', sortOrder = 'desc' } = {}) =>
        `/admin/promotions${buildQuery({ page, limit, status, sortBy, sortOrder })}`,
      providesTags: ['AdminPromotions'],
    }),

    updatePromotionStatus: builder.mutation({
      query: ({ postId, processed }) => ({
        url: `/admin/promotions/${postId}`,
        method: 'PATCH',
        body: { processed },
      }),
      invalidatesTags: ['AdminPromotions', 'AdminOverview', 'AdminAudit'],
    }),

    /* --------------------------------------------------------------- users */

    getUsersAdmin: builder.query({
      query: ({ page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = {}) =>
        `/admin/users${buildQuery({ page, limit, search, sortBy, sortOrder })}`,
      providesTags: ['AdminUsers'],
    }),

    getUserPostsAdmin: builder.query({
      query: ({ userId, page = 1, limit = 10 } = {}) =>
        `/admin/users/${userId}/posts${buildQuery({ page, limit })}`,
      providesTags: ['AdminUsers'],
    }),

    updateUserAdmin: builder.mutation({
      query: ({ userId, isActive, role }) => ({
        url: `/admin/users/${userId}`,
        method: 'PATCH',
        body: { isActive, role },
      }),
      invalidatesTags: ['AdminUsers', 'AdminOverview', 'AdminAudit'],
    }),

    adminResetUserPassword: builder.mutation({
      query: ({ userId, newPassword }) => ({
        url: `/admin/users/${userId}/reset-password`,
        method: 'PATCH',
        body: { newPassword },
      }),
      invalidatesTags: ['AdminUsers', 'AdminAudit'],
    }),

    deleteUserAdmin: builder.mutation({
      query: (userId) => {
        if (!userId) throw new Error('User ID is required for deletion');
        return { url: `/admin/users/${userId}`, method: 'DELETE' };
      },
      invalidatesTags: ['AdminUsers', 'AdminPosts', 'AdminOverview', 'AdminAudit'],
    }),

    /* ------------------------------------------------------------- support */

    getPasswordResetRequests: builder.query({
      query: ({ page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = {}) =>
        `/admin/password-reset-requests${buildQuery({ page, limit, status, sortBy, sortOrder })}`,
      providesTags: ['AdminResetRequests'],
    }),

    updatePasswordResetRequestStatus: builder.mutation({
      query: ({ requestId, status, adminNotes }) => ({
        url: `/admin/password-reset-requests/${requestId}`,
        method: 'PATCH',
        body: { status, adminNotes },
      }),
      invalidatesTags: ['AdminResetRequests', 'AdminOverview', 'AdminAudit'],
    }),

    getContactsAdmin: builder.query({
      query: ({ page = 1, limit = 10, search, status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = {}) =>
        `/contact${buildQuery({ page, limit, search, status, priority, sortBy, sortOrder })}`,
      providesTags: ['AdminContacts'],
    }),

    getContactStats: builder.query({
      query: () => '/contact/stats',
      providesTags: ['AdminContactStats'],
    }),

    updateContactStatus: builder.mutation({
      query: ({ contactId, status, response }) => ({
        url: `/contact/${contactId}`,
        method: 'PATCH',
        body: { status, response },
      }),
      invalidatesTags: ['AdminContacts', 'AdminContactStats', 'AdminOverview'],
    }),

    deleteContactAdmin: builder.mutation({
      query: (contactId) => ({ url: `/contact/${contactId}`, method: 'DELETE' }),
      invalidatesTags: ['AdminContacts', 'AdminContactStats', 'AdminOverview'],
    }),

    /* -------------------------------------------------------------- places */

    // Visitor counts are read by GET /admin/analytics, which windows them
    // honestly; /admin/visitor-stats is still served but nothing here asks for
    // it - its three numbers were the old panel's whole analytics offering.

    getCitiesByCountryAdmin: builder.query({
      query: ({ countryId, language = 'en' }) =>
        // `active=false` asks for every city, inactive ones included - the
        // panel is the only screen that should see the ones the public
        // pickers hide.
        `/admin/cities/country/${countryId}${buildQuery({ language, active: 'false' })}`,
      providesTags: ['AdminCities'],
    }),

    updateCityAdmin: builder.mutation({
      query: ({ cityId, labels, isCapital, isActive }) => ({
        url: `/admin/cities/${cityId}`,
        method: 'PUT',
        body: { labels, isCapital, isActive },
      }),
      invalidatesTags: ['AdminCities'],
    }),

    deleteCityAdmin: builder.mutation({
      query: (cityId) => ({ url: `/admin/cities/${cityId}`, method: 'DELETE' }),
      invalidatesTags: ['AdminCities'],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminAuditQuery,
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useGetAdminCommentsQuery,
  useUpdateCommentAdminMutation,
  useGetAllPostsAdminQuery,
  useUpdatePostStatusAdminMutation,
  useDeletePostAdminMutation,
  useGetPromotionsQuery,
  useUpdatePromotionStatusMutation,
  useGetUsersAdminQuery,
  useGetUserPostsAdminQuery,
  useUpdateUserAdminMutation,
  useAdminResetUserPasswordMutation,
  useDeleteUserAdminMutation,
  useGetPasswordResetRequestsQuery,
  useUpdatePasswordResetRequestStatusMutation,
  useGetContactsAdminQuery,
  useGetContactStatsQuery,
  useUpdateContactStatusMutation,
  useDeleteContactAdminMutation,
  useGetCitiesByCountryAdminQuery,
  useUpdateCityAdminMutation,
  useDeleteCityAdminMutation,
} = adminApiSlice;
