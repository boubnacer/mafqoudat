const express = require('express');
const router = express.Router();
const costMonitor = require('../utils/costMonitor');
const { getCloudinaryStats } = require('../config/optimizedCloudinary');
const verifyAdmin = require('../middleware/verifyAdmin');

/**
 * Cost Monitoring Routes
 * Provides insights into Cloudinary cost optimization effectiveness
 */

// Get current cost metrics
router.get('/metrics', verifyAdmin, async (req, res) => {
  try {
    const metrics = costMonitor.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cost metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cost metrics'
    });
  }
});

// Generate comprehensive cost report
router.get('/report', verifyAdmin, async (req, res) => {
  try {
    const report = await costMonitor.generateReport();
    
    if (!report) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate cost report'
      });
    }
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating cost report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cost report'
    });
  }
});

// Get Cloudinary usage statistics
router.get('/cloudinary-stats', verifyAdmin, async (req, res) => {
  try {
    const stats = await getCloudinaryStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching Cloudinary stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Cloudinary statistics'
    });
  }
});

// Reset cost monitoring metrics
router.post('/reset', verifyAdmin, async (req, res) => {
  try {
    costMonitor.reset();
    
    res.json({
      success: true,
      message: 'Cost monitoring metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting cost metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset cost metrics'
    });
  }
});

// Get optimization recommendations
router.get('/recommendations', verifyAdmin, async (req, res) => {
  try {
    const metrics = costMonitor.getMetrics();
    const recommendations = costMonitor.generateRecommendations(metrics);
    
    res.json({
      success: true,
      data: {
        recommendations,
        metrics: {
          compressionRatio: metrics.averages.compressionRatio,
          cacheHitRate: metrics.averages.cacheHitRate,
          duplicateRate: metrics.averages.duplicateRate
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch optimization recommendations'
    });
  }
});

// Get cost savings summary
router.get('/savings-summary', verifyAdmin, async (req, res) => {
  try {
    const metrics = costMonitor.getMetrics();
    const savings = metrics.savings.estimatedCostSavings;
    
    res.json({
      success: true,
      data: {
        summary: {
          totalUploads: metrics.totalUploads,
          duplicateSaves: metrics.duplicateSaves,
          averageCompressionRatio: metrics.averages.compressionRatio + '%',
          cacheHitRate: metrics.averages.cacheHitRate + '%',
          bandwidthSavedMB: metrics.savings.bandwidthSavedMB,
          estimatedSavingsPercentage: savings.percentage + '%'
        },
        breakdown: {
          bandwidthSavings: '$' + savings.bandwidth,
          duplicateSavings: '$' + savings.duplicates,
          transformationSavings: '$' + savings.transformations,
          totalSavings: '$' + savings.total
        },
        runtime: metrics.runtime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch savings summary'
    });
  }
});

module.exports = router;
