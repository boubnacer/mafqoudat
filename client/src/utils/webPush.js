import { authStorage } from './authStorage';

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

// Asked once per page load. The answer is a deployment-level fact, not a
// per-visitor one, and the offer below has to know it before deciding whether
// to spend someone's permission decision.
let publicKeyPromise = null;

const getPublicKey = () => {
  if (!publicKeyPromise) publicKeyPromise = fetchPublicKey();
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

const saveSubscription = async (subscription, language) => {
  const payload = subscription.toJSON();
  const response = await fetch(`${API_URL}/notifications/web-push-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      endpoint: payload.endpoint,
      keys: payload.keys,
      // A push is composed server-side, so the language it should be written
      // in has to be stored with the subscription - there is no request to
      // read it from at send time.
      language,
    }),
  });
  return response.ok;
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

  try {
    const publicKey = await getPublicKey();
    if (!publicKey) return 'failed';

    const registration = await registerServiceWorker();
    // `ready` rather than the registration itself: a worker that is installing
    // has no active push manager yet, and subscribing against it throws.
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.getSubscription()
      || await registration.pushManager.subscribe({
        // Required to be true by every browser: a push that shows no
        // notification is what gets a site's permission revoked wholesale.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

    const saved = await saveSubscription(subscription, language);
    return saved ? 'granted' : 'failed';
  } catch (error) {
    console.warn('Web push subscription failed:', error?.message || error);
    return 'failed';
  }
};

/**
 * Re-registers an existing subscription, so the server keeps an endpoint this
 * browser still holds — and picks up a language change.
 *
 * Cheap and idempotent (the endpoint is the identity; re-registering refreshes
 * it in place), and it is what repairs the one case the flow above cannot: a
 * browser that subscribed while signed into another account, or whose row was
 * pruned after a delivery failure, is silently no longer reachable otherwise.
 */
export const syncSubscription = async (language = 'en') => {
  if (!isWebPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;
    return await saveSubscription(subscription, language);
  } catch (error) {
    return false;
  }
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
