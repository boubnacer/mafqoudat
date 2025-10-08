import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";
import { setCurrentCountry } from "../../app/state/index";
import { authStorage } from "../../utils/authStorage";
import { performLogout } from "../../utils/logoutUtils";

// Helper function to extract user data from token
const extractUserFromToken = (token) => {
  try {
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (payload.UserInfo) {
      return {
        _id: payload.UserInfo.userId,
        username: payload.UserInfo.username,
        country: payload.UserInfo.country,
        role: payload.UserInfo.role
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

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
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { accessToken, user } = data;
          
          // Set credentials on successful login (no refresh service needed with long-lived tokens)
          if (accessToken) {
            const userData = extractUserFromToken(accessToken) || user;
            dispatch(setCredentials({ accessToken, user: userData }));
            
            // Update current country in Redux state
            if (userData?.country) {
              dispatch(setCurrentCountry({ currentCountry: userData.country }));
              console.log('🌍 [AUTH-API] Updated currentCountry in Redux:', userData.country);
            }
          }
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
    }),
    sendLogout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          
          // Clear auth state
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
  }),
});

export const { useLoginMutation, useSendLogoutMutation } = authApiSlice;
