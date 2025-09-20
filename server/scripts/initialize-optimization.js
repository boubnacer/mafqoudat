const mongoose = require('mongoose');
const { staticDataOptimizationSystem } = require('../config/staticDataOptimization');

/**
 * Static Data Optimization Initialization Script
 * 
 * This script initializes the complete static data optimization system
 * and can be run during server startup or as a standalone script.
 */

async function initializeOptimization() {
  console.log('🚀 Starting Static Data Optimization Initialization...\n');
  
  try {
    // Check if MongoDB connection is available
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Waiting for MongoDB connection...');
      
      // Wait for MongoDB connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 30000); // 30 second timeout
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        mongoose.connection.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      console.log('✅ MongoDB connected');
    }
    
    // Initialize the optimization system
    console.log('🔄 Initializing static data optimization system...');
    await staticDataOptimizationSystem.initialize();
    
    // Get initial system status
    const status = staticDataOptimizationSystem.getSystemStatus();
    
    console.log('\n📊 Initialization Summary:');
    console.log('='.repeat(50));
    console.log(`Initialization Time: ${status.initializationTime}ms`);
    console.log(`System Health: ${status.health.overall}`);
    console.log(`Cache Manager: ${status.components.cacheManager.data ? 'Ready' : 'Not Ready'}`);
    console.log(`Versioning: ${status.components.versioning.isHealthy ? 'Ready' : 'Not Ready'}`);
    console.log(`Refresh Strategy: ${status.components.refreshStrategy.isRunning ? 'Active' : 'Inactive'}`);
    console.log(`Loading Strategies: ${status.components.loadingStrategies.isHealthy() ? 'Ready' : 'Not Ready'}`);
    
    console.log('\n📈 Expected Performance Improvements:');
    console.log('• 95%+ reduction in database queries for static data');
    console.log('• Sub-millisecond response times for cached data');
    console.log('• Automatic cache refresh and invalidation');
    console.log('• Memory-efficient data structures');
    console.log('• Smart refresh strategies based on usage patterns');
    
    console.log('\n🎯 Optimization Targets:');
    console.log('• Query Reduction: 95%+ (Target)');
    console.log('• Response Time: <50ms (Target)');
    console.log('• Cache Hit Rate: 95%+ (Target)');
    console.log('• Memory Usage: <100MB (Target)');
    
    console.log('\n✅ Static Data Optimization System initialized successfully!');
    console.log('   The system is now ready to serve optimized static data.');
    
    return {
      success: true,
      initializationTime: status.initializationTime,
      systemHealth: status.health.overall,
      message: 'Static data optimization system initialized successfully'
    };
    
  } catch (error) {
    console.error('\n❌ Failed to initialize static data optimization system:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to initialize static data optimization system'
    };
  }
}

// Graceful shutdown handler
async function gracefulShutdown() {
  console.log('\n🔌 Shutting down static data optimization system...');
  
  try {
    await staticDataOptimizationSystem.shutdown();
    console.log('✅ Shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown failed:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon

// Export functions for use in other modules
module.exports = {
  initializeOptimization,
  gracefulShutdown,
  staticDataOptimizationSystem
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeOptimization()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Initialization completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Initialization failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Initialization error:', error);
      process.exit(1);
    });
}
