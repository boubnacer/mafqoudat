/**
 * Error Monitoring and Alerting System
 * Comprehensive error tracking, analysis, and alerting
 */

class ErrorMonitor {
  constructor() {
    this.errorLog = [];
    this.alertThresholds = {
      errorRate: 10, // errors per minute
      consecutiveFailures: 5,
      criticalErrors: 3
    };
    this.metrics = {
      totalErrors: 0,
      criticalErrors: 0,
      warnings: 0,
      lastAlertTime: null,
      errorRate: 0
    };
    this.alertCooldown = 300000; // 5 minutes
  }

  /**
   * Log an error with context
   */
  logError(error, context = {}) {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      context: {
        ...context,
        userAgent: context.userAgent,
        ip: context.ip,
        endpoint: context.endpoint,
        userId: context.userId
      },
      severity: this.determineSeverity(error),
      category: this.categorizeError(error)
    };

    this.errorLog.push(errorEntry);
    this.updateMetrics(errorEntry);
    
    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }

    // Check for alerts
    this.checkForAlerts();

    return errorEntry;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return 'low';
    }
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return 'high';
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return 'critical';
    }
    
    if (error.message.includes('circuit breaker') || error.message.includes('fallback')) {
      return 'high';
    }
    
    if (error.message.includes('memory') || error.message.includes('out of memory')) {
      return 'critical';
    }
    
    return 'medium';
  }

  /**
   * Categorize error for better analysis
   */
  categorizeError(error) {
    if (error.name.includes('Mongo') || error.message.includes('database')) {
      return 'database';
    }
    
    if (error.message.includes('Redis') || error.message.includes('cache')) {
      return 'cache';
    }
    
    if (error.message.includes('Cloudinary') || error.message.includes('upload')) {
      return 'cloudinary';
    }
    
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'network';
    }
    
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return 'validation';
    }
    
    if (error.message.includes('authentication') || error.message.includes('authorization')) {
      return 'auth';
    }
    
    return 'general';
  }

  /**
   * Update error metrics
   */
  updateMetrics(errorEntry) {
    this.metrics.totalErrors++;
    
    if (errorEntry.severity === 'critical') {
      this.metrics.criticalErrors++;
    } else if (errorEntry.severity === 'low') {
      this.metrics.warnings++;
    }
    
    // Calculate error rate (errors per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentErrors = this.errorLog.filter(e => e.timestamp > oneMinuteAgo);
    this.metrics.errorRate = recentErrors.length;
  }

  /**
   * Check for alert conditions
   */
  checkForAlerts() {
    const now = Date.now();
    
    // Check alert cooldown
    if (this.metrics.lastAlertTime && 
        (now - this.metrics.lastAlertTime) < this.alertCooldown) {
      return;
    }

    let shouldAlert = false;
    let alertMessage = '';

    // Check error rate
    if (this.metrics.errorRate >= this.alertThresholds.errorRate) {
      shouldAlert = true;
      alertMessage = `High error rate detected: ${this.metrics.errorRate} errors/minute`;
    }

    // Check consecutive critical errors
    const recentCriticalErrors = this.errorLog
      .slice(-this.alertThresholds.consecutiveFailures)
      .filter(e => e.severity === 'critical');
    
    if (recentCriticalErrors.length >= this.alertThresholds.consecutiveFailures) {
      shouldAlert = true;
      alertMessage = `${recentCriticalErrors.length} consecutive critical errors detected`;
    }

    // Check total critical errors
    if (this.metrics.criticalErrors >= this.alertThresholds.criticalErrors) {
      shouldAlert = true;
      alertMessage = `${this.metrics.criticalErrors} critical errors detected`;
    }

    if (shouldAlert) {
      this.sendAlert(alertMessage);
      this.metrics.lastAlertTime = now;
    }
  }

  /**
   * Send alert (implement based on your notification system)
   */
  async sendAlert(message) {
    console.error(`🚨 ALERT: ${message}`);
    
    // You can implement various alerting methods here:
    // - Email notifications
    // - Slack webhooks
    // - SMS alerts
    // - PagerDuty integration
    // - Custom webhook endpoints
    
    try {
      // Example: Log to a dedicated alert log
      const alertEntry = {
        timestamp: new Date(),
        message,
        metrics: { ...this.metrics },
        recentErrors: this.errorLog.slice(-10)
      };
      
      console.error('🚨 Alert Details:', JSON.stringify(alertEntry, null, 2));
      
      // In production, you might want to send this to an external service
      // await this.sendToMonitoringService(alertEntry);
      
    } catch (alertError) {
      console.error('Failed to send alert:', alertError.message);
    }
  }

  /**
   * Get error analytics
   */
  getAnalytics(timeRange = 3600000) { // 1 hour default
    const cutoffTime = new Date(Date.now() - timeRange);
    const recentErrors = this.errorLog.filter(e => e.timestamp > cutoffTime);
    
    const analytics = {
      totalErrors: recentErrors.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      errorsByTime: {},
      topErrors: {},
      errorTrend: this.calculateErrorTrend(recentErrors)
    };

    // Analyze by category
    recentErrors.forEach(error => {
      analytics.errorsByCategory[error.category] = 
        (analytics.errorsByCategory[error.category] || 0) + 1;
      
      analytics.errorsBySeverity[error.severity] = 
        (analytics.errorsBySeverity[error.severity] || 0) + 1;
      
      // Group by 10-minute intervals
      const timeKey = Math.floor(error.timestamp.getTime() / 600000) * 600000;
      analytics.errorsByTime[timeKey] = (analytics.errorsByTime[timeKey] || 0) + 1;
      
      // Track top errors
      const errorKey = `${error.name}: ${error.message}`;
      analytics.topErrors[errorKey] = (analytics.topErrors[errorKey] || 0) + 1;
    });

    return analytics;
  }

  /**
   * Calculate error trend
   */
  calculateErrorTrend(errors) {
    if (errors.length < 2) return 'stable';
    
    const midpoint = Math.floor(errors.length / 2);
    const firstHalf = errors.slice(0, midpoint).length;
    const secondHalf = errors.slice(midpoint).length;
    
    const ratio = secondHalf / firstHalf;
    
    if (ratio > 1.5) return 'increasing';
    if (ratio < 0.67) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get error metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalLoggedErrors: this.errorLog.length,
      lastErrorTime: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1].timestamp : null
    };
  }

  /**
   * Clear old errors (maintenance)
   */
  clearOldErrors(olderThan = 86400000) { // 24 hours default
    const cutoffTime = new Date(Date.now() - olderThan);
    const initialLength = this.errorLog.length;
    
    this.errorLog = this.errorLog.filter(e => e.timestamp > cutoffTime);
    
    const clearedCount = initialLength - this.errorLog.length;
    console.log(`🧹 Cleared ${clearedCount} old error entries`);
    
    return clearedCount;
  }

  /**
   * Get error summary for health checks
   */
  getHealthSummary() {
    const recentErrors = this.errorLog.slice(-100); // Last 100 errors
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
    
    return {
      status: criticalErrors.length > 5 ? 'unhealthy' : 
              this.metrics.errorRate > 20 ? 'degraded' : 'healthy',
      criticalErrors: criticalErrors.length,
      errorRate: this.metrics.errorRate,
      lastErrorTime: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1].timestamp : null
    };
  }
}

// Create global error monitor instance
const errorMonitor = new ErrorMonitor();

// Global error handler
process.on('uncaughtException', (error) => {
  errorMonitor.logError(error, {
    type: 'uncaughtException',
    endpoint: 'global'
  });
  
  console.error('🚨 Uncaught Exception:', error);
  
  // In production, you might want to gracefully shutdown
  // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  errorMonitor.logError(error, {
    type: 'unhandledRejection',
    endpoint: 'global'
  });
  
  console.error('🚨 Unhandled Rejection:', reason);
});

module.exports = errorMonitor;
