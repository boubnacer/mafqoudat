import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

const countriesAdapter = createEntityAdapter({});

const initialState = countriesAdapter.getInitialState();

export const countriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCountries: builder.query({
      query: () => ({
        url: "/countries",
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const loadedCountries = responseData.map((country) => {
          country.id = country._id;
          return country;
        });
        return countriesAdapter.setAll(initialState, loadedCountries);
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
  }),
});

export const { useGetCountriesQuery } = countriesApiSlice;

// export const { useGetCountriesQuery } = countriesApiSlice;

// // returns the query result object
// export const selectCountriesResult =
//   countriesApiSlice.endpoints.getCountries.select();

// // creates memoized selector
// const selectCountriesData = createSelector(
//   selectCountriesResult,
//   (countriesResult) => countriesResult.data // normalized state object with ids & entities
// );

// //getSelectors creates these selectors and we rename them with aliases using destructuring
// export const {
//   selectAll: selectAllCountries,
//   selectById: selectCountryById,
//   selectIds: selectCountryIds,
//   // Pass in a selector that returns the countries slice of state
// } = countriesAdapter.getSelectors(
//   (state) => selectCountriesData(state) ?? initialState
// );
