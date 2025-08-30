const mongoose = require('mongoose');
require('dotenv').config();

async function monitorIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n📊 Index Usage Statistics\n');

    // Monitor Post indexes
    console.log('📝 POST INDEXES:');
    console.log('================');
    const postIndexStats = await db.collection('posts').aggregate([
      { $indexStats: {} }
    ]).toArray();

    postIndexStats.forEach(index => {
      const usage = index.accesses;
      const ops = usage.ops || 0;
      const since = new Date(usage.since).toLocaleDateString();
      
      console.log(`\n🔍 Index: ${index.name}`);
      console.log(`   Operations: ${ops.toLocaleString()}`);
      console.log(`   Since: ${since}`);
      console.log(`   Size: ${(index.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (ops === 0) {
        console.log(`   ⚠️  WARNING: This index has not been used!`);
      } else if (ops < 100) {
        console.log(`   📉 Low usage - consider removing if not needed`);
      } else {
        console.log(`   ✅ Good usage`);
      }
    });

    // Monitor User indexes
    console.log('\n\n👤 USER INDEXES:');
    console.log('===============');
    const userIndexStats = await db.collection('users').aggregate([
      { $indexStats: {} }
    ]).toArray();

    userIndexStats.forEach(index => {
      const usage = index.accesses;
      const ops = usage.ops || 0;
      const since = new Date(usage.since).toLocaleDateString();
      
      console.log(`\n🔍 Index: ${index.name}`);
      console.log(`   Operations: ${ops.toLocaleString()}`);
      console.log(`   Since: ${since}`);
      console.log(`   Size: ${(index.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (ops === 0) {
        console.log(`   ⚠️  WARNING: This index has not been used!`);
      } else if (ops < 50) {
        console.log(`   📉 Low usage - consider removing if not needed`);
      } else {
        console.log(`   ✅ Good usage`);
      }
    });

    // Monitor City indexes
    console.log('\n\n🏙️ CITY INDEXES:');
    console.log('================');
    const cityIndexStats = await db.collection('cities').aggregate([
      { $indexStats: {} }
    ]).toArray();

    cityIndexStats.forEach(index => {
      const usage = index.accesses;
      const ops = usage.ops || 0;
      const since = new Date(usage.since).toLocaleDateString();
      
      console.log(`\n🔍 Index: ${index.name}`);
      console.log(`   Operations: ${ops.toLocaleString()}`);
      console.log(`   Since: ${since}`);
      console.log(`   Size: ${(index.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (ops === 0) {
        console.log(`   ⚠️  WARNING: This index has not been used!`);
      } else if (ops < 20) {
        console.log(`   📉 Low usage - consider removing if not needed`);
      } else {
        console.log(`   ✅ Good usage`);
      }
    });

    // Monitor Category indexes
    console.log('\n\n📂 CATEGORY INDEXES:');
    console.log('===================');
    const categoryIndexStats = await db.collection('categories').aggregate([
      { $indexStats: {} }
    ]).toArray();

    categoryIndexStats.forEach(index => {
      const usage = index.accesses;
      const ops = usage.ops || 0;
      const since = new Date(usage.since).toLocaleDateString();
      
      console.log(`\n🔍 Index: ${index.name}`);
      console.log(`   Operations: ${ops.toLocaleString()}`);
      console.log(`   Since: ${since}`);
      console.log(`   Size: ${(index.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (ops === 0) {
        console.log(`   ⚠️  WARNING: This index has not been used!`);
      } else if (ops < 10) {
        console.log(`   📉 Low usage - consider removing if not needed`);
      } else {
        console.log(`   ✅ Good usage`);
      }
    });

    // Monitor FoundLost indexes
    console.log('\n\n🔍 FOUNDLOST INDEXES:');
    console.log('====================');
    const foundlostIndexStats = await db.collection('foundlosts').aggregate([
      { $indexStats: {} }
    ]).toArray();

    foundlostIndexStats.forEach(index => {
      const usage = index.accesses;
      const ops = usage.ops || 0;
      const since = new Date(usage.since).toLocaleDateString();
      
      console.log(`\n🔍 Index: ${index.name}`);
      console.log(`   Operations: ${ops.toLocaleString()}`);
      console.log(`   Since: ${since}`);
      console.log(`   Size: ${(index.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (ops === 0) {
        console.log(`   ⚠️  WARNING: This index has not been used!`);
      } else if (ops < 10) {
        console.log(`   📉 Low usage - consider removing if not needed`);
      } else {
        console.log(`   ✅ Good usage`);
      }
    });

    // Summary
    console.log('\n\n📈 SUMMARY:');
    console.log('===========');
    
    const allCollections = ['posts', 'users', 'cities', 'categories', 'foundlosts'];
    let totalIndexes = 0;
    let unusedIndexes = 0;
    let totalSize = 0;

    for (const collection of allCollections) {
      const stats = await db.collection(collection).aggregate([
        { $indexStats: {} }
      ]).toArray();

      totalIndexes += stats.length;
      
      stats.forEach(index => {
        const ops = index.accesses.ops || 0;
        if (ops === 0) unusedIndexes++;
        totalSize += index.size;
      });
    }

    console.log(`Total Indexes: ${totalIndexes}`);
    console.log(`Unused Indexes: ${unusedIndexes}`);
    console.log(`Total Index Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index Usage Rate: ${((totalIndexes - unusedIndexes) / totalIndexes * 100).toFixed(1)}%`);

    if (unusedIndexes > 0) {
      console.log(`\n⚠️  RECOMMENDATIONS:`);
      console.log(`- Consider removing ${unusedIndexes} unused indexes to save space`);
      console.log(`- Monitor query patterns to identify why indexes are unused`);
    }

    console.log('\n📊 Monitoring completed successfully!');

  } catch (error) {
    console.error('❌ Error monitoring indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  monitorIndexes();
}

module.exports = monitorIndexes;
