const express = require('express');
const router = express.Router();
const { getConnectionMetrics, checkConnectionHealth, forceReconnect } = require('../config/dbConn');
const { dbMonitor } = require('../utils/dbMonitor');
const mongoose = require('mongoose');

/**
 * Database health and monitoring routes
 * Provides endpoints for monitoring MongoDB connection health and performance
 */

// Basic health check endpoint
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await checkConnectionHealth();
        const statusCode = healthStatus.healthy ? 200 : 503;
        
        res.status(statusCode).json({
            status: healthStatus.healthy ? 'healthy' : 'unhealthy',
            message: healthStatus.message,
            timestamp: new Date().toISOString(),
            connection: {
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: `Health check failed: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Detailed metrics endpoint
router.get('/metrics', (req, res) => {
    try {
        const connectionMetrics = getConnectionMetrics();
        const monitorStatus = dbMonitor.getStatus();
        
        res.json({
            timestamp: new Date().toISOString(),
            connection: connectionMetrics,
            monitoring: monitorStatus,
            recommendations: dbMonitor.getRecommendations()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Failed to get metrics: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Connection pool status
router.get('/pool', (req, res) => {
    try {
        const connection = mongoose.connection;
        const poolStats = {
            readyState: connection.readyState,
            readyStateText: getReadyStateText(connection.readyState),
            host: connection.host,
            port: connection.port,
            name: connection.name,
            collections: Object.keys(connection.collections).length,
            models: Object.keys(connection.models).length,
            db: {
                name: connection.db?.databaseName,
                version: connection.db?.serverConfig?.version
            }
        };
        
        res.json({
            timestamp: new Date().toISOString(),
            pool: poolStats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Failed to get pool status: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Force reconnection endpoint (admin only)
router.post('/reconnect', async (req, res) => {
    try {
        console.log('🔄 Manual reconnection requested');
        await forceReconnect();
        
        res.json({
            status: 'success',
            message: 'Reconnection completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Reconnection failed: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Performance test endpoint
router.get('/performance-test', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Perform a simple database operation
        await mongoose.connection.db.admin().ping();
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            status: 'success',
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            performance: {
                excellent: responseTime < 100,
                good: responseTime < 500,
                acceptable: responseTime < 1000,
                slow: responseTime >= 1000
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Performance test failed: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Database statistics
router.get('/stats', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const stats = await db.stats();
        
        res.json({
            timestamp: new Date().toISOString(),
            database: {
                name: stats.db,
                collections: stats.collections,
                dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
                storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
                indexes: stats.indexes,
                indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
                objects: stats.objects
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Failed to get database stats: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Monitoring alerts
router.get('/alerts', (req, res) => {
    try {
        const monitorStatus = dbMonitor.getStatus();
        const recentAlerts = monitorStatus.metrics.alerts.slice(-20); // Last 20 alerts
        
        res.json({
            timestamp: new Date().toISOString(),
            totalAlerts: monitorStatus.metrics.alerts.length,
            recentAlerts: recentAlerts,
            alertSummary: getAlertSummary(recentAlerts)
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Failed to get alerts: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function to get ready state text
function getReadyStateText(readyState) {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[readyState] || 'unknown';
}

// Helper function to get alert summary
function getAlertSummary(alerts) {
    const summary = {
        CRITICAL: 0,
        ERROR: 0,
        WARNING: 0,
        INFO: 0
    };
    
    alerts.forEach(alert => {
        summary[alert.severity] = (summary[alert.severity] || 0) + 1;
    });
    
    return summary;
}

module.exports = router;
