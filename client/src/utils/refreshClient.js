/**
 * Silent session refresh - the one place the web app calls POST /auth/refresh.
 *
 * Plain fetch rather than RTK Query so it can be shared by the baseQuery's
 * 401 handling (app/api/apiSlice.js) and the boot-time bootstrap
 * (hooks/useSessionBootstrap.js) without import cycles.
 *
 * The refresh token itself is an httpOnly cookie scoped to /auth on the API
 * origin - this code never sees it, it only sends credentials and receives a
 * new access token. The Bearer header is attached for the legacy-session
 * bootstrap: a still-valid 30-day token from before the refresh-token deploy
 * has no cookie yet, and the server trades it for a real session
 * (see server/controllers/authcontroller.js `refresh`).
 *
 * Single-flight: concurrent 401s share one refresh request, so a burst of
 * failing queries can't race each other through token rotation.
 */

import { authStorage } from './authStorage';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';

let inflight = null;

const doRefresh = async () => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = authStorage.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.accessToken || null;
  } catch (error) {
    // Network failure is not "session dead" - callers treat null as
    // "no new token", and only log out when the old one is unusable too.
    return null;
  }
};

export const refreshAccessToken = () => {
  if (!inflight) {
    inflight = doRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
};

export default refreshAccessToken;
