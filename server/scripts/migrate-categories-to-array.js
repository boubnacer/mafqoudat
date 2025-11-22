const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

/**
 * Migration script to convert single category field to categories array
 * This script:
 * 1. Finds all posts with category field but no categories array
 * 2. Converts category to categories array
 * 3. Keeps the original category field for backward compatibility
 */
async function migrateCategoriesToArray() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mafqoudat';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all posts that have category but no categories array (or empty categories array)
    const postsToMigrate = await Post.find({
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } },
        { categories: null }
      ],
      category: { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${postsToMigrate.length} posts to migrate`);

    if (postsToMigrate.length === 0) {
      console.log('✅ No posts need migration. All posts already have categories array.');
      await mongoose.connection.close();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each post
    for (const post of postsToMigrate) {
      try {
        // Convert single category to array
        if (post.category && (!post.categories || post.categories.length === 0)) {
          post.categories = [post.category];
          await post.save();
          migratedCount++;
          
          if (migratedCount % 100 === 0) {
            console.log(`⏳ Migrated ${migratedCount} posts...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error migrating post ${post._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} posts`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} posts`);
    }

    // Verify migration
    const remainingPosts = await Post.find({
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } },
        { categories: null }
      ],
      category: { $exists: true, $ne: null }
    });

    if (remainingPosts.length === 0) {
      console.log('✅ Migration completed successfully! All posts now have categories array.');
    } else {
      console.log(`⚠️  Warning: ${remainingPosts.length} posts still need migration.`);
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateCategoriesToArray()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateCategoriesToArray;

