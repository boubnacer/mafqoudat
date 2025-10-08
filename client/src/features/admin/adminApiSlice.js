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
} = adminApiSlice;
