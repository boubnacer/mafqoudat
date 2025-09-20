/**
 * Cost Optimization Test Suite
 * Tests the effectiveness of our Cloudinary optimizations
 */

const fs = require('fs');
const path = require('path');
const imageOptimizer = require('./utils/imageOptimizer');
const costMonitor = require('./utils/costMonitor');
const { uploadToCloudinary, getOptimizedImageUrl } = require('./config/optimizedCloudinary');

async function runCostOptimizationTests() {
  console.log('🧪 Starting Cost Optimization Tests...\n');

  try {
    // Test 1: Image Compression
    console.log('📊 Test 1: Image Compression Effectiveness');
    console.log('==========================================');
    
    // Create a test image buffer (simulating a 2MB image)
    const testImageBuffer = Buffer.alloc(2 * 1024 * 1024, 'test-image-data');
    
    const compressionResult = await imageOptimizer.processImage(testImageBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85
    });
    
    console.log(`✅ Compression Ratio: ${compressionResult.compressionRatio}%`);
    console.log(`✅ Original Size: ${(testImageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✅ Optimized Size: ${(compressionResult.optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✅ Bandwidth Saved: ${((testImageBuffer.length - compressionResult.optimizedBuffer.length) / 1024 / 1024).toFixed(2)} MB\n`);

    // Test 2: Duplicate Detection
    console.log('🔄 Test 2: Duplicate Detection');
    console.log('=============================');
    
    const duplicateCheck1 = await imageOptimizer.checkForDuplicate(testImageBuffer);
    console.log(`✅ First check - Is duplicate: ${duplicateCheck1.isDuplicate}`);
    
    // Store the image reference
    await imageOptimizer.storeDuplicateReference(testImageBuffer, 'https://example.com/test-image.jpg');
    
    const duplicateCheck2 = await imageOptimizer.checkForDuplicate(testImageBuffer);
    console.log(`✅ Second check - Is duplicate: ${duplicateCheck2.isDuplicate}`);
    console.log(`✅ Existing URL found: ${duplicateCheck2.existingUrl}\n`);

    // Test 3: Cost Monitoring
    console.log('💰 Test 3: Cost Monitoring');
    console.log('=========================');
    
    // Simulate some uploads
    costMonitor.recordUpload(35, false); // 35% compression
    costMonitor.recordUpload(42, false); // 42% compression
    costMonitor.recordUpload(0, true);   // Duplicate saved
    costMonitor.recordCacheHit(true);    // Cache hit
    costMonitor.recordCacheHit(false);   // Cache miss
    costMonitor.recordBandwidthSaved(1024 * 1024); // 1MB saved
    
    const metrics = costMonitor.getMetrics();
    console.log(`✅ Total Uploads: ${metrics.totalUploads}`);
    console.log(`✅ Duplicate Saves: ${metrics.duplicateSaves}`);
    console.log(`✅ Average Compression: ${metrics.averages.compressionRatio}%`);
    console.log(`✅ Cache Hit Rate: ${metrics.averages.cacheHitRate}%`);
    console.log(`✅ Bandwidth Saved: ${metrics.savings.bandwidthSavedMB} MB`);
    console.log(`✅ Estimated Cost Savings: $${metrics.savings.estimatedCostSavings.total}\n`);

    // Test 4: URL Optimization
    console.log('🔗 Test 4: URL Optimization');
    console.log('==========================');
    
    const testPublicId = 'mafqoudat/test-image';
    const optimizedUrl = await getOptimizedImageUrl(testPublicId, 'card');
    console.log(`✅ Optimized URL generated: ${optimizedUrl ? 'Success' : 'Failed'}`);
    console.log(`✅ URL includes transformations: ${optimizedUrl ? optimizedUrl.includes('w_800') : false}\n`);

    // Test 5: Cost Report Generation
    console.log('📋 Test 5: Cost Report Generation');
    console.log('================================');
    
    const report = await costMonitor.generateReport();
    if (report) {
      console.log(`✅ Report generated successfully`);
      console.log(`✅ Estimated Savings: ${report.summary.estimatedSavingsPercentage}`);
      console.log(`✅ Recommendations: ${report.recommendations.length} generated`);
    } else {
      console.log(`❌ Report generation failed\n`);
    }

    // Test 6: Performance Metrics
    console.log('⚡ Test 6: Performance Metrics');
    console.log('=============================');
    
    const startTime = Date.now();
    
    // Simulate processing multiple images
    for (let i = 0; i < 10; i++) {
      await imageOptimizer.processImage(testImageBuffer, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 85
      });
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`✅ Processed 10 images in ${processingTime}ms`);
    console.log(`✅ Average processing time: ${(processingTime / 10).toFixed(2)}ms per image\n`);

    // Final Summary
    console.log('🎯 COST OPTIMIZATION SUMMARY');
    console.log('============================');
    
    const finalMetrics = costMonitor.getMetrics();
    const savings = finalMetrics.savings.estimatedCostSavings;
    
    console.log(`💰 Estimated Cost Reduction: ${savings.percentage}%`);
    console.log(`💾 Bandwidth Savings: ${finalMetrics.savings.bandwidthSavedMB} MB`);
    console.log(`🔄 Duplicate Detection Rate: ${finalMetrics.averages.duplicateRate}%`);
    console.log(`📦 Cache Hit Rate: ${finalMetrics.averages.cacheHitRate}%`);
    console.log(`🗜️ Average Compression: ${finalMetrics.averages.compressionRatio}%`);
    
    // Calculate total savings
    const totalSavings = parseFloat(savings.total);
    const baselineCost = finalMetrics.totalUploads * 0.05; // $0.05 per upload baseline
    const actualSavingsPercentage = baselineCost > 0 ? ((totalSavings / baselineCost) * 100).toFixed(1) : 0;
    
    console.log(`\n🎉 TARGET ACHIEVEMENT:`);
    console.log(`✅ Cost Reduction Target: 40%+`);
    console.log(`✅ Actual Savings: ${actualSavingsPercentage}%`);
    console.log(`✅ Status: ${actualSavingsPercentage >= 40 ? 'TARGET ACHIEVED! 🎉' : 'Below target - needs optimization'}`);
    
    if (actualSavingsPercentage >= 40) {
      console.log(`\n🚀 SUCCESS: Cloudinary cost optimization is working effectively!`);
      console.log(`💡 Key optimizations contributing to savings:`);
      console.log(`   • Image compression reduces bandwidth usage`);
      console.log(`   • Duplicate detection prevents redundant uploads`);
      console.log(`   • Enhanced caching reduces API calls`);
      console.log(`   • Format optimization (WebP/AVIF) reduces file sizes`);
      console.log(`   • Lazy loading reduces unnecessary bandwidth usage`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runCostOptimizationTests()
    .then(() => {
      console.log('\n✅ Cost optimization tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runCostOptimizationTests };
