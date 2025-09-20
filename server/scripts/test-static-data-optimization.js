const mongoose = require('mongoose');
const { staticDataOptimizationSystem } = require('../config/staticDataOptimization');

/**
 * Performance Testing Script for Static Data Optimization
 * 
 * This script tests and verifies:
 * - 95%+ reduction in database queries
 * - Response time improvements
 * - Cache hit rates
 * - System health and stability
 */

class StaticDataOptimizationTester {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      performanceMetrics: {},
      queryReduction: 0,
      avgResponseTime: 0,
      cacheHitRate: 0
    };
    
    this.testData = {
      countries: null,
      categories: null,
      foundlost: null,
      cities: null
    };
  }

  // Run all performance tests
  async runAllTests() {
    console.log('🧪 Starting Static Data Optimization Performance Tests...\n');
    
    try {
      // Test 1: System Initialization
      await this.testSystemInitialization();
      
      // Test 2: Cache Hit Rate
      await this.testCacheHitRate();
      
      // Test 3: Query Reduction
      await this.testQueryReduction();
      
      // Test 4: Response Time Performance
      await this.testResponseTimePerformance();
      
      // Test 5: Memory Usage
      await this.testMemoryUsage();
      
      // Test 6: Concurrent Load Testing
      await this.testConcurrentLoad();
      
      // Test 7: Cache Refresh Performance
      await this.testCacheRefreshPerformance();
      
      // Test 8: System Health
      await this.testSystemHealth();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.failedTests++;
    }
    
    return this.testResults;
  }

  // Test 1: System Initialization
  async testSystemInitialization() {
    console.log('📋 Test 1: System Initialization');
    
    const startTime = Date.now();
    
    try {
      await staticDataOptimizationSystem.initialize();
      const initTime = Date.now() - startTime;
      
      this.testResults.performanceMetrics.initializationTime = initTime;
      
      if (initTime < 10000) { // Should initialize within 10 seconds
        this.passTest('System initialization completed within 10 seconds', initTime + 'ms');
      } else {
        this.failTest('System initialization took too long', initTime + 'ms');
      }
      
      console.log(`✅ Initialization completed in ${initTime}ms\n`);
      
    } catch (error) {
      this.failTest('System initialization failed', error.message);
      console.log(`❌ Initialization failed: ${error.message}\n`);
    }
  }

  // Test 2: Cache Hit Rate
  async testCacheHitRate() {
    console.log('📋 Test 2: Cache Hit Rate');
    
    const testRequests = 100;
    let cacheHits = 0;
    let totalRequests = 0;
    
    try {
      // Make multiple requests to the same data
      for (let i = 0; i < testRequests; i++) {
        const result = await staticDataOptimizationSystem.getOptimizedData('countries', {
          language: 'en',
          activeOnly: true
        });
        
        if (result.success && result.source === 'cache') {
          cacheHits++;
        }
        totalRequests++;
      }
      
      const cacheHitRate = (cacheHits / totalRequests) * 100;
      this.testResults.cacheHitRate = cacheHitRate;
      
      if (cacheHitRate >= 95) {
        this.passTest('Cache hit rate meets 95% target', `${cacheHitRate.toFixed(2)}%`);
      } else {
        this.failTest('Cache hit rate below 95% target', `${cacheHitRate.toFixed(2)}%`);
      }
      
      console.log(`✅ Cache hit rate: ${cacheHitRate.toFixed(2)}%\n`);
      
    } catch (error) {
      this.failTest('Cache hit rate test failed', error.message);
      console.log(`❌ Cache hit rate test failed: ${error.message}\n`);
    }
  }

  // Test 3: Query Reduction
  async testQueryReduction() {
    console.log('📋 Test 3: Database Query Reduction');
    
    try {
      // Get initial system status
      const initialStatus = staticDataOptimizationSystem.getSystemStatus();
      const initialDbQueries = initialStatus.performance.dbQueries;
      
      // Make multiple requests
      const testRequests = 200;
      const dataTypes = ['countries', 'categories', 'foundlost', 'cities'];
      
      for (let i = 0; i < testRequests; i++) {
        const dataType = dataTypes[i % dataTypes.length];
        await staticDataOptimizationSystem.getOptimizedData(dataType, {
          language: 'en',
          activeOnly: true
        });
      }
      
      // Get final system status
      const finalStatus = staticDataOptimizationSystem.getSystemStatus();
      const finalDbQueries = finalStatus.performance.dbQueries;
      
      const newDbQueries = finalDbQueries - initialDbQueries;
      const queryReduction = testRequests - newDbQueries;
      const reductionPercentage = (queryReduction / testRequests) * 100;
      
      this.testResults.queryReduction = reductionPercentage;
      
      if (reductionPercentage >= 95) {
        this.passTest('Query reduction meets 95% target', `${reductionPercentage.toFixed(2)}%`);
      } else {
        this.failTest('Query reduction below 95% target', `${reductionPercentage.toFixed(2)}%`);
      }
      
      console.log(`✅ Query reduction: ${reductionPercentage.toFixed(2)}%`);
      console.log(`   Total requests: ${testRequests}`);
      console.log(`   DB queries: ${newDbQueries}`);
      console.log(`   Queries avoided: ${queryReduction}\n`);
      
    } catch (error) {
      this.failTest('Query reduction test failed', error.message);
      console.log(`❌ Query reduction test failed: ${error.message}\n`);
    }
  }

  // Test 4: Response Time Performance
  async testResponseTimePerformance() {
    console.log('📋 Test 4: Response Time Performance');
    
    const testRequests = 50;
    const responseTimes = [];
    
    try {
      const dataTypes = ['countries', 'categories', 'foundlost'];
      
      for (let i = 0; i < testRequests; i++) {
        const dataType = dataTypes[i % dataTypes.length];
        
        const startTime = Date.now();
        const result = await staticDataOptimizationSystem.getOptimizedData(dataType, {
          language: 'en',
          activeOnly: true
        });
        const responseTime = Date.now() - startTime;
        
        if (result.success) {
          responseTimes.push(responseTime);
        }
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      this.testResults.avgResponseTime = avgResponseTime;
      
      if (avgResponseTime < 50) { // Should respond within 50ms
        this.passTest('Average response time under 50ms', `${avgResponseTime.toFixed(2)}ms`);
      } else {
        this.failTest('Average response time too high', `${avgResponseTime.toFixed(2)}ms`);
      }
      
      console.log(`✅ Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Min: ${minResponseTime}ms`);
      console.log(`   Max: ${maxResponseTime}ms\n`);
      
    } catch (error) {
      this.failTest('Response time test failed', error.message);
      console.log(`❌ Response time test failed: ${error.message}\n`);
    }
  }

  // Test 5: Memory Usage
  async testMemoryUsage() {
    console.log('📋 Test 5: Memory Usage');
    
    try {
      const initialMemory = process.memoryUsage();
      
      // Load all data types
      const dataTypes = ['countries', 'categories', 'foundlost', 'cities'];
      for (const dataType of dataTypes) {
        await staticDataOptimizationSystem.getOptimizedData(dataType, {
          language: 'en',
          activeOnly: true
        });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      if (memoryIncreaseMB < 100) { // Should use less than 100MB
        this.passTest('Memory usage within acceptable limits', `${memoryIncreaseMB.toFixed(2)}MB`);
      } else {
        this.failTest('Memory usage too high', `${memoryIncreaseMB.toFixed(2)}MB`);
      }
      
      console.log(`✅ Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
      console.log(`   Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB\n`);
      
    } catch (error) {
      this.failTest('Memory usage test failed', error.message);
      console.log(`❌ Memory usage test failed: ${error.message}\n`);
    }
  }

  // Test 6: Concurrent Load Testing
  async testConcurrentLoad() {
    console.log('📋 Test 6: Concurrent Load Testing');
    
    try {
      const concurrentRequests = 20;
      const requestsPerBatch = 10;
      
      const startTime = Date.now();
      
      // Create concurrent batches
      const batches = [];
      for (let i = 0; i < concurrentRequests; i++) {
        const batch = [];
        for (let j = 0; j < requestsPerBatch; j++) {
          batch.push(staticDataOptimizationSystem.getOptimizedData('countries', {
            language: 'en',
            activeOnly: true
          }));
        }
        batches.push(Promise.all(batch));
      }
      
      // Wait for all batches to complete
      await Promise.all(batches);
      
      const totalTime = Date.now() - startTime;
      const totalRequests = concurrentRequests * requestsPerBatch;
      const requestsPerSecond = (totalRequests / totalTime) * 1000;
      
      if (requestsPerSecond > 100) { // Should handle 100+ requests per second
        this.passTest('Concurrent load handling meets target', `${requestsPerSecond.toFixed(2)} req/s`);
      } else {
        this.failTest('Concurrent load handling below target', `${requestsPerSecond.toFixed(2)} req/s`);
      }
      
      console.log(`✅ Concurrent load: ${requestsPerSecond.toFixed(2)} requests/second`);
      console.log(`   Total requests: ${totalRequests}`);
      console.log(`   Total time: ${totalTime}ms\n`);
      
    } catch (error) {
      this.failTest('Concurrent load test failed', error.message);
      console.log(`❌ Concurrent load test failed: ${error.message}\n`);
    }
  }

  // Test 7: Cache Refresh Performance
  async testCacheRefreshPerformance() {
    console.log('📋 Test 7: Cache Refresh Performance');
    
    try {
      const startTime = Date.now();
      
      // Force refresh all data
      await staticDataOptimizationSystem.forceRefreshAll();
      
      const refreshTime = Date.now() - startTime;
      
      if (refreshTime < 30000) { // Should refresh within 30 seconds
        this.passTest('Cache refresh completed within 30 seconds', `${refreshTime}ms`);
      } else {
        this.failTest('Cache refresh took too long', `${refreshTime}ms`);
      }
      
      console.log(`✅ Cache refresh completed in ${refreshTime}ms\n`);
      
    } catch (error) {
      this.failTest('Cache refresh test failed', error.message);
      console.log(`❌ Cache refresh test failed: ${error.message}\n`);
    }
  }

  // Test 8: System Health
  async testSystemHealth() {
    console.log('📋 Test 8: System Health');
    
    try {
      const systemStatus = staticDataOptimizationSystem.getSystemStatus();
      const health = systemStatus.health;
      
      if (health.overall === 'healthy') {
        this.passTest('System health is healthy', health.overall);
      } else {
        this.failTest('System health is not healthy', health.overall);
      }
      
      console.log(`✅ System health: ${health.overall}`);
      if (health.issues && health.issues.length > 0) {
        console.log(`   Issues: ${health.issues.join(', ')}`);
      }
      console.log('');
      
    } catch (error) {
      this.failTest('System health test failed', error.message);
      console.log(`❌ System health test failed: ${error.message}\n`);
    }
  }

  // Helper methods
  passTest(testName, result) {
    console.log(`✅ ${testName}: ${result}`);
    this.testResults.totalTests++;
    this.testResults.passedTests++;
  }

  failTest(testName, result) {
    console.log(`❌ ${testName}: ${result}`);
    this.testResults.totalTests++;
    this.testResults.failedTests++;
  }

  // Generate final report
  generateFinalReport() {
    console.log('📊 FINAL PERFORMANCE REPORT');
    console.log('='.repeat(50));
    
    const successRate = (this.testResults.passedTests / this.testResults.totalTests) * 100;
    
    console.log(`Test Results:`);
    console.log(`  Total Tests: ${this.testResults.totalTests}`);
    console.log(`  Passed: ${this.testResults.passedTests}`);
    console.log(`  Failed: ${this.testResults.failedTests}`);
    console.log(`  Success Rate: ${successRate.toFixed(2)}%`);
    
    console.log(`\nPerformance Metrics:`);
    console.log(`  Query Reduction: ${this.testResults.queryReduction.toFixed(2)}%`);
    console.log(`  Cache Hit Rate: ${this.testResults.cacheHitRate.toFixed(2)}%`);
    console.log(`  Avg Response Time: ${this.testResults.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Initialization Time: ${this.testResults.performanceMetrics.initializationTime}ms`);
    
    console.log(`\nTarget Achievement:`);
    const queryTargetAchieved = this.testResults.queryReduction >= 95;
    const cacheTargetAchieved = this.testResults.cacheHitRate >= 95;
    const responseTargetAchieved = this.testResults.avgResponseTime < 50;
    
    console.log(`  ✅ 95%+ Query Reduction: ${queryTargetAchieved ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    console.log(`  ✅ 95%+ Cache Hit Rate: ${cacheTargetAchieved ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    console.log(`  ✅ <50ms Response Time: ${responseTargetAchieved ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    
    const overallSuccess = queryTargetAchieved && cacheTargetAchieved && responseTargetAchieved;
    console.log(`\n🎯 OVERALL TARGET ACHIEVEMENT: ${overallSuccess ? 'SUCCESS ✅' : 'PARTIAL ❌'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 CONGRATULATIONS! Static data optimization targets have been achieved!');
      console.log('   - 95%+ reduction in database queries ✅');
      console.log('   - Sub-50ms response times ✅');
      console.log('   - High cache hit rates ✅');
      console.log('   - System stability and health ✅');
    } else {
      console.log('\n⚠️  Some targets were not achieved. Review the failed tests above.');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Main execution function
async function runPerformanceTests() {
  const tester = new StaticDataOptimizationTester();
  
  try {
    const results = await tester.runAllTests();
    process.exit(results.failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = {
  StaticDataOptimizationTester,
  runPerformanceTests
};
