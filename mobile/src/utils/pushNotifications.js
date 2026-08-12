/**
 * Device push notifications (match alerts that arrive while the app is closed).
 *
 * The app already shows match alerts two ways - the bell badge in AppHeader and
 * the inbox on NotificationsScreen - but both only exist while someone is
 * looking at the app. This is the channel that reaches the user who is not:
 * the person who found a wallet three weeks ago and has no reason to open a
 * lost-and-found app today is exactly who the alert has to reach.
 *
 * Everything here is best-effort and silent on failure. A push token is a
 * convenience, never a requirement: a user who denies the permission, runs an
 * emulator without Play Services, or is simply offline when this runs keeps the
 * full in-app experience and loses nothing but the tray notification.
 *
 * Server side: server/services/pushNotificationService.js (send) and
 * server/controllers/notificationsController.js (token registration).
 * Setup and build requirements: mobile/PUSH_NOTIFICATIONS.md.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerPushToken, unregisterPushToken } from '../api/notificationsApi';

// Android only, deliberately. Delivery on iOS needs an APNs key, which needs a
// paid Apple Developer account - everything else in this file (and the entire
// server side) is already platform-agnostic, so the day that account exists,
// adding 'ios' here plus the APNs credential in EAS is the whole change. Until
// then this keeps the app from asking iOS users for a permission it cannot use.
const SUPPORTED_PLATFORMS = ['android'];

// Must match ANDROID_CHANNEL_ID in server/services/pushNotificationService.js:
// every message names this channel, and naming one the device has not created
// makes Android fall back to a default channel the user cannot configure.
export const MATCH_ALERTS_CHANNEL_ID = 'match-alerts';

// The token last registered with the server. Persisted rather than kept in
// memory alone so sign-out can revoke it after a cold start, and so a token
// that has not changed is not re-sent on every launch.
const STORED_TOKEN_KEY = 'pushToken';
const STORED_TOKEN_LANGUAGE_KEY = 'pushTokenLanguage';

/**
 * How a notification behaves when it arrives while the app is open.
 *
 * Still shown: the alert can arrive on any screen, and a user reading a listing
 * has no reason to expect the bell badge to have silently changed behind them.
 * Sound and badge are left off in the foreground - the app itself is the
 * feedback at that point.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const isSupportedPlatform = () => SUPPORTED_PLATFORMS.includes(Platform.OS);

/**
 * The EAS project id, which getExpoPushTokenAsync needs to mint a token bound
 * to this project. Lives in app.config.js's `extra.eas.projectId`; read from
 * Constants rather than hardcoded so the two can never disagree.
 */
const getProjectId = () => (
  Constants?.expoConfig?.extra?.eas?.projectId
  || Constants?.easConfig?.projectId
  || null
);

/**
 * Android requires a channel before any notification can be shown, and the
 * channel - not the app - is what the user actually configures in system
 * settings. Creating it explicitly (rather than letting the OS invent a
 * "Miscellaneous" one) is what gives them a labelled "Match alerts" switch.
 *
 * Safe to call repeatedly: it updates the channel's name and description in
 * place, which is what keeps the label in the user's own language after they
 * change it in the app.
 */
export const ensureNotificationChannel = async ({ name, description }) => {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(MATCH_ALERTS_CHANNEL_ID, {
      name,
      description,
      // HIGH, so the alert surfaces as a heads-up rather than sitting silently
      // in the shade. An item someone has just handed in is time-critical, and
      // the server collapses a whole scan into a single message, so this is at
      // most one interruption per run rather than one per match.
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4DFF',
    });
  } catch (error) {
    // A channel that cannot be created is not worth failing anything over -
    // Android falls back to its own default and the notification still arrives.
    console.warn('Could not create the match alerts channel:', error?.message || error);
  }
};

/** Current OS-level permission state, for explaining a disabled toggle. */
export const getPushPermissionStatus = async () => {
  if (!isSupportedPlatform()) return 'unsupported';

  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    return canAskAgain ? 'undetermined' : 'blocked';
  } catch (error) {
    return 'unsupported';
  }
};

/**
 * Asks for the notification permission (Android 13+; a no-op grant below that),
 * mints an Expo push token and registers it with the server.
 *
 * @param {Object}  params
 * @param {string}  params.language  Language to deliver this device's pushes in.
 * @param {boolean} params.promptIfNeeded  Whether to show the OS prompt when the
 *   permission has not been decided yet. False on a silent refresh, so returning
 *   to the app never re-asks someone who has already said no.
 * @returns {Promise<string|null>} the registered token, or null.
 */
export const registerForPushNotifications = async ({ language = 'en', promptIfNeeded = true } = {}) => {
  if (!isSupportedPlatform()) return null;

  // A push token cannot be minted without Play Services, which emulator images
  // without Google APIs lack. Checking first turns a confusing red error box
  // into a single log line during development.
  if (!Device.isDevice) return null;

  try {
    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
    let status = existingStatus;

    if (status !== 'granted') {
      if (!promptIfNeeded || !canAskAgain) return null;
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const projectId = getProjectId();
    if (!projectId) {
      console.warn('No EAS project id available - cannot register for push notifications.');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;

    // Always registered, never skipped because the token looks unchanged. The
    // token belongs to the installation, not the account: the same unchanged
    // token has to be re-bound whenever a different user signs in on this
    // device - including after a session expired without a sign-out, where
    // nothing local records that the account changed. One small request per
    // sign-in is a fair price for never silently leaving an account with no
    // registered device. (The server treats a repeat registration as a refresh:
    // it pulls the token off every other account first, then upserts it here.)
    await registerPushToken({ token, platform: Platform.OS, language });

    // Kept only so sign-out can name the token it is revoking, after a cold
    // start where nothing else remembers it.
    await AsyncStorage.multiSet([
      [STORED_TOKEN_KEY, token],
      [STORED_TOKEN_LANGUAGE_KEY, language],
    ]);

    return token;
  } catch (error) {
    // Includes the offline case and the "no FCM credentials configured for this
    // project" case. Neither is actionable by the user, and neither costs them
    // anything beyond the tray notification.
    console.warn('Push registration failed:', error?.message || error);
    return null;
  }
};

/**
 * Revokes this device's token server-side. Called on sign out.
 *
 * Not optional housekeeping: the next person to sign in on a shared phone would
 * otherwise keep receiving the previous account's match alerts, and the copy
 * says what kind of listing they concern.
 *
 * The stored copy is cleared first, so a failed request still leaves the app in
 * a state where the next sign-in registers cleanly.
 *
 * @param {boolean} params.revokeOnServer  False after the account itself has
 *   been deleted: its push tokens went with it, and the request would be made
 *   with a token the server no longer recognises.
 */
export const unregisterForPushNotifications = async ({ revokeOnServer = true } = {}) => {
  try {
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    await AsyncStorage.multiRemove([STORED_TOKEN_KEY, STORED_TOKEN_LANGUAGE_KEY]);
    if (!token || !revokeOnServer) return;
    await unregisterPushToken(token);
  } catch (error) {
    console.warn('Push token revocation failed:', error?.message || error);
  }
};

/**
 * Where a tapped notification should land.
 *
 * A single match opens the counterpart listing directly - the same destination
 * that tapping the row in the inbox reaches, and the one the user can act on.
 * Anything else opens the inbox, which is the only screen that can show a whole
 * group. `notificationId` rides along so the caller can mark the alert read on
 * the way through, keeping the tray and the bell badge in agreement.
 *
 * Returns null for anything unrecognised, including a future notification type
 * shipped by a server this build predates.
 */
export const resolveNotificationTarget = (response) => {
  const data = response?.notification?.request?.content?.data;
  if (!data || data.type !== 'match_found') return null;

  if (data.postId) {
    return {
      screen: 'PostDetailScreen',
      params: { id: String(data.postId) },
      notificationId: data.notificationId ? String(data.notificationId) : null,
    };
  }

  return { screen: 'Notifications', params: undefined, notificationId: null };
};

/** The notification that launched the app from a cold start, if any. */
export const getInitialNotificationResponse = () => Notifications.getLastNotificationResponseAsync();

export const addNotificationResponseListener = (handler) => (
  Notifications.addNotificationResponseReceivedListener(handler)
);

export const addNotificationReceivedListener = (handler) => (
  Notifications.addNotificationReceivedListener(handler)
);
