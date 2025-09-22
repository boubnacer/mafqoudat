/**
 * Resilient Database Connection Manager
 * Enhanced error handling and resilience for Atlas Flex plan limitations
 */

const mongoose = require('mongoose');
const resilienceManager = require('../utils/resilienceManager');

// Suppress deprecation warnings in production
if (process.env.NODE_ENV === 'production') {
    mongoose.set('strictQuery', false);
}

// Enhanced connection metrics
const connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    retryAttempts: 0,
    lastConnectionTime: null,
    connectionUptime: 0,
    healthChecks: 0,
    healthCheckFailures: 0,
    circuitBreakerTrips: 0,
    gracefulDegradations: 0
};

// Atlas Flex plan optimized connection options with resilience
const getConnectionOptions = () => ({
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
    // Optimized for Atlas Flex plan limits
    maxPoolSize: 8, // Optimal for Flex plan
    minPoolSize: 2, // Maintain minimum connections
    maxIdleTimeMS: 60000, // 1 minute
    
    // Resilience-focused timeout settings
    serverSelectionTimeoutMS: 15000, // 15s
    socketTimeoutMS: 45000, // 45s
    connectTimeoutMS: 15000, // 15s
    heartbeatFrequencyMS: 10000, // 10s
    
    // Reliability settings
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    
    // Compression for bandwidth optimization
    compressors: ['zlib'],
    
    // Enhanced monitoring
    monitorCommands: true
});

// Connection state management
let connectionState = {
    isConnected: false,
    isConnecting: false,
    lastError: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
};

/**
 * Enhanced database connection with resilience patterns
 */
const connectDB = async () => {
    if (connectionState.isConnected) {
        console.log('📊 Database already connected');
        return;
    }

    if (connectionState.isConnecting) {
        console.log('⏳ Database connection in progress...');
        return new Promise((resolve, reject) => {
            const checkConnection = setInterval(() => {
                if (connectionState.isConnected) {
                    clearInterval(checkConnection);
                    resolve();
                } else if (!connectionState.isConnecting) {
                    clearInterval(checkConnection);
                    reject(connectionState.lastError);
                }
            }, 100);
        });
    }

    connectionState.isConnecting = true;
    connectionMetrics.totalConnections++;

    try {
        const options = getConnectionOptions();
        
        // Use circuit breaker for connection
        await resilienceManager.executeWithCircuitBreaker('database', async () => {
            const connection = await mongoose.connect(process.env.MONGODB_URI, options);
            
            connectionState.isConnected = true;
            connectionState.isConnecting = false;
            connectionState.lastError = null;
            connectionState.reconnectAttempts = 0;
            
            connectionMetrics.activeConnections++;
            connectionMetrics.lastConnectionTime = new Date();
            connectionMetrics.connectionUptime = Date.now();
            
            console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
            console.log(`📊 Connection Pool: max=${options.maxPoolSize}, min=${options.minPoolSize}`);
            
            return connection;
        }, async () => {
            // Fallback: Use in-memory cache mode
            console.log('🔄 Database connection failed, using fallback mode');
            connectionMetrics.gracefulDegradations++;
            connectionState.isConnected = false;
            connectionState.isConnecting = false;
            
            // Set up graceful degradation
            process.env.DB_FALLBACK_MODE = 'true';
            
            return { fallback: true };
        });

        // Set up connection event handlers
        setupConnectionEventHandlers();
        
    } catch (error) {
        connectionState.isConnecting = false;
        connectionState.lastError = error;
        connectionMetrics.failedConnections++;
        
        console.error('❌ Database connection failed:', error.message);
        
        // Attempt automatic recovery
        await attemptRecovery();
        
        throw error;
    }
};

/**
 * Setup connection event handlers for resilience
 */
const setupConnectionEventHandlers = () => {
    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        connectionState.isConnected = true;
        connectionState.lastError = null;
        connectionMetrics.activeConnections = 1;
    });

    mongoose.connection.on('error', async (error) => {
        console.error('❌ MongoDB connection error:', error.message);
        connectionState.isConnected = false;
        connectionState.lastError = error;
        connectionMetrics.failedConnections++;
        
        // Attempt recovery
        await attemptRecovery();
    });

    mongoose.connection.on('disconnected', async () => {
        console.warn('⚠️ MongoDB disconnected');
        connectionState.isConnected = false;
        connectionMetrics.activeConnections = 0;
        
        // Attempt reconnection
        await attemptRecovery();
    });

    mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        connectionState.isConnected = true;
        connectionState.reconnectAttempts = 0;
        connectionMetrics.activeConnections = 1;
    });

    // Monitor connection pool
    mongoose.connection.on('fullsetup', () => {
        console.log('📊 MongoDB connection pool fully established');
    });
};

/**
 * Automatic recovery mechanism
 */
const attemptRecovery = async () => {
    if (connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts) {
        console.error('❌ Maximum reconnection attempts reached');
        return false;
    }

    connectionState.reconnectAttempts++;
    console.log(`🔄 Attempting database recovery (attempt ${connectionState.reconnectAttempts})`);
    
    try {
        // Use exponential backoff
        const delay = Math.min(1000 * Math.pow(2, connectionState.reconnectAttempts - 1), 30000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (!connectionState.isConnected) {
            await connectDB();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Database recovery failed:', error.message);
        return false;
    }
};

/**
 * Enhanced database health check
 */
const checkDatabaseHealth = async () => {
    try {
        connectionMetrics.healthChecks++;
        
        if (!connectionState.isConnected) {
            throw new Error('Database not connected');
        }

        // Test with a simple ping
        await mongoose.connection.db.admin().ping();
        
        // Check connection pool status
        const poolStats = {
            totalConnections: mongoose.connection.db.serverConfig.s.pool.totalConnectionCount,
            availableConnections: mongoose.connection.db.serverConfig.s.pool.availableConnectionCount,
            checkedOutConnections: mongoose.connection.db.serverConfig.s.pool.checkedOutConnectionCount
        };
        
        return {
            status: 'healthy',
            connectionState: mongoose.connection.readyState,
            poolStats,
            uptime: connectionMetrics.connectionUptime ? Date.now() - connectionMetrics.connectionUptime : 0
        };
    } catch (error) {
        connectionMetrics.healthCheckFailures++;
        throw new Error(`Database health check failed: ${error.message}`);
    }
};

/**
 * Graceful database operations with fallback
 */
const executeWithFallback = async (operation, fallbackOperation = null, context = '') => {
    try {
        return await resilienceManager.executeWithRetry('database', operation, { context });
    } catch (error) {
        console.warn(`⚠️ Database operation failed${context ? ` (${context})` : ''}:`, error.message);
        
        if (fallbackOperation) {
            try {
                console.log(`🔄 Using fallback operation${context ? ` for ${context}` : ''}`);
                connectionMetrics.gracefulDegradations++;
                return await fallbackOperation();
            } catch (fallbackError) {
                console.error(`❌ Fallback operation also failed:`, fallbackError.message);
                throw fallbackError;
            }
        }
        
        throw error;
    }
};

/**
 * Enhanced connection metrics
 */
const getConnectionMetrics = () => {
    return {
        ...connectionMetrics,
        connectionState,
        uptime: connectionMetrics.connectionUptime ? Date.now() - connectionMetrics.connectionUptime : 0,
        resilienceMetrics: resilienceManager.getMetrics()
    };
};

/**
 * Graceful shutdown with cleanup
 */
const disconnectDB = async () => {
    try {
        console.log('🔄 Disconnecting from MongoDB...');
        
        if (connectionState.isConnected) {
            await mongoose.connection.close();
            connectionState.isConnected = false;
            connectionMetrics.activeConnections = 0;
            console.log('✅ MongoDB disconnected gracefully');
        }
    } catch (error) {
        console.error('❌ Error during MongoDB disconnection:', error.message);
        throw error;
    }
};

/**
 * Database operation wrapper with resilience
 */
const withDatabaseResilience = (operation, fallback = null) => {
    return async (...args) => {
        return await executeWithFallback(
            () => operation(...args),
            fallback,
            operation.name || 'database_operation'
        );
    };
};

module.exports = {
    connectDB,
    disconnectDB,
    checkDatabaseHealth,
    getConnectionMetrics,
    executeWithFallback,
    withDatabaseResilience,
    isConnected: () => connectionState.isConnected,
    connectionState: () => connectionState,
    attemptRecovery
};
