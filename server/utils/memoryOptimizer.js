/**
 * Memory Optimization Utilities
 * Provides memory monitoring, garbage collection optimization, and memory leak detection
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class MemoryOptimizer {
  constructor() {
    this.memoryThresholds = {
      warning: 100 * 1024 * 1024,  // 100MB
      critical: 200 * 1024 * 1024, // 200MB
      max: 300 * 1024 * 1024       // 300MB
    };
    
    this.monitoringInterval = null;
    this.memoryHistory = [];
    this.maxHistorySize = 100;
    
    this.setupMemoryMonitoring();
  }

  // Setup continuous memory monitoring
  setupMemoryMonitoring() {
    // Monitor memory every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    // Force garbage collection every 5 minutes if available
    if (global.gc) {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > this.memoryThresholds.warning) {
          console.log('🧹 Forcing garbage collection due to memory usage');
          global.gc();
        }
      }, 5 * 60 * 1000);
    }

    // Log memory stats every 10 minutes
    setInterval(() => {
      this.logMemoryStats();
    }, 10 * 60 * 1000);
  }

  // Check current memory usage
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    // Store in history
    this.memoryHistory.push({
      timestamp: new Date().toISOString(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      systemFree: systemMemory.free
    });

    // Keep history size manageable
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize);
    }

    // Check thresholds
    if (memUsage.heapUsed > this.memoryThresholds.critical) {
      console.error(`🚨 CRITICAL: Memory usage at ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      this.handleCriticalMemoryUsage();
    } else if (memUsage.heapUsed > this.memoryThresholds.warning) {
      console.warn(`⚠️ WARNING: Memory usage at ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      this.handleHighMemoryUsage();
    }
  }

  // Handle critical memory usage
  async handleCriticalMemoryUsage() {
    console.log('🔧 Taking emergency memory optimization actions...');
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Clear any temporary caches
    try {
      const { unifiedCacheService } = require('../config/unifiedCache');
      await unifiedCacheService.invalidatePattern('temp:*');
    } catch (error) {
      console.error('Failed to clear temp cache:', error);
    }

    // Log memory usage
    this.logMemoryStats();
  }

  // Handle high memory usage
  handleHighMemoryUsage() {
    console.log('🔧 Taking memory optimization actions...');
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  // Log comprehensive memory statistics
  logMemoryStats() {
    const memUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    console.log('\n📊 MEMORY STATISTICS:');
    console.log(`Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`External: ${(memUsage.external / 1024 / 1024).toFixed(2)}MB`);
    console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`System Free: ${(systemMemory.free / 1024 / 1024).toFixed(2)}MB`);
    console.log(`System Used: ${(systemMemory.used / 1024 / 1024).toFixed(2)}MB`);
    
    // Calculate memory efficiency
    const heapEfficiency = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2);
    console.log(`Heap Efficiency: ${heapEfficiency}%`);
    
    // Memory trend analysis
    if (this.memoryHistory.length >= 10) {
      const recent = this.memoryHistory.slice(-10);
      const trend = this.calculateMemoryTrend(recent);
      console.log(`Memory Trend: ${trend > 0 ? '📈 Increasing' : '📉 Decreasing'} (${trend.toFixed(2)}MB/min)`);
    }
  }

  // Calculate memory trend
  calculateMemoryTrend(history) {
    if (history.length < 2) return 0;
    
    const first = history[0];
    const last = history[history.length - 1];
    const timeDiff = (new Date(last.timestamp) - new Date(first.timestamp)) / 1000 / 60; // minutes
    const memoryDiff = (last.heapUsed - first.heapUsed) / 1024 / 1024; // MB
    
    return memoryDiff / timeDiff;
  }

  // Get memory statistics
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    return {
      process: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        heapEfficiency: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
      },
      system: {
        total: `${(systemMemory.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
        free: `${(systemMemory.free / 1024 / 1024 / 1024).toFixed(2)}GB`,
        used: `${(systemMemory.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
        usagePercent: `${((systemMemory.used / systemMemory.total) * 100).toFixed(2)}%`
      },
      thresholds: {
        warning: `${(this.memoryThresholds.warning / 1024 / 1024).toFixed(2)}MB`,
        critical: `${(this.memoryThresholds.critical / 1024 / 1024).toFixed(2)}MB`,
        max: `${(this.memoryThresholds.max / 1024 / 1024).toFixed(2)}MB`
      },
      status: this.getMemoryStatus(memUsage.heapUsed),
      timestamp: new Date().toISOString()
    };
  }

  // Get memory status
  getMemoryStatus(heapUsed) {
    if (heapUsed > this.memoryThresholds.critical) {
      return 'critical';
    } else if (heapUsed > this.memoryThresholds.warning) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  // Force memory optimization
  async optimizeMemory() {
    console.log('🔧 Performing memory optimization...');
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Clear temporary caches
    try {
      const { unifiedCacheService } = require('../config/unifiedCache');
      await unifiedCacheService.invalidatePattern('temp:*');
      console.log('✅ Temporary caches cleared');
    } catch (error) {
      console.error('❌ Failed to clear temporary caches:', error);
    }

    // Clear memory history if it's too large
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize / 2);
      console.log('✅ Memory history trimmed');
    }

    const memUsage = process.memoryUsage();
    console.log(`✅ Memory optimization completed. Current usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    return this.getMemoryStats();
  }

  // Cleanup monitoring
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('✅ Memory monitoring stopped');
  }

  // Export memory report
  async exportMemoryReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        currentStats: this.getMemoryStats(),
        history: this.memoryHistory,
        recommendations: this.getMemoryRecommendations()
      };

      const reportPath = path.join(__dirname, '../logs/memory-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📄 Memory report exported to: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('❌ Failed to export memory report:', error);
      return null;
    }
  }

  // Get memory optimization recommendations
  getMemoryRecommendations() {
    const recommendations = [];
    const memUsage = process.memoryUsage();
    
    if (memUsage.heapUsed > this.memoryThresholds.warning) {
      recommendations.push({
        priority: 'high',
        type: 'memory_usage',
        message: 'Consider reducing cache TTL or implementing more aggressive garbage collection'
      });
    }

    if (memUsage.external > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        priority: 'medium',
        type: 'external_memory',
        message: 'High external memory usage detected. Check for memory leaks in native modules'
      });
    }

    const heapEfficiency = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapEfficiency > 80) {
      recommendations.push({
        priority: 'medium',
        type: 'heap_efficiency',
        message: 'Low heap efficiency. Consider increasing heap size or optimizing data structures'
      });
    }

    if (this.memoryHistory.length >= 10) {
      const trend = this.calculateMemoryTrend(this.memoryHistory.slice(-10));
      if (trend > 1) { // Increasing by more than 1MB per minute
        recommendations.push({
          priority: 'high',
          type: 'memory_leak',
          message: 'Potential memory leak detected. Memory usage is increasing steadily'
        });
      }
    }

    return recommendations;
  }
}

// Create singleton instance
const memoryOptimizer = new MemoryOptimizer();

// Graceful shutdown
process.on('SIGINT', () => {
  memoryOptimizer.cleanup();
});

process.on('SIGTERM', () => {
  memoryOptimizer.cleanup();
});

module.exports = {
  memoryOptimizer,
  MemoryOptimizer
};
