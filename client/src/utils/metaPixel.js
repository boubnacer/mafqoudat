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

const PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID || '822628638471721';
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
  if (isPixelInitialized || typeof window === 'undefined') {
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
  if (typeof window === 'undefined') {
    return;
  }

  startConsentListener();

  if (hasAdConsent()) {
    activatePixel();
    return;
  }

  onConsentChange(() => {
    if (hasAdConsent()) {
      activatePixel();
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
