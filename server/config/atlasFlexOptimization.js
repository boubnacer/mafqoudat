/**
 * Atlas Flex Plan Optimization Configuration
 * Optimized settings for MongoDB Atlas Flex plan limitations and cost efficiency
 */

const atlasFlexConfig = {
  // Connection Pool Optimization
  connectionPool: {
    maxPoolSize: 8, // Optimal for Flex plan (balance between performance and cost)
    minPoolSize: 2, // Maintain minimum connections for responsiveness
    maxIdleTimeMS: 60000, // 1 minute - reduces idle connections
    maxConnecting: 5, // Limit concurrent connection attempts
  },

  // Timeout Settings (optimized for Flex plan response times)
  timeouts: {
    serverSelectionTimeoutMS: 15000, // 15s - reasonable for Flex plan
    socketTimeoutMS: 45000, // 45s - allows for longer operations
    connectTimeoutMS: 15000, // 15s - reasonable connection timeout
    heartbeatFrequencyMS: 10000, // 10s - frequent health checks
  },

  // Query Optimization
  queryOptimization: {
    maxTimeMS: 30000, // 30s max query time
    allowDiskUse: false, // Prevent expensive disk operations
    batchSize: 100, // Reasonable batch size for Flex plan
  },

  // Index Optimization
  indexes: {
    // Ensure critical indexes exist
    criticalIndexes: [
      { collection: 'posts', index: { createdAt: -1 } },
      { collection: 'posts', index: { userId: 1 } },
      { collection: 'posts', index: { category: 1, createdAt: -1 } },
      { collection: 'users', index: { email: 1 } },
      { collection: 'users', index: { username: 1 } },
    ],
    
    // Index monitoring
    monitorIndexUsage: true,
    dropUnusedIndexes: true,
  },

  // Aggregation Pipeline Optimization
  aggregation: {
    allowDiskUse: false, // Prevent expensive disk operations
    maxMemoryUsageMB: 100, // Limit memory usage
    cursorBatchSize: 1000, // Reasonable batch size
  },

  // Monitoring and Alerting
  monitoring: {
    slowQueryThreshold: 1000, // Log queries slower than 1s
    connectionPoolThreshold: 0.8, // Alert at 80% pool usage
    errorRateThreshold: 0.05, // Alert at 5% error rate
  },

  // Cost Optimization Strategies
  costOptimization: {
    // Read preferences for cost efficiency
    readPreference: 'secondaryPreferred', // Use secondary when possible
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority', j: true },
    
    // Connection management
    compressConnections: true, // Use compression to reduce bandwidth
    retryWrites: true,
    retryReads: true,
  },

  // Flex Plan Specific Settings
  flexPlanLimits: {
    // Estimated limits for Flex plan (adjust based on your actual plan)
    maxConnections: 20,
    maxOperationsPerSecond: 1000,
    maxDataTransferPerHour: 100, // MB
    maxStorageGB: 2,
    
    // Monitoring thresholds (80% of limits)
    connectionWarningThreshold: 16, // 80% of 20
    opsWarningThreshold: 800, // 80% of 1000
    dataTransferWarningThreshold: 80, // 80% of 100MB
  }
};

/**
 * Get optimized MongoDB connection options for Atlas Flex
 */
const getAtlasFlexConnectionOptions = () => ({
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
  // Connection pool settings
  maxPoolSize: atlasFlexConfig.connectionPool.maxPoolSize,
  minPoolSize: atlasFlexConfig.connectionPool.minPoolSize,
  maxIdleTimeMS: atlasFlexConfig.connectionPool.maxIdleTimeMS,
  maxConnecting: atlasFlexConfig.connectionPool.maxConnecting,
  
  // Timeout settings
  serverSelectionTimeoutMS: atlasFlexConfig.timeouts.serverSelectionTimeoutMS,
  socketTimeoutMS: atlasFlexConfig.timeouts.socketTimeoutMS,
  connectTimeoutMS: atlasFlexConfig.timeouts.connectTimeoutMS,
  heartbeatFrequencyMS: atlasFlexConfig.timeouts.heartbeatFrequencyMS,
  
  // Cost optimization
  retryWrites: atlasFlexConfig.costOptimization.retryWrites,
  retryReads: atlasFlexConfig.costOptimization.retryReads,
  compressors: ['zlib'], // Enable compression
  
  // Read preferences for cost efficiency
  readPreference: atlasFlexConfig.costOptimization.readPreference,
  readConcern: atlasFlexConfig.costOptimization.readConcern,
  writeConcern: atlasFlexConfig.costOptimization.writeConcern,
  
  // Monitoring
  monitorCommands: true,
});

/**
 * Get optimized query options
 */
const getOptimizedQueryOptions = (options = {}) => ({
  maxTimeMS: atlasFlexConfig.queryOptimization.maxTimeMS,
  allowDiskUse: atlasFlexConfig.queryOptimization.allowDiskUse,
  batchSize: atlasFlexConfig.queryOptimization.batchSize,
  ...options
});

/**
 * Get optimized aggregation options
 */
const getOptimizedAggregationOptions = (options = {}) => ({
  allowDiskUse: atlasFlexConfig.aggregation.allowDiskUse,
  maxMemoryUsageMB: atlasFlexConfig.aggregation.maxMemoryUsageMB,
  cursor: {
    batchSize: atlasFlexConfig.aggregation.cursorBatchSize
  },
  ...options
});

/**
 * Monitor Atlas Flex plan usage
 */
class AtlasFlexMonitor {
  constructor() {
    this.metrics = {
      connections: 0,
      operations: 0,
      dataTransfer: 0,
      lastReset: Date.now(),
      warnings: []
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitor connection pool usage
    setInterval(() => {
      this.checkConnectionUsage();
    }, 30000); // Every 30 seconds

    // Reset hourly metrics
    setInterval(() => {
      this.resetHourlyMetrics();
    }, 3600000); // Every hour

    // Check for warnings
    setInterval(() => {
      this.checkWarnings();
    }, 60000); // Every minute
  }

  checkConnectionUsage() {
    // This would integrate with your actual connection monitoring
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      // Get actual connection count (simplified)
      this.metrics.connections = Math.floor(Math.random() * 20); // Placeholder
      
      if (this.metrics.connections > atlasFlexConfig.flexPlanLimits.connectionWarningThreshold) {
        this.addWarning('High connection usage', {
          current: this.metrics.connections,
          threshold: atlasFlexConfig.flexPlanLimits.connectionWarningThreshold
        });
      }
    }
  }

  resetHourlyMetrics() {
    this.metrics.operations = 0;
    this.metrics.dataTransfer = 0;
    this.metrics.lastReset = Date.now();
  }

  checkWarnings() {
    const now = Date.now();
    
    // Remove old warnings (older than 1 hour)
    this.metrics.warnings = this.metrics.warnings.filter(
      warning => (now - warning.timestamp) < 3600000
    );
  }

  addWarning(type, details) {
    const warning = {
      type,
      details,
      timestamp: Date.now()
    };
    
    this.metrics.warnings.push(warning);
    console.warn(`⚠️ Atlas Flex Warning: ${type}`, details);
  }

  getMetrics() {
    return {
      ...this.metrics,
      limits: atlasFlexConfig.flexPlanLimits,
      utilization: {
        connections: (this.metrics.connections / atlasFlexConfig.flexPlanLimits.maxConnections) * 100,
        operations: (this.metrics.operations / atlasFlexConfig.flexPlanLimits.maxOperationsPerSecond) * 100,
        dataTransfer: (this.metrics.dataTransfer / atlasFlexConfig.flexPlanLimits.maxDataTransferPerHour) * 100
      }
    };
  }
}

/**
 * Optimize queries for Atlas Flex plan
 */
const optimizeQueryForFlex = (query, options = {}) => {
  // Add maxTimeMS to prevent expensive queries
  if (!options.maxTimeMS) {
    options.maxTimeMS = atlasFlexConfig.queryOptimization.maxTimeMS;
  }
  
  // Ensure proper indexing hints
  if (query.category && query.createdAt) {
    options.hint = { category: 1, createdAt: -1 };
  }
  
  return { query, options };
};

/**
 * Optimize aggregation pipeline for Atlas Flex
 */
const optimizeAggregationForFlex = (pipeline, options = {}) => {
  // Add $limit early in pipeline to reduce data processing
  if (!pipeline.some(stage => stage.$limit)) {
    pipeline.unshift({ $limit: 1000 });
  }
  
  // Add memory usage limits
  options.allowDiskUse = false;
  options.maxMemoryUsageMB = atlasFlexConfig.aggregation.maxMemoryUsageMB;
  
  return { pipeline, options };
};

// Create global monitor instance
const atlasFlexMonitor = new AtlasFlexMonitor();

module.exports = {
  atlasFlexConfig,
  getAtlasFlexConnectionOptions,
  getOptimizedQueryOptions,
  getOptimizedAggregationOptions,
  optimizeQueryForFlex,
  optimizeAggregationForFlex,
  atlasFlexMonitor
};
