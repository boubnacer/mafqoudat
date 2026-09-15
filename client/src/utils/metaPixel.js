// Facebook/Meta Pixel, behind the same consent manager as Google Analytics
// (utils/analytics.js).
//
// The Pixel snippet used to sit in public/index.html and fire fbq('init', ...)
// / fbq('track', 'PageView') unconditionally on every page load, before the
// Consent Mode defaults were even set and with no dependency on utils/consent.js
// - exactly the gap analytics.js already closed for GA. This module applies the
// same fix: nothing requests fbevents.js or calls fbq() until consent.js
// reports ad consent (ad_storage + ad_user_data granted), and a later consent
// change is picked up the same way GA's is.

import { hasAdConsent, onConsentChange, startConsentListener } from './consent';

// No hardcoded fallback: an unset REACT_APP_FB_PIXEL_ID means this
// deployment cannot send to the Pixel, the same "no signal = not
// configured" rule utils/analytics.js's GA_MEASUREMENT_ID and consent.js's
// FC_PUBLISHER_ID already follow. The old fallback was a real production
// Pixel ID, so any deployment that forgot to set the env var - a preview
// build, a fork, a misconfigured staging env - silently sent its traffic
// into the production account's real analytics instead of nowhere.
const PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID;
let isPixelInitialized = false;

const loadPixelScript = () => {
  if (typeof window === 'undefined' || window.fbq) {
    return;
  }

  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
};

const activatePixel = () => {
  if (isPixelInitialized || typeof window === 'undefined' || !PIXEL_ID) {
    return;
  }

  loadPixelScript();
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  isPixelInitialized = true;
};

/**
 * Start listening for consent and hand the Pixel to it. Call once on app load,
 * same as initializeGA - it loads nothing by itself.
 */
export const initializeMetaPixel = () => {
  if (typeof window === 'undefined' || !PIXEL_ID) {
    return;
  }

  startConsentListener();

  if (hasAdConsent()) {
    activatePixel();
  }

  // Consent can change in both directions after this runs. A visitor who
  // grants later gets the pixel activated for the first time (the branch
  // above only fires immediately if consent was already granted at start-up).
  // One who withdraws after granting has to actually stop the pixel from
  // sending data, not just never be activated again - the old version of
  // this listener only ever checked "granted", so a withdrawal here did
  // nothing and the already-loaded pixel just kept firing. fbq's own
  // 'consent' command (distinct from the Consent Mode v2 signals consent.js
  // publishes, which only Google's gtag understands) is Meta's documented
  // way to pause/resume a pixel that is already loaded.
  onConsentChange(() => {
    if (hasAdConsent()) {
      if (isPixelInitialized) {
        window.fbq('consent', 'grant');
      } else {
        activatePixel();
      }
    } else if (isPixelInitialized) {
      window.fbq('consent', 'revoke');
    }
  });
};

/**
 * Track a custom Pixel event. No-ops until consent has activated the Pixel.
 */
export const trackPixelEvent = (eventName, params = {}) => {
  if (!isPixelInitialized || typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }

  window.fbq('track', eventName, params);
};
