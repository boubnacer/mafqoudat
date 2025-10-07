/**
 * Rate Limit Utilities
 * Provides utilities for handling rate limiting in token refresh operations
 */

/**
 * Parse retry-after header from various error response formats
 * @param {Object} error - Error object from failed request
 * @returns {number|null} Retry delay in milliseconds or null if not found
 */
export const parseRetryAfter = (error) => {
  // Check for retry-after in response headers
  const retryAfter = error?.response?.headers?.['retry-after'] || 
                    error?.headers?.['retry-after'] ||
                    error?.retryAfter ||
                    error?.data?.retryAfter;
  
  if (retryAfter) {
    // Convert to milliseconds (retry-after is usually in seconds)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
  }
  
  return null;
};

/**
 * Check if an error is a rate limiting error (429)
 * @param {Object} error - Error object to check
 * @returns {boolean} True if error is a rate limiting error
 */
export const isRateLimitError = (error) => {
  return error?.status === 429 || 
         error?.error?.status === 429 ||
         error?.response?.status === 429 ||
         error?.data?.code === 'RATE_LIMITED';
};

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds (default: 30000)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 15 minutes)
 * @returns {number} Delay in milliseconds
 */
export const calculateExponentialBackoff = (attempt, baseDelay = 30000, maxDelay = 15 * 60 * 1000) => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Get appropriate backoff delay for rate limiting
 * @param {Object} error - Error object from failed request
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
export const getRateLimitBackoffDelay = (error, attempt = 0) => {
  // First try to parse retry-after header
  const retryAfter = parseRetryAfter(error);
  if (retryAfter) {
    return retryAfter;
  }
  
  // Fall back to exponential backoff
  return calculateExponentialBackoff(attempt);
};

/**
 * Create a rate limit error handler
 * @param {Function} onRateLimit - Callback when rate limited
 * @param {Function} onRetry - Callback when retrying
 * @param {Function} onMaxRetries - Callback when max retries reached
 * @returns {Function} Error handler function
 */
export const createRateLimitHandler = (onRateLimit, onRetry, onMaxRetries) => {
  return (error, attempt, maxAttempts) => {
    if (isRateLimitError(error)) {
      const backoffDelay = getRateLimitBackoffDelay(error, attempt);
      
      if (onRateLimit) {
        onRateLimit(error, backoffDelay);
      }
      
      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(attempt + 1, backoffDelay);
        }
        return backoffDelay; // Return delay for retry
      } else {
        if (onMaxRetries) {
          onMaxRetries(error);
        }
        return null; // No retry
      }
    }
    
    return null; // Not a rate limit error
  };
};

/**
 * Rate limit detection and recovery manager
 */
export class RateLimitManager {
  constructor() {
    this.rateLimitBackoff = 0;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
  }

  /**
   * Check if we're currently in a rate limit backoff period
   * @returns {boolean} True if in backoff period
   */
  isInBackoff() {
    return this.rateLimitBackoff > Date.now();
  }

  /**
   * Get remaining backoff time in seconds
   * @returns {number} Remaining backoff time in seconds
   */
  getRemainingBackoff() {
    if (!this.isInBackoff()) {
      return 0;
    }
    return Math.ceil((this.rateLimitBackoff - Date.now()) / 1000);
  }

  /**
   * Set rate limit backoff
   * @param {number} delay - Backoff delay in milliseconds
   */
  setBackoff(delay) {
    this.rateLimitBackoff = Date.now() + delay;
  }

  /**
   * Handle rate limit error
   * @param {Object} error - Rate limit error
   * @returns {number} Backoff delay in milliseconds
   */
  handleRateLimit(error) {
    const backoffDelay = getRateLimitBackoffDelay(error, this.consecutiveFailures);
    this.setBackoff(backoffDelay);
    this.consecutiveFailures++;
    return backoffDelay;
  }

  /**
   * Reset failure tracking on successful operation
   */
  resetFailures() {
    this.consecutiveFailures = 0;
    this.rateLimitBackoff = 0;
  }

  /**
   * Get current status
   * @returns {Object} Current status information
   */
  getStatus() {
    return {
      isInBackoff: this.isInBackoff(),
      remainingBackoff: this.getRemainingBackoff(),
      consecutiveFailures: this.consecutiveFailures,
      maxConsecutiveFailures: this.maxConsecutiveFailures
    };
  }
}

// Create singleton instance
export const rateLimitManager = new RateLimitManager();
