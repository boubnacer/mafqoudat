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
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to load post types. Please try again." } 
          };
        }
        return response;
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Dependencies", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Dependencies", id })),
          ];
        } else return [{ type: "Dependencies", id: "LIST" }];
      },
      // Add cache key based on language to ensure proper cache invalidation
      serializeQueryArgs: ({ queryArgs }) => {
        return `${queryArgs.language || 'en'}-${queryArgs.active || true}`;
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
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to load countries. Please try again." } 
          };
        }
        return response;
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Country", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Country", id })),
          ];
        } else return [{ type: "Country", id: "LIST" }];
      },
      // Add cache key based on language to ensure proper cache invalidation
      serializeQueryArgs: ({ queryArgs }) => {
        return `${queryArgs.language || 'en'}-${queryArgs.search || ''}-${queryArgs.active || true}`;
      },
    }),

    getCategories: builder.query({
      query: ({ language = 'en', active = true } = {}) => ({
        url: "categories",
        params: { language, active },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        // Handle both old and new response formats
        const categories = responseData.data || responseData;
        const loadedCategories = categories.map((category) => {
          category.id = category._id;
          return category;
        });
        return dependenciesAdapter.setAll(initialState, loadedCategories);
      },
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to load categories. Please try again." } 
          };
        }
        return response;
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Category", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Category", id })),
          ];
        } else return [{ type: "Category", id: "LIST" }];
      },
      // Add cache key based on language to ensure proper cache invalidation
      serializeQueryArgs: ({ queryArgs }) => {
        return `${queryArgs.language || 'en'}-${queryArgs.active || true}`;
      },
    }),

    // Add mutation for creating a country
    createCountry: builder.mutation({
      query: (country) => ({
        url: "countries",
        method: "POST",
        body: country,
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: "Invalid country data. Please check your input." } 
          };
        }
        if (response.status === 409) {
          return { 
            status: 409, 
            data: { message: "Country already exists." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to create country. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: [{ type: "Country", id: "LIST" }],
    }),

    // Add mutation for creating a category
    createCategory: builder.mutation({
      query: (category) => ({
        url: "dependencies/category",
        method: "POST",
        body: category,
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: "Invalid category data. Please check your input." } 
          };
        }
        if (response.status === 409) {
          return { 
            status: 409, 
            data: { message: "Category already exists." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to create category. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    // Add mutation for creating a foundLost option
    createFoundLost: builder.mutation({
      query: (foundLost) => ({
        url: "dependencies/foundlost",
        method: "POST",
        body: foundLost,
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: "Invalid post type data. Please check your input." } 
          };
        }
        if (response.status === 409) {
          return { 
            status: 409, 
            data: { message: "Post type already exists." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to create post type. Please try again." } 
          };
        }
        return response;
      },
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
