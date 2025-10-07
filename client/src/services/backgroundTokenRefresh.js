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
    this.lastRefreshTime = 0;
    this.minRefreshInterval = 30000; // Minimum 30 seconds between refreshes
    this.rateLimitBackoff = 0; // Backoff time when rate limited
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

    // Check if we're in rate limit backoff period
    const now = Date.now();
    if (this.rateLimitBackoff > now) {
      const remainingBackoff = Math.ceil((this.rateLimitBackoff - now) / 1000);
      console.log(`Rate limit backoff active, waiting ${remainingBackoff} seconds before next refresh attempt`);
      return;
    }

    // Check minimum refresh interval (but allow override for critical situations)
    const isCritical = refreshTiming.priority === 'high' && refreshTiming.timeUntilRefresh === 0;
    if (this.lastRefreshTime > 0 && (now - this.lastRefreshTime) < this.minRefreshInterval && !isCritical) {
      const remainingInterval = Math.ceil((this.minRefreshInterval - (now - this.lastRefreshTime)) / 1000);
      console.log(`Minimum refresh interval not met, waiting ${remainingInterval} seconds`);
      return;
    }

    // Schedule refresh if needed
    if (refreshTiming.shouldRefresh) {
      if (refreshTiming.timeUntilRefresh > 0) {
        this.scheduleRefresh(refreshTiming.timeUntilRefresh, refreshTiming.priority);
      } else {
        console.log('Token needs immediate refresh, executing now');
        this.forceRefresh().catch(error => {
          console.error('Immediate background refresh failed:', error);
        });
      }
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
        this.lastRefreshTime = Date.now();
        await this.refreshCallback();
        
        // Clear cache after successful refresh
        clearTokenValidationCache();
        
        console.log('Background token refresh completed successfully');
        
        // Reset rate limit backoff on successful refresh
        this.rateLimitBackoff = 0;
      } catch (error) {
        console.error('Background token refresh failed:', error);
        
        // Handle rate limiting
        if (error?.status === 429 || error?.error?.status === 429) {
          console.warn('Rate limited, setting backoff period');
          this.rateLimitBackoff = Date.now() + (15 * 60 * 1000); // 15 minutes backoff
          return; // Don't retry if rate limited
        }
        
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
    if (!this.refreshCallback || !this.store) {
      throw new Error('Refresh callback or store not initialized');
    }

    this.clearScheduledRefresh();
    
    try {
      console.log('Forcing immediate token refresh');
      this.lastRefreshTime = Date.now();
      await this.refreshCallback();
      clearTokenValidationCache();
      console.log('Forced token refresh completed');
      
      // Reset rate limit backoff on successful refresh
      this.rateLimitBackoff = 0;
    } catch (error) {
      console.error('Forced token refresh failed:', error);
      
      // Handle rate limiting
      if (error?.status === 429 || error?.error?.status === 429) {
        console.warn('Rate limited, setting backoff period');
        this.rateLimitBackoff = Date.now() + (15 * 60 * 1000); // 15 minutes backoff
      }
      
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
