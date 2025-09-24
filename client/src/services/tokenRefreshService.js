import { store } from '../app/store';
import { selectCurrentToken, selectIsRefreshing } from '../features/auth/authSlice';
import { useRefreshMutation } from '../features/auth/authApiSlice';
import { isTokenExpired, isTokenExpiringSoon, getTokenTimeRemaining } from '../utils/tokenUtils';

/**
 * Proactive Token Refresh Service
 * 
 * Monitors token expiration and automatically refreshes tokens before they expire
 * Provides centralized token management and refresh coordination
 */

class TokenRefreshService {
  constructor() {
    this.refreshTimer = null;
    this.validationInterval = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.listeners = new Set();
    
    // Configuration
    this.config = {
      refreshThreshold: 2 * 60 * 1000, // 2 minutes before expiry
      validationInterval: 30 * 1000, // Check every 30 seconds
      maxRefreshAttempts: 3,
      retryDelay: 1000, // Base delay for retries
    };
    
    this.start();
  }

  /**
   * Start the token refresh service
   */
  start() {
    console.log('Token refresh service started');
    this.setupValidationInterval();
    this.checkAndRefreshToken();
  }

  /**
   * Stop the token refresh service
   */
  stop() {
    console.log('Token refresh service stopped');
    this.clearTimers();
    this.listeners.clear();
  }

  /**
   * Add a listener for token refresh events
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in token refresh listener:', error);
      }
    });
  }

  /**
   * Setup periodic validation interval
   */
  setupValidationInterval() {
    this.clearValidationInterval();
    
    this.validationInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.config.validationInterval);
  }

  /**
   * Clear validation interval
   */
  clearValidationInterval() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    this.clearRefreshTimer();
    this.clearValidationInterval();
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get current token from store
   */
  getCurrentToken() {
    const state = store.getState();
    return selectCurrentToken(state);
  }

  /**
   * Check if currently refreshing
   */
  isCurrentlyRefreshing() {
    const state = store.getState();
    return selectIsRefreshing(state);
  }

  /**
   * Check token and refresh if needed
   */
  async checkAndRefreshToken() {
    const token = this.getCurrentToken();
    
    if (!token) {
      this.notifyListeners('NO_TOKEN', { message: 'No token available' });
      return;
    }

    if (this.isCurrentlyRefreshing()) {
      console.log('Token refresh already in progress, skipping check');
      return;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token is expired, attempting refresh');
      this.notifyListeners('TOKEN_EXPIRED', { token });
      await this.attemptRefresh();
      return;
    }

    // Check if token is expiring soon
    if (isTokenExpiringSoon(token)) {
      console.log('Token is expiring soon, scheduling refresh');
      this.notifyListeners('TOKEN_EXPIRING_SOON', { token });
      this.scheduleRefresh();
      return;
    }

    // Token is valid, schedule next check
    this.scheduleRefresh();
  }

  /**
   * Schedule token refresh based on expiration time
   */
  scheduleRefresh() {
    const token = this.getCurrentToken();
    if (!token) return;

    this.clearRefreshTimer();

    const timeRemaining = getTokenTimeRemaining(token);
    const refreshTime = Math.max(timeRemaining - this.config.refreshThreshold, 0);

    if (refreshTime > 0) {
      console.log(`Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`);
      
      this.refreshTimer = setTimeout(() => {
        this.attemptRefresh();
      }, refreshTime);
    } else {
      // Token expires very soon, refresh immediately
      this.attemptRefresh();
    }
  }

  /**
   * Attempt to refresh the token
   */
  async attemptRefresh() {
    if (this.isRefreshing || this.isCurrentlyRefreshing()) {
      console.log('Refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    console.log('Attempting token refresh...');
    this.isRefreshing = true;
    this.notifyListeners('REFRESH_STARTED', {});

    try {
      this.refreshPromise = this.performRefresh();
      const result = await this.refreshPromise;
      
      console.log('Token refresh successful');
      this.notifyListeners('REFRESH_SUCCESS', { result });
      
      // Schedule next refresh
      this.scheduleRefresh();
      
      return result;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.notifyListeners('REFRESH_FAILED', { error });
      
      // Handle refresh failure
      this.handleRefreshFailure(error);
      
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual refresh request
   */
  async performRefresh() {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }

    return await response.json();
  }

  /**
   * Handle refresh failure
   */
  handleRefreshFailure(error) {
    console.error('Token refresh failed, user will need to re-authenticate:', error);
    
    // Clear all timers
    this.clearTimers();
    
    // Notify listeners of failure
    this.notifyListeners('REFRESH_FAILED', { error });
    
    // The auth slice will handle logout automatically
  }

  /**
   * Force refresh token (for manual triggers)
   */
  async forceRefresh() {
    console.log('Force refreshing token...');
    this.clearRefreshTimer();
    return await this.attemptRefresh();
  }

  /**
   * Get token status information
   */
  getTokenStatus() {
    const token = this.getCurrentToken();
    
    if (!token) {
      return {
        hasToken: false,
        isValid: false,
        isExpired: true,
        isExpiringSoon: false,
        timeRemaining: 0,
        isRefreshing: this.isRefreshing || this.isCurrentlyRefreshing()
      };
    }

    return {
      hasToken: true,
      isValid: !isTokenExpired(token),
      isExpired: isTokenExpired(token),
      isExpiringSoon: isTokenExpiringSoon(token),
      timeRemaining: getTokenTimeRemaining(token),
      isRefreshing: this.isRefreshing || this.isCurrentlyRefreshing()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Token refresh service config updated:', this.config);
    
    // Restart validation interval with new settings
    this.setupValidationInterval();
  }
}

// Create singleton instance
const tokenRefreshService = new TokenRefreshService();

// Export the service instance
export default tokenRefreshService;

// Export the class for testing
export { TokenRefreshService };
