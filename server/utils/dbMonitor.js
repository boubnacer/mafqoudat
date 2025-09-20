const { getConnectionMetrics, checkConnectionHealth, forceReconnect } = require('../config/dbConn');
const mongoose = require('mongoose');

/**
 * Database monitoring utility for Atlas Flex plan optimization
 * Provides comprehensive monitoring, alerting, and performance tracking
 */

class DatabaseMonitor {
    constructor() {
        this.metrics = {
            performance: {
                avgResponseTime: 0,
                slowQueries: 0,
                totalQueries: 0,
                errorRate: 0
            },
            connection: {
                poolUtilization: 0,
                connectionChurn: 0,
                retryRate: 0
            },
            alerts: []
        };
        
        this.thresholds = {
            responseTime: 1000, // 1 second
            errorRate: 0.05, // 5%
            poolUtilization: 0.8, // 80%
            healthCheckFailures: 3
        };
        
        this.startMonitoring();
    }

    /**
     * Start comprehensive database monitoring
     */
    startMonitoring() {
        // Performance monitoring every 30 seconds
        this.performanceInterval = setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000);

        // Connection health monitoring every 15 seconds
        this.healthInterval = setInterval(() => {
            this.performHealthCheck();
        }, 15000);

        // Detailed metrics logging every 5 minutes
        this.metricsInterval = setInterval(() => {
            this.logDetailedMetrics();
        }, 300000);

        console.log('📊 Database monitoring started');
    }

    /**
     * Collect performance metrics
     */
    async collectPerformanceMetrics() {
        try {
            const connectionMetrics = getConnectionMetrics();
            
            // Calculate pool utilization
            const poolUtilization = this.calculatePoolUtilization();
            this.metrics.connection.poolUtilization = poolUtilization;

            // Check for performance issues
            if (poolUtilization > this.thresholds.poolUtilization) {
                this.addAlert('HIGH_POOL_UTILIZATION', `Pool utilization: ${(poolUtilization * 100).toFixed(1)}%`);
            }

            // Monitor connection health
            if (connectionMetrics.healthCheckFailures > this.thresholds.healthCheckFailures) {
                this.addAlert('HEALTH_CHECK_FAILURES', `Health check failures: ${connectionMetrics.healthCheckFailures}`);
            }

        } catch (error) {
            console.error('❌ Error collecting performance metrics:', error);
        }
    }

    /**
     * Perform health check
     */
    async performHealthCheck() {
        try {
            const healthStatus = await checkConnectionHealth();
            
            if (!healthStatus.healthy) {
                this.addAlert('CONNECTION_UNHEALTHY', healthStatus.message);
                
                // Attempt automatic recovery
                if (mongoose.connection.readyState === 0) {
                    console.log('🔄 Attempting automatic reconnection...');
                    try {
                        await forceReconnect();
                        this.addAlert('RECONNECTION_SUCCESS', 'Automatic reconnection successful');
                    } catch (error) {
                        this.addAlert('RECONNECTION_FAILED', `Reconnection failed: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Health check error:', error);
            this.addAlert('HEALTH_CHECK_ERROR', error.message);
        }
    }

    /**
     * Calculate connection pool utilization
     */
    calculatePoolUtilization() {
        try {
            // This is an approximation since mongoose doesn't expose exact pool stats
            const readyState = mongoose.connection.readyState;
            const isConnected = readyState === 1;
            
            // Estimate based on connection state and activity
            return isConnected ? 0.3 : 0; // Conservative estimate
        } catch (error) {
            return 0;
        }
    }

    /**
     * Add alert to monitoring system
     */
    addAlert(type, message) {
        const alert = {
            type,
            message,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(type)
        };

        this.metrics.alerts.push(alert);
        
        // Keep only last 50 alerts
        if (this.metrics.alerts.length > 50) {
            this.metrics.alerts = this.metrics.alerts.slice(-50);
        }

        console.log(`🚨 DB Alert [${alert.severity}]: ${type} - ${message}`);
    }

    /**
     * Get alert severity level
     */
    getAlertSeverity(type) {
        const severityMap = {
            'HIGH_POOL_UTILIZATION': 'WARNING',
            'HEALTH_CHECK_FAILURES': 'ERROR',
            'CONNECTION_UNHEALTHY': 'CRITICAL',
            'RECONNECTION_SUCCESS': 'INFO',
            'RECONNECTION_FAILED': 'CRITICAL',
            'HEALTH_CHECK_ERROR': 'ERROR'
        };
        
        return severityMap[type] || 'INFO';
    }

    /**
     * Log detailed metrics
     */
    logDetailedMetrics() {
        const connectionMetrics = getConnectionMetrics();
        
        console.log('📊 === Database Performance Report ===');
        console.log(`📈 Connection Metrics:`, {
            totalConnections: connectionMetrics.totalConnections,
            activeConnections: connectionMetrics.activeConnections,
            failedConnections: connectionMetrics.failedConnections,
            retryAttempts: connectionMetrics.retryAttempts,
            healthCheckSuccessRate: connectionMetrics.healthCheckSuccessRate,
            uptime: `${Math.round(connectionMetrics.uptime / 1000)}s`
        });
        
        console.log(`📊 Performance Metrics:`, {
            poolUtilization: `${(this.metrics.connection.poolUtilization * 100).toFixed(1)}%`,
            totalAlerts: this.metrics.alerts.length,
            recentAlerts: this.metrics.alerts.slice(-5).map(a => `${a.type}: ${a.message}`)
        });
        
        console.log('=====================================');
    }

    /**
     * Get current monitoring status
     */
    getStatus() {
        return {
            monitoring: {
                active: true,
                uptime: Date.now() - this.startTime,
                intervals: {
                    performance: !!this.performanceInterval,
                    health: !!this.healthInterval,
                    metrics: !!this.metricsInterval
                }
            },
            metrics: this.metrics,
            connection: getConnectionMetrics()
        };
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.performanceInterval) clearInterval(this.performanceInterval);
        if (this.healthInterval) clearInterval(this.healthInterval);
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        
        console.log('📊 Database monitoring stopped');
    }

    /**
     * Force health check and return results
     */
    async forceHealthCheck() {
        return await checkConnectionHealth();
    }

    /**
     * Get connection recommendations based on current metrics
     */
    getRecommendations() {
        const recommendations = [];
        const connectionMetrics = getConnectionMetrics();
        
        // Pool size recommendations
        if (this.metrics.connection.poolUtilization > 0.8) {
            recommendations.push({
                type: 'POOL_SIZE',
                message: 'Consider increasing maxPoolSize if you frequently hit pool limits',
                priority: 'MEDIUM'
            });
        }
        
        // Retry recommendations
        if (connectionMetrics.retryAttempts > 2) {
            recommendations.push({
                type: 'RETRY_LOGIC',
                message: 'High retry attempts detected. Check network stability and MongoDB Atlas status',
                priority: 'HIGH'
            });
        }
        
        // Health check recommendations
        if (connectionMetrics.healthCheckFailures > 5) {
            recommendations.push({
                type: 'HEALTH_MONITORING',
                message: 'Multiple health check failures. Consider reviewing connection configuration',
                priority: 'HIGH'
            });
        }
        
        return recommendations;
    }
}

// Create singleton instance
const dbMonitor = new DatabaseMonitor();

module.exports = {
    dbMonitor,
    DatabaseMonitor
};
