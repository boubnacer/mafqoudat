/**
 * API Configuration
 * Mirrors the web app's API configuration
 * Reference: client/src/app/api/apiSlice.js
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://mafqoudat-api.onrender.com";

// Google OAuth Configuration
// Web client ID doubles as the Expo Go / auth-proxy client when native iOS/Android
// client IDs aren't configured for the current build.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "571757802995-qg4dvpnaidjh532uo0eu88l1qttmckac.apps.googleusercontent.com";

export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth",
    LOGOUT: "/auth/logout",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    GOOGLE_COMPLETE: "/auth/google/complete",
    GOOGLE_MOBILE: "/auth/google/mobile",
    GOOGLE_MOBILE_COMPLETE: "/auth/google/mobile/complete",
  },
  POSTS: {
    GET_ALL: "/posts",
    GET_USER_POSTS: "/posts/user",
    GET_BY_ID: (id) => `/posts/${id}`,
  },
};

export const API_TIMEOUT = 30000; // 30 seconds
