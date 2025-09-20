const mongoose = require('mongoose');
require('dotenv').config({ path: '../env.production' });

const { optimizedCacheService } = require('../config/optimizedCache');

/**
 * Cache Performance Monitoring Script
 * 
 * This script monitors cache performance and provides insights
 * to achieve 80%+ database call reduction.
 */

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for performance monitoring');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Performance monitoring class
class CachePerformanceMonitor {
  constructor() {
    this.monitoringData = {
      startTime: Date.now(),
      dbQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      compressionSavings: 0
    };
  }

  // Monitor database queries
  async monitorDatabaseQueries() {
    console.log('📊 Monitoring database queries...');
    
    // Get MongoDB connection stats
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    
    return {
      operations: serverStatus.opcounters || {},
      connections: serverStatus.connections || {},
      memory: serverStatus.mem || {},
      uptime: serverStatus.uptime || 0
    };
  }

  // Monitor cache performance
  async monitorCachePerformance() {
    console.log('📊 Monitoring cache performance...');
    
    const stats = optimizedCacheService.getStats();
    const health = await optimizedCacheService.healthCheck();
    
    return {
      performance: stats.performance,
      compression: stats.compression,
      memory: stats.memory,
      redis: stats.redis,
      health: health
    };
  }

  // Generate performance report
  async generatePerformanceReport() {
    console.log('📈 Generating comprehensive performance report...');
    
    const dbStats = await this.monitorDatabaseQueries();
    const cacheStats = await this.monitorCachePerformance();
    
    const report = {
      timestamp: new Date().toISOString(),
      monitoring: {
        duration: Date.now() - this.monitoringData.startTime,
        uptime: process.uptime()
      },
      database: {
        operations: dbStats.operations,
        connections: dbStats.connections,
        memory: dbStats.memory,
        uptime: dbStats.uptime
      },
      cache: cacheStats,
      recommendations: this.generateRecommendations(cacheStats, dbStats)
    };
    
    return report;
  }

  // Generate performance recommendations
  generateRecommendations(cacheStats, dbStats) {
    const recommendations = [];
    const hitRate = parseFloat(cacheStats.performance.hitRate);
    
    // Cache hit rate recommendations
    if (hitRate < 70) {
      recommendations.push({
        type: 'cache_hit_rate',
        priority: 'high',
        issue: `Cache hit rate is ${cacheStats.performance.hitRate}`,
        recommendation: 'Increase TTL for frequently accessed data, especially reference data (countries, categories)',
        expectedImprovement: '15-25% hit rate improvement'
      });
    }
    
    if (hitRate < 80) {
      recommendations.push({
        type: 'cache_optimization',
        priority: 'medium',
        issue: 'Cache hit rate below 80% target',
        recommendation: 'Implement cache warming for frequently accessed endpoints',
        expectedImprovement: '10-15% hit rate improvement'
      });
    }
    
    // Memory usage recommendations
    const memoryUsage = cacheStats.memory.memoryUsage.heapUsed / 1024 / 1024; // MB
    if (memoryUsage > 100) {
      recommendations.push({
        type: 'memory_optimization',
        priority: 'medium',
        issue: `High memory usage: ${memoryUsage.toFixed(2)}MB`,
        recommendation: 'Consider enabling compression for large cache entries',
        expectedImprovement: '20-30% memory reduction'
      });
    }
    
    // Compression recommendations
    if (cacheStats.compression.compressionRatio === '0%') {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        issue: 'No compression detected',
        recommendation: 'Enable compression for responses larger than 1KB',
        expectedImprovement: '30-50% memory and network savings'
      });
    }
    
    // Redis connection recommendations
    if (!cacheStats.redis.connected) {
      recommendations.push({
        type: 'redis_connection',
        priority: 'high',
        issue: 'Redis not connected',
        recommendation: 'Fix Redis connection to enable distributed caching',
        expectedImprovement: '50%+ performance improvement in multi-instance deployments'
      });
    }
    
    return recommendations;
  }

  // Simulate load testing
  async simulateLoadTest(iterations = 100) {
    console.log(`🚀 Running load test with ${iterations} iterations...`);
    
    const testData = [
      { namespace: 'reference', prefix: 'countries', params: { active: true } },
      { namespace: 'reference', prefix: 'categories', params: { active: true } },
      { namespace: 'reference', prefix: 'foundlost', params: { active: true } },
      { namespace: 'posts', prefix: 'recent', params: { limit: 20 } },
      { namespace: 'dashboard', prefix: 'main', params: { currentCountry: '507f1f77bcf86cd799439011' } }
    ];
    
    const results = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      errors: 0
    };
    
    const responseTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const testItem = testData[i % testData.length];
      const startTime = Date.now();
      
      try {
        const cacheKey = optimizedCacheService.generateKey(
          testItem.namespace, 
          testItem.prefix, 
          testItem.params
        );
        
        const result = await optimizedCacheService.get(cacheKey);
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        results.totalRequests++;
        if (result) {
          results.cacheHits++;
        } else {
          results.cacheMisses++;
        }
        
      } catch (error) {
        results.errors++;
        console.error('Load test error:', error);
      }
    }
    
    results.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    results.hitRate = (results.cacheHits / results.totalRequests * 100).toFixed(2) + '%';
    
    return results;
  }

  // Export performance data
  async exportPerformanceData() {
    const report = await this.generatePerformanceReport();
    const loadTestResults = await this.simulateLoadTest(50);
    
    const exportData = {
      ...report,
      loadTest: loadTestResults,
      summary: {
        cacheHitRate: report.cache.performance.hitRate,
        averageResponseTime: loadTestResults.averageResponseTime + 'ms',
        memoryUsage: (report.cache.memory.memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
        dbReductionEstimate: this.calculateDBReduction(report.cache.performance.hitRate),
        overallGrade: this.calculateOverallGrade(report.cache.performance.hitRate, loadTestResults.averageResponseTime)
      }
    };
    
    return exportData;
  }

  // Calculate estimated database reduction
  calculateDBReduction(hitRate) {
    const hitRateNum = parseFloat(hitRate);
    if (hitRateNum >= 80) return '80%+ (Target achieved!)';
    if (hitRateNum >= 70) return '70-80% (Good)';
    if (hitRateNum >= 60) return '60-70% (Moderate)';
    return 'Below 60% (Needs improvement)';
  }

  // Calculate overall performance grade
  calculateOverallGrade(hitRate, avgResponseTime) {
    const hitRateNum = parseFloat(hitRate);
    
    if (hitRateNum >= 80 && avgResponseTime < 100) return 'A+ (Excellent)';
    if (hitRateNum >= 75 && avgResponseTime < 200) return 'A (Very Good)';
    if (hitRateNum >= 70 && avgResponseTime < 300) return 'B (Good)';
    if (hitRateNum >= 60 && avgResponseTime < 500) return 'C (Average)';
    return 'D (Needs Improvement)';
  }
}

// Main execution function
const main = async () => {
  try {
    await connectDB();
    
    const monitor = new CachePerformanceMonitor();
    const performanceData = await monitor.exportPerformanceData();
    
    console.log('\n📊 Cache Performance Report');
    console.log('=' * 50);
    
    console.log('\n🎯 Summary:');
    console.log(`Cache Hit Rate: ${performanceData.summary.cacheHitRate}`);
    console.log(`Average Response Time: ${performanceData.summary.averageResponseTime}`);
    console.log(`Memory Usage: ${performanceData.summary.memoryUsage}`);
    console.log(`DB Reduction Estimate: ${performanceData.summary.dbReductionEstimate}`);
    console.log(`Overall Grade: ${performanceData.summary.overallGrade}`);
    
    console.log('\n📈 Recommendations:');
    performanceData.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
      console.log(`   Expected: ${rec.expectedImprovement}`);
    });
    
    console.log('\n🔧 Load Test Results:');
    console.log(`Total Requests: ${performanceData.loadTest.totalRequests}`);
    console.log(`Cache Hits: ${performanceData.loadTest.cacheHits}`);
    console.log(`Cache Misses: ${performanceData.loadTest.cacheMisses}`);
    console.log(`Hit Rate: ${performanceData.loadTest.hitRate}`);
    console.log(`Average Response Time: ${performanceData.loadTest.averageResponseTime.toFixed(2)}ms`);
    
    if (performanceData.loadTest.errors > 0) {
      console.log(`Errors: ${performanceData.loadTest.errors}`);
    }
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `cache-performance-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(performanceData, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CachePerformanceMonitor, main };
