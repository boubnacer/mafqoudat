import { apiSlice } from "../../app/api/apiSlice";

export const reportsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitReport: builder.mutation({
      query: (reportData) => {
        console.log('reportsApiSlice - Submitting report data:', reportData);
        return {
          url: "/posts/report",
          method: "POST",
          body: reportData,
        };
      },
      invalidatesTags: ["Post"],
      // Add timeout configuration
      timeout: 30000, // 30 seconds timeout
      // Add transform response to debug
      transformResponse: (response, meta, arg) => {
        console.log('reportsApiSlice - Raw response received:', response);
        console.log('reportsApiSlice - Response meta:', meta);
        return response;
      },
      // Add transform error response to debug
      transformErrorResponse: (response, meta, arg) => {
        console.log('reportsApiSlice - Error response received:', response);
        console.log('reportsApiSlice - Error meta:', meta);
        return response;
      },
    }),
  }),
});

export const { useSubmitReportMutation } = reportsApiSlice;
