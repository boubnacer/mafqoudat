/**
 * API Configuration
 * Mirrors the web app's API configuration
 * Reference: client/src/app/api/apiSlice.js
 */

export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  "https://mafqoudat-production.up.railway.app";

// Google OAuth Configuration
export const GOOGLE_WEB_CLIENT_ID = 
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
  "571757802995-qg4dvpnaidjh532uo0eu88l1qttmckac.apps.googleusercontent.com";

// OAuth Redirect URIs
export const OAUTH_REDIRECT_URI = 
  process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI || 
  "https://mafqoudat-production.up.railway.app/auth/mobile-callback";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth",
    LOGOUT: "/auth/logout",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    GOOGLE_COMPLETE: "/auth/google/complete",
  },
  POSTS: {
    GET_ALL: "/posts",
    GET_USER_POSTS: "/posts/user",
    GET_BY_ID: (id) => `/posts/${id}`,
  },
};

export const API_TIMEOUT = 30000; // 30 seconds
