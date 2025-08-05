const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Updated categories data with proper multilingual support
const updatedCategoriesData = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    code: 'KEYS',
    labels: {
      en: 'Keys',
      fr: 'Clés',
      ar: 'مفاتيح'
    },
    flag: '🔑',
    icon: '🔑',
    color: '#FFC107',
    description: 'Keys and keychains'
  },
  {
    code: 'BAGS',
    labels: {
      en: 'Bags',
      fr: 'Sacs',
      ar: 'حقائب'
    },
    flag: '💼',
    icon: '💼',
    color: '#795548',
    description: 'Bags, backpacks, and luggage'
  },
  {
    code: 'MONEY',
    labels: {
      en: 'Money',
      fr: 'Argent',
      ar: 'أموال'
    },
    flag: '💰',
    icon: '💰',
    color: '#4CAF50',
    description: 'Money, wallets, and valuables'
  },
  {
    code: 'BOOKS',
    labels: {
      en: 'Books',
      fr: 'Livres',
      ar: 'كتب'
    },
    flag: '📚',
    icon: '📚',
    color: '#8BC34A',
    description: 'Books and educational materials'
  }
];

const updateCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get existing categories
    const existingCategories = await Category.find({});
    console.log(`Found ${existingCategories.length} existing categories`);

    // Update each category with proper translations
    for (const categoryData of updatedCategoriesData) {
      const existingCategory = existingCategories.find(cat => cat.code === categoryData.code);
      
      if (existingCategory) {
        // Update existing category
        await Category.findByIdAndUpdate(existingCategory._id, {
          labels: categoryData.labels,
          flag: categoryData.flag,
          icon: categoryData.icon,
          color: categoryData.color,
          description: categoryData.description
        });
        console.log(`✅ Updated category: ${categoryData.code}`);
      } else {
        // Create new category
        await Category.create(categoryData);
        console.log(`✅ Created new category: ${categoryData.code}`);
      }
    }

    // Verify the updates
    const updatedCategories = await Category.find({});
    console.log('\n📋 Updated Categories:');
    updatedCategories.forEach(cat => {
      console.log(`${cat.code}: ${cat.labels.en} | ${cat.labels.fr} | ${cat.labels.ar}`);
    });

    console.log('\n✅ Categories updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating categories:', error);
    process.exit(1);
  }
};

// Run the update
updateCategories(); 