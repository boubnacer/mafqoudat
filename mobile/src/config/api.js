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

// Native ID-token exchange (expo-auth-session, POST /auth/google/mobile) is the default:
// it works in Expo Go and doesn't leave the app. The legacy in-app-browser + deep-link
// bridge (server/views/mobile-callback.html) is kept as an instant fallback in case the
// native flow misbehaves on a real device - flip this to 'false' to switch back to it.
// Note the browser fallback only works in a standalone/dev-client build: Expo Go doesn't
// register the app for the `mafqoudat://` scheme, so the deep-link handoff can't resolve there.
export const USE_NATIVE_GOOGLE_AUTH =
  process.env.EXPO_PUBLIC_USE_NATIVE_GOOGLE_AUTH !== "false";

// The server's mobile-callback.html always redirects here verbatim regardless of any
// redirect_uri passed to /auth/google - it is not templated, so this must match exactly.
export const GOOGLE_MOBILE_CALLBACK_URL = "mafqoudat://auth/callback";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth",
    LOGOUT: "/auth/logout",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    GOOGLE_COMPLETE: "/auth/complete",
    GOOGLE_MOBILE: "/auth/google/mobile",
    GOOGLE_MOBILE_COMPLETE: "/auth/google/mobile/complete",
  },
  POSTS: {
    GET_ALL: "/posts",
    GET_USER_POSTS: "/posts/user",
    GET_BY_ID: (id) => `/posts/${id}`,
    CREATE: "/posts",
  },
};

export const API_TIMEOUT = 30000; // 30 seconds
