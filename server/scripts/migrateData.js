const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Migration data for existing categories
const categoryMigrations = [
  {
    oldCode: 'ELECTRONICS',
    newData: {
      code: 'ELECTRONICS',
      labels: {
        en: 'Electronics',
        fr: 'Électronique',
        ar: 'إلكترونيات'
      },
      flag: '📱',
      icon: '📱',
      color: '#2196F3',
      description: 'Electronic devices and gadgets'
    }
  },
  {
    oldCode: 'DOCUMENTS',
    newData: {
      code: 'DOCUMENTS',
      labels: {
        en: 'Documents',
        fr: 'Documents',
        ar: 'وثائق'
      },
      flag: '📄',
      icon: '📄',
      color: '#FF9800',
      description: 'Important documents and papers'
    }
  },
  {
    oldCode: 'JEWELRY',
    newData: {
      code: 'JEWELRY',
      labels: {
        en: 'Jewelry',
        fr: 'Bijoux',
        ar: 'مجوهرات'
      },
      flag: '💍',
      icon: '💍',
      color: '#E91E63',
      description: 'Jewelry and accessories'
    }
  },
  {
    oldCode: 'CLOTHING',
    newData: {
      code: 'CLOTHING',
      labels: {
        en: 'Clothing',
        fr: 'Vêtements',
        ar: 'ملابس'
      },
      flag: '👕',
      icon: '👕',
      color: '#9C27B0',
      description: 'Clothing and fashion items'
    }
  },
  {
    oldCode: 'PETS',
    newData: {
      code: 'PETS',
      labels: {
        en: 'Pets',
        fr: 'Animaux',
        ar: 'حيوانات أليفة'
      },
      flag: '🐕',
      icon: '🐕',
      color: '#795548',
      description: 'Lost or found pets'
    }
  },
  {
    oldCode: 'VEHICLES',
    newData: {
      code: 'VEHICLES',
      labels: {
        en: 'Vehicles',
        fr: 'Véhicules',
        ar: 'مركبات'
      },
      flag: '🚗',
      icon: '🚗',
      color: '#607D8B',
      description: 'Cars, motorcycles, and other vehicles'
    }
  }
];

const migrateCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    let migratedCount = 0;
    let createdCount = 0;

    for (const migration of categoryMigrations) {
      // Check if category exists
      const existingCategory = await Category.findOne({ code: migration.oldCode });
      
      if (existingCategory) {
        // Update existing category
        if (!existingCategory.labels || !existingCategory.labels.en) {
          // Only update if it doesn't have the new structure
          await Category.findByIdAndUpdate(existingCategory._id, {
            labels: migration.newData.labels,
            icon: migration.newData.icon,
            color: migration.newData.color,
            description: migration.newData.description,
            isActive: true
          });
          console.log(`✅ Updated category: ${migration.oldCode}`);
          migratedCount++;
        } else {
          console.log(`⏭️  Category already migrated: ${migration.oldCode}`);
        }
      } else {
        // Create new category
        await Category.create(migration.newData);
        console.log(`✅ Created category: ${migration.oldCode}`);
        createdCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`Updated: ${migratedCount} categories`);
    console.log(`Created: ${createdCount} categories`);

    // Show final count
    const totalCategories = await Category.countDocuments();
    console.log(`Total categories in database: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateCategories();
}

module.exports = { migrateCategories }; 