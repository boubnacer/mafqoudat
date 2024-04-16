import { createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

const dependenciesAdapter = createEntityAdapter({});

const initialState = dependenciesAdapter.getInitialState();

export const dependencieaApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getflOptions: builder.query({
      query: () => ({
        url: "floptions",
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const loadedlfOptions = responseData.map((flOption) => {
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
      query: () => ({
        url: "countries",
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const loadedCountries = responseData.map((country) => {
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
  }),
});

export const {
  useGetflOptionsQuery,
  useGetCountriesQuery,
  useGetCategoriesQuery,
} = dependencieaApiSlice;
