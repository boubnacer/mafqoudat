/**
 * Visitor Session Manager
 * Uses sessionStorage so each browser session (tab/window) counts as 1 visit
 * Session expires after 1 hour of inactivity, creating a new visit
 * sessionStorage is also cleared when the browser tab/window closes
 */

const VISITOR_SESSION_KEY = 'visitorSessionId';
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get or create visitor session ID
 * Uses sessionStorage so each browser session gets a new ID
 * Session expires after 1 hour, creating a new visit
 * When the browser tab/window closes, sessionStorage is cleared, so next visit = new session = new visit
 * @returns {string} Session ID
 */
export const getVisitorSessionId = () => {
  try {
    // Check sessionStorage first (cleared when tab/window closes)
    let stored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    
    if (stored) {
      try {
        const { sessionId, timestamp } = JSON.parse(stored);
        
        // Validate sessionId exists and is a string
        if (sessionId && typeof sessionId === 'string') {
          // Check if session is still valid (within 1 hour)
          const now = Date.now();
          if (timestamp && (now - timestamp < SESSION_DURATION)) {
            // Session is still valid, return existing ID
            return sessionId;
          } else {
            // Session expired (older than 1 hour), create new one
            console.debug('Session expired (older than 1 hour), creating new session');
            sessionStorage.removeItem(VISITOR_SESSION_KEY);
            // Continue to create new session below
          }
        }
      } catch (parseError) {
        // Invalid JSON, will create new session below
        console.debug('Invalid session data in sessionStorage, creating new session');
        sessionStorage.removeItem(VISITOR_SESSION_KEY);
      }
    }
    
    // No valid session ID found or session expired - create a new one
    // This happens on:
    // 1. First visit (no sessionStorage)
    // 2. After browser tab/window is closed and reopened (sessionStorage cleared)
    // 3. After 1 hour of inactivity (session expired)
    const newSessionId = generateSessionId();
    const sessionData = {
      sessionId: newSessionId,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(sessionData));
    
    // Also store in localStorage as backup (for cross-tab consistency)
    // But we primarily use sessionStorage to detect new browser sessions
    try {
      localStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      // localStorage might be disabled, that's okay
    }
    
    return newSessionId;
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
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
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

