const mongoose = require('mongoose');
const { env } = require('./env.cjs');

/**
 * Production-grade MongoDB connection with optimized settings
 * 
 * Features:
 * - Connection pooling for concurrent requests
 * - Automatic retry logic for failed operations
 * - Compression for bandwidth optimization
 * - Event listeners for monitoring
 * - Graceful shutdown handling
 */

const connectToDatabase = async () => {
  mongoose.set('strictQuery', true);

  // Connection options optimized for vector search workloads
  const options = {
    // Database name
    dbName: env.MONGODB_DB_NAME,
    
    // Connection Pool Settings (optimized for production)
    maxPoolSize: 30,              // Max concurrent connections
    minPoolSize: 5,               // Min connections to maintain
    maxIdleTimeMS: 60000,         // Close idle connections after 60s
    
    // Timeout Settings (fail fast for better UX)
    serverSelectionTimeoutMS: 5000,   // Fail after 5s if no server available
    socketTimeoutMS: 45000,           // Socket operation timeout
    connectTimeoutMS: 10000,          // Initial connection timeout
    heartbeatFrequencyMS: 10000,      // Check server health every 10s
    
    // Reliability & Durability
    retryWrites: true,                // Auto-retry failed writes
    retryReads: true,                 // Auto-retry failed reads
    w: 'majority',                    // Write acknowledgment from majority
    
    // Performance Optimizations
    compressors: ['zlib'],            // Enable network compression
    zlibCompressionLevel: 6,          // Compression level (1-9, 6 is balanced)
    
    // Application Identification (shows in Atlas monitoring)
    appName: 'CompanyMind-SemanticSearch'
  };

  try {
    await mongoose.connect(env.MONGODB_URI, options);
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`   Database: ${env.MONGODB_DB_NAME || 'default'}`);
    console.log(`   Pool Size: ${options.minPoolSize}-${options.maxPoolSize} connections`);
    console.log(`   Compression: Enabled (zlib level ${options.zlibCompressionLevel})`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

/**
 * Connection Event Listeners for Monitoring
 */
const setupMongooseEventListeners = () => {
  // Connection opened
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  // Connection error
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
  });

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
  });

  // Application termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('👋 Mongoose connection closed due to app termination');
    process.exit(0);
  });

  // Graceful shutdown on SIGTERM (Docker/Kubernetes)
  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('👋 Mongoose connection closed due to SIGTERM');
    process.exit(0);
  });
};

/**
 * Get database connection statistics
 */
const getConnectionStats = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: states[state],
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length
  };
};

/**
 * Health check for monitoring/load balancers
 */
const checkDatabaseHealth = async () => {
  try {
    // Ping database
    await mongoose.connection.db.admin().ping();
    
    // Get server status
    const serverStatus = await mongoose.connection.db.admin().serverStatus();
    
    return {
      status: 'healthy',
      connections: serverStatus.connections,
      uptimeSeconds: serverStatus.uptimeEstimate,
      version: serverStatus.version
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Setup event listeners when module loads
setupMongooseEventListeners();

module.exports = { 
  connectToDatabase,
  getConnectionStats,
  checkDatabaseHealth
};
