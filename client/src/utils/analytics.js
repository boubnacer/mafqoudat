// Google Analytics utility functions

// Use environment variable if available, otherwise fallback to hardcoded ID
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-6CHWS73F4W';
let isGAInitialized = false;

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
 * Load Google Analytics script dynamically (fallback if not in HTML)
 * Returns a Promise that resolves when the script is loaded
 */
const loadGAScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
      reject(new Error('GA Measurement ID not found or window is undefined'));
      return;
    }

    // Check if script is already loaded in HTML
    if (isGAScriptLoaded()) {
      resolve();
      return;
    }

    // Load the GA script dynamically as fallback
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Analytics script'));
    
    document.head.appendChild(script);
  });
};

/**
 * Check if the GA script in HTML has the placeholder (meaning build-time injection failed)
 */
const hasPlaceholderInHTML = () => {
  if (typeof document === 'undefined') {
    return false;
  }
  
  const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
  for (const script of scripts) {
    if (script.src && script.src.includes('GA_MEASUREMENT_ID_PLACEHOLDER')) {
      return true;
    }
  }
  
  // Also check inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  for (const script of inlineScripts) {
    if (script.textContent && script.textContent.includes('GA_MEASUREMENT_ID_PLACEHOLDER')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Fix placeholder in HTML at runtime (fallback if build-time injection failed)
 */
const fixPlaceholderAtRuntime = () => {
  if (typeof document === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }
  
  // Fix script src
  const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
  scripts.forEach(script => {
    if (script.src && script.src.includes('GA_MEASUREMENT_ID_PLACEHOLDER')) {
      script.src = script.src.replace('GA_MEASUREMENT_ID_PLACEHOLDER', GA_MEASUREMENT_ID);
    }
  });
  
  // Fix inline config scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  inlineScripts.forEach(script => {
    if (script.textContent && script.textContent.includes('GA_MEASUREMENT_ID_PLACEHOLDER')) {
      script.textContent = script.textContent.replace(/GA_MEASUREMENT_ID_PLACEHOLDER/g, GA_MEASUREMENT_ID);
    }
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
    // Check if placeholder is still in HTML (build-time injection failed)
    if (hasPlaceholderInHTML()) {
      console.log('⚠️  GA placeholder found in HTML, fixing at runtime...');
      fixPlaceholderAtRuntime();
    }
    
    // Check if script is already in HTML (from build-time injection or runtime fix)
    const scriptAlreadyLoaded = isGAScriptLoaded();
    
    if (!scriptAlreadyLoaded) {
      // Load the GA script dynamically if not in HTML
      await loadGAScript();
    }
    
    // Wait a bit for gtag to be available (especially if script was in HTML)
    let retries = 0;
    while (!window.gtag && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    // Initialize GA once script is loaded
    if (window.gtag) {
      // Only set 'js' date if not already set (script in HTML already does this)
      if (!scriptAlreadyLoaded) {
        window.gtag('js', new Date());
      }
      
      // Update config with current page info
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

