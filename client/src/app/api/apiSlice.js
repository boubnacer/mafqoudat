import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials } from "../../features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3500",
  credentials: "include", //important, to send the cookie back to the server along with the token
  timeout: 30000, // 30 seconds timeout for slow connections
  prepareHeaders: (headers, { getState, endpoint }) => {
    // api => api.getState => {getState}
    const token = getState().auth.token;
    
    console.log('prepareHeaders - endpoint:', endpoint);
    console.log('prepareHeaders - token:', token ? 'Token exists' : 'No token');
    console.log('prepareHeaders - token length:', token ? token.length : 0);
    console.log('prepareHeaders - token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    console.log('prepareHeaders - headers before:', headers);
    
    // Only add authorization header for authenticated endpoints
    // Skip for public endpoints like dashboard
    if (token && !endpoint?.includes("getDashboard")) {
      headers.set("authorization", `Bearer ${token}`);
      console.log('prepareHeaders - Authorization header set');
    } else {
      console.log('prepareHeaders - Authorization header NOT set. Token:', !!token, 'Endpoint:', endpoint);
    }
    
    // Special case: Always add authorization for report endpoint if we have a token
    if (endpoint === 'submitReport' && token) {
      headers.set("authorization", `Bearer ${token}`);
      console.log('prepareHeaders - Authorization header set for report endpoint');
    }

    console.log('prepareHeaders - headers after:', headers);
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Add debugging for report requests
  if (args.url?.includes('/posts/report')) {
    console.log('apiSlice - Report request:', args);
    console.log('apiSlice - Request headers:', args.headers);
    console.log('apiSlice - Request body:', args.body);
  }

  let result = await baseQuery(args, api, extraOptions);
  
  // Add debugging for report responses
  if (args.url?.includes('/posts/report')) {
    console.log('apiSlice - Report response:', result);
  }

  // Handle both 401 and 403 errors for authenticated routes
  // Skip reauth for public routes like dashboard
  if ((result?.error?.status === 401 || result?.error?.status === 403) && !args.url?.includes("/dashboard")) {
    console.log("sending refresh token");

    // send refresh token to get new access token
    const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);

    if (refreshResult?.data) {
      // store the new token
      api.dispatch(setCredentials({ ...refreshResult.data }));

      // retry original query with new access token
      result = await baseQuery(args, api, extraOptions);
    } else {
      if (refreshResult?.error?.status === 401 || refreshResult?.error?.status === 403) {
        refreshResult.error.data.message = "Your login has expired.";
      }
      return refreshResult;
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "User", "Country", "Dashboard", "FlOptions", "Category"],
  endpoints: (builder) => ({}),
});
