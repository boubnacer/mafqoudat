import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";
import { authStorage } from "../../utils/authStorage";
import { performLogout } from "../../utils/logoutUtils";
import backgroundTokenRefreshService from "../../services/backgroundTokenRefresh";
import { clearTokenValidationCache } from "../../utils/optimizedTokenUtils";

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
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          const { accessToken, user } = data;
          
          // Clear token validation cache after successful login
          clearTokenValidationCache();
          
          // Initialize background refresh service after successful login
          if (accessToken) {
            const refreshCallback = async () => {
              // Use the refresh mutation for background refresh
              const refreshResult = await dispatch(authApiSlice.endpoints.refresh.initiate());
              return refreshResult.data;
            };
            
            // Initialize with enhanced error handling and recovery
            try {
              backgroundTokenRefreshService.initialize(refreshCallback, { getState, dispatch });
              console.log('✅ Background token refresh service initialized successfully');
            } catch (error) {
              console.error('❌ Failed to initialize background token refresh service:', error);
              // Attempt to recover the service
              try {
                backgroundTokenRefreshService.recover(refreshCallback, { getState, dispatch });
                console.log('✅ Background token refresh service recovered successfully');
              } catch (recoveryError) {
                console.error('❌ Failed to recover background token refresh service:', recoveryError);
                // Service will continue without background refresh - user will need to manually refresh
              }
            }
          }
          
        } catch (error) {
          // Stop background refresh service on login failure
          backgroundTokenRefreshService.stop();
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
          const { data } = await queryFulfilled;
          
          // Stop background refresh service
          backgroundTokenRefreshService.stop();
          
          // Clear token validation cache
          clearTokenValidationCache();
          
          dispatch(logOut());
          setTimeout(() => {
            dispatch(apiSlice.util.resetApiState());
          }, 1000);
        } catch (err) {
          // Use the robust logout utility for fallback
          console.warn('Primary logout failed, using robust logout utility:', err);
          
          // Stop background refresh service even on error
          backgroundTokenRefreshService.stop();
          clearTokenValidationCache();
          
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
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const result = await queryFulfilled;
          const { accessToken, user } = result.data;
          
          if (accessToken) {
            // Extract user data from the new token
            const userData = extractUserFromToken(accessToken);
            console.log('✅ Extracted user data from refresh token:', userData);
            
            // Clear token validation cache before setting new credentials
            clearTokenValidationCache();
            
            // Update auth state with new token and user data
            dispatch(setCredentials({ 
              accessToken, 
              user: userData || user // Use extracted data or fallback to API response
            }));
            
            // Force a state update to ensure all components re-render
            dispatch({ type: 'auth/forceUpdate' });
            
            // Re-initialize background refresh service
            const refreshCallback = async () => {
              // Use the refresh mutation for background refresh
              const refreshResult = await dispatch(authApiSlice.endpoints.refresh.initiate());
              return refreshResult.data;
            };
            
            try {
              backgroundTokenRefreshService.initialize(refreshCallback, { getState, dispatch });
              console.log('✅ Background token refresh service re-initialized after refresh');
            } catch (error) {
              console.error('❌ Failed to re-initialize background token refresh service:', error);
            }
            
            console.log('✅ Auth state updated after refresh with user data:', userData);
          }
          
        } catch (error) {
          console.error('❌ Refresh mutation failed:', error);
          
          // Stop background refresh service
          backgroundTokenRefreshService.stop();
          
          // If refresh fails, use robust logout utility
          console.warn('Token refresh failed, performing logout:', error);
          
          performLogout({
            forceClientSide: true,
            onSuccess: () => {
              dispatch(logOut({ reason: 'Refresh failed' }));
              // Dispatch a custom event to notify components of auth failure
              window.dispatchEvent(new CustomEvent('authError', { 
                detail: { error: { status: 401, message: 'Your login has expired.' } } 
              }));
            },
            onError: () => {
              // Even if logout utility fails, ensure local cleanup
              dispatch(logOut({ reason: 'Refresh failed' }));
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
