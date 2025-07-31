import { createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

const dependenciesAdapter = createEntityAdapter({});

const initialState = dependenciesAdapter.getInitialState();

export const dependencieaApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getflOptions: builder.query({
      query: ({ language = 'en', active = true } = {}) => ({
        url: "floptions",
        params: { language, active },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        // Handle both old and new response formats
        const flOptions = responseData.data || responseData;
        const loadedlfOptions = flOptions.map((flOption) => {
          flOption.id = flOption._id;
          return flOption;
        });
        return dependenciesAdapter.setAll(initialState, loadedlfOptions);
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Dependencies", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Dependencies", id })),
          ];
        } else return [{ type: "Dependencies", id: "LIST" }];
      },
    }),

    getCountries: builder.query({
      query: ({ language = 'en', search, active = true } = {}) => ({
        url: "countries",
        params: { language, search, active },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        // Handle both old and new response formats
        const countries = responseData.data || responseData;
        const loadedCountries = countries.map((country) => {
          country.id = country._id;
          return country;
        });
        return dependenciesAdapter.setAll(initialState, loadedCountries);
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Country", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Country", id })),
          ];
        } else return [{ type: "Country", id: "LIST" }];
      },
    }),

    getCategories: builder.query({
      query: () => ({
        url: "categories",
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const loadedCategories = responseData.map((category) => {
          category.id = category._id;
          return category;
        });
        return dependenciesAdapter.setAll(initialState, loadedCategories);
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Category", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Category", id })),
          ];
        } else return [{ type: "Category", id: "LIST" }];
      },
    }),

    // Add mutation for creating a country
    createCountry: builder.mutation({
      query: (country) => ({
        url: "countries",
        method: "POST",
        body: country,
      }),
      invalidatesTags: [{ type: "Country", id: "LIST" }],
    }),

    // Add mutation for creating a category
    createCategory: builder.mutation({
      query: (category) => ({
        url: "dependencies/category",
        method: "POST",
        body: category,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    // Add mutation for creating a foundLost option
    createFoundLost: builder.mutation({
      query: (foundLost) => ({
        url: "dependencies/foundlost",
        method: "POST",
        body: foundLost,
      }),
      invalidatesTags: [{ type: "Dependencies", id: "LIST" }],
    }),
  }),
});

export const {
  useGetflOptionsQuery,
  useGetCountriesQuery,
  useGetCategoriesQuery,
  useCreateCountryMutation,
  useCreateCategoryMutation,
  useCreateFoundLostMutation,
} = dependencieaApiSlice;
