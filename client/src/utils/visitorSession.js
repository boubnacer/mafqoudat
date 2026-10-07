/**
 * Visitor Session Manager
 * Uses sessionStorage so each browser session (tab/window) counts as 1 visit
 * Session expires after 1 hour of inactivity, creating a new visit
 * sessionStorage is also cleared when the browser tab/window closes
 */

const VISITOR_SESSION_KEY = 'visitorSessionId';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Get or create visitor session ID
 * Uses sessionStorage and falls back to localStorage to maintain session across tabs
 * Session expires after 30 minutes of inactivity, creating a new visit
 * @returns {string} Session ID
 */
export const getVisitorSessionId = () => {
  try {
    const now = Date.now();
    let stored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    
    // If not in sessionStorage (e.g. new tab opened), check localStorage
    if (!stored) {
      try {
        stored = localStorage.getItem(VISITOR_SESSION_KEY);
      } catch (e) {
        // localStorage might be disabled, ignore
      }
    }

    let activeSessionId = null;

    if (stored) {
      try {
        const { sessionId, timestamp } = JSON.parse(stored);
        
        // Validate sessionId exists and is a string
        if (sessionId && typeof sessionId === 'string') {
          // Check if session is still valid (within 30 mins)
          if (timestamp && (now - timestamp < SESSION_DURATION)) {
            // Session is still valid
            activeSessionId = sessionId;
          }
        }
      } catch (parseError) {
        console.error('Invalid session data, creating new session', parseError);
      }
    }
    
    // If no valid session ID found or session expired, create a new one
    if (!activeSessionId) {
      activeSessionId = generateSessionId();
    }

    const sessionData = {
      sessionId: activeSessionId,
      timestamp: now
    };
    
    // Always update sessionStorage and localStorage with the refreshed timestamp (or new session)
    sessionStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(sessionData));
    try {
      localStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      // localStorage might be disabled, that's okay
    }
    
    return activeSessionId;
  } catch (error) {
    console.error('Error managing visitor session:', error);
    // Fallback: generate a new ID (but this won't persist)
    return generateSessionId();
  }
};

/**
 * Generate a unique session ID
 * @returns {string} Session ID
 */
const generateSessionId = () => {
  // Generate a UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

/**
 * Clear visitor session (for testing or logout)
 */
export const clearVisitorSession = () => {
  try {
    sessionStorage.removeItem(VISITOR_SESSION_KEY);
    localStorage.removeItem(VISITOR_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing visitor session:', error);
  }
};

/**
 * Check if visitor session exists and is valid (not expired)
 * @returns {boolean}
 */
export const hasValidVisitorSession = () => {
  try {
    const stored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!stored) return false;
    
    const { sessionId, timestamp } = JSON.parse(stored);
    
    // Check if session ID exists and session hasn't expired
    if (sessionId && typeof sessionId === 'string' && timestamp) {
      const now = Date.now();
      return (now - timestamp < SESSION_DURATION);
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

