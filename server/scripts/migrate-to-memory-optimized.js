#!/usr/bin/env node

/**
 * Migration Script: Remove Old Cache Systems
 * 
 * This script helps migrate from multiple caching systems to the unified memory-optimized cache.
 * Run this script after deploying the memory optimizations.
 */

const fs = require('fs').promises;
const path = require('path');

class CacheMigrationScript {
  constructor() {
    this.oldCacheFiles = [
      'server/config/cache.js',
      'server/config/enhancedCache.js', 
      'server/config/optimizedCache.js'
    ];
    
    this.oldMiddlewareFiles = [
      'server/middleware/cacheMiddleware.js',
      'server/middleware/optimizedCacheMiddleware.js'
    ];
    
    this.backupDir = 'server/backups/cache-migration';
  }

  async runMigration() {
    console.log('🚀 Starting cache system migration...');
    
    try {
      // Create backup directory
      await this.createBackupDirectory();
      
      // Backup old files
      await this.backupOldFiles();
      
      // Update imports in files that reference old cache systems
      await this.updateCacheImports();
      
      // Clean up old files (optional - uncomment if you want to remove them)
      // await this.removeOldFiles();
      
      console.log('✅ Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Test your application to ensure it works with the unified cache');
      console.log('2. Monitor memory usage with: curl http://localhost:3500/memory/stats');
      console.log('3. Check cache stats with: curl http://localhost:3500/cache/stats');
      console.log('4. If everything works, you can remove the backup files');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n🔧 Recovery steps:');
      console.log('1. Check the backup directory for your original files');
      console.log('2. Restore any files if needed');
      console.log('3. Fix any import errors and try again');
    }
  }

  async createBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    } catch (error) {
      console.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  async backupOldFiles() {
    console.log('💾 Backing up old cache files...');
    
    for (const filePath of [...this.oldCacheFiles, ...this.oldMiddlewareFiles]) {
      try {
        const fullPath = path.resolve(filePath);
        const exists = await fs.access(fullPath).then(() => true).catch(() => false);
        
        if (exists) {
          const fileName = path.basename(filePath);
          const backupPath = path.join(this.backupDir, fileName);
          await fs.copyFile(fullPath, backupPath);
          console.log(`✅ Backed up: ${filePath}`);
        } else {
          console.log(`⚠️ File not found: ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to backup ${filePath}:`, error);
      }
    }
  }

  async updateCacheImports() {
    console.log('🔄 Updating cache imports...');
    
    const filesToUpdate = [
      'server/controllers/postsController.js',
      'server/controllers/dependenciesController.js',
      'server/controllers/cityController.js',
      'server/controllers/countryController.js',
      'server/routes/postRoutes.js',
      'server/routes/dashRoutes.js'
    ];

    for (const filePath of filesToUpdate) {
      try {
        const fullPath = path.resolve(filePath);
        const exists = await fs.access(fullPath).then(() => true).catch(() => false);
        
        if (exists) {
          await this.updateFileImports(fullPath);
          console.log(`✅ Updated imports in: ${filePath}`);
        } else {
          console.log(`⚠️ File not found: ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${filePath}:`, error);
      }
    }
  }

  async updateFileImports(filePath) {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;

    // Replace old cache imports
    const oldImports = [
      { from: 'require("../config/cache")', to: 'require("../config/unifiedCache")' },
      { from: 'require("../config/enhancedCache")', to: 'require("../config/unifiedCache")' },
      { from: 'require("../config/optimizedCache")', to: 'require("../config/unifiedCache")' }
    ];

    for (const { from, to } of oldImports) {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        updated = true;
      }
    }

    // Replace cache service references
    const serviceReplacements = [
      { from: 'cacheService', to: 'unifiedCacheService' },
      { from: 'enhancedCacheService', to: 'unifiedCacheService' },
      { from: 'optimizedCacheService', to: 'unifiedCacheService' }
    ];

    for (const { from, to } of serviceReplacements) {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, 'g'), to);
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  async removeOldFiles() {
    console.log('🗑️ Removing old cache files...');
    
    for (const filePath of [...this.oldCacheFiles, ...this.oldMiddlewareFiles]) {
      try {
        const fullPath = path.resolve(filePath);
        const exists = await fs.access(fullPath).then(() => true).catch(() => false);
        
        if (exists) {
          await fs.unlink(fullPath);
          console.log(`✅ Removed: ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to remove ${filePath}:`, error);
      }
    }
  }

  async generateMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      migration: 'cache-to-unified',
      filesBackedUp: [...this.oldCacheFiles, ...this.oldMiddlewareFiles],
      backupLocation: this.backupDir,
      status: 'completed',
      recommendations: [
        'Monitor memory usage after migration',
        'Test all cache-dependent endpoints',
        'Update any remaining imports manually if needed',
        'Consider removing backup files after successful testing'
      ]
    };

    const reportPath = path.join(this.backupDir, 'migration-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Migration report saved to: ${reportPath}`);
    return reportPath;
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new CacheMigrationScript();
  migration.runMigration().then(async () => {
    await migration.generateMigrationReport();
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = CacheMigrationScript;
