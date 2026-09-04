/**
 * Redeems the one-time code the OAuth browser flow hands back through the deep
 * link, for the actual session tokens.
 *
 * The server used to put the access token and the 30-day refresh token in the
 * `/auth/mobile-callback` redirect URL, which the app then loaded - and the
 * server logs every request's full query string to disk verbatim
 * (server/middleware/logger.js), so every mobile OAuth sign-in wrote a live
 * refresh credential to reqLog.log in plaintext. Now only an opaque, single-use
 * code travels in that URL, and this trades it for the tokens over POST.
 *
 * Shared by googleAuth.js and facebookAuth.js - the codes come from one
 * provider-agnostic store server-side (server/utils/oauthExchange.js).
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

export const exchangeOAuthCode = async (code) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.MOBILE_EXCHANGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Same client header the cookie-authenticated auth routes require
        // (server/middleware/csrfGuard.js) - harmless here, and keeps every
        // auth call the app makes consistent.
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok || !data?.accessToken) {
      return null;
    }

    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch (error) {
    console.error('OAuth code exchange error:', error);
    return null;
  }
};

export default exchangeOAuthCode;
