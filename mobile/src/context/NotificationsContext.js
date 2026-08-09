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
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { fetchUnreadCount } from '../api/notificationsApi';

const POLL_INTERVAL_MS = 60000;

const NotificationsContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: () => {},
  setUnreadCount: () => {},
});

export const NotificationsProvider = ({ children }) => {
  const { isSignedIn } = useAuth();
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

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);

export default NotificationsContext;
