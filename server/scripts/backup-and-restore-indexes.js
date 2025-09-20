/**
 * MongoDB Index Backup and Restore Script
 * 
 * This script backs up current indexes before optimization and provides
 * a way to restore them if needed.
 * 
 * Usage: 
 * - Backup: node server/scripts/backup-and-restore-indexes.js backup
 * - Restore: node server/scripts/backup-and-restore-indexes.js restore
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKUP_FILE = path.join(__dirname, 'index-backup.json');

async function backupIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const backup = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // Backup all collection indexes
    const collections = ['posts', 'users', 'cities', 'categories', 'foundlosts', 'countries', 'reports'];
    
    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        backup.collections[collectionName] = indexes;
        console.log(`✅ Backed up ${indexes.length} indexes for ${collectionName}`);
      } catch (error) {
        console.log(`⚠️  Could not backup ${collectionName}: ${error.message}`);
        backup.collections[collectionName] = [];
      }
    }

    // Save backup to file
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log(`\n💾 Index backup saved to: ${BACKUP_FILE}`);
    console.log(`📊 Total collections backed up: ${Object.keys(backup.collections).length}`);

  } catch (error) {
    console.error('❌ Error backing up indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function restoreIndexes() {
  try {
    // Check if backup file exists
    if (!fs.existsSync(BACKUP_FILE)) {
      throw new Error(`Backup file not found: ${BACKUP_FILE}`);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Read backup file
    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`📅 Restoring indexes from backup: ${backup.timestamp}`);

    // Restore indexes for each collection
    for (const [collectionName, indexes] of Object.entries(backup.collections)) {
      console.log(`\n🔄 Restoring ${indexes.length} indexes for ${collectionName}...`);
      
      for (const index of indexes) {
        // Skip the default _id index
        if (index.name === '_id_') continue;
        
        try {
          // Create index with the same specification
          const indexSpec = { ...index.key };
          const options = {
            name: index.name,
            background: true,
            ...index
          };
          
          // Remove key from options as it's in the spec
          delete options.key;
          
          await db.collection(collectionName).createIndex(indexSpec, options);
          console.log(`  ✅ Restored index: ${index.name}`);
        } catch (error) {
          if (error.code === 85) { // Index already exists
            console.log(`  ℹ️  Index already exists: ${index.name}`);
          } else {
            console.log(`  ⚠️  Could not restore index ${index.name}: ${error.message}`);
          }
        }
      }
    }

    console.log('\n✅ Index restoration completed successfully!');

  } catch (error) {
    console.error('❌ Error restoring indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function listBackupInfo() {
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.log('❌ No backup file found. Run backup first.');
      return;
    }

    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    
    console.log('📋 Backup Information:');
    console.log(`📅 Created: ${backup.timestamp}`);
    console.log(`📊 Collections: ${Object.keys(backup.collections).length}`);
    
    for (const [collectionName, indexes] of Object.entries(backup.collections)) {
      console.log(`  ${collectionName}: ${indexes.length} indexes`);
    }

  } catch (error) {
    console.error('❌ Error reading backup info:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      await backupIndexes();
      break;
    case 'restore':
      await restoreIndexes();
      break;
    case 'info':
      await listBackupInfo();
      break;
    default:
      console.log('Usage:');
      console.log('  node backup-and-restore-indexes.js backup   - Backup current indexes');
      console.log('  node backup-and-restore-indexes.js restore  - Restore from backup');
      console.log('  node backup-and-restore-indexes.js info     - Show backup information');
      process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Operation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Operation failed:', error);
      process.exit(1);
    });
}

module.exports = { backupIndexes, restoreIndexes, listBackupInfo };
