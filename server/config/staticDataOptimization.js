const { staticDataCacheManager } = require('./staticDataCache');
const { dataVersioningManager } = require('./dataVersioning');
const { smartRefreshStrategy } = require('./smartRefreshStrategy');
const { efficientLoadingStrategies } = require('./efficientLoadingStrategies');

/**
 * Static Data Optimization System
 * 
 * This is the main orchestrator that:
 * - Initializes all optimization components
 * - Coordinates between different systems
 * - Provides unified API for static data access
 * - Monitors performance and health
 * - Provides fallback mechanisms
 */

class StaticDataOptimizationSystem {
  constructor() {
    this.isInitialized = false;
    this.initializationStartTime = null;
    this.components = {
      cacheManager: staticDataCacheManager,
      versioning: dataVersioningManager,
      refreshStrategy: smartRefreshStrategy,
      loadingStrategies: efficientLoadingStrategies
    };
    
    this.performanceMetrics = {
      initializationTime: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbQueries: 0,
      avgResponseTime: 0,
      lastReset: Date.now()
    };
    
    this.healthStatus = {
      overall: 'unknown',
      components: {},
      lastCheck: null
    };
  }

  // Initialize the entire optimization system
  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Static Data Optimization System already initialized');
      return;
    }

    this.initializationStartTime = Date.now();
    console.log('🚀 Initializing Static Data Optimization System...');
    
    try {
      // Step 1: Initialize data versioning first
      console.log('📝 Step 1: Initializing data versioning...');
      await this.components.versioning.initialize();
      
      // Step 2: Initialize efficient loading strategies
      console.log('📦 Step 2: Initializing efficient loading strategies...');
      await this.components.loadingStrategies.initialize();
      
      // Step 3: Initialize static data cache with optimized loading
      console.log('💾 Step 3: Initializing static data cache...');
      await this.components.cacheManager.initialize();
      
      // Step 4: Initialize smart refresh strategy
      console.log('🔄 Step 4: Initializing smart refresh strategy...');
      await this.components.refreshStrategy.initialize();
      
      // Step 5: Setup performance monitoring
      console.log('📊 Step 5: Setting up performance monitoring...');
      this.startPerformanceMonitoring();
      
      // Step 6: Setup health monitoring
      console.log('🏥 Step 6: Setting up health monitoring...');
      this.startHealthMonitoring();
      
      // Calculate initialization time
      this.performanceMetrics.initializationTime = Date.now() - this.initializationStartTime;
      
      this.isInitialized = true;
      
      console.log(`✅ Static Data Optimization System initialized successfully in ${this.performanceMetrics.initializationTime}ms`);
      console.log('📈 Expected performance improvements:');
      console.log('   - 95%+ reduction in database queries for static data');
      console.log('   - Sub-millisecond response times for cached data');
      console.log('   - Automatic cache refresh and invalidation');
      console.log('   - Memory-efficient data structures');
      
    } catch (error) {
      console.error('❌ Failed to initialize Static Data Optimization System:', error);
      await this.cleanup();
      throw error;
    }
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    // Monitor performance every 5 minutes
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 5 * 60 * 1000);
  }

  // Start health monitoring
  startHealthMonitoring() {
    // Monitor health every 2 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 2 * 60 * 1000);
  }

  // Collect performance metrics
  collectPerformanceMetrics() {
    try {
      const cacheStats = this.components.cacheManager.getStats();
      const refreshStats = this.components.refreshStrategy.getRefreshStats();
      const loadingStats = this.components.loadingStrategies.getLoadingStats();
      
      // Update performance metrics
      this.performanceMetrics.cacheHits += cacheStats.service.hits;
      this.performanceMetrics.cacheMisses += cacheStats.service.misses;
      this.performanceMetrics.totalRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
      
      // Calculate cache hit rate
      const cacheHitRate = this.performanceMetrics.totalRequests > 0 
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
        : 0;
      
      // Log performance summary
      if (this.performanceMetrics.totalRequests > 0) {
        console.log('📊 Performance Summary:');
        console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(2)}%`);
        console.log(`   Total Requests: ${this.performanceMetrics.totalRequests}`);
        console.log(`   DB Query Reduction: ${cacheHitRate.toFixed(2)}%`);
        console.log(`   Avg Response Time: ${loadingStats.avgLoadTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error('❌ Failed to collect performance metrics:', error);
    }
  }

  // Perform health check
  async performHealthCheck() {
    try {
      const healthCheck = {
        overall: 'healthy',
        components: {},
        timestamp: new Date(),
        issues: []
      };
      
      // Check each component
      for (const [name, component] of Object.entries(this.components)) {
        try {
          const isHealthy = component.isHealthy ? component.isHealthy() : true;
          healthCheck.components[name] = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            details: component.getStats ? component.getStats() : null
          };
          
          if (!isHealthy) {
            healthCheck.overall = 'degraded';
            healthCheck.issues.push(`${name} component is unhealthy`);
          }
        } catch (error) {
          healthCheck.components[name] = {
            status: 'error',
            error: error.message
          };
          healthCheck.overall = 'unhealthy';
          healthCheck.issues.push(`${name} component error: ${error.message}`);
        }
      }
      
      // Check cache hit rate
      const cacheHitRate = this.performanceMetrics.totalRequests > 0 
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
        : 0;
      
      if (cacheHitRate < 80 && this.performanceMetrics.totalRequests > 100) {
        healthCheck.overall = 'degraded';
        healthCheck.issues.push(`Low cache hit rate: ${cacheHitRate.toFixed(2)}%`);
      }
      
      this.healthStatus = healthCheck;
      
      // Log health status if there are issues
      if (healthCheck.issues.length > 0) {
        console.warn('⚠️ Health check detected issues:', healthCheck.issues);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.healthStatus = {
        overall: 'error',
        components: {},
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  // Get optimized static data with fallback
  async getOptimizedData(dataType, options = {}) {
    const startTime = Date.now();
    
    try {
      // Try to get from cache first
      let data = null;
      
      switch (dataType) {
        case 'countries':
          data = this.components.cacheManager.getCountries(options.language, options.search, options.activeOnly);
          break;
        case 'categories':
          data = this.components.cacheManager.getCategories(options.language, options.activeOnly);
          break;
        case 'foundlost':
          data = this.components.cacheManager.getFoundLostOptions(options.language, options.activeOnly);
          break;
        case 'cities':
          data = this.components.cacheManager.getCities(options.language, options.search, options.countryId, options.activeOnly);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      if (data && data.length > 0) {
        // Cache hit
        this.performanceMetrics.cacheHits++;
        
        const responseTime = Date.now() - startTime;
        this.updateAvgResponseTime(responseTime);
        
        return {
          success: true,
          data,
          source: 'cache',
          responseTime,
          total: data.length
        };
      } else {
        // Cache miss - fallback to database
        console.warn(`⚠️ Cache miss for ${dataType}, falling back to database`);
        
        data = await this.components.loadingStrategies.loadDataOptimized(dataType, options);
        this.performanceMetrics.cacheMisses++;
        this.performanceMetrics.dbQueries++;
        
        const responseTime = Date.now() - startTime;
        this.updateAvgResponseTime(responseTime);
        
        return {
          success: true,
          data,
          source: 'database',
          responseTime,
          total: data.length
        };
      }
      
    } catch (error) {
      this.performanceMetrics.cacheMisses++;
      const responseTime = Date.now() - startTime;
      
      console.error(`❌ Failed to get optimized data for ${dataType}:`, error);
      
      return {
        success: false,
        error: error.message,
        source: 'error',
        responseTime
      };
    }
  }

  // Update average response time
  updateAvgResponseTime(responseTime) {
    if (this.performanceMetrics.avgResponseTime === 0) {
      this.performanceMetrics.avgResponseTime = responseTime;
    } else {
      this.performanceMetrics.avgResponseTime = (this.performanceMetrics.avgResponseTime + responseTime) / 2;
    }
  }

  // Force refresh all data
  async forceRefreshAll() {
    console.log('🔄 Force refreshing all static data...');
    
    try {
      await this.components.refreshStrategy.forceRefreshAll();
      console.log('✅ Force refresh completed');
      return true;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return false;
    }
  }

  // Force refresh specific data type
  async forceRefresh(dataType) {
    console.log(`🔄 Force refreshing ${dataType}...`);
    
    try {
      await this.components.refreshStrategy.forceRefresh(dataType);
      console.log(`✅ Force refresh completed for ${dataType}`);
      return true;
    } catch (error) {
      console.error(`❌ Force refresh failed for ${dataType}:`, error);
      return false;
    }
  }

  // Get comprehensive system status
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      initializationTime: this.performanceMetrics.initializationTime,
      health: this.healthStatus,
      performance: {
        ...this.performanceMetrics,
        cacheHitRate: this.performanceMetrics.totalRequests > 0 
          ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
          : 0,
        dbQueryReduction: this.performanceMetrics.totalRequests > 0 
          ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
          : 0
      },
      components: {
        cacheManager: this.components.cacheManager.getStats(),
        versioning: this.components.versioning.getSystemInfo(),
        refreshStrategy: this.components.refreshStrategy.getRefreshStats(),
        loadingStrategies: this.components.loadingStrategies.getLoadingStats()
      }
    };
  }

  // Get performance report
  getPerformanceReport() {
    const cacheHitRate = this.performanceMetrics.totalRequests > 0 
      ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
      : 0;
    
    const dbQueryReduction = cacheHitRate;
    
    return {
      summary: {
        totalRequests: this.performanceMetrics.totalRequests,
        cacheHits: this.performanceMetrics.cacheHits,
        cacheMisses: this.performanceMetrics.cacheMisses,
        dbQueries: this.performanceMetrics.dbQueries,
        cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
        dbQueryReduction: `${dbQueryReduction.toFixed(2)}%`,
        avgResponseTime: `${this.performanceMetrics.avgResponseTime.toFixed(2)}ms`,
        targetAchieved: dbQueryReduction >= 95
      },
      details: this.getSystemStatus(),
      recommendations: this.generateRecommendations()
    };
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    const cacheHitRate = this.performanceMetrics.totalRequests > 0 
      ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
      : 0;
    
    if (cacheHitRate < 95 && this.performanceMetrics.totalRequests > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `Cache hit rate is ${cacheHitRate.toFixed(2)}%, target is 95%+`,
        action: 'Consider increasing cache TTL or optimizing cache keys'
      });
    }
    
    if (this.performanceMetrics.avgResponseTime > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `Average response time is ${this.performanceMetrics.avgResponseTime.toFixed(2)}ms`,
        action: 'Consider optimizing data structures or reducing data size'
      });
    }
    
    if (this.healthStatus.overall !== 'healthy') {
      recommendations.push({
        type: 'health',
        priority: 'high',
        message: `System health is ${this.healthStatus.overall}`,
        action: 'Check component health and resolve issues'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        priority: 'info',
        message: 'System is performing optimally',
        action: 'Continue monitoring'
      });
    }
    
    return recommendations;
  }

  // Cleanup resources
  async cleanup() {
    console.log('🧹 Cleaning up Static Data Optimization System...');
    
    try {
      // Stop refresh strategy
      if (this.components.refreshStrategy.stop) {
        this.components.refreshStrategy.stop();
      }
      
      // Shutdown loading strategies
      if (this.components.loadingStrategies.shutdown) {
        await this.components.loadingStrategies.shutdown();
      }
      
      // Clear cache
      if (this.components.cacheManager.clear) {
        this.components.cacheManager.clear();
      }
      
      this.isInitialized = false;
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🔌 Shutting down Static Data Optimization System...');
    await this.cleanup();
    console.log('✅ Static Data Optimization System shutdown complete');
  }
}

// Create singleton instance
const staticDataOptimizationSystem = new StaticDataOptimizationSystem();

module.exports = {
  staticDataOptimizationSystem,
  initializeStaticDataOptimization: () => staticDataOptimizationSystem.initialize(),
  getStaticDataOptimization: () => staticDataOptimizationSystem
};
