import { apiSlice } from "../../app/api/apiSlice";

export const externalSearchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchExternal: builder.query({
      query: ({ q, countryCode, language = "en", limit = 6 } = {}) => ({
        url: "/external-search",
        params: {
          q,
          ...(countryCode && { countryCode }),
          language,
          limit,
        },
      }),
      transformResponse: (response) => {
        return response.data || response;
      },
      keepUnusedDataFor: 3600, // 1 hour - matches the backend's own cache TTL
      providesTags: [{ type: "ExternalSearch", id: "LIST" }],
    }),
  }),
});

export const { useLazySearchExternalQuery } = externalSearchApiSlice;
