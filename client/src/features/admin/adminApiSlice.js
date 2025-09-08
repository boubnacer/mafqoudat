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
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetReportsQuery,
  useGetPromotionsQuery,
  useUpdateReportStatusMutation,
  useUpdatePromotionStatusMutation,
} = adminApiSlice;
