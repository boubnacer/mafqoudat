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
import { isStoredTokenExpired } from '../features/auth/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';

// How long to wait before re-checking storage for a token another tab won.
// Long enough to cover the gap between the two tabs' responses, short enough
// that a genuinely dead session isn't left hanging on the login bounce.
const CROSS_TAB_RECHECK_MS = 500;

let inflight = null;

// Rotation is atomic server-side, so when two tabs boot together and both
// refresh with the same cookie, exactly one wins and the other is answered
// REFRESH_INVALID. The loser's session is not actually dead - the winner just
// stored a brand-new access token in the shared localStorage. So before
// treating REFRESH_INVALID as "log out", look for that token.
// (The server no longer clears the refresh cookie on this failure either -
// see server/controllers/authcontroller.js's refreshUnauthorized.)
const adoptTokenFromAnotherTab = (tokenBefore) => {
  const stored = authStorage.getAccessToken();
  if (!stored || stored === tokenBefore) return null;
  if (isStoredTokenExpired(stored)) return null;
  return stored;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const doRefresh = async () => {
  const tokenBefore = authStorage.getAccessToken();

  try {
    const headers = {
      'Content-Type': 'application/json',
      // Required by server/middleware/csrfGuard.js: /auth/refresh and
      // /auth/logout authenticate from the SameSite=None refresh cookie alone,
      // so they only accept requests carrying a header a cross-site form post
      // cannot set.
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (tokenBefore) {
      headers.Authorization = `Bearer ${tokenBefore}`;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      let code = null;
      try {
        code = (await response.json())?.code || null;
      } catch (parseError) {
        // Non-JSON error body - treated as an unknown failure code.
      }

      if (code === 'REFRESH_INVALID') {
        let fromOtherTab = adoptTokenFromAnotherTab(tokenBefore);
        if (!fromOtherTab) {
          // The winning tab's response may simply not have landed yet.
          await delay(CROSS_TAB_RECHECK_MS);
          fromOtherTab = adoptTokenFromAnotherTab(tokenBefore);
        }
        if (fromOtherTab) return { accessToken: fromOtherTab, code: null };
      }

      return { accessToken: null, code };
    }

    const data = await response.json();
    return { accessToken: data?.accessToken || null, code: null };
  } catch (error) {
    // Network failure is not "session dead" - callers treat a null token as
    // "no new token", and only log out when the old one is unusable too.
    return { accessToken: null, code: null };
  }
};

/** Full result: { accessToken, code } - `code` is the server's failure code. */
export const refreshSession = () => {
  if (!inflight) {
    inflight = doRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
};

export const refreshAccessToken = async () => (await refreshSession()).accessToken;

export default refreshAccessToken;
