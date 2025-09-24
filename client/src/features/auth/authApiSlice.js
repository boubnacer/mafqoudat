import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";
import { authStorage } from "../../utils/authStorage";
import { performLogout } from "../../utils/logoutUtils";

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
          setTimeout(() => {
            dispatch(apiSlice.util.resetApiState());
          }, 1000);
        } catch (err) {
          // Use the robust logout utility for fallback
          console.warn('Primary logout failed, using robust logout utility:', err);
          
          await performLogout({
            onSuccess: (message) => {
              console.log('Logout completed:', message);
              dispatch(logOut());
              setTimeout(() => {
                dispatch(apiSlice.util.resetApiState());
              }, 1000);
            },
            onError: (error) => {
              console.error('Logout failed:', error);
              // Even if logout utility fails, ensure local cleanup
              dispatch(logOut());
              setTimeout(() => {
                dispatch(apiSlice.util.resetApiState());
              }, 1000);
            }
          });
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
        } catch (err) {
          // If refresh fails, use robust logout utility
          console.warn('Token refresh failed, performing logout:', err);
          
          performLogout({
            forceClientSide: true,
            onSuccess: () => {
              dispatch(logOut());
              // Dispatch a custom event to notify components of auth failure
              window.dispatchEvent(new CustomEvent('authError', { 
                detail: { error: { status: 401, message: 'Your login has expired.' } } 
              }));
            },
            onError: () => {
              // Even if logout utility fails, ensure local cleanup
              dispatch(logOut());
              window.dispatchEvent(new CustomEvent('authError', { 
                detail: { error: { status: 401, message: 'Your login has expired.' } } 
              }));
            }
          });
        }
      },
    }),
  }),
});

export const { useLoginMutation, useSendLogoutMutation, useRefreshMutation } =
  authApiSlice;
