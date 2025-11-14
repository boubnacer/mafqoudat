/**
 * Visitor Session Manager
 * Manages visitor session ID in localStorage for cross-origin cookie support
 */

const VISITOR_SESSION_KEY = 'visitorSessionId';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get or create visitor session ID
 * @returns {string} Session ID
 */
export const getVisitorSessionId = () => {
  try {
    const stored = localStorage.getItem(VISITOR_SESSION_KEY);
    
    if (stored) {
      const { sessionId, timestamp } = JSON.parse(stored);
      
      // Check if session is still valid (within 24 hours)
      const now = Date.now();
      if (now - timestamp < SESSION_DURATION) {
        return sessionId;
      }
      
      // Session expired, create new one
      localStorage.removeItem(VISITOR_SESSION_KEY);
    }
    
    // Create new session ID
    const newSessionId = generateSessionId();
    const sessionData = {
      sessionId: newSessionId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(sessionData));
    return newSessionId;
  } catch (error) {
    console.error('Error managing visitor session:', error);
    // Fallback: generate a new ID
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

