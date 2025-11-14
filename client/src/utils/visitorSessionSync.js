/**
 * Visitor Session Sync
 * Syncs visitor session ID from server to localStorage
 */

import { getVisitorSessionId } from './visitorSession';

/**
 * Initialize visitor session on app load
 * Calls the backend to get/sync the session ID
 */
export const initializeVisitorSession = async () => {
  try {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
    const existingSessionId = getVisitorSessionId();
    
    // Call backend to sync session ID
    const response = await fetch(`${baseUrl}/visitor-session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Visitor-Session': existingSessionId || '',
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.sessionId) {
        // Update localStorage with the session ID from server
        const sessionData = {
          sessionId: data.sessionId,
          timestamp: Date.now()
        };
        
        localStorage.setItem('visitorSessionId', JSON.stringify(sessionData));
        console.log('✅ Visitor session synced:', data.sessionId.substring(0, 8) + '...');
      }
    }
  } catch (error) {
    // Silently fail - not critical, will use localStorage session ID
    console.debug('Could not sync visitor session from server:', error);
    // Fallback: ensure we have a session ID in localStorage
    getVisitorSessionId();
  }
};

