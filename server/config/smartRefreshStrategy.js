const { staticDataCacheManager } = require('./staticDataCache');
const { dataVersioningManager } = require('./dataVersioning');

/**
 * Smart Refresh Strategy
 * 
 * This system provides:
 * - Intelligent cache refresh based on data changes
 * - Version-aware cache invalidation
 * - Background refresh without service interruption
 * - Adaptive refresh intervals based on usage patterns
 * - Health monitoring and automatic recovery
 */

class SmartRefreshStrategy {
  constructor() {
    this.isRunning = false;
    this.refreshIntervals = new Map();
    this.refreshSchedules = new Map();
    this.healthChecks = new Map();
    this.usagePatterns = new Map();
    this.lastRefreshTimes = new Map();
    this.refreshCounts = new Map();
    
    // Configuration
    this.config = {
      // Base refresh intervals (in milliseconds)
      baseIntervals: {
        countries: 6 * 60 * 60 * 1000,    // 6 hours
        categories: 8 * 60 * 60 * 1000,   // 8 hours
        foundlost: 12 * 60 * 60 * 1000,   // 12 hours
        cities: 4 * 60 * 60 * 1000        // 4 hours
      },
      
      // Minimum refresh intervals (in milliseconds)
      minIntervals: {
        countries: 30 * 60 * 1000,        // 30 minutes
        categories: 30 * 60 * 1000,       // 30 minutes
        foundlost: 60 * 60 * 1000,        // 1 hour
        cities: 15 * 60 * 1000            // 15 minutes
      },
      
      // Maximum refresh intervals (in milliseconds)
      maxIntervals: {
        countries: 24 * 60 * 60 * 1000,   // 24 hours
        categories: 24 * 60 * 60 * 1000,  // 24 hours
        foundlost: 48 * 60 * 60 * 1000,   // 48 hours
        cities: 12 * 60 * 60 * 1000       // 12 hours
      },
      
      // Health check intervals
      healthCheckInterval: 5 * 60 * 1000,  // 5 minutes
      
      // Usage tracking window
      usageTrackingWindow: 60 * 60 * 1000, // 1 hour
      
      // Adaptive refresh factors
      adaptiveFactors: {
        highUsage: 0.5,      // Reduce interval by 50% for high usage
        lowUsage: 2.0,       // Increase interval by 100% for low usage
        errorRate: 0.3       // Reduce interval by 70% if error rate is high
      }
    };
    
    this.dataTypes = ['countries', 'categories', 'foundlost', 'cities'];
  }

  // Initialize the smart refresh strategy
  async initialize() {
    if (this.isRunning) {
      return;
    }

    console.log('🔄 Initializing Smart Refresh Strategy...');
    
    try {
      // Initialize usage tracking for each data type
      this.dataTypes.forEach(dataType => {
        this.usagePatterns.set(dataType, {
          requests: 0,
          lastReset: Date.now(),
          errors: 0,
          avgResponseTime: 0
        });
        
        this.refreshCounts.set(dataType, 0);
        this.lastRefreshTimes.set(dataType, null);
      });
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start adaptive refresh scheduling
      this.startAdaptiveRefresh();
      
      this.isRunning = true;
      console.log('✅ Smart Refresh Strategy initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Smart Refresh Strategy:', error);
      throw error;
    }
  }

  // Start health monitoring
  startHealthMonitoring() {
    const healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    this.healthChecks.set('main', healthCheckInterval);
  }

  // Perform health check
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date(),
        staticCache: staticDataCacheManager.isHealthy(),
        versioning: dataVersioningManager.isHealthy(),
        refreshStatus: {}
      };
      
      // Check refresh status for each data type
      for (const dataType of this.dataTypes) {
        const lastRefresh = this.lastRefreshTimes.get(dataType);
        const refreshCount = this.refreshCounts.get(dataType);
        const usage = this.usagePatterns.get(dataType);
        
        healthStatus.refreshStatus[dataType] = {
          lastRefresh,
          refreshCount,
          usage: {
            requests: usage.requests,
            errors: usage.errors,
            errorRate: usage.requests > 0 ? (usage.errors / usage.requests) * 100 : 0,
            avgResponseTime: usage.avgResponseTime
          }
        };
      }
      
      // Log health status if there are issues
      if (!healthStatus.staticCache || !healthStatus.versioning) {
        console.warn('⚠️ Health check detected issues:', healthStatus);
        
        // Attempt to recover
        await this.attemptRecovery();
      }
      
      return healthStatus;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return null;
    }
  }

  // Attempt recovery from health issues
  async attemptRecovery() {
    try {
      console.log('🔧 Attempting recovery...');
      
      // Reinitialize static data cache if unhealthy
      if (!staticDataCacheManager.isHealthy()) {
        console.log('🔄 Reinitializing static data cache...');
        await staticDataCacheManager.initialize();
      }
      
      // Reinitialize data versioning if unhealthy
      if (!dataVersioningManager.isHealthy()) {
        console.log('🔄 Reinitializing data versioning...');
        await dataVersioningManager.initialize();
      }
      
      console.log('✅ Recovery completed');
    } catch (error) {
      console.error('❌ Recovery failed:', error);
    }
  }

  // Start adaptive refresh scheduling
  startAdaptiveRefresh() {
    this.dataTypes.forEach(dataType => {
      this.scheduleAdaptiveRefresh(dataType);
    });
  }

  // Schedule adaptive refresh for a data type
  scheduleAdaptiveRefresh(dataType) {
    // Clear existing interval if any
    const existingInterval = this.refreshIntervals.get(dataType);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    // Calculate adaptive interval
    const interval = this.calculateAdaptiveInterval(dataType);
    
    // Schedule refresh
    const refreshInterval = setInterval(async () => {
      await this.performSmartRefresh(dataType);
    }, interval);
    
    this.refreshIntervals.set(dataType, refreshInterval);
    
    console.log(`📅 Scheduled adaptive refresh for ${dataType}: ${interval / 1000 / 60} minutes`);
  }

  // Calculate adaptive refresh interval based on usage patterns
  calculateAdaptiveInterval(dataType) {
    const baseInterval = this.config.baseIntervals[dataType];
    const minInterval = this.config.minIntervals[dataType];
    const maxInterval = this.config.maxIntervals[dataType];
    
    const usage = this.usagePatterns.get(dataType);
    if (!usage) {
      return baseInterval;
    }
    
    let adaptiveFactor = 1.0;
    
    // Adjust based on request volume (last hour)
    const requestsPerHour = usage.requests;
    if (requestsPerHour > 100) {
      // High usage - refresh more frequently
      adaptiveFactor *= this.config.adaptiveFactors.highUsage;
    } else if (requestsPerHour < 10) {
      // Low usage - refresh less frequently
      adaptiveFactor *= this.config.adaptiveFactors.lowUsage;
    }
    
    // Adjust based on error rate
    const errorRate = usage.requests > 0 ? (usage.errors / usage.requests) : 0;
    if (errorRate > 0.05) { // 5% error rate threshold
      // High error rate - refresh more frequently
      adaptiveFactor *= this.config.adaptiveFactors.errorRate;
    }
    
    // Calculate final interval
    const finalInterval = Math.max(
      minInterval,
      Math.min(maxInterval, baseInterval * adaptiveFactor)
    );
    
    return Math.round(finalInterval);
  }

  // Perform smart refresh for a data type
  async performSmartRefresh(dataType) {
    try {
      console.log(`🔄 Starting smart refresh for ${dataType}...`);
      
      const startTime = Date.now();
      
      // Check if data has actually changed using versioning
      const currentVersion = dataVersioningManager.getCurrentVersion(dataType);
      const lastRefreshVersion = this.getLastRefreshVersion(dataType);
      
      if (currentVersion === lastRefreshVersion) {
        console.log(`⏭️ Skipping refresh for ${dataType} - no changes detected (version ${currentVersion})`);
        return;
      }
      
      // Perform the refresh
      const success = await staticDataCacheManager.refreshDataType(dataType);
      
      const duration = Date.now() - startTime;
      
      if (success) {
        // Update tracking
        this.lastRefreshTimes.set(dataType, new Date());
        this.refreshCounts.set(dataType, (this.refreshCounts.get(dataType) || 0) + 1);
        this.setLastRefreshVersion(dataType, currentVersion);
        
        console.log(`✅ Smart refresh completed for ${dataType} in ${duration}ms (version ${currentVersion})`);
        
        // Update usage pattern
        this.updateUsagePattern(dataType, true, duration);
      } else {
        console.error(`❌ Smart refresh failed for ${dataType}`);
        
        // Update usage pattern with error
        this.updateUsagePattern(dataType, false, duration);
        
        // Reschedule with shorter interval for failed refresh
        this.rescheduleAfterFailure(dataType);
      }
      
      // Reschedule with new adaptive interval
      this.scheduleAdaptiveRefresh(dataType);
      
    } catch (error) {
      console.error(`❌ Smart refresh error for ${dataType}:`, error);
      this.updateUsagePattern(dataType, false, 0);
      this.rescheduleAfterFailure(dataType);
    }
  }

  // Update usage pattern for a data type
  updateUsagePattern(dataType, success, responseTime) {
    const usage = this.usagePatterns.get(dataType);
    if (!usage) {
      return;
    }
    
    // Reset usage tracking every hour
    const now = Date.now();
    if (now - usage.lastReset > this.config.usageTrackingWindow) {
      usage.requests = 0;
      usage.errors = 0;
      usage.avgResponseTime = 0;
      usage.lastReset = now;
    }
    
    usage.requests++;
    
    if (!success) {
      usage.errors++;
    }
    
    // Update average response time
    if (responseTime > 0) {
      if (usage.avgResponseTime === 0) {
        usage.avgResponseTime = responseTime;
      } else {
        usage.avgResponseTime = (usage.avgResponseTime + responseTime) / 2;
      }
    }
  }

  // Record a request for usage tracking
  recordRequest(dataType, success = true, responseTime = 0) {
    this.updateUsagePattern(dataType, success, responseTime);
  }

  // Get last refresh version for a data type
  getLastRefreshVersion(dataType) {
    // This would typically be stored in a persistent store
    // For now, we'll use a simple in-memory map
    return this.lastRefreshVersions?.get(dataType) || 0;
  }

  // Set last refresh version for a data type
  setLastRefreshVersion(dataType, version) {
    if (!this.lastRefreshVersions) {
      this.lastRefreshVersions = new Map();
    }
    this.lastRefreshVersions.set(dataType, version);
  }

  // Reschedule refresh after failure
  rescheduleAfterFailure(dataType) {
    const failureInterval = this.config.minIntervals[dataType] / 2; // Half of minimum interval
    
    setTimeout(() => {
      console.log(`🔄 Rescheduling refresh for ${dataType} after failure...`);
      this.scheduleAdaptiveRefresh(dataType);
    }, failureInterval);
  }

  // Force refresh for a specific data type
  async forceRefresh(dataType) {
    if (!this.dataTypes.includes(dataType)) {
      throw new Error(`Unknown data type: ${dataType}`);
    }
    
    console.log(`🔄 Force refresh requested for ${dataType}`);
    
    // Cancel existing scheduled refresh
    const existingInterval = this.refreshIntervals.get(dataType);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    // Perform immediate refresh
    await this.performSmartRefresh(dataType);
  }

  // Force refresh for all data types
  async forceRefreshAll() {
    console.log('🔄 Force refresh requested for all data types');
    
    const refreshPromises = this.dataTypes.map(dataType => this.forceRefresh(dataType));
    
    try {
      await Promise.all(refreshPromises);
      console.log('✅ Force refresh completed for all data types');
    } catch (error) {
      console.error('❌ Force refresh failed for some data types:', error);
    }
  }

  // Get refresh statistics
  getRefreshStats() {
    const stats = {
      isRunning: this.isRunning,
      refreshCounts: Object.fromEntries(this.refreshCounts),
      lastRefreshTimes: Object.fromEntries(this.lastRefreshTimes),
      usagePatterns: {},
      nextScheduledRefreshes: {}
    };
    
    // Add usage patterns
    for (const [dataType, usage] of this.usagePatterns) {
      stats.usagePatterns[dataType] = {
        requests: usage.requests,
        errors: usage.errors,
        errorRate: usage.requests > 0 ? (usage.errors / usage.requests) * 100 : 0,
        avgResponseTime: usage.avgResponseTime,
        lastReset: new Date(usage.lastReset)
      };
    }
    
    // Add next scheduled refresh times
    for (const dataType of this.dataTypes) {
      const lastRefresh = this.lastRefreshTimes.get(dataType);
      const interval = this.calculateAdaptiveInterval(dataType);
      
      if (lastRefresh) {
        const nextRefresh = new Date(lastRefresh.getTime() + interval);
        stats.nextScheduledRefreshes[dataType] = nextRefresh;
      }
    }
    
    return stats;
  }

  // Stop the refresh strategy
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    console.log('🛑 Stopping Smart Refresh Strategy...');
    
    // Clear all intervals
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.healthChecks.forEach(interval => clearInterval(interval));
    
    this.refreshIntervals.clear();
    this.healthChecks.clear();
    
    this.isRunning = false;
    console.log('✅ Smart Refresh Strategy stopped');
  }

  // Shutdown gracefully
  async shutdown() {
    console.log('🔌 Shutting down Smart Refresh Strategy...');
    
    this.stop();
    
    // Wait for any ongoing refreshes to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Smart Refresh Strategy shutdown complete');
  }
}

// Create singleton instance
const smartRefreshStrategy = new SmartRefreshStrategy();

module.exports = {
  smartRefreshStrategy,
  initializeSmartRefresh: () => smartRefreshStrategy.initialize(),
  getSmartRefresh: () => smartRefreshStrategy
};
