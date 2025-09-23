import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth",
        method: "POST",
        body: { ...credentials },
      }),
      transformResponse: (response) => {
        // Handle both old and new response formats
        if (response.data) {
          return response.data;
        }
        return response;
      },
      transformErrorResponse: (response) => {
        // Provide better error messages
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: "Invalid username or password" } 
          };
        }
        if (response.status === 401) {
          return { 
            status: 401, 
            data: { message: "Unauthorized access" } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Server error. Please try again later." } 
          };
        }
        return response;
      },
    }),
    sendLogout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(logOut());
          localStorage.setItem('isLoggedIn', 'false');
          setTimeout(() => {
            dispatch(apiSlice.util.resetApiState());
          }, 1000);
        } catch (err) {
          console.log(err);
          // Even if logout fails, clear local state
          dispatch(logOut());
          localStorage.setItem('isLoggedIn', 'false');
        }
      },
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "GET",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { accessToken } = data;
          dispatch(setCredentials({ accessToken }));
          localStorage.setItem('isLoggedIn', 'true');
        } catch (err) {
          // If refresh fails, logout user immediately
          dispatch(logOut());
          localStorage.setItem('isLoggedIn', 'false');
          
          // Dispatch a custom event to notify components of auth failure
          window.dispatchEvent(new CustomEvent('authError', { 
            detail: { error: { status: 401, message: 'Your login has expired.' } } 
          }));
        }
      },
    }),
  }),
});

export const { useLoginMutation, useSendLogoutMutation, useRefreshMutation } =
  authApiSlice;
