/**
 * Redeems the one-time code the web OAuth redirect hands back through
 * /auth/callback, for the real access token.
 *
 * server/routes/googleAuthRoutes.js and facebookAuthRoutes.js used to put the
 * access token straight in that redirect URL (?token=...). Short-lived
 * (30 min) since the refresh-token rework, so no longer the credential leak
 * it used to be, but it still landed in browser history and any proxy/CDN
 * log on the path - and mobile's browser flow already solved the same
 * problem for its refresh token (see server/utils/oauthExchange.js). This
 * reuses that same machinery: only a one-time opaque code travels in the
 * URL, and this trades it for the access token over POST
 * /auth/mobile-exchange (provider- and platform-agnostic despite the name -
 * it just redeems whatever code the server-side store issued).
 *
 * The refresh token in the exchange response is ignored - web's refresh
 * token only ever travels as the httpOnly cookie the OAuth redirect itself
 * already set.
 */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

export const exchangeOAuthCode = async (code) => {
  try {
    const response = await fetch(`${API_URL}/auth/mobile-exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok || !data?.accessToken) {
      return null;
    }

    return data.accessToken;
  } catch (error) {
    console.error("OAuth code exchange error:", error);
    return null;
  }
};

export default exchangeOAuthCode;
