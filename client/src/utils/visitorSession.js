/**
 * Visitor Session Manager
 * Uses sessionStorage so each browser session (tab/window) counts as 1 visit
 * sessionStorage is cleared when the browser tab/window closes, creating a new visit on next open
 */

const VISITOR_SESSION_KEY = 'visitorSessionId';

/**
 * Get or create visitor session ID
 * Uses sessionStorage so each browser session gets a new ID
 * When the browser tab/window closes, sessionStorage is cleared, so next visit = new session = new visit
 * @returns {string} Session ID
 */
export const getVisitorSessionId = () => {
  try {
    // Check sessionStorage first (cleared when tab/window closes)
    let stored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    
    if (stored) {
      try {
        const { sessionId } = JSON.parse(stored);
        
        // Validate sessionId exists and is a string
        if (sessionId && typeof sessionId === 'string') {
          return sessionId;
        }
      } catch (parseError) {
        // Invalid JSON, will create new session below
        console.debug('Invalid session data in sessionStorage, creating new session');
      }
    }
    
    // No valid session ID found - create a new one
    // This happens on:
    // 1. First visit (no sessionStorage)
    // 2. After browser tab/window is closed and reopened (sessionStorage cleared)
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
 * Check if visitor session exists and is valid
 * @returns {boolean}
 */
export const hasValidVisitorSession = () => {
  try {
    const stored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!stored) return false;
    
    const { sessionId } = JSON.parse(stored);
    return !!(sessionId && typeof sessionId === 'string');
  } catch (error) {
    return false;
  }
};

