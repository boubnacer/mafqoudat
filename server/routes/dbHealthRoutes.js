const express = require('express');
const router = express.Router();
const { getConnectionMetrics, checkConnectionHealth, forceReconnect } = require('../config/dbConn');
const { dbMonitor } = require('../utils/dbMonitor');
const mongoose = require('mongoose');
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");

/**
 * Database health and monitoring routes
 * Provides endpoints for monitoring MongoDB connection health and performance
 *
 * Every route here is admin-only: they expose connection internals (host,
 * database name, pool state), collection/index sizes, monitoring alerts, and
 * a manual reconnect that can drop the live connection pool. Even /health
 * reports the connection host and database name, so it is not a safe
 * unauthenticated liveness probe - infrastructure health checks should call
 * the open GET /resilience/live and GET /resilience/ready instead.
 */

// Basic health check endpoint (admin only - exposes connection host/database name)
router.get('/health', verifyJWT, verifyAdmin, async (req, res) => {
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
        console.error('Database health check failed:', error);
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Detailed metrics endpoint
router.get('/metrics', verifyJWT, verifyAdmin, (req, res) => {
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
        console.error('Failed to get database metrics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get metrics',
            timestamp: new Date().toISOString()
        });
    }
});

// Connection pool status
router.get('/pool', verifyJWT, verifyAdmin, (req, res) => {
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
        console.error('Failed to get connection pool status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get pool status',
            timestamp: new Date().toISOString()
        });
    }
});

// Force reconnection endpoint (admin only)
router.post('/reconnect', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        await forceReconnect();
        
        res.json({
            status: 'success',
            message: 'Reconnection completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database reconnection failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Reconnection failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Performance test endpoint
router.get('/performance-test', verifyJWT, verifyAdmin, async (req, res) => {
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
        console.error('Database performance test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Performance test failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Database statistics
router.get('/stats', verifyJWT, verifyAdmin, async (req, res) => {
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
        console.error('Failed to get database stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get database stats',
            timestamp: new Date().toISOString()
        });
    }
});

// Monitoring alerts
router.get('/alerts', verifyJWT, verifyAdmin, (req, res) => {
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
        console.error('Failed to get monitoring alerts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get alerts',
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
