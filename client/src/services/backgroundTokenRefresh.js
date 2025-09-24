import { getOptimizedTokenValidation, getTokenRefreshTiming, clearTokenValidationCache } from '../utils/optimizedTokenUtils';

/**
 * Background Token Refresh Service
 * Handles proactive token refresh to prevent authentication interruptions
 */
class BackgroundTokenRefreshService {
  constructor() {
    this.refreshTimeout = null;
    this.isActive = false;
    this.refreshCallback = null;
    this.store = null;
    this.checkInterval = null;
  }

  /**
   * Initialize the background refresh service
   * @param {Function} refreshCallback - Callback to execute token refresh
   * @param {Object} store - Redux store for state access
   */
  initialize(refreshCallback, store) {
    this.refreshCallback = refreshCallback;
    this.store = store;
    this.isActive = true;
    
    // Start periodic token health checks
    this.startHealthChecks();
    
    console.log('Background token refresh service initialized');
  }

  /**
   * Start periodic health checks for token status
   */
  startHealthChecks() {
    // Check token health every 30 seconds
    this.checkInterval = setInterval(() => {
      if (this.isActive) {
        this.checkTokenHealth();
      }
    }, 30000);
  }

  /**
   * Check token health and schedule refresh if needed
   */
  checkTokenHealth() {
    if (!this.store || !this.refreshCallback) return;

    const state = this.store.getState();
    const token = state.auth?.token;

    if (!token) {
      this.clearScheduledRefresh();
      return;
    }

    const validation = getOptimizedTokenValidation(token);
    const refreshTiming = getTokenRefreshTiming(token);

    // If token is invalid or expired, don't schedule refresh
    if (!validation.isValid) {
      console.warn('Token is invalid, not scheduling background refresh');
      this.clearScheduledRefresh();
      return;
    }

    // Schedule refresh if needed
    if (refreshTiming.shouldRefresh && refreshTiming.timeUntilRefresh > 0) {
      this.scheduleRefresh(refreshTiming.timeUntilRefresh, refreshTiming.priority);
    }
  }

  /**
   * Schedule a token refresh
   * @param {number} delay - Delay in milliseconds
   * @param {string} priority - Refresh priority (low, medium, high)
   */
  scheduleRefresh(delay, priority = 'medium') {
    // Clear existing refresh timeout
    this.clearScheduledRefresh();

    // Don't schedule if already refreshing
    const state = this.store.getState();
    if (state.auth?.isRefreshing) {
      console.log('Token refresh already in progress, skipping background refresh');
      return;
    }

    console.log(`Scheduling background token refresh in ${delay}ms (priority: ${priority})`);

    this.refreshTimeout = setTimeout(async () => {
      try {
        console.log(`Executing background token refresh (priority: ${priority})`);
        await this.refreshCallback();
        
        // Clear cache after successful refresh
        clearTokenValidationCache();
        
        console.log('Background token refresh completed successfully');
      } catch (error) {
        console.error('Background token refresh failed:', error);
        
        // Retry with exponential backoff for high priority refreshes
        if (priority === 'high') {
          const retryDelay = Math.min(delay * 2, 60000); // Max 1 minute
          console.log(`Retrying background refresh in ${retryDelay}ms`);
          this.scheduleRefresh(retryDelay, 'medium');
        }
      }
    }, delay);
  }

  /**
   * Clear scheduled refresh timeout
   */
  clearScheduledRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  /**
   * Force immediate token refresh
   */
  async forceRefresh() {
    if (!this.refreshCallback) {
      throw new Error('Refresh callback not initialized');
    }

    this.clearScheduledRefresh();
    
    try {
      console.log('Forcing immediate token refresh');
      await this.refreshCallback();
      clearTokenValidationCache();
      console.log('Forced token refresh completed');
    } catch (error) {
      console.error('Forced token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Stop the background refresh service
   */
  stop() {
    this.isActive = false;
    this.clearScheduledRefresh();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('Background token refresh service stopped');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      hasScheduledRefresh: !!this.refreshTimeout,
      isHealthCheckActive: !!this.checkInterval
    };
  }
}

// Create singleton instance
const backgroundTokenRefreshService = new BackgroundTokenRefreshService();

export default backgroundTokenRefreshService;
