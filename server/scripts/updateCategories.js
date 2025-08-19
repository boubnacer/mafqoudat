const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const updateCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log(`📋 Found ${categories.length} categories to update`);

    // Update each category
    for (const category of categories) {
      const updates = {};

      // Remove flag and icon fields if they exist
      if (category.flag !== undefined) {
        updates.$unset = { flag: 1 };
      }
      if (category.icon !== undefined) {
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.icon = 1;
      }

      // Add new fields if they don't exist
      if (!category.priority) {
        updates.priority = 0;
      }
      if (!category.searchTerms) {
        updates.searchTerms = [];
      }
      if (!category.iconName) {
        // Map existing codes to icon names
        const iconMapping = {
          'ELECTRONICS': 'PhoneAndroidOutlined',
          'DOCUMENTS': 'ArticleOutlined',
          'JEWELRY': 'AttachMoneyOutlined',
          'CLOTHING': 'LuggageOutlined',
          'PETS': 'PetsOutlined',
          'VEHICLES': 'DirectionsCarOutlined',
          'KEYS': 'KeyOutlined',
          'WALLET': 'CreditCardOutlined'
        };
        updates.iconName = iconMapping[category.code] || null;
      }

      // Apply updates if there are any
      if (Object.keys(updates).length > 0) {
        await Category.updateOne({ _id: category._id }, updates);
        console.log(`✅ Updated category: ${category.code}`);
      } else {
        console.log(`ℹ️  No updates needed for category: ${category.code}`);
      }
    }

    console.log('🎉 Category migration completed successfully!');
    
    // Verify the updates
    const updatedCategories = await Category.find({});
    console.log('\n📊 Updated categories:');
    updatedCategories.forEach(cat => {
      console.log(`  - ${cat.code}: priority=${cat.priority}, iconName=${cat.iconName}`);
    });

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration
updateCategories(); 