import { getOptimizedTokenValidation, getTokenRefreshTiming, clearTokenValidationCache } from '../utils/optimizedTokenUtils';
import { rateLimitManager, isRateLimitError, getRateLimitBackoffDelay } from '../utils/rateLimitUtils';

/**
 * Background Token Refresh Service
 * Handles proactive token refresh to prevent authentication interruptions
 * Enhanced with proper rate limiting, exponential backoff, and request deduplication
 */
class BackgroundTokenRefreshService {
  constructor() {
    this.refreshTimeout = null;
    this.isActive = false;
    this.refreshCallback = null;
    this.store = null;
    this.checkInterval = null;
    this.lastRefreshTime = 0;
    this.minRefreshInterval = 60000; // Minimum 60 seconds between refreshes (increased from 30s)
    this.rateLimitBackoff = 0; // Backoff time when rate limited
    this.isRefreshing = false; // Prevent simultaneous refresh requests
    this.refreshPromise = null; // Store ongoing refresh promise
    this.consecutiveFailures = 0; // Track consecutive failures for exponential backoff
    this.maxConsecutiveFailures = 3; // Max failures before extended backoff
    this.baseBackoffDelay = 30000; // Base 30 seconds backoff
    this.maxBackoffDelay = 15 * 60 * 1000; // Max 15 minutes backoff
    this.retryAfterHeader = null; // Store retry-after header from 429 responses
  }

  /**
   * Initialize the background refresh service
   * @param {Function} refreshCallback - Callback to execute token refresh
   * @param {Object} store - Redux store for state access
   */
  initialize(refreshCallback, store) {
    try {
      this.refreshCallback = refreshCallback;
      this.store = store;
      this.isActive = true;
      
      // Start periodic token health checks
      this.startHealthChecks();
      
      console.log('Background token refresh service initialized');
    } catch (error) {
      console.error('Error initializing background token refresh service:', error);
      // Attempt to recover by stopping and reinitializing
      this.stop();
      throw error;
    }
  }

  /**
   * Start periodic health checks for token status
   */
  startHealthChecks() {
    // Check token health every 30 seconds
    this.checkInterval = setInterval(() => {
      if (this.isActive) {
        try {
          this.checkTokenHealth();
        } catch (error) {
          console.error('Error in health check interval:', error);
          // Continue running the interval even if one check fails
        }
      }
    }, 30000);
  }

  /**
   * Check token health and schedule refresh if needed
   */
  checkTokenHealth() {
    try {
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

      // Check if we're already refreshing to prevent duplicate requests
      if (this.isRefreshing) {
        console.log('Refresh already in progress, skipping health check');
        return;
      }

      // Check if we're in rate limit backoff period
      if (rateLimitManager.isInBackoff()) {
        const remainingBackoff = rateLimitManager.getRemainingBackoff();
        console.log(`Rate limit backoff active, waiting ${remainingBackoff} seconds before next refresh attempt`);
        return;
      }

      // Check minimum refresh interval (but allow override for critical situations)
      const now = Date.now(); // Fix: Define 'now' variable properly
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
    } catch (error) {
      console.error('Error in checkTokenHealth:', error);
      // Don't let the error crash the service - continue running
      // The service will retry on the next health check interval
    }
  }

  /**
   * Calculate exponential backoff delay (fallback method)
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateBackoffDelay(attempt) {
    const exponentialDelay = this.baseBackoffDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, this.maxBackoffDelay);
  }

  /**
   * Schedule a token refresh with enhanced rate limiting
   * @param {number} delay - Delay in milliseconds
   * @param {string} priority - Refresh priority (low, medium, high)
   */
  scheduleRefresh(delay, priority = 'medium') {
    try {
      // Clear existing refresh timeout
      this.clearScheduledRefresh();

      // Don't schedule if already refreshing
      if (this.isRefreshing) {
        console.log('Token refresh already in progress, skipping background refresh');
        return;
      }

      // Don't schedule if already refreshing in Redux state
      if (this.store) {
        const state = this.store.getState();
        if (state.auth?.isRefreshing) {
          console.log('Token refresh already in progress (Redux state), skipping background refresh');
          return;
        }
      }

      console.log(`Scheduling background token refresh in ${delay}ms (priority: ${priority})`);

      this.refreshTimeout = setTimeout(async () => {
        try {
          await this.executeRefresh(priority);
        } catch (error) {
          console.error('Error in scheduled refresh execution:', error);
        }
      }, delay);
    } catch (error) {
      console.error('Error in scheduleRefresh:', error);
    }
  }

  /**
   * Execute token refresh with proper error handling and backoff
   * @param {string} priority - Refresh priority
   */
  async executeRefresh(priority = 'medium') {
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping duplicate request');
      return;
    }

    this.isRefreshing = true;
    this.refreshPromise = null;

    try {
      console.log(`Executing background token refresh (priority: ${priority})`);
      this.lastRefreshTime = Date.now();
      
      // Execute the refresh callback
      this.refreshPromise = this.refreshCallback();
      await this.refreshPromise;
      
      // Clear cache after successful refresh
      clearTokenValidationCache();
      
      console.log('Background token refresh completed successfully');
      
      // Reset failure tracking on successful refresh
      this.consecutiveFailures = 0;
      rateLimitManager.resetFailures();
      
    } catch (error) {
      console.error('Background token refresh failed:', error);
      this.consecutiveFailures++;
      
      // Handle rate limiting (429 errors)
      if (isRateLimitError(error)) {
        const backoffDelay = rateLimitManager.handleRateLimit(error);
        
        console.warn(`Rate limited, setting backoff period of ${Math.ceil(backoffDelay / 1000)} seconds`);
        
        // Don't retry immediately for rate limiting
        return;
      }
      
      // Handle other errors with exponential backoff
      if (this.consecutiveFailures <= this.maxConsecutiveFailures) {
        const retryDelay = this.calculateBackoffDelay(this.consecutiveFailures - 1);
        console.log(`Retrying background refresh in ${Math.ceil(retryDelay / 1000)} seconds (attempt ${this.consecutiveFailures})`);
        
        // Only retry for high priority refreshes or if we haven't exceeded max failures
        if (priority === 'high' || this.consecutiveFailures < this.maxConsecutiveFailures) {
          this.scheduleRefresh(retryDelay, 'medium');
        }
      } else {
        console.error('Max consecutive failures reached, stopping background refresh attempts');
        this.rateLimitBackoff = Date.now() + this.maxBackoffDelay;
      }
      
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
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
    try {
      if (!this.refreshCallback || !this.store) {
        throw new Error('Refresh callback or store not initialized');
      }

      this.clearScheduledRefresh();
      
      // If already refreshing, return the existing promise
      if (this.isRefreshing && this.refreshPromise) {
        console.log('Refresh already in progress, returning existing promise');
        return this.refreshPromise;
      }
      
      return this.executeRefresh('high');
    } catch (error) {
      console.error('Error in forceRefresh:', error);
      throw error; // Re-throw to maintain expected behavior for callers
    }
  }

  /**
   * Get the current refresh promise if one exists
   * @returns {Promise|null} Current refresh promise or null
   */
  getCurrentRefreshPromise() {
    return this.refreshPromise;
  }

  /**
   * Check if a refresh is currently in progress
   * @returns {boolean} True if refresh is in progress
   */
  isRefreshInProgress() {
    return this.isRefreshing;
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
    
    // Reset all state
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.consecutiveFailures = 0;
    rateLimitManager.resetFailures();
    
    console.log('Background token refresh service stopped');
  }

  /**
   * Recover from critical errors by restarting the service
   * @param {Function} refreshCallback - Callback to execute token refresh
   * @param {Object} store - Redux store for state access
   */
  recover(refreshCallback, store) {
    console.log('Attempting to recover background token refresh service...');
    try {
      this.stop();
      this.initialize(refreshCallback, store);
      console.log('Background token refresh service recovered successfully');
    } catch (error) {
      console.error('Failed to recover background token refresh service:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    const rateLimitStatus = rateLimitManager.getStatus();
    return {
      isActive: this.isActive,
      hasScheduledRefresh: !!this.refreshTimeout,
      isHealthCheckActive: !!this.checkInterval,
      isRefreshing: this.isRefreshing,
      consecutiveFailures: this.consecutiveFailures,
      rateLimitBackoff: rateLimitStatus.remainingBackoff,
      lastRefreshTime: this.lastRefreshTime,
      rateLimitStatus: rateLimitStatus
    };
  }
}

// Create singleton instance
const backgroundTokenRefreshService = new BackgroundTokenRefreshService();

export default backgroundTokenRefreshService;
