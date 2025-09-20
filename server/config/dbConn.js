const mongoose = require('mongoose')

// Suppress deprecation warnings in production
if (process.env.NODE_ENV === 'production') {
    mongoose.set('strictQuery', false);
}

// Connection metrics tracking
const connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    retryAttempts: 0,
    lastConnectionTime: null,
    connectionUptime: 0,
    healthChecks: 0,
    healthCheckFailures: 0
};

// Retry configuration for Atlas Flex plan
const retryConfig = {
    maxRetries: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2
};

// Atlas Flex plan optimized connection options
const getConnectionOptions = () => ({
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
    // Optimized for Atlas Flex plan limits
    maxPoolSize: 8, // Optimal for Flex plan (was 5, increased for better performance)
    minPoolSize: 2, // Maintain minimum connections for responsiveness
    maxIdleTimeMS: 60000, // 1 minute - balance between resource usage and performance
    
    // Optimized timeout settings for Atlas Flex
    serverSelectionTimeoutMS: 15000, // 15s - optimal for Flex plan
    socketTimeoutMS: 45000, // 45s - allows for longer operations
    connectTimeoutMS: 15000, // 15s - reasonable connection timeout
    heartbeatFrequencyMS: 10000, // 10s - frequent health checks
    
    // Reliability settings
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    
    // Compression for bandwidth optimization
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
    
    // Additional optimizations
    maxStalenessSeconds: 90, // Read from secondary if primary is stale
    readPreference: 'primaryPreferred', // Prefer primary but allow secondary reads
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority', j: true }
});

// Exponential backoff retry logic
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectWithRetry = async (retryCount = 0) => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, getConnectionOptions());
        
        connectionMetrics.totalConnections++;
        connectionMetrics.lastConnectionTime = new Date();
        connectionMetrics.retryAttempts = retryCount;
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Connection Pool: max=${getConnectionOptions().maxPoolSize}, min=${getConnectionOptions().minPoolSize}`);
        
        return conn;
    } catch (error) {
        connectionMetrics.failedConnections++;
        
        if (retryCount < retryConfig.maxRetries) {
            const delay = Math.min(
                retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, retryCount),
                retryConfig.maxDelay
            );
            
            console.log(`⚠️ Connection attempt ${retryCount + 1} failed. Retrying in ${delay}ms...`);
            console.error(`Error: ${error.message}`);
            
            await sleep(delay);
            return connectWithRetry(retryCount + 1);
        } else {
            console.error('❌ Max retry attempts reached. Connection failed permanently.');
            throw error;
        }
    }
};

const connectDB = async () => {
    try {
        const conn = await connectWithRetry();
        
        // Enhanced connection monitoring
        mongoose.connection.on('connected', () => {
            connectionMetrics.activeConnections = 1;
            connectionMetrics.connectionUptime = Date.now();
            console.log('✅ MongoDB connection established');
        });
        
        mongoose.connection.on('disconnected', () => {
            connectionMetrics.activeConnections = 0;
            console.log('⚠️ MongoDB connection disconnected');
        });
        
        mongoose.connection.on('error', (err) => {
            connectionMetrics.healthCheckFailures++;
            console.error('❌ MongoDB connection error:', err);
            
            // Attempt reconnection on certain errors
            if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
                console.log('🔄 Attempting to reconnect...');
                setTimeout(() => {
                    if (mongoose.connection.readyState === 0) {
                        connectDB().catch(console.error);
                    }
                }, 5000);
            }
        });
        
        // Connection pool monitoring
        mongoose.connection.on('fullsetup', () => {
            console.log('📊 MongoDB connection pool fully established');
        });
        
        // Health check monitoring
        const healthCheckInterval = setInterval(() => {
            connectionMetrics.healthChecks++;
            
            if (mongoose.connection.readyState === 1) {
                const poolStats = {
                    readyState: mongoose.connection.readyState,
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                    uptime: connectionMetrics.connectionUptime ? Date.now() - connectionMetrics.connectionUptime : 0
                };
                
                console.log(`📊 MongoDB Health: ${JSON.stringify(poolStats)}`);
            } else {
                connectionMetrics.healthCheckFailures++;
                console.log(`⚠️ MongoDB Health Check Failed: State=${mongoose.connection.readyState}`);
            }
        }, 30000); // Every 30 seconds
        
        // Store interval for cleanup
        mongoose.connection._healthCheckInterval = healthCheckInterval;
        
    } catch (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    }
}

// Graceful shutdown function with cleanup
const disconnectDB = async () => {
    try {
        // Clear health check interval
        if (mongoose.connection._healthCheckInterval) {
            clearInterval(mongoose.connection._healthCheckInterval);
        }
        
        // Close connection gracefully
        await mongoose.connection.close();
        connectionMetrics.activeConnections = 0;
        
        console.log('✅ MongoDB connection closed gracefully');
        console.log('📊 Final Connection Metrics:', getConnectionMetrics());
    } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
    }
}

// Get current connection metrics
const getConnectionMetrics = () => ({
    ...connectionMetrics,
    currentTime: new Date().toISOString(),
    uptime: connectionMetrics.connectionUptime ? Date.now() - connectionMetrics.connectionUptime : 0,
    healthCheckSuccessRate: connectionMetrics.healthChecks > 0 
        ? ((connectionMetrics.healthChecks - connectionMetrics.healthCheckFailures) / connectionMetrics.healthChecks * 100).toFixed(2) + '%'
        : 'N/A'
});

// Connection health check function
const checkConnectionHealth = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            // Perform a simple ping to verify connection
            await mongoose.connection.db.admin().ping();
            return { healthy: true, message: 'Connection is healthy' };
        } else {
            return { healthy: false, message: `Connection state: ${mongoose.connection.readyState}` };
        }
    } catch (error) {
        return { healthy: false, message: `Health check failed: ${error.message}` };
    }
};

// Force reconnection function
const forceReconnect = async () => {
    try {
        console.log('🔄 Forcing MongoDB reconnection...');
        await mongoose.connection.close();
        await sleep(2000); // Wait 2 seconds
        await connectWithRetry();
        console.log('✅ MongoDB reconnection successful');
    } catch (error) {
        console.error('❌ MongoDB reconnection failed:', error);
        throw error;
    }
};

module.exports = { 
    connectDB, 
    disconnectDB, 
    getConnectionMetrics, 
    checkConnectionHealth, 
    forceReconnect 
}