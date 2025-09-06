import { apiSlice } from "../../app/api/apiSlice";

export const reportsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitReport: builder.mutation({
      query: (reportData) => ({
        url: "/posts/report",
        method: "POST",
        body: reportData,
      }),
      invalidatesTags: ["Post"],
      // Add timeout configuration
      timeout: 30000, // 30 seconds timeout
    }),
  }),
});

export const { useSubmitReportMutation } = reportsApiSlice;
