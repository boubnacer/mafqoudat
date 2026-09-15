import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";
// getCountries itself is defined in dependenciesApiSlice.js now, not here -
// see the side-effect import + re-export below for why.
import { useGetCountriesQuery } from "../dependencies/dependenciesApiSlice";

const countriesAdapter = createEntityAdapter({});

const initialState = countriesAdapter.getInitialState();

export const countriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchCountries: builder.query({
      query: ({ q, language = 'en', limit = 10 } = {}) => ({
        url: "/countries/search",
        params: { q, language, limit },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const countries = responseData.data || responseData;
        const loadedCountries = countries.map((country) => {
          country.id = country._id;
          return country;
        });
        return countriesAdapter.setAll(initialState, loadedCountries);
      },
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Search query must be at least 2 characters long." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to search countries. Please try again." } 
          };
        }
        return response;
      },
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Country", id: "SEARCH" },
            ...result.ids.map((id) => ({ type: "Country", id })),
          ];
        } else return [{ type: "Country", id: "SEARCH" }];
      },
    }),
  }),
});

export const { useSearchCountriesQuery } = countriesApiSlice;

// Re-exported, not redefined: this file and dependenciesApiSlice.js each used
// to call apiSlice.injectEndpoints() with their own "getCountries" builder -
// two separate query/transformResponse/providesTags definitions racing to
// register the same endpoint name on the one shared `apiSlice` instance.
// RTK Query has no notion of a per-module namespace for that; injectEndpoints
// just merges definitions into apiSlice.endpoints, so whichever module's JS
// happened to evaluate last silently won for *every* caller, including the
// ones that imported the hook from here expecting this file's (simpler, no
// retry/nocache) version. dependenciesApiSlice.js's is the one every other
// caller already uses (it also supports `nocache`), so it's now the only
// definition, and the side-effect import above guarantees it is registered
// before the selector below reads it.
export { useGetCountriesQuery };

// returns the query result object
export const selectCountriesResult =
  apiSlice.endpoints.getCountries.select();

// creates memoized selector
const selectCountriesData = createSelector(
  selectCountriesResult,
  (countriesResult) => countriesResult.data // normalized state object with ids & entities
);

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
  selectAll: selectAllCountries,
  selectById: selectCountryById,
  selectIds: selectCountryIds,
  // Pass in a selector that returns the countries slice of state
} = countriesAdapter.getSelectors(
  (state) => selectCountriesData(state) ?? initialState
);
