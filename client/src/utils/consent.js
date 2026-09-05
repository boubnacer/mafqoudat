// Consent state, read from Google's Funding Choices CMP ("Privacy & messaging"
// in AdSense) and republished to the rest of the app.
//
// The CMP is the only consent UI on this site. Nothing here draws a banner or
// remembers a choice of its own: the choice lives in the TC string Google's
// message writes, and this module's whole job is to turn that into the four
// Consent Mode v2 signals and tell anyone waiting on them. That is why
// components/Pages/CookieNotice.jsx explains cookies but never asks about them
// - two consent UIs would mean two answers to the same question.
//
// The standing answer is "denied", set as the Consent Mode default in
// public/index.html before any Google tag can read the dataLayer. Everything
// below can only move a signal off that default, and only because the CMP
// said so.

// Google Advertising Products, IAB TCF Global Vendor List id 755. The
// purpose-to-signal mapping below follows Google's TCF integration guidance;
// where it is ambiguous this errs toward requiring more, since the cost of
// being wrong in that direction is a missing measurement rather than an
// unconsented one.
const GOOGLE_VENDOR_ID = 755;

// TCF purposes used here:
//   1  store and/or access information on a device  -> any cookie at all
//   3  create a personalised ads profile
//   4  select personalised ads
//   7  measure ad performance
const PURPOSE_STORAGE = 1;
const PURPOSE_ADS_PROFILE = 3;
const PURPOSE_ADS_SELECT = 4;
const PURPOSE_AD_PERFORMANCE = 7;

// How long to wait for the CMP to publish a __tcfapi before giving up on it.
// Reaching this means the script was blocked, failed, or was never configured;
// all three resolve to denied.
const TCF_WAIT_MS = 8000;
const TCF_POLL_MS = 100;

const DENIED = Object.freeze({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
});

const GRANTED = Object.freeze({
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
});

let signals = DENIED;
let source = 'pending';
let started = false;
const listeners = new Set();

const isBrowser = () => typeof window !== 'undefined';

/** True once the build has a Funding Choices publisher id behind it. */
export const isConsentManagerConfigured = () =>
  isBrowser() && window.__MAFQ_CMP_CONFIGURED__ === true;

export const getConsentSignals = () => signals;

/** Where the current signals came from: pending | tcf | no-gdpr | not-configured | timeout | error */
export const getConsentSource = () => source;

export const hasAnalyticsConsent = () => signals.analytics_storage === 'granted';

/**
 * Subscribe to consent changes. Fires on every CMP answer, including a later
 * one - a visitor who opens the message again and withdraws consent has to be
 * able to move a signal back to denied.
 *
 * Returns an unsubscribe function.
 */
export const onConsentChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const publish = (nextSignals, nextSource) => {
  signals = nextSignals;
  source = nextSource;

  // Tell Google's own tags first: gtag holds the update in the dataLayer even
  // when no tag has loaded yet, so a tag loading afterwards starts from the
  // answer rather than from the default.
  if (isBrowser() && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', nextSignals);
  }

  // Every answer is published, including one that repeats the last: a listener
  // that has not acted yet (analytics.js before gtag.js is loaded) has to see
  // the second 'granted' as readily as the first.
  listeners.forEach((listener) => {
    try {
      listener(signals, source);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Consent listener failed:', error);
      }
    }
  });
};

const signalsFromTcData = (tcData) => {
  const purposes = (tcData && tcData.purpose && tcData.purpose.consents) || {};
  const vendors = (tcData && tcData.vendor && tcData.vendor.consents) || {};

  const storage = purposes[PURPOSE_STORAGE] === true;
  const google = vendors[GOOGLE_VENDOR_ID] === true;

  return {
    // Analytics is first-party measurement: it needs permission to keep a
    // cookie, which is purpose 1, and nothing beyond it.
    analytics_storage: storage ? 'granted' : 'denied',
    ad_storage: storage && google ? 'granted' : 'denied',
    ad_user_data:
      storage && google && purposes[PURPOSE_AD_PERFORMANCE] === true ? 'granted' : 'denied',
    ad_personalization:
      google &&
      purposes[PURPOSE_ADS_PROFILE] === true &&
      purposes[PURPOSE_ADS_SELECT] === true
        ? 'granted'
        : 'denied',
  };
};

const handleTcData = (tcData, success) => {
  if (!success || !tcData) {
    publish(DENIED, 'error');
    return;
  }

  // gdprApplies === false is the CMP saying this visitor is outside the regime
  // it enforces, so it will never show them a message and there is no string to
  // read. Holding them at denied would mean no analytics for the site's own
  // region on the strength of a rule that does not reach them.
  if (tcData.gdprApplies === false) {
    publish(GRANTED, 'no-gdpr');
    return;
  }

  // cmpuishown means the message is on screen and unanswered - the visitor is
  // being asked right now, so the default stands until they answer.
  if (tcData.eventStatus === 'tcloaded' || tcData.eventStatus === 'useractioncomplete') {
    publish(signalsFromTcData(tcData), 'tcf');
  }
};

const waitForTcfApi = () => {
  let waited = 0;

  const poll = () => {
    if (typeof window.__tcfapi === 'function') {
      try {
        window.__tcfapi('addEventListener', 2, handleTcData);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to attach the TCF consent listener:', error);
        }
        publish(DENIED, 'error');
      }
      return;
    }

    waited += TCF_POLL_MS;
    if (waited >= TCF_WAIT_MS) {
      // No CMP answered. Denied is the only safe reading: a blocked or broken
      // consent script is not permission.
      publish(DENIED, 'timeout');
      return;
    }

    window.setTimeout(poll, TCF_POLL_MS);
  };

  poll();
};

/**
 * Start listening for the CMP's answer. Idempotent - call it from anywhere that
 * needs consent without worrying about who called it first.
 */
export const startConsentListener = () => {
  if (started || !isBrowser()) {
    return;
  }
  started = true;

  if (!isConsentManagerConfigured()) {
    // No publisher id in this build, so no message will ever be shown and no
    // one has been asked anything. Analytics stays off rather than running
    // unasked - see scripts/postbuild.js, which warns about this at build time.
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'No Funding Choices publisher ID configured (REACT_APP_FC_PUBLISHER_ID). ' +
          'Consent stays denied and Google Analytics will not load.'
      );
    }
    publish(DENIED, 'not-configured');
    return;
  }

  waitForTcfApi();
};

/**
 * Re-open the CMP so a visitor can review or withdraw what they chose. This is
 * the only way to change consent on this site, and CookieNotice.jsx is where it
 * is offered from.
 *
 * Returns true when the message was requested.
 */
export const openConsentManager = () => {
  if (!isBrowser() || !window.googlefc) {
    return false;
  }

  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({
    CONSENT_DATA_READY: () => {
      if (typeof window.googlefc.showRevocationMessage === 'function') {
        window.googlefc.showRevocationMessage();
      }
    },
  });

  return true;
};
