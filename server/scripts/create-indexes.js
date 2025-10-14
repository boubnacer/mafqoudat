const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure indexes are created
const Post = require('../models/Post');
const User = require('../models/User');
const City = require('../models/City');
const Category = require('../models/Category');
const FoundLost = require('../models/FoundLost');
const Country = require('../models/Country');

async function createIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Creating database indexes...');

    // Get database instance
    const db = mongoose.connection.db;

    // Create Post indexes
    console.log('\n📝 Creating Post indexes...');
    await db.collection('posts').createIndex(
      { country: 1, category: 1, status: 1 },
      { background: true, name: 'country_category_status' }
    );
    console.log('✅ Created index: country_category_status');

    await db.collection('posts').createIndex(
      { foundLost: 1, status: 1, createdAt: -1 },
      { background: true, name: 'foundlost_status_createdAt' }
    );
    console.log('✅ Created index: foundlost_status_createdAt');

    await db.collection('posts').createIndex(
      { country: 1, foundLost: 1, status: 1 },
      { background: true, name: 'country_foundlost_status' }
    );
    console.log('✅ Created index: country_foundlost_status');

    await db.collection('posts').createIndex(
      { user: 1, status: 1, createdAt: -1 },
      { background: true, name: 'user_status_createdAt' }
    );
    console.log('✅ Created index: user_status_createdAt');

    await db.collection('posts').createIndex(
      { status: 1, createdAt: -1 },
      { background: true, name: 'status_createdAt' }
    );
    console.log('✅ Created index: status_createdAt');

    await db.collection('posts').createIndex(
      { country: 1, status: 1, createdAt: -1 },
      { background: true, name: 'country_status_createdAt' }
    );
    console.log('✅ Created index: country_status_createdAt');

    await db.collection('posts').createIndex(
      { city: 1, status: 1, createdAt: -1 },
      { background: true, name: 'city_status_createdAt' }
    );
    console.log('✅ Created index: city_status_createdAt');

    await db.collection('posts').createIndex(
      { returned: 1, status: 1, createdAt: -1 },
      { background: true, name: 'returned_status_createdAt' }
    );
    console.log('✅ Created index: returned_status_createdAt');


    await db.collection('posts').createIndex(
      { views: -1, status: 1 },
      { background: true, name: 'views_status' }
    );
    console.log('✅ Created index: views_status');

    await db.collection('posts').createIndex(
      { expiresAt: 1, status: 1 },
      { background: true, name: 'expiresAt_status' }
    );
    console.log('✅ Created index: expiresAt_status');

    await db.collection('posts').createIndex(
      { promotionRequested: 1, promotionProcessed: 1, status: 1 },
      { background: true, name: 'promotion_status' }
    );
    console.log('✅ Created index: promotion_status');

    // Create User indexes
    console.log('\n👤 Creating User indexes...');
    await db.collection('users').createIndex(
      { country: 1, isActive: 1 },
      { background: true, name: 'country_isActive' }
    );
    console.log('✅ Created index: country_isActive');

    await db.collection('users').createIndex(
      { role: 1, isActive: 1 },
      { background: true, name: 'role_isActive' }
    );
    console.log('✅ Created index: role_isActive');

    await db.collection('users').createIndex(
      { lastLogin: -1, isActive: 1 },
      { background: true, name: 'lastLogin_isActive' }
    );
    console.log('✅ Created index: lastLogin_isActive');

    await db.collection('users').createIndex(
      { createdAt: -1, isActive: 1 },
      { background: true, name: 'createdAt_isActive' }
    );
    console.log('✅ Created index: createdAt_isActive');

    await db.collection('users').createIndex(
      { country: 1, role: 1, isActive: 1 },
      { background: true, name: 'country_role_isActive' }
    );
    console.log('✅ Created index: country_role_isActive');

    await db.collection('users').createIndex(
      { email: 1, isActive: 1 },
      { background: true, name: 'email_isActive' }
    );
    console.log('✅ Created index: email_isActive');

    await db.collection('users').createIndex(
      { phone: 1, isActive: 1 },
      { background: true, name: 'phone_isActive' }
    );
    console.log('✅ Created index: phone_isActive');

    // Create City indexes
    console.log('\n🏙️ Creating City indexes...');
    await db.collection('cities').createIndex(
      { country: 1, isActive: 1, isCapital: 1 },
      { background: true, name: 'country_isActive_isCapital' }
    );
    console.log('✅ Created index: country_isActive_isCapital');

    await db.collection('cities').createIndex(
      { country: 1, isActive: 1, "labels.en": 1 },
      { background: true, name: 'country_isActive_labels_en' }
    );
    console.log('✅ Created index: country_isActive_labels_en');

    await db.collection('cities').createIndex(
      { isActive: 1, isCapital: 1 },
      { background: true, name: 'isActive_isCapital' }
    );
    console.log('✅ Created index: isActive_isCapital');

    await db.collection('cities').createIndex(
      { isDynamic: 1, isActive: 1 },
      { background: true, name: 'isDynamic_isActive' }
    );
    console.log('✅ Created index: isDynamic_isActive');

    await db.collection('cities').createIndex(
      { country: 1, isDynamic: 1, isActive: 1 },
      { background: true, name: 'country_isDynamic_isActive' }
    );
    console.log('✅ Created index: country_isDynamic_isActive');

    // Create Category indexes
    console.log('\n📂 Creating Category indexes...');
    await db.collection('categories').createIndex(
      { isActive: 1, priority: -1 },
      { background: true, name: 'isActive_priority' }
    );
    console.log('✅ Created index: isActive_priority');

    await db.collection('categories').createIndex(
      { isActive: 1, "labels.en": 1 },
      { background: true, name: 'isActive_labels_en' }
    );
    console.log('✅ Created index: isActive_labels_en');

    await db.collection('categories').createIndex(
      { code: 1, isActive: 1 },
      { background: true, name: 'code_isActive' }
    );
    console.log('✅ Created index: code_isActive');

    // Create FoundLost indexes
    console.log('\n🔍 Creating FoundLost indexes...');
    await db.collection('foundlosts').createIndex(
      { isActive: 1, code: 1 },
      { background: true, name: 'isActive_code' }
    );
    console.log('✅ Created index: isActive_code');

    await db.collection('foundlosts').createIndex(
      { isActive: 1, "labels.en": 1 },
      { background: true, name: 'isActive_labels_en' }
    );
    console.log('✅ Created index: isActive_labels_en');

    console.log('\n🎉 All indexes created successfully!');
    console.log('\n📊 Index creation completed. You can monitor index usage with:');
    console.log('db.posts.aggregate([{ $indexStats: {} }])');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;
