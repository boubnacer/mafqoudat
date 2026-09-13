import { authStorage } from './authStorage';
import { refreshSession } from './refreshClient';

/**
 * Browser push notifications: permission, subscription, and keeping the server
 * in step with both.
 *
 * The web half of the channel the mobile app has had since match alerts
 * shipped — an alert that reaches someone who is not currently looking at
 * Mafqoudat. The service worker that receives them is `public/push-sw.js`; the
 * sending half is `server/services/webPushService.js`.
 *
 * Nothing in here throws at its caller. Every failure — an unsupported
 * browser, a denied prompt, a push service that refused the subscription, a
 * network error registering it — resolves to a status the caller can render,
 * because the one thing this must never do is stand between an author and
 * their listing. `requestSubscription` is called from the New Post flow, and a
 * person who cannot subscribe still has to be able to post.
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';

const SERVICE_WORKER_PATH = '/push-sw.js';

// Remembers that this browser has already been offered browser alerts, so the
// New Post flow asks once rather than at every listing. Per browser profile,
// like the permission it is about — deliberately not a server-side preference:
// granting is a decision the browser records per origin, and a second device
// signed into the same account has its own answer to give.
const ASKED_KEY = 'webPushAsked';

/**
 * Three things have to be true before a browser can receive a push, and they
 * fail in different places: Safari before 16.4 has no Push API at all, iOS has
 * one only once the site is installed to the Home Screen, and a page served
 * over plain http (any host but localhost) gets no service worker.
 */
export const isWebPushSupported = () => (
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && typeof Notification !== 'undefined'
);

const hasBeenAsked = () => {
  try {
    return localStorage.getItem(ASKED_KEY) === 'true';
  } catch (error) {
    // Private windows and blocked site data both throw here. Treating that as
    // "already asked" would silence the offer forever; treating it as "not
    // asked" costs at most one dialog per visit.
    return false;
  }
};

const rememberAsked = () => {
  try {
    localStorage.setItem(ASKED_KEY, 'true');
  } catch (error) {
    /* nothing to do - see hasBeenAsked */
  }
};

/**
 * Whether the New Post flow should offer browser alerts before submitting.
 *
 * Deliberately narrow. A browser that has already granted permission is
 * subscribed and needs nothing; one that has denied it cannot be asked again
 * by any means (the browser will not re-open the prompt, and a dialog that
 * leads nowhere is worse than silence); and one that has been offered and
 * declined has answered. Only a first-time, undecided, capable browser is
 * asked, and only once.
 */
export const shouldOfferWebPush = () => (
  isWebPushSupported() && Notification.permission === 'default' && !hasBeenAsked()
);

/**
 * What a settings row needs to render, which is not the same question as
 * `Notification.permission`: a browser that granted permission and then had
 * its subscription removed ("turn browser alerts off") is still 'granted' and
 * is receiving nothing. So the state is resolved from both.
 *
 * 'unsupported' | 'blocked' (the browser refuses, and no click can re-ask) |
 * 'on' | 'off'.
 */
export const getSubscriptionState = async () => {
  if (!isWebPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission !== 'granted') return 'off';

  try {
    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? 'on' : 'off';
  } catch (error) {
    return 'off';
  }
};

const authHeaders = () => {
  const token = authStorage.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** The VAPID public key this deployment signs with, or '' when it has none. */
const fetchPublicKey = async () => {
  try {
    const response = await fetch(`${API_URL}/notifications/web-push-key`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data?.publicKey || '';
  } catch (error) {
    // Unreachable API reads the same as an unconfigured one: no key, so no
    // offer and no subscription. Never an error the caller has to handle.
    return '';
  }
};

// Asked once per page load *once it has answered*. The answer is a
// deployment-level fact, not a per-visitor one, and the offer below has to know
// it before deciding whether to spend someone's permission decision.
//
// Only a real key is remembered. Caching an empty answer was the bug that made
// browser alerts look unimplemented: the route used to require a bearer token,
// so a request that landed while the access token was expired - during the
// boot-time silent refresh, say - answered 401, and '' was then cached as
// "this deployment cannot send" for the rest of the page load. The key route
// is public now (server/routes/notificationRoutes.js), and a failure here is
// retried rather than remembered either way.
let publicKeyPromise = null;

const getPublicKey = () => {
  if (!publicKeyPromise) {
    publicKeyPromise = fetchPublicKey().then((key) => {
      if (!key) publicKeyPromise = null;
      return key;
    });
  }
  return publicKeyPromise;
};

/**
 * Whether to make the offer at all — `shouldOfferWebPush` plus the one thing
 * the browser cannot tell us: whether this deployment can actually send.
 *
 * Without the key check, a site whose VAPID keys are not configured yet still
 * shows the dialog, still fires the browser's prompt, and registers nothing —
 * spending a decision that can never be re-asked (a denial is permanent) on a
 * channel that does not exist. So the offer waits for the key.
 */
export const canOfferWebPush = async () => {
  if (!shouldOfferWebPush()) return false;
  return !!(await getPublicKey());
};

/**
 * Whether browser alerts are available here at all — this browser can receive
 * them and this deployment can send them.
 *
 * What the settings row needs, and deliberately not `canOfferWebPush`: someone
 * who dismissed the one-time offer must still be able to turn alerts on from
 * settings, so the "already asked" and "undecided" conditions do not apply
 * there. Only "can this work" does.
 */
export const isWebPushAvailable = async () => {
  if (!isWebPushSupported()) return false;
  return !!(await getPublicKey());
};

/**
 * `applicationServerKey` has to be raw bytes; the key travels as base64url.
 * (`atob` reads standard base64, hence the two substitutions and the padding.)
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

const registerServiceWorker = async () => {
  const existing = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SERVICE_WORKER_PATH);
};

/**
 * Stores this browser's subscription against the signed-in account.
 *
 * Retries once behind a silent session refresh on a 401. This route is a plain
 * `fetch`, not an RTK Query endpoint, so it does not inherit apiSlice's
 * refresh-and-retry - and an access token lives 30 minutes while a page can be
 * open for hours. Without the retry, the once-per-page-load repair below
 * silently gave up on exactly the long-lived tab it exists to repair, and the
 * subscription quietly went stale.
 */
const saveSubscription = async (subscription, language) => {
  const payload = subscription.toJSON();

  const post = (token) => fetch(`${API_URL}/notifications/web-push-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      endpoint: payload.endpoint,
      keys: payload.keys,
      // A push is composed server-side, so the language it should be written
      // in has to be stored with the subscription - there is no request to
      // read it from at send time.
      language,
    }),
  });

  try {
    const response = await post(authStorage.getAccessToken());
    if (response.ok) return true;
    if (response.status !== 401) return false;

    const { accessToken } = await refreshSession();
    if (!accessToken) return false;

    const retried = await post(accessToken);
    return retried.ok;
  } catch (error) {
    // Offline, or an API that is not answering. Nothing to report to the
    // caller beyond "not saved" - see this file's header.
    return false;
  }
};

/**
 * Whether an existing subscription was created with the key this deployment
 * signs with now.
 *
 * A VAPID pair is bound into the subscription at creation time, so rotating the
 * pair (or a browser that subscribed against a different environment - a
 * staging build on the same origin) leaves a subscription the push service will
 * accept from nobody. It looks completely healthy from the page: permission
 * granted, a subscription object present, an endpoint stored on the account,
 * and every send refused. Re-subscribing is the only repair.
 */
const matchesServerKey = (subscription, publicKey) => {
  const applied = subscription?.options?.applicationServerKey;
  if (!applied) return true; // Nothing to compare against; assume it is ours.

  try {
    const current = urlBase64ToUint8Array(publicKey);
    const existing = new Uint8Array(applied);
    if (existing.length !== current.length) return false;
    return existing.every((byte, index) => byte === current[index]);
  } catch (error) {
    return true;
  }
};

/**
 * Makes sure this browser holds a subscription against the current VAPID key
 * and that the server knows about it. Assumes permission is already granted.
 *
 * The one path that both `requestSubscription` (after the prompt) and
 * `syncSubscription` (once per page load) go through, because "subscribe" and
 * "repair" are the same operation: subscribing is idempotent, the endpoint is
 * the identity, and re-registering only refreshes the row.
 *
 * @returns {Promise<boolean>} whether the server now holds this browser.
 */
const ensureSubscription = async (language) => {
  try {
    const publicKey = await getPublicKey();
    if (!publicKey) return false;

    const registration = await registerServiceWorker();
    // `ready` rather than the registration itself: a worker that is installing
    // has no active push manager yet, and subscribing against it throws.
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (subscription && !matchesServerKey(subscription, publicKey)) {
      // Built for a key this deployment no longer signs with - unsubscribe and
      // take a fresh one rather than storing an endpoint nothing can reach.
      try {
        await subscription.unsubscribe();
      } catch (error) {
        /* the re-subscribe below is what matters */
      }
      subscription = null;
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        // Required to be true by every browser: a push that shows no
        // notification is what gets a site's permission revoked wholesale.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    return await saveSubscription(subscription, language);
  } catch (error) {
    console.warn('Web push subscription failed:', error?.message || error);
    return false;
  }
};

/**
 * Asks the browser for permission and registers the resulting subscription.
 *
 * Must be called from a user gesture — browsers refuse the prompt otherwise,
 * silently resolving to 'default'.
 *
 * @param {string} language which language this browser's alerts are written in.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'|'failed'>}
 *   'failed' means permission was given but the subscription could not be
 *   completed (no VAPID key configured, a push service that refused, a network
 *   error) — distinct from a refusal, since nothing about it is the user's
 *   answer.
 */
export const requestSubscription = async (language = 'en') => {
  if (!isWebPushSupported()) return 'unsupported';

  rememberAsked();

  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch (error) {
    return 'failed';
  }
  if (permission !== 'granted') return permission;

  const subscribed = await ensureSubscription(language);
  return subscribed ? 'granted' : 'failed';
};

/**
 * Keeps the server in step with this browser, once per page load.
 *
 * Three things this repairs, all of which look identical from the page - a
 * granted permission and no notifications ever arriving:
 *
 *  - the endpoint rotated, or the server pruned the row after a delivery came
 *    back "gone", so the account no longer holds a reachable browser;
 *  - permission was granted but no subscription was ever created. The New Post
 *    offer cannot fix this one: it only fires while the permission is still
 *    'default', so a browser that granted and then lost its subscription (site
 *    data cleared, a failed first save, a sign-in on a browser that had granted
 *    for another account) had no path back except the settings row;
 *  - the subscription belongs to a superseded VAPID key.
 *
 * Subscribing here needs no user gesture, because permission is already given
 * — the gesture requirement is on the prompt, not on `subscribe()`.
 *
 * @returns {Promise<boolean>} whether the server now holds this browser.
 */
export const syncSubscription = async (language = 'en') => {
  if (!isWebPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  return ensureSubscription(language);
};

/**
 * Drops this browser's subscription, on the server and in the browser itself.
 *
 * Called on sign-out and when the reader turns browser alerts off. Both halves
 * matter: leaving the row behind keeps one account's alerts arriving on a
 * computer somebody else now uses, and leaving the browser subscription behind
 * means the next sign-in re-registers a stale endpoint instead of a fresh one.
 */
export const unsubscribe = async () => {
  if (!isWebPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;

    const { endpoint } = subscription.toJSON();

    // Server first, while the session still has a token to authenticate with.
    try {
      await fetch(`${API_URL}/notifications/web-push-subscription`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ endpoint }),
      });
    } catch (error) {
      /* the browser half still has to happen */
    }

    await subscription.unsubscribe();
    return true;
  } catch (error) {
    return false;
  }
};
