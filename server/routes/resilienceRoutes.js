/**
 * Resilience and Health Check Routes
 * Comprehensive health monitoring and system status endpoints
 */

const express = require('express');
const router = express.Router();
const resilienceManager = require('../utils/resilienceManager');
const { checkDatabaseHealth, getConnectionMetrics } = require('../config/resilientDbConn');

/**
 * Comprehensive health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const healthData = await resilienceManager.performHealthChecks();
    const dbMetrics = getConnectionMetrics();
    
    const response = {
      status: healthData.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: healthData.services.database,
          metrics: dbMetrics
        },
        redis: {
          status: healthData.services.redis
        },
        cloudinary: {
          status: healthData.services.cloudinary
        }
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      resilience: resilienceManager.getMetrics()
    };

    // Set appropriate HTTP status code
    const httpStatus = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Database-specific health check
 */
router.get('/health/database', async (req, res) => {
  try {
    const healthData = await resilienceManager.executeWithCircuitBreaker(
      'database',
      checkDatabaseHealth,
      () => ({ status: 'unhealthy', error: 'Database circuit breaker open' })
    );

    const metrics = getConnectionMetrics();
    
    res.json({
      status: 'healthy',
      database: healthData,
      metrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Redis health check
 */
router.get('/health/redis', async (req, res) => {
  try {
    const healthData = await resilienceManager.executeWithCircuitBreaker(
      'redis',
      () => resilienceManager.checkRedisHealth(),
      () => ({ status: 'unhealthy', error: 'Redis circuit breaker open' })
    );

    res.json({
      status: 'healthy',
      redis: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Cloudinary health check
 */
router.get('/health/cloudinary', async (req, res) => {
  try {
    const healthData = await resilienceManager.executeWithCircuitBreaker(
      'cloudinary',
      () => resilienceManager.checkCloudinaryHealth(),
      () => ({ status: 'unhealthy', error: 'Cloudinary circuit breaker open' })
    );

    res.json({
      status: 'healthy',
      cloudinary: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Resilience metrics endpoint
 */
router.get('/resilience/metrics', async (req, res) => {
  try {
    const metrics = resilienceManager.getMetrics();
    const dbMetrics = getConnectionMetrics();
    
    res.json({
      success: true,
      data: {
        resilience: metrics,
        database: dbMetrics,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Circuit breaker status
 */
router.get('/resilience/circuit-breakers', async (req, res) => {
  try {
    const metrics = resilienceManager.getMetrics();
    
    res.json({
      success: true,
      data: {
        circuitBreakers: metrics.circuitBreakers,
        overallHealth: metrics.overallHealth
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Manual recovery endpoint
 */
router.post('/resilience/recover/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const result = await resilienceManager.attemptRecovery(service);
    
    if (result) {
      res.json({
        success: true,
        message: `${service} recovery successful`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: `${service} recovery failed`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Reset resilience metrics
 */
router.post('/resilience/reset', async (req, res) => {
  try {
    resilienceManager.resetMetrics();
    
    res.json({
      success: true,
      message: 'Resilience metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * System readiness check (for load balancers)
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick checks for essential services
    const checks = await Promise.allSettled([
      resilienceManager.checkDatabaseHealth(),
      resilienceManager.checkRedisHealth()
    ]);

    const isReady = checks.every(check => check.status === 'fulfilled');
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness check (for Kubernetes)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Detailed system status
 */
router.get('/status', async (req, res) => {
  try {
    const healthData = await resilienceManager.performHealthChecks();
    const dbMetrics = getConnectionMetrics();
    const resilienceMetrics = resilienceManager.getMetrics();
    
    res.json({
      status: healthData.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      services: {
        database: {
          status: healthData.services.database,
          connectionState: dbMetrics.connectionState,
          metrics: {
            totalConnections: dbMetrics.totalConnections,
            activeConnections: dbMetrics.activeConnections,
            failedConnections: dbMetrics.failedConnections,
            retryAttempts: dbMetrics.retryAttempts
          }
        },
        redis: {
          status: healthData.services.redis
        },
        cloudinary: {
          status: healthData.services.cloudinary
        }
      },
      
      resilience: {
        overallHealth: resilienceMetrics.overallHealth,
        failures: resilienceMetrics.failures,
        successes: resilienceMetrics.successes,
        retries: resilienceMetrics.retries,
        circuitBreakerTrips: resilienceMetrics.circuitBreakerTrips,
        circuitBreakers: resilienceMetrics.circuitBreakers
      },
      
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
