/**
 * Unread match-alert count, shared by the header bell and the overflow menu.
 * Mirrors the web app's polling in client/src/features/notifications/NotificationBell.jsx.
 *
 * Lives in a context rather than in each header because AppHeader is mounted
 * fresh on every screen: a per-component poll would restart its timer on every
 * navigation, and several screens' headers would poll in parallel.
 *
 * Two things keep this cheap on a phone, where the web app's plain 60s interval
 * would be wasteful:
 *  - it only runs while a session exists, and
 *  - it only runs while the app is actually in the foreground, resyncing once
 *    on the way back rather than continuing to poll in the background.
 *
 * Device push registration lives here too, for the same reason: it is
 * session-scoped, has to re-run when the language changes, and would otherwise
 * be duplicated by every screen that mounts a header. What arrives while the
 * app is closed is the one thing this polling cannot cover - see
 * utils/pushNotifications.js. Taps are handled in App.js, which owns the
 * "navigate once the right navigator is mounted" machinery.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTranslation } from '../utils/translations';
import { fetchUnreadCount } from '../api/notificationsApi';
import {
  addNotificationReceivedListener,
  ensureNotificationChannel,
  registerForPushNotifications,
} from '../utils/pushNotifications';

const POLL_INTERVAL_MS = 60000;

const NotificationsContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: () => {},
  setUnreadCount: () => {},
});

export const NotificationsProvider = ({ children }) => {
  const { isSignedIn } = useAuth();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Guards a late response from a request that was in flight when the session
  // ended, which would otherwise repaint a badge for a signed-out user.
  const isSignedInRef = useRef(isSignedIn);
  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isSignedInRef.current) return;
    try {
      const count = await fetchUnreadCount();
      if (isSignedInRef.current) setUnreadCount(count);
    } catch (error) {
      // A failed poll is not worth surfacing: the badge simply keeps its last
      // known value until the next tick succeeds. apiService's interceptor
      // already handles the one failure that matters (an invalid session).
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setUnreadCount(0);
      return undefined;
    }

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) return;
      refreshUnreadCount();
      intervalId = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    startPolling();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // Restarting the interval also fires an immediate refresh, so a user
        // returning to the app sees a current badge rather than waiting out
        // the remainder of a tick.
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [isSignedIn, refreshUnreadCount]);

  // Whether this session has a token registered. Drives the one case sign-in
  // alone cannot cover: a user who denied the permission, granted it later in
  // system settings, and came back to the app - there is no event for that, so
  // the return to the foreground is the moment to try again.
  const hasPushTokenRef = useRef(false);

  // Push registration. Runs on sign-in and on every language change: the token
  // carries the language a message should be written in, and the Android
  // channel carries the label the user sees in system settings, so both go
  // stale the moment someone switches language.
  //
  // The OS permission is only ever requested once per install by this effect -
  // registerForPushNotifications returns early when the permission has been
  // denied and cannot be asked again, so a user who said no is never nagged on
  // a later sign-in.
  useEffect(() => {
    if (!isSignedIn) {
      hasPushTokenRef.current = false;
      return undefined;
    }

    let isActive = true;

    const register = async ({ promptIfNeeded }) => {
      const token = await registerForPushNotifications({
        language: currentLanguage,
        promptIfNeeded,
      });
      if (isActive) hasPushTokenRef.current = !!token;
    };

    (async () => {
      await ensureNotificationChannel({
        name: t('pushChannelMatchAlerts'),
        description: t('pushChannelMatchAlertsDescription'),
      });
      if (!isActive) return;
      await register({ promptIfNeeded: true });
    })();

    const subscription = AppState.addEventListener('change', (nextState) => {
      // Silent: a user who said no is asked once, at sign-in, and never again.
      if (nextState === 'active' && !hasPushTokenRef.current) {
        register({ promptIfNeeded: false });
      }
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
    // `t` is derived from currentLanguage and would only re-run this with the
    // same inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, currentLanguage]);

  // A push that lands while the app is open updates the badge immediately,
  // rather than leaving it a poll interval behind the banner the user just saw.
  useEffect(() => {
    if (!isSignedIn) return undefined;

    const subscription = addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });
    return () => subscription.remove();
  }, [isSignedIn, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);

export default NotificationsContext;
