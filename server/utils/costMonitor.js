const { getCloudinaryStats } = require('../config/optimizedCloudinary');

/**
 * Cost Monitoring Utility
 * Tracks Cloudinary usage and cost savings from optimizations
 */

class CostMonitor {
  constructor() {
    this.metrics = {
      totalUploads: 0,
      duplicateSaves: 0,
      compressionSavings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bandwidthSaved: 0,
      transformationsSaved: 0
    };
    
    this.startTime = Date.now();
  }

  /**
   * Record an upload event
   */
  recordUpload(compressionRatio = 0, isDuplicate = false) {
    this.metrics.totalUploads++;
    
    if (isDuplicate) {
      this.metrics.duplicateSaves++;
    }
    
    if (compressionRatio > 0) {
      this.metrics.compressionSavings += compressionRatio;
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(isHit = true) {
    if (isHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Record bandwidth savings
   */
  recordBandwidthSaved(bytes) {
    this.metrics.bandwidthSaved += bytes;
  }

  /**
   * Record transformation savings
   */
  recordTransformationSaved() {
    this.metrics.transformationsSaved++;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const runtime = Date.now() - this.startTime;
    const runtimeHours = runtime / (1000 * 60 * 60);
    
    return {
      ...this.metrics,
      runtime: {
        milliseconds: runtime,
        hours: runtimeHours.toFixed(2)
      },
      averages: {
        compressionRatio: this.metrics.totalUploads > 0 
          ? (this.metrics.compressionSavings / this.metrics.totalUploads).toFixed(1)
          : 0,
        duplicateRate: this.metrics.totalUploads > 0
          ? ((this.metrics.duplicateSaves / this.metrics.totalUploads) * 100).toFixed(1)
          : 0,
        cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
          ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(1)
          : 0
      },
      savings: {
        bandwidthSavedMB: (this.metrics.bandwidthSaved / (1024 * 1024)).toFixed(2),
        estimatedCostSavings: this.calculateEstimatedSavings()
      }
    };
  }

  /**
   * Calculate estimated cost savings
   */
  calculateEstimatedSavings() {
    // Based on typical Cloudinary pricing and our optimizations
    const baseCostPerGB = 0.10; // $0.10 per GB storage
    const baseCostPerGBBandwidth = 0.15; // $0.15 per GB bandwidth
    const baseCostPerTransformation = 0.001; // $0.001 per transformation
    
    // Calculate savings from compression (bandwidth reduction)
    const bandwidthSavingsGB = this.metrics.bandwidthSaved / (1024 * 1024 * 1024);
    const bandwidthCostSavings = bandwidthSavingsGB * baseCostPerGBBandwidth;
    
    // Calculate savings from duplicate detection (storage + bandwidth)
    const duplicateSavings = this.metrics.duplicateSaves * 0.02; // Estimated $0.02 per duplicate saved
    
    // Calculate savings from cache hits (transformations avoided)
    const transformationSavings = this.metrics.cacheHits * baseCostPerTransformation;
    
    // Calculate total estimated savings
    const totalSavings = bandwidthCostSavings + duplicateSavings + transformationSavings;
    
    return {
      bandwidth: bandwidthCostSavings.toFixed(2),
      duplicates: duplicateSavings.toFixed(2),
      transformations: transformationSavings.toFixed(2),
      total: totalSavings.toFixed(2),
      percentage: this.calculateSavingsPercentage(totalSavings)
    };
  }

  /**
   * Calculate savings percentage (estimated)
   */
  calculateSavingsPercentage(totalSavings) {
    // Estimate baseline costs without optimizations
    const estimatedBaselineCost = this.metrics.totalUploads * 0.05; // $0.05 per upload baseline
    const savingsPercentage = estimatedBaselineCost > 0 
      ? ((totalSavings / estimatedBaselineCost) * 100).toFixed(1)
      : 0;
    
    return Math.min(savingsPercentage, 50); // Cap at 50% to be realistic
  }

  /**
   * Generate cost savings report
   */
  async generateReport() {
    try {
      const metrics = this.getMetrics();
      const cloudinaryStats = await getCloudinaryStats();
      
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalUploads: metrics.totalUploads,
          duplicateSaves: metrics.duplicateSaves,
          averageCompressionRatio: metrics.averages.compressionRatio + '%',
          cacheHitRate: metrics.averages.cacheHitRate + '%',
          estimatedCostSavings: '$' + metrics.savings.estimatedCostSavings.total,
          estimatedSavingsPercentage: metrics.savings.estimatedCostSavings.percentage + '%'
        },
        details: metrics,
        cloudinaryStats: cloudinaryStats?.optimization || null,
        recommendations: this.generateRecommendations(metrics)
      };
      
      return report;
    } catch (error) {
      console.error('Error generating cost report:', error);
      return null;
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.averages.compressionRatio < 30) {
      recommendations.push('Consider increasing image compression levels for better bandwidth savings');
    }
    
    if (metrics.averages.cacheHitRate < 70) {
      recommendations.push('Cache hit rate is low - consider increasing cache TTL or implementing better cache keys');
    }
    
    if (metrics.averages.duplicateRate < 5) {
      recommendations.push('Low duplicate detection rate - consider improving duplicate detection algorithm');
    }
    
    if (metrics.transformationsSaved < metrics.totalUploads * 0.5) {
      recommendations.push('Consider implementing more aggressive transformation caching');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Optimization is performing well! Continue monitoring for further improvements.');
    }
    
    return recommendations;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      totalUploads: 0,
      duplicateSaves: 0,
      compressionSavings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bandwidthSaved: 0,
      transformationsSaved: 0
    };
    this.startTime = Date.now();
    console.log('📊 Cost monitoring metrics reset');
  }
}

module.exports = new CostMonitor();
