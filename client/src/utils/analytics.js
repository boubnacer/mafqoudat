// Google Analytics utility functions

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;
let isGAInitialized = false;

/**
 * Load Google Analytics script dynamically
 * Returns a Promise that resolves when the script is loaded
 */
const loadGAScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
      reject(new Error('GA Measurement ID not found or window is undefined'));
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
    if (existingScript) {
      resolve();
      return;
    }

    // Load the GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Analytics script'));
    
    document.head.appendChild(script);
  });
};

/**
 * Initialize Google Analytics
 * This should be called once when the app loads
 */
export const initializeGA = async () => {
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

  // Don't initialize twice
  if (isGAInitialized) {
    return;
  }

  try {
    // Load the GA script and wait for it to load
    await loadGAScript();
    
    // Initialize GA once script is loaded
    if (window.gtag) {
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      });
      isGAInitialized = true;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }
};

/**
 * Track page views
 * Call this whenever the route changes in a React Router app
 */
export const trackPageView = (path, title) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
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
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
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

