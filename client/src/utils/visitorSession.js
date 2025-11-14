/**
 * Visitor Session Manager
 * Manages visitor session ID in localStorage for cross-origin cookie support
 */

const VISITOR_SESSION_KEY = 'visitorSessionId';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get or create visitor session ID
 * This function is synchronous and always returns the same ID for the same browser session
 * @returns {string} Session ID
 */
export const getVisitorSessionId = () => {
  try {
    const stored = localStorage.getItem(VISITOR_SESSION_KEY);
    
    if (stored) {
      try {
        const { sessionId, timestamp } = JSON.parse(stored);
        
        // Validate sessionId exists and is a string
        if (sessionId && typeof sessionId === 'string') {
          // Check if session is still valid (within 24 hours)
          const now = Date.now();
          if (timestamp && (now - timestamp < SESSION_DURATION)) {
            return sessionId;
          }
        }
      } catch (parseError) {
        // Invalid JSON, will create new session below
        console.debug('Invalid session data in localStorage, creating new session');
      }
      
      // Session expired or invalid, remove it
      localStorage.removeItem(VISITOR_SESSION_KEY);
    }
    
    // Create new session ID synchronously
    // This ensures all API calls use the same session ID
    const newSessionId = generateSessionId();
    const sessionData = {
      sessionId: newSessionId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(sessionData));
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
    const stored = localStorage.getItem(VISITOR_SESSION_KEY);
    if (!stored) return false;
    
    const { timestamp } = JSON.parse(stored);
    const now = Date.now();
    return (now - timestamp < SESSION_DURATION);
  } catch (error) {
    return false;
  }
};

