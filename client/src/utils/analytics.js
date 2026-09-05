// Google Analytics, behind the consent manager.
//
// Nothing in here runs until utils/consent.js reports analytics consent. The
// gtag.js snippet used to sit in public/index.html and load on every page view,
// which set the GA cookie before the visitor had been asked anything; the
// document now carries only the Consent Mode defaults (all denied) and the
// Funding Choices loader, and this module is what actually requests gtag.js -
// after the CMP has answered, and only if the answer was yes.

import {
  hasAnalyticsConsent,
  onConsentChange,
  startConsentListener,
} from './consent';

// Use environment variable if available, otherwise fallback to hardcoded ID
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-6CHWS73F4W';
let isGAInitialized = false;
let loadPromise = null;

/**
 * Check if Google Analytics script is already loaded in the HTML
 */
const isGAScriptLoaded = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if the script tag exists in the HTML
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  return !!existingScript;
};

/**
 * The dataLayer/gtag stub normally comes from the consent block in
 * public/index.html. Recreate it if some entry point (a prerendered shell that
 * predates that block, a test) is missing it, so the consent defaults and the
 * config below always have somewhere to go.
 */
const ensureGtagStub = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
};

/**
 * Load Google Analytics script dynamically
 * Returns a Promise that resolves when the script is loaded
 */
const loadGAScript = () => {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
      reject(new Error('GA Measurement ID not found or window is undefined'));
      return;
    }

    // Check if script is already loaded in HTML
    if (isGAScriptLoaded()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Analytics script'));

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Load gtag.js and configure the property. Only ever called from the consent
 * path below.
 */
const activateGA = async () => {
  if (isGAInitialized || typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }

  try {
    ensureGtagStub();
    await loadGAScript();

    // gtag() itself is the stub above, available synchronously; the loaded
    // library drains the dataLayer it has been filling.
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
    });

    isGAInitialized = true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }
};

/**
 * Initialize Google Analytics
 * This should be called once when the app loads. It does not load anything by
 * itself - it starts the consent listener and hands the decision to the CMP.
 * A visitor who accepts later (or reopens the message from the cookie notice
 * and accepts then) is picked up by the subscription rather than needing a
 * reload.
 */
export const initializeGA = () => {
  if (!GA_MEASUREMENT_ID) {
    // Only log in development to avoid console noise in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Google Analytics Measurement ID not found. Set REACT_APP_GA_MEASUREMENT_ID in your .env file.');
    }
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  startConsentListener();

  if (hasAnalyticsConsent()) {
    activateGA();
    return;
  }

  onConsentChange(() => {
    if (hasAnalyticsConsent()) {
      activateGA();
    }
  });
};

/**
 * Whether GA has actually been loaded and configured. Everything that reports
 * to GA checks this rather than window.gtag: the gtag stub exists on every page
 * from the consent block, so its presence says nothing about consent, and
 * pushing events into the dataLayer before an answer would only park them there
 * to be sent the moment one arrived.
 */
const isTrackingActive = () =>
  isGAInitialized && typeof window !== 'undefined' && typeof window.gtag === 'function';

/**
 * Track page views
 * Call this whenever the route changes in a React Router app
 */
export const trackPageView = (path, title) => {
  if (!isTrackingActive()) {
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track custom events
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!isTrackingActive()) {
    return;
  }

  window.gtag('event', eventName, eventParams);
};

/**
 * Track when a user creates a post
 */
export const trackPostCreation = (postId, category, type) => {
  trackEvent('create_post', {
    post_id: postId,
    category: category,
    post_type: type, // 'lost' or 'found'
  });
};

/**
 * Track when a user signs up
 */
export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', {
    method: method,
  });
};

/**
 * Track when a user logs in
 */
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method,
  });
};

/**
 * Track when a user searches
 */
export const trackSearch = (searchTerm) => {
  trackEvent('search', {
    search_term: searchTerm,
  });
};

/**
 * Track when a user views a post
 */
export const trackPostView = (postId, category, type) => {
  trackEvent('view_post', {
    post_id: postId,
    category: category,
    post_type: type,
  });
};

/**
 * Track when a user contacts another user about a post
 */
export const trackContactUser = (postId) => {
  trackEvent('contact_user', {
    post_id: postId,
  });
};

/**
 * Track when a user shares a post
 */
export const trackShare = (postId, method) => {
  trackEvent('share', {
    post_id: postId,
    method: method, // 'facebook', 'twitter', 'whatsapp', etc.
  });
};

