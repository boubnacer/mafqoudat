import { apiSlice } from '../../app/api/apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get admin dashboard statistics
    getAdminDashboard: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),

    // Get all reports with pagination and filtering
    getReports: builder.query({
      query: ({ page = 1, limit = 10, status, reasonType, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (status) params.append('status', status);
        if (reasonType) params.append('reasonType', reasonType);
        
        return `/admin/reports?${params.toString()}`;
      },
      providesTags: ['Reports'],
    }),

    // Get all promotion requests with pagination and filtering
    getPromotions: builder.query({
      query: ({ page = 1, limit = 10, status, sortBy = 'promotionRequestedAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (status) params.append('status', status);
        
        return `/admin/promotions?${params.toString()}`;
      },
      providesTags: ['Promotions'],
    }),

    // Update report status
    updateReportStatus: builder.mutation({
      query: ({ reportId, status, adminNotes }) => ({
        url: `/admin/reports/${reportId}`,
        method: 'PATCH',
        body: { status, adminNotes },
      }),
      invalidatesTags: ['Reports', 'AdminDashboard'],
    }),

    // Update promotion status
    updatePromotionStatus: builder.mutation({
      query: ({ postId, processed }) => ({
        url: `/admin/promotions/${postId}`,
        method: 'PATCH',
        body: { processed },
      }),
      invalidatesTags: ['Promotions', 'AdminDashboard'],
    }),

    // Delete a post
    deletePostAdmin: builder.mutation({
      query: (postId) => {
        if (!postId) {
          throw new Error('Post ID is required for deletion');
        }
        
        return {
          url: `/admin/posts/${postId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Reports', 'Promotions', 'AdminDashboard'],
    }),

    // Get all password reset requests with pagination and filtering
    getPasswordResetRequests: builder.query({
      query: ({ page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (status) params.append('status', status);
        
        return `/admin/password-reset-requests?${params.toString()}`;
      },
      providesTags: ['PasswordResetRequests'],
    }),

    // Update password reset request status
    updatePasswordResetRequestStatus: builder.mutation({
      query: ({ requestId, status, adminNotes }) => ({
        url: `/admin/password-reset-requests/${requestId}`,
        method: 'PATCH',
        body: { status, adminNotes },
      }),
      invalidatesTags: ['PasswordResetRequests', 'AdminDashboard'],
    }),

    // Get all users with pagination, search, and sorting
    getUsersAdmin: builder.query({
      query: ({ page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (search) params.append('search', search);
        
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ['AdminUsers'],
    }),

    // Get all posts for a specific user with pagination
    getUserPostsAdmin: builder.query({
      query: ({ userId, page = 1, limit = 10 } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        
        return `/admin/users/${userId}/posts?${params.toString()}`;
      },
      providesTags: ['AdminUsers'],
    }),

    // Admin reset user password
    adminResetUserPassword: builder.mutation({
      query: ({ userId, newPassword }) => ({
        url: `/admin/users/${userId}/reset-password`,
        method: 'PATCH',
        body: { newPassword },
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    // Delete a user and all their posts
    deleteUserAdmin: builder.mutation({
      query: (userId) => {
        if (!userId) {
          throw new Error('User ID is required for deletion');
        }
        
        return {
          url: `/admin/users/${userId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['AdminUsers', 'AdminDashboard'],
    }),

    // Get all posts with pagination, search, and filtering
    getAllPostsAdmin: builder.query({
      query: ({ page = 1, limit = 10, search, status, category, country, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (country) params.append('country', country);
        
        return `/admin/posts?${params.toString()}`;
      },
      providesTags: ['AdminPosts'],
    }),

    // Get all contact submissions for admin management
    getContactsAdmin: builder.query({
      query: ({ page = 1, limit = 10, search, status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        
        return `/contact?${params.toString()}`;
      },
      providesTags: ['AdminContacts'],
    }),

    // Get contact statistics
    getContactStats: builder.query({
      query: () => '/contact/stats',
      providesTags: ['ContactStats'],
    }),

    // Update contact status
    updateContactStatus: builder.mutation({
      query: ({ contactId, status, response }) => ({
        url: `/contact/${contactId}`,
        method: 'PATCH',
        body: { status, response },
      }),
      invalidatesTags: ['AdminContacts', 'ContactStats'],
    }),

    // Delete contact submission
    deleteContactAdmin: builder.mutation({
      query: (contactId) => ({
        url: `/contact/${contactId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminContacts', 'ContactStats'],
    }),

    // Get visitor statistics
    getVisitorStats: builder.query({
      query: ({ days = 7 } = {}) => `/admin/visitor-stats?days=${days}&_t=${Date.now()}`,
      providesTags: ['VisitorStats'],
    }),

    // Get cities by country (admin only)
    getCitiesByCountryAdmin: builder.query({
      query: ({ countryId, language = 'en' }) => {
        const params = new URLSearchParams();
        params.append('language', language);
        return `/admin/cities/country/${countryId}?${params.toString()}`;
      },
      providesTags: ['AdminCities'],
    }),

    // Update city (admin only)
    updateCityAdmin: builder.mutation({
      query: ({ cityId, labels, isCapital, isActive }) => ({
        url: `/admin/cities/${cityId}`,
        method: 'PUT',
        body: { labels, isCapital, isActive },
      }),
      invalidatesTags: ['AdminCities'],
    }),

    // Delete city (admin only)
    deleteCityAdmin: builder.mutation({
      query: (cityId) => ({
        url: `/admin/cities/${cityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminCities'],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetReportsQuery,
  useGetPromotionsQuery,
  useUpdateReportStatusMutation,
  useUpdatePromotionStatusMutation,
  useDeletePostAdminMutation,
  useGetPasswordResetRequestsQuery,
  useUpdatePasswordResetRequestStatusMutation,
  useGetUsersAdminQuery,
  useGetUserPostsAdminQuery,
  useAdminResetUserPasswordMutation,
  useDeleteUserAdminMutation,
  useGetAllPostsAdminQuery,
  useGetContactsAdminQuery,
  useGetContactStatsQuery,
  useUpdateContactStatusMutation,
  useDeleteContactAdminMutation,
  useGetVisitorStatsQuery,
  useGetCitiesByCountryAdminQuery,
  useUpdateCityAdminMutation,
  useDeleteCityAdminMutation,
} = adminApiSlice;
