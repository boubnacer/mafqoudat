const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Complete categories data with proper multilingual support
const completeCategoriesData = [
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

const fixAllCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear all existing categories
    await Category.deleteMany({});
    console.log('Cleared all existing categories');

    // Insert all categories with proper translations
    const categories = await Category.insertMany(completeCategoriesData);
    console.log(`✅ Created ${categories.length} categories with proper translations`);

    // Verify the results
    const allCategories = await Category.find({}).sort({ code: 1 });
    console.log('\n📋 All Categories with Translations:');
    console.log('='.repeat(80));
    allCategories.forEach(cat => {
      console.log(`${cat.code.padEnd(12)} | ${cat.labels.en.padEnd(15)} | ${cat.labels.fr.padEnd(15)} | ${cat.labels.ar}`);
    });
    console.log('='.repeat(80));

    // Test API response for different languages
    console.log('\n🧪 Testing API responses:');
    
    // Test English
    const testEn = await Category.find({}).select('code labels').lean();
    console.log('\nEnglish (en):');
    testEn.forEach(cat => {
      console.log(`${cat.code}: ${cat.labels.en}`);
    });

    // Test Arabic
    console.log('\nArabic (ar):');
    testEn.forEach(cat => {
      console.log(`${cat.code}: ${cat.labels.ar}`);
    });

    // Test French
    console.log('\nFrench (fr):');
    testEn.forEach(cat => {
      console.log(`${cat.code}: ${cat.labels.fr}`);
    });

    console.log('\n✅ All categories fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
    process.exit(1);
  }
};

// Run the fix
fixAllCategories(); 