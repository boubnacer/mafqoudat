/**
 * MongoDB Index Optimization Script
 * 
 * This script adds critical indexes for optimal query performance
 * Run this script to add the recommended indexes to your MongoDB Atlas cluster
 * 
 * Usage: node server/scripts/optimize-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure they're registered
const Post = require('../models/Post');
const User = require('../models/User');
const Country = require('../models/Country');
const Category = require('../models/Category');
const City = require('../models/City');
const FoundLost = require('../models/FoundLost');

async function optimizeIndexes() {
  try {
    console.log('🚀 Starting MongoDB index optimization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // ========================================
    // POSTS COLLECTION - CRITICAL INDEXES
    // ========================================
    console.log('\n📊 Optimizing Posts collection indexes...');

    // 1. Primary query pattern: country + foundLost + createdAt + status
    await db.collection('posts').createIndex(
      { "country": 1, "foundLost": 1, "createdAt": -1, "status": 1 },
      { 
        name: "country_foundlost_createdat_status",
        background: true 
      }
    );
    console.log('✅ Created index: country_foundlost_createdat_status');

    // 2. Category filtering pattern: country + category + foundLost + createdAt
    await db.collection('posts').createIndex(
      { "country": 1, "category": 1, "foundLost": 1, "createdAt": -1 },
      { 
        name: "country_category_foundlost_createdat",
        background: true 
      }
    );
    console.log('✅ Created index: country_category_foundlost_createdat');

    // 3. City-based queries: country + city + status + createdAt
    await db.collection('posts').createIndex(
      { "country": 1, "city": 1, "status": 1, "createdAt": -1 },
      { 
        name: "country_city_status_createdat",
        background: true 
      }
    );
    console.log('✅ Created index: country_city_status_createdat');

    // 4. Trending posts: foundLost + status + createdAt + views
    await db.collection('posts').createIndex(
      { "foundLost": 1, "status": 1, "createdAt": -1, "views": -1 },
      { 
        name: "foundlost_status_createdat_views",
        background: true 
      }
    );
    console.log('✅ Created index: foundlost_status_createdat_views');

    // 5. User posts: user + status + createdAt
    await db.collection('posts').createIndex(
      { "user": 1, "status": 1, "createdAt": -1 },
      { 
        name: "user_status_createdat",
        background: true 
      }
    );
    console.log('✅ Created index: user_status_createdat');

    // 6. Returned items: country + returned + status + createdAt
    await db.collection('posts').createIndex(
      { "country": 1, "returned": 1, "status": 1, "createdAt": -1 },
      { 
        name: "country_returned_status_createdat",
        background: true 
      }
    );
    console.log('✅ Created index: country_returned_status_createdat');

    // 7. Partial index for active posts only (most common query)
    await db.collection('posts').createIndex(
      { "country": 1, "foundLost": 1, "createdAt": -1 },
      { 
        name: "active_posts_country_foundlost_createdat",
        partialFilterExpression: { "status": "active" },
        background: true 
      }
    );
    console.log('✅ Created partial index: active_posts_country_foundlost_createdat');

    // 8. Search optimization: country + status + text search
    await db.collection('posts').createIndex(
      { "country": 1, "status": 1, "exactLocation": "text", "description": "text" },
      { 
        name: "country_status_text_search",
        background: true 
      }
    );
    console.log('✅ Created index: country_status_text_search');

    // ========================================
    // CITIES COLLECTION - OPTIMIZATION
    // ========================================
    console.log('\n🏙️ Optimizing Cities collection indexes...');

    // 1. Country + isActive + labels.en (for sorted city queries)
    await db.collection('cities').createIndex(
      { "country": 1, "isActive": 1, "labels.en": 1 },
      { 
        name: "country_isactive_labels_en",
        background: true 
      }
    );
    console.log('✅ Created index: country_isactive_labels_en');

    // 2. Country + isActive + isCapital (for capital cities)
    await db.collection('cities').createIndex(
      { "country": 1, "isActive": 1, "isCapital": 1 },
      { 
        name: "country_isactive_iscapital",
        background: true 
      }
    );
    console.log('✅ Created index: country_isactive_iscapital');

    // ========================================
    // CATEGORIES COLLECTION - OPTIMIZATION
    // ========================================
    console.log('\n📂 Optimizing Categories collection indexes...');

    // 1. isActive + priority + labels.en (for sorted active categories)
    await db.collection('categories').createIndex(
      { "isActive": 1, "priority": -1, "labels.en": 1 },
      { 
        name: "isactive_priority_labels_en",
        background: true 
      }
    );
    console.log('✅ Created index: isactive_priority_labels_en');

    // ========================================
    // FOUNDLOST COLLECTION - OPTIMIZATION
    // ========================================
    console.log('\n🔍 Optimizing FoundLost collection indexes...');

    // 1. isActive + code (for active found/lost types)
    await db.collection('foundlosts').createIndex(
      { "isActive": 1, "code": 1 },
      { 
        name: "isactive_code",
        background: true 
      }
    );
    console.log('✅ Created index: isactive_code');

    // ========================================
    // COUNTRIES COLLECTION - OPTIMIZATION
    // ========================================
    console.log('\n🌍 Optimizing Countries collection indexes...');

    // 1. isActive + labels.en (for sorted active countries)
    await db.collection('countries').createIndex(
      { "isActive": 1, "labels.en": 1 },
      { 
        name: "isactive_labels_en",
        background: true 
      }
    );
    console.log('✅ Created index: isactive_labels_en');

    // ========================================
    // USERS COLLECTION - OPTIMIZATION
    // ========================================
    console.log('\n👤 Optimizing Users collection indexes...');

    // 1. isActive + country (for active users by country)
    await db.collection('users').createIndex(
      { "isActive": 1, "country": 1 },
      { 
        name: "isactive_country",
        background: true 
      }
    );
    console.log('✅ Created index: isactive_country');

    // ========================================
    // INDEX ANALYSIS AND RECOMMENDATIONS
    // ========================================
    console.log('\n📈 Analyzing index usage...');

    // Get index statistics
    const postsIndexes = await db.collection('posts').indexes();
    const citiesIndexes = await db.collection('cities').indexes();
    const categoriesIndexes = await db.collection('categories').indexes();
    const foundlostsIndexes = await db.collection('foundlosts').indexes();
    const countriesIndexes = await db.collection('countries').indexes();
    const usersIndexes = await db.collection('users').indexes();

    console.log('\n📊 Index Summary:');
    console.log(`Posts: ${postsIndexes.length} indexes`);
    console.log(`Cities: ${citiesIndexes.length} indexes`);
    console.log(`Categories: ${categoriesIndexes.length} indexes`);
    console.log(`FoundLost: ${foundlostsIndexes.length} indexes`);
    console.log(`Countries: ${countriesIndexes.length} indexes`);
    console.log(`Users: ${usersIndexes.length} indexes`);

    console.log('\n✅ Index optimization completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Monitor query performance using MongoDB Atlas Performance Advisor');
    console.log('2. Run EXPLAIN on your most common queries to verify index usage');
    console.log('3. Consider implementing the optimized aggregation pipelines');
    console.log('4. Set up monitoring for index usage and query performance');

  } catch (error) {
    console.error('❌ Error during index optimization:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the optimization if this script is executed directly
if (require.main === module) {
  optimizeIndexes()
    .then(() => {
      console.log('🎉 Index optimization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Index optimization failed:', error);
      process.exit(1);
    });
}

module.exports = { optimizeIndexes };
