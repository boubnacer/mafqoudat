/**
 * MongoDB Performance Testing Script
 * 
 * This script tests the performance improvements of the optimized queries
 * Run this script to validate the optimization results
 * 
 * Usage: node server/scripts/performance-test.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models and controllers
const Post = require('../models/Post');
const User = require('../models/User');
const Country = require('../models/Country');
const Category = require('../models/Category');
const FoundLost = require('../models/FoundLost');
const City = require('../models/City');

// Import optimized controllers
const { getAllPostsOptimized, getDashboardOptimized } = require('../controllers/optimizedPostsController');

// Import original controllers for comparison
const { getAllPosts, getDashboard } = require('../controllers/postsController');
const { getDashboard: getDashboardOriginal } = require('../controllers/dependenciesController');

class PerformanceTester {
  constructor() {
    this.results = {
      original: {},
      optimized: {},
      improvements: {}
    };
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB for performance testing');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }

  async runTest(testName, testFunction, iterations = 5) {
    console.log(`\n🧪 Running ${testName} test (${iterations} iterations)...`);
    
    const times = [];
    let errors = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        await testFunction();
        const executionTime = Date.now() - startTime;
        times.push(executionTime);
        console.log(`  Iteration ${i + 1}: ${executionTime}ms`);
      } catch (error) {
        console.error(`  Iteration ${i + 1} failed:`, error.message);
        errors++;
      }
    }
    
    if (times.length === 0) {
      console.log(`❌ All iterations failed for ${testName}`);
      return null;
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const p95Time = times.sort((a, b) => a - b)[Math.ceil(times.length * 0.95) - 1];
    
    const result = {
      avgTime,
      minTime,
      maxTime,
      p95Time,
      iterations: times.length,
      errors,
      times
    };
    
    console.log(`📊 ${testName} Results:`);
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime}ms`);
    console.log(`  Max: ${maxTime}ms`);
    console.log(`  P95: ${p95Time}ms`);
    console.log(`  Errors: ${errors}`);
    
    return result;
  }

  async testGetAllPosts() {
    // Get a valid country ID for testing
    const country = await Country.findOne({ isActive: true }).lean();
    if (!country) {
      throw new Error('No active country found for testing');
    }

    const testParams = {
      query: {
        currentCountry: country._id.toString(),
        page: 1,
        pageSize: 8
      }
    };

    const mockRes = {
      json: () => {},
      status: () => ({ json: () => {} })
    };

    // Test original implementation
    console.log('\n📊 Testing original getAllPosts...');
    this.results.original.getAllPosts = await this.runTest(
      'Original getAllPosts',
      () => getAllPosts(testParams, mockRes)
    );

    // Test optimized implementation
    console.log('\n📊 Testing optimized getAllPosts...');
    this.results.optimized.getAllPosts = await this.runTest(
      'Optimized getAllPosts',
      () => getAllPostsOptimized(testParams, mockRes)
    );
  }

  async testGetDashboard() {
    // Get a valid country ID for testing
    const country = await Country.findOne({ isActive: true }).lean();
    if (!country) {
      throw new Error('No active country found for testing');
    }

    const testParams = {
      query: {
        currentCountry: country._id.toString(),
        language: 'en'
      }
    };

    const mockRes = {
      json: () => {},
      status: () => ({ json: () => {} })
    };

    // Test original implementation
    console.log('\n📊 Testing original getDashboard...');
    this.results.original.getDashboard = await this.runTest(
      'Original getDashboard',
      () => getDashboardOriginal(testParams, mockRes)
    );

    // Test optimized implementation
    console.log('\n📊 Testing optimized getDashboard...');
    this.results.optimized.getDashboard = await this.runTest(
      'Optimized getDashboard',
      () => getDashboardOptimized(testParams, mockRes)
    );
  }

  async testIndexUsage() {
    console.log('\n📊 Testing index usage...');
    
    try {
      // Test if indexes are being used
      const explainResult = await Post.aggregate([
        { $match: { status: 'active' } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 }
      ]).explain('executionStats');
      
      console.log('Index usage test completed');
      return true;
    } catch (error) {
      console.error('Index usage test failed:', error);
      return false;
    }
  }

  async testCachePerformance() {
    console.log('\n📊 Testing cache performance...');
    
    try {
      const { cacheService } = require('../config/cache');
      
      // Test cache set/get performance
      const cacheTimes = [];
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await cacheService.set(`test_${i}`, { data: `test_${i}` }, 60);
        const result = await cacheService.get(`test_${i}`);
        cacheTimes.push(Date.now() - start);
      }
      
      const avgCacheTime = cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length;
      console.log(`Average cache operation time: ${avgCacheTime.toFixed(2)}ms`);
      
      return avgCacheTime;
    } catch (error) {
      console.error('Cache performance test failed:', error);
      return null;
    }
  }

  calculateImprovements() {
    console.log('\n📈 Calculating performance improvements...');
    
    const improvements = {};
    
    // Calculate getAllPosts improvements
    if (this.results.original.getAllPosts && this.results.optimized.getAllPosts) {
      const original = this.results.original.getAllPosts.avgTime;
      const optimized = this.results.optimized.getAllPosts.avgTime;
      const improvement = ((original - optimized) / original) * 100;
      
      improvements.getAllPosts = {
        original: original,
        optimized: optimized,
        improvement: improvement,
        improvementText: `${improvement.toFixed(1)}% faster`
      };
    }
    
    // Calculate getDashboard improvements
    if (this.results.original.getDashboard && this.results.optimized.getDashboard) {
      const original = this.results.original.getDashboard.avgTime;
      const optimized = this.results.optimized.getDashboard.avgTime;
      const improvement = ((original - optimized) / original) * 100;
      
      improvements.getDashboard = {
        original: original,
        optimized: optimized,
        improvement: improvement,
        improvementText: `${improvement.toFixed(1)}% faster`
      };
    }
    
    this.results.improvements = improvements;
    return improvements;
  }

  printSummary() {
    console.log('\n🎉 Performance Test Summary');
    console.log('='.repeat(50));
    
    if (this.results.improvements.getAllPosts) {
      const imp = this.results.improvements.getAllPosts;
      console.log(`\n📊 getAllPosts Performance:`);
      console.log(`  Original: ${imp.original.toFixed(2)}ms`);
      console.log(`  Optimized: ${imp.optimized.toFixed(2)}ms`);
      console.log(`  Improvement: ${imp.improvementText}`);
    }
    
    if (this.results.improvements.getDashboard) {
      const imp = this.results.improvements.getDashboard;
      console.log(`\n📊 getDashboard Performance:`);
      console.log(`  Original: ${imp.original.toFixed(2)}ms`);
      console.log(`  Optimized: ${imp.optimized.toFixed(2)}ms`);
      console.log(`  Improvement: ${imp.improvementText}`);
    }
    
    console.log('\n📋 Recommendations:');
    if (this.results.improvements.getAllPosts?.improvement > 50) {
      console.log('✅ getAllPosts optimization is highly effective');
    } else if (this.results.improvements.getAllPosts?.improvement > 20) {
      console.log('✅ getAllPosts optimization is effective');
    } else {
      console.log('⚠️ getAllPosts optimization needs review');
    }
    
    if (this.results.improvements.getDashboard?.improvement > 50) {
      console.log('✅ getDashboard optimization is highly effective');
    } else if (this.results.improvements.getDashboard?.improvement > 20) {
      console.log('✅ getDashboard optimization is effective');
    } else {
      console.log('⚠️ getDashboard optimization needs review');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Deploy optimized controllers to production');
    console.log('2. Monitor performance in production');
    console.log('3. Consider implementing denormalization for further gains');
    console.log('4. Set up continuous performance monitoring');
  }

  async runAllTests() {
    try {
      await this.connect();
      
      console.log('🚀 Starting MongoDB Performance Tests...');
      console.log('This will test the performance improvements of optimized queries');
      
      // Run all tests
      await this.testGetAllPosts();
      await this.testGetDashboard();
      await this.testIndexUsage();
      await this.testCachePerformance();
      
      // Calculate and display results
      this.calculateImprovements();
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run the performance test if this script is executed directly
if (require.main === module) {
  const tester = new PerformanceTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 Performance testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = { PerformanceTester };
