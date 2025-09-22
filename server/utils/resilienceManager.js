/**
 * Resilience Manager - Comprehensive error handling and application resilience
 * Handles database connections, retry logic, circuit breakers, and graceful degradation
 */

class ResilienceManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.retryConfigs = new Map();
    this.healthStatus = {
      database: 'unknown',
      redis: 'unknown',
      cloudinary: 'unknown',
      lastCheck: null
    };
    this.metrics = {
      failures: 0,
      successes: 0,
      retries: 0,
      circuitBreakerTrips: 0
    };
  }

  /**
   * Circuit Breaker Implementation
   */
  createCircuitBreaker(name, options = {}) {
    const config = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
      ...options
    };

    const circuitBreaker = {
      name,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      config,
      isHealthy: () => circuitBreaker.state === 'CLOSED' || circuitBreaker.state === 'HALF_OPEN'
    };

    this.circuitBreakers.set(name, circuitBreaker);
    return circuitBreaker;
  }

  async executeWithCircuitBreaker(name, operation, fallback = null) {
    const circuitBreaker = this.circuitBreakers.get(name);
    
    if (!circuitBreaker) {
      throw new Error(`Circuit breaker '${name}' not found`);
    }

    // Check if circuit breaker is open
    if (circuitBreaker.state === 'OPEN') {
      if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.config.resetTimeout) {
        circuitBreaker.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker '${name}' moved to HALF_OPEN state`);
      } else {
        console.log(`⚡ Circuit breaker '${name}' is OPEN, using fallback`);
        this.metrics.circuitBreakerTrips++;
        return fallback ? await fallback() : null;
      }
    }

    try {
      const result = await operation();
      
      // Success - reset failure count
      circuitBreaker.failures = 0;
      circuitBreaker.successes++;
      
      if (circuitBreaker.state === 'HALF_OPEN') {
        circuitBreaker.state = 'CLOSED';
        console.log(`✅ Circuit breaker '${name}' moved to CLOSED state`);
      }
      
      this.metrics.successes++;
      return result;
    } catch (error) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();
      this.metrics.failures++;

      // Check if we should open the circuit breaker
      if (circuitBreaker.failures >= circuitBreaker.config.failureThreshold) {
        circuitBreaker.state = 'OPEN';
        console.log(`🔴 Circuit breaker '${name}' opened due to ${circuitBreaker.failures} failures`);
      }

      // Try fallback if available
      if (fallback) {
        try {
          console.log(`🔄 Using fallback for '${name}' after failure`);
          return await fallback();
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for '${name}':`, fallbackError.message);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * Retry Logic Implementation
   */
  createRetryConfig(name, options = {}) {
    const config = {
      maxAttempts: options.maxAttempts || 3,
      baseDelay: options.baseDelay || 1000, // 1 second
      maxDelay: options.maxDelay || 10000, // 10 seconds
      backoffFactor: options.backoffFactor || 2,
      retryCondition: options.retryCondition || (error => true),
      ...options
    };

    this.retryConfigs.set(name, config);
    return config;
  }

  async executeWithRetry(name, operation, context = {}) {
    const config = this.retryConfigs.get(name);
    
    if (!config) {
      throw new Error(`Retry config '${name}' not found`);
    }

    let lastError;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ Operation '${name}' succeeded on attempt ${attempt}`);
          this.metrics.retries += (attempt - 1);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt === config.maxAttempts || !config.retryCondition(error)) {
          console.error(`❌ Operation '${name}' failed after ${attempt} attempts:`, error.message);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );

        console.log(`🔄 Retrying '${name}' in ${delay}ms (attempt ${attempt + 1}/${config.maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Health Check System
   */
  async performHealthChecks() {
    const checks = {
      database: this.checkDatabaseHealth(),
      redis: this.checkRedisHealth(),
      cloudinary: this.checkCloudinaryHealth()
    };

    const results = await Promise.allSettled(Object.values(checks));
    
    this.healthStatus.database = results[0].status === 'fulfilled' ? 'healthy' : 'unhealthy';
    this.healthStatus.redis = results[1].status === 'fulfilled' ? 'healthy' : 'unhealthy';
    this.healthStatus.cloudinary = results[2].status === 'fulfilled' ? 'healthy' : 'unhealthy';
    this.healthStatus.lastCheck = new Date();

    return {
      status: this.getOverallHealthStatus(),
      services: this.healthStatus,
      metrics: this.metrics,
      timestamp: this.healthStatus.lastCheck
    };
  }

  getOverallHealthStatus() {
    const services = Object.values(this.healthStatus).filter(status => status !== 'unknown');
    const healthyServices = services.filter(status => status === 'healthy');
    
    if (services.length === 0) return 'unknown';
    if (healthyServices.length === services.length) return 'healthy';
    if (healthyServices.length === 0) return 'unhealthy';
    return 'degraded';
  }

  async checkDatabaseHealth() {
    try {
      const mongoose = require('mongoose');
      const state = mongoose.connection.readyState;
      
      if (state === 1) { // Connected
        // Test with a simple query
        await mongoose.connection.db.admin().ping();
        return { status: 'healthy', connectionState: state };
      } else {
        throw new Error(`Database not connected. State: ${state}`);
      }
    } catch (error) {
      throw new Error(`Database health check failed: ${error.message}`);
    }
  }

  async checkRedisHealth() {
    try {
      const { cacheService } = require('../config/cache');
      
      // Test Redis connection with a simple operation
      await cacheService.set('health_check', 'test', 1);
      await cacheService.get('health_check');
      
      return { status: 'healthy' };
    } catch (error) {
      throw new Error(`Redis health check failed: ${error.message}`);
    }
  }

  async checkCloudinaryHealth() {
    try {
      const cloudinary = require('cloudinary').v2;
      
      // Test Cloudinary connection
      const result = await cloudinary.api.ping();
      
      if (result.status === 'ok') {
        return { status: 'healthy' };
      } else {
        throw new Error(`Cloudinary ping failed: ${result.status}`);
      }
    } catch (error) {
      throw new Error(`Cloudinary health check failed: ${error.message}`);
    }
  }

  /**
   * Graceful Degradation
   */
  async executeWithGracefulDegradation(operation, fallbackOperation, serviceName) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`⚠️ Service '${serviceName}' failed, using graceful degradation:`, error.message);
      
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        console.error(`❌ Fallback for '${serviceName}' also failed:`, fallbackError.message);
        throw fallbackError;
      }
    }
  }

  /**
   * Automatic Recovery
   */
  async attemptRecovery(serviceName) {
    console.log(`🔄 Attempting recovery for service: ${serviceName}`);
    
    switch (serviceName) {
      case 'database':
        return await this.recoverDatabase();
      case 'redis':
        return await this.recoverRedis();
      case 'cloudinary':
        return await this.recoverCloudinary();
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  async recoverDatabase() {
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState === 0) {
        // Try to reconnect
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database reconnection successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Database recovery failed:', error.message);
      return false;
    }
  }

  async recoverRedis() {
    try {
      const { cacheService } = require('../config/cache');
      
      // Try to reinitialize Redis connection
      if (cacheService.reconnect) {
        await cacheService.reconnect();
        console.log('✅ Redis reconnection successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Redis recovery failed:', error.message);
      return false;
    }
  }

  async recoverCloudinary() {
    // Cloudinary is stateless, so recovery is just a health check
    try {
      await this.checkCloudinaryHealth();
      console.log('✅ Cloudinary recovery successful');
      return true;
    } catch (error) {
      console.error('❌ Cloudinary recovery failed:', error.message);
      return false;
    }
  }

  /**
   * Get resilience metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, cb]) => ({
        name,
        state: cb.state,
        failures: cb.failures,
        successes: cb.successes
      })),
      healthStatus: this.healthStatus,
      overallHealth: this.getOverallHealthStatus()
    };
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  resetMetrics() {
    this.metrics = {
      failures: 0,
      successes: 0,
      retries: 0,
      circuitBreakerTrips: 0
    };
    
    // Reset circuit breakers
    for (const cb of this.circuitBreakers.values()) {
      cb.failures = 0;
      cb.successes = 0;
      cb.state = 'CLOSED';
    }
    
    console.log('🔄 Resilience metrics reset');
  }
}

// Create and configure the global resilience manager
const resilienceManager = new ResilienceManager();

// Configure circuit breakers
resilienceManager.createCircuitBreaker('database', {
  failureThreshold: 3,
  resetTimeout: 30000
});

resilienceManager.createCircuitBreaker('redis', {
  failureThreshold: 5,
  resetTimeout: 60000
});

resilienceManager.createCircuitBreaker('cloudinary', {
  failureThreshold: 3,
  resetTimeout: 30000
});

// Configure retry policies
resilienceManager.createRetryConfig('database', {
  maxAttempts: 3,
  baseDelay: 1000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on connection errors, not on query errors
    return error.name === 'MongoNetworkError' || 
           error.name === 'MongoTimeoutError' ||
           error.message.includes('connection');
  }
});

resilienceManager.createRetryConfig('cloudinary', {
  maxAttempts: 2,
  baseDelay: 2000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, not on validation errors
    return error.http_code >= 500 || error.message.includes('network');
  }
});

module.exports = resilienceManager;
