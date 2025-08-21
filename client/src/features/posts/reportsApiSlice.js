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
    }),
  }),
});

export const { useSubmitReportMutation } = reportsApiSlice;
