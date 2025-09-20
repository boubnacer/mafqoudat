const mongoose = require('mongoose');

/**
 * Data Versioning System
 * 
 * This system provides:
 * - Version tracking for static data changes
 * - Efficient cache invalidation based on versions
 * - Change detection and notification
 * - Rollback capabilities
 * - Audit trail for data modifications
 */

// Version schema for tracking data changes
const versionSchema = new mongoose.Schema({
  dataType: {
    type: String,
    required: true,
    enum: ['countries', 'categories', 'foundlost', 'cities']
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  previousVersion: {
    type: Number,
    default: null
  },
  changeType: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'bulk_update']
  },
  changeCount: {
    type: Number,
    default: 1
  },
  affectedIds: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  metadata: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['api', 'admin', 'migration', 'system'],
      default: 'api'
    },
    description: String,
    ip: String,
    userAgent: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  checksum: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
versionSchema.index({ dataType: 1, version: -1 });
versionSchema.index({ timestamp: -1 });
versionSchema.index({ 'metadata.user': 1 });

const DataVersion = mongoose.model('DataVersion', versionSchema);

class DataVersioningManager {
  constructor() {
    this.currentVersions = new Map();
    this.versionHistory = new Map();
    this.isInitialized = false;
  }

  // Initialize versioning system
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🔄 Initializing Data Versioning System...');
    
    try {
      // Load current versions for all data types
      await this.loadCurrentVersions();
      
      this.isInitialized = true;
      console.log('✅ Data Versioning System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Data Versioning System:', error);
      throw error;
    }
  }

  // Load current versions from database
  async loadCurrentVersions() {
    try {
      const dataTypes = ['countries', 'categories', 'foundlost', 'cities'];
      
      for (const dataType of dataTypes) {
        const latestVersion = await DataVersion.findOne({ dataType })
          .sort({ version: -1 })
          .lean();
        
        if (latestVersion) {
          this.currentVersions.set(dataType, latestVersion.version);
        } else {
          // Create initial version if none exists
          await this.createInitialVersion(dataType);
          this.currentVersions.set(dataType, 1);
        }
      }
      
      console.log('📊 Current versions loaded:', Object.fromEntries(this.currentVersions));
    } catch (error) {
      console.error('❌ Failed to load current versions:', error);
      throw error;
    }
  }

  // Create initial version for a data type
  async createInitialVersion(dataType) {
    try {
      const checksum = await this.calculateDataChecksum(dataType);
      
      const initialVersion = new DataVersion({
        dataType,
        version: 1,
        changeType: 'bulk_update',
        changeCount: 0,
        affectedIds: [],
        metadata: {
          source: 'system',
          description: 'Initial version created during system initialization'
        },
        checksum
      });
      
      await initialVersion.save();
      console.log(`📝 Created initial version for ${dataType}`);
    } catch (error) {
      console.error(`❌ Failed to create initial version for ${dataType}:`, error);
      throw error;
    }
  }

  // Calculate checksum for data type
  async calculateDataChecksum(dataType) {
    try {
      const models = {
        countries: require('../models/Country'),
        categories: require('../models/Category'),
        foundlost: require('../models/FoundLost'),
        cities: require('../models/City')
      };

      const Model = models[dataType];
      if (!Model) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      // Get all documents and create a hash
      const documents = await Model.find({})
        .sort({ _id: 1 })
        .lean();

      const crypto = require('crypto');
      const dataString = JSON.stringify(documents);
      const checksum = crypto.createHash('md5').update(dataString).digest('hex');
      
      return checksum;
    } catch (error) {
      console.error(`❌ Failed to calculate checksum for ${dataType}:`, error);
      return 'unknown';
    }
  }

  // Record a change and increment version
  async recordChange(dataType, changeType, affectedIds = [], metadata = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const currentVersion = this.currentVersions.get(dataType) || 0;
      const newVersion = currentVersion + 1;
      
      const checksum = await this.calculateDataChecksum(dataType);
      
      const versionRecord = new DataVersion({
        dataType,
        version: newVersion,
        previousVersion: currentVersion,
        changeType,
        changeCount: affectedIds.length,
        affectedIds,
        metadata: {
          source: 'api',
          ...metadata
        },
        checksum
      });

      await versionRecord.save();
      
      // Update current version
      this.currentVersions.set(dataType, newVersion);
      
      // Store in version history for quick access
      if (!this.versionHistory.has(dataType)) {
        this.versionHistory.set(dataType, []);
      }
      
      const history = this.versionHistory.get(dataType);
      history.unshift({
        version: newVersion,
        changeType,
        timestamp: versionRecord.timestamp,
        changeCount: affectedIds.length,
        checksum
      });
      
      // Keep only last 50 versions in memory
      if (history.length > 50) {
        history.splice(50);
      }
      
      console.log(`📝 Recorded ${changeType} change for ${dataType}: version ${newVersion} (${affectedIds.length} items)`);
      
      return {
        dataType,
        version: newVersion,
        previousVersion: currentVersion,
        changeType,
        changeCount: affectedIds.length,
        checksum
      };
    } catch (error) {
      console.error(`❌ Failed to record change for ${dataType}:`, error);
      throw error;
    }
  }

  // Get current version for data type
  getCurrentVersion(dataType) {
    return this.currentVersions.get(dataType) || 0;
  }

  // Get version history for data type
  async getVersionHistory(dataType, limit = 20) {
    try {
      const versions = await DataVersion.find({ dataType })
        .sort({ version: -1 })
        .limit(limit)
        .select('version previousVersion changeType changeCount timestamp metadata.description checksum')
        .lean();
      
      return versions;
    } catch (error) {
      console.error(`❌ Failed to get version history for ${dataType}:`, error);
      return [];
    }
  }

  // Check if data has changed since last cache update
  async hasDataChanged(dataType, lastCacheVersion) {
    try {
      const currentVersion = this.getCurrentVersion(dataType);
      return currentVersion > lastCacheVersion;
    } catch (error) {
      console.error(`❌ Failed to check data changes for ${dataType}:`, error);
      return true; // Assume changed if we can't determine
    }
  }

  // Get all current versions
  getAllCurrentVersions() {
    return Object.fromEntries(this.currentVersions);
  }

  // Compare checksums to detect changes
  async compareChecksums(dataType) {
    try {
      const currentChecksum = await this.calculateDataChecksum(dataType);
      const latestVersion = await DataVersion.findOne({ dataType })
        .sort({ version: -1 })
        .lean();
      
      if (!latestVersion) {
        return { changed: true, reason: 'No version history found' };
      }
      
      const changed = currentChecksum !== latestVersion.checksum;
      return {
        changed,
        currentChecksum,
        lastChecksum: latestVersion.checksum,
        lastVersion: latestVersion.version
      };
    } catch (error) {
      console.error(`❌ Failed to compare checksums for ${dataType}:`, error);
      return { changed: true, reason: 'Error comparing checksums' };
    }
  }

  // Bulk update version (for migrations or bulk operations)
  async recordBulkUpdate(dataType, changeCount, metadata = {}) {
    return this.recordChange(dataType, 'bulk_update', [], {
      ...metadata,
      description: `Bulk update affecting ${changeCount} items`
    });
  }

  // Record single item change
  async recordItemChange(dataType, changeType, itemId, metadata = {}) {
    return this.recordChange(dataType, changeType, [itemId], metadata);
  }

  // Record multiple item changes
  async recordItemsChange(dataType, changeType, itemIds, metadata = {}) {
    return this.recordChange(dataType, changeType, itemIds, metadata);
  }

  // Get version statistics
  async getVersionStats() {
    try {
      const stats = {};
      const dataTypes = ['countries', 'categories', 'foundlost', 'cities'];
      
      for (const dataType of dataTypes) {
        const count = await DataVersion.countDocuments({ dataType });
        const latestVersion = await DataVersion.findOne({ dataType })
          .sort({ version: -1 })
          .lean();
        
        stats[dataType] = {
          totalVersions: count,
          currentVersion: this.getCurrentVersion(dataType),
          lastChange: latestVersion?.timestamp,
          lastChangeType: latestVersion?.changeType
        };
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get version stats:', error);
      return {};
    }
  }

  // Cleanup old version records (keep only last N versions per data type)
  async cleanupOldVersions(keepVersions = 100) {
    try {
      const dataTypes = ['countries', 'categories', 'foundlost', 'cities'];
      let totalDeleted = 0;
      
      for (const dataType of dataTypes) {
        const oldVersions = await DataVersion.find({ dataType })
          .sort({ version: -1 })
          .skip(keepVersions)
          .select('_id version');
        
        if (oldVersions.length > 0) {
          const idsToDelete = oldVersions.map(v => v._id);
          const result = await DataVersion.deleteMany({ _id: { $in: idsToDelete } });
          totalDeleted += result.deletedCount;
          
          console.log(`🗑️ Cleaned up ${result.deletedCount} old versions for ${dataType}`);
        }
      }
      
      console.log(`✅ Cleanup completed: ${totalDeleted} old versions deleted`);
      return totalDeleted;
    } catch (error) {
      console.error('❌ Failed to cleanup old versions:', error);
      return 0;
    }
  }

  // Health check
  isHealthy() {
    return this.isInitialized && this.currentVersions.size > 0;
  }

  // Get system info
  getSystemInfo() {
    return {
      isInitialized: this.isInitialized,
      currentVersions: this.getAllCurrentVersions(),
      isHealthy: this.isHealthy()
    };
  }
}

// Create singleton instance
const dataVersioningManager = new DataVersioningManager();

// Middleware to automatically record changes
const recordChangeMiddleware = (dataType, changeType) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override response methods to capture changes
    res.json = function(data) {
      // Record change after successful response
      if (data && data.success && res.statusCode < 400) {
        const itemId = req.params.id || data.data?._id;
        const itemIds = Array.isArray(data.data) ? data.data.map(item => item._id) : [itemId];
        
        dataVersioningManager.recordItemsChange(dataType, changeType, itemIds, {
          user: req.user?._id,
          source: 'api',
          description: `${changeType} operation via API`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(error => {
          console.error('Failed to record change:', error);
        });
      }
      
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      // Record change after successful response
      if (res.statusCode < 400) {
        const itemId = req.params.id;
        
        dataVersioningManager.recordItemChange(dataType, changeType, itemId, {
          user: req.user?._id,
          source: 'api',
          description: `${changeType} operation via API`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(error => {
          console.error('Failed to record change:', error);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  DataVersion,
  dataVersioningManager,
  recordChangeMiddleware,
  initializeDataVersioning: () => dataVersioningManager.initialize()
};
