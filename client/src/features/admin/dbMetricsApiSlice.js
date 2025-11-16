import { apiSlice } from '../../app/api/apiSlice';

export const dbMetricsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDbMetrics: builder.query({
      query: () => '/db-metrics/summary',
      providesTags: ['SystemSettings'],
      transformResponse: (response) => response,
    }),
  }),
});

export const { useGetDbMetricsQuery } = dbMetricsApiSlice;


