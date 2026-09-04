import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentToken,
  setCredentials,
  logOut,
  isStoredTokenExpired,
} from '../features/auth/authSlice';
import { refreshAccessToken } from '../utils/refreshClient';
import { authStorage } from '../utils/authStorage';

/**
 * One-shot silent refresh at app boot (mounted from App.js).
 *
 * Three cases, one call:
 * - Stored token already expired: the refresh cookie revives the session
 *   in place; if the refresh fails too, log out with the same
 *   sessionExpiredMessage notice the API layer uses (authSlice used to drop
 *   the expired token synchronously at boot, which made a re-login mandatory
 *   even when the refresh cookie could have saved the session).
 * - Legacy pre-refresh-deploy 30-day token, still valid: the server's
 *   bootstrap path (Bearer-only /auth/refresh) upgrades it to a short token +
 *   refresh cookie without the user noticing.
 * - Current short-lived token: refresh just rotates it early - harmless.
 *
 * A failed refresh while the stored token is still VALID is deliberately not
 * a logout: it can be a network blip, and the token itself keeps working
 * until apiSlice's own 401 handling has its say.
 */
export const useSessionBootstrap = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!token || attemptedRef.current) return;
    attemptedRef.current = true;

    let cancelled = false;

    (async () => {
      const wasExpired = isStoredTokenExpired(token);
      const newAccessToken = await refreshAccessToken();
      if (cancelled) return;

      if (newAccessToken) {
        dispatch(setCredentials({ accessToken: newAccessToken }));
      } else if (wasExpired) {
        dispatch(logOut({ reason: 'Stored token expired and refresh failed' }));
        authStorage.setLoginRedirectMessage('sessionExpiredMessage');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, dispatch]);
};

export default useSessionBootstrap;
