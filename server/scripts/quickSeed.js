const mongoose = require('mongoose');
const Country = require('../models/Country');
const FoundLost = require('../models/FoundLost');
const Category = require('../models/Category');

// Use the same MongoDB URI format as Railway
const MONGODB_URI = 'mongodb+srv://mafqoudat:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority';

// Simple data to seed
const countriesData = [
  { code: 'MA', labels: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' }, flag: '🇲🇦' },
  { code: 'DZ', labels: { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' }, flag: '🇩🇿' },
  { code: 'TN', labels: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' }, flag: '🇹🇳' },
  { code: 'EG', labels: { en: 'Egypt', fr: 'Égypte', ar: 'مصر' }, flag: '🇪🇬' },
  { code: 'SA', labels: { en: 'Saudi Arabia', fr: 'Arabie Saoudite', ar: 'المملكة العربية السعودية' }, flag: '🇸🇦' }
];

const postTypesData = [
  {
    code: 'FOUND',
    labels: { en: 'Found', fr: 'Trouvé', ar: 'تم العثور عليه' },
    color: '#4CAF50',
    icon: '🔍',
    description: 'Items that have been found'
  },
  {
    code: 'LOST',
    labels: { en: 'Lost', fr: 'Perdu', ar: 'مفقود' },
    color: '#F44336',
    icon: '❓',
    description: 'Items that have been lost'
  }
];

const categoriesData = [
  {
    code: 'ELECTRONICS',
    labels: { en: 'Electronics', fr: 'Électronique', ar: 'إلكترونيات' },
    flag: '📱',
    icon: '📱',
    color: '#2196F3',
    description: 'Electronic devices and gadgets'
  },
  {
    code: 'DOCUMENTS',
    labels: { en: 'Documents', fr: 'Documents', ar: 'وثائق' },
    flag: '📄',
    icon: '📄',
    color: '#FF9800',
    description: 'Important documents and papers'
  },
  {
    code: 'JEWELRY',
    labels: { en: 'Jewelry', fr: 'Bijoux', ar: 'مجوهرات' },
    flag: '💍',
    icon: '💍',
    color: '#E91E63',
    description: 'Jewelry and accessories'
  },
  {
    code: 'CLOTHING',
    labels: { en: 'Clothing', fr: 'Vêtements', ar: 'ملابس' },
    flag: '👕',
    icon: '👕',
    color: '#9C27B0',
    description: 'Clothing and fashion items'
  },
  {
    code: 'PETS',
    labels: { en: 'Pets', fr: 'Animaux', ar: 'حيوانات أليفة' },
    flag: '🐕',
    icon: '🐕',
    color: '#795548',
    description: 'Lost or found pets'
  },
  {
    code: 'VEHICLES',
    labels: { en: 'Vehicles', fr: 'Véhicules', ar: 'مركبات' },
    flag: '🚗',
    icon: '🚗',
    color: '#607D8B',
    description: 'Cars, motorcycles, and other vehicles'
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Country.deleteMany({});
    await FoundLost.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Cleared existing data');

    // Seed countries
    console.log('🌍 Seeding countries...');
    const countries = await Country.insertMany(countriesData);
    console.log(`✅ Seeded ${countries.length} countries`);

    // Seed post types
    console.log('🏷️  Seeding post types...');
    const postTypes = await FoundLost.insertMany(postTypesData);
    console.log(`✅ Seeded ${postTypes.length} post types`);

    // Seed categories
    console.log('📂 Seeding categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ Seeded ${categories.length} categories`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`Countries: ${countries.length}`);
    console.log(`Post Types: ${postTypes.length}`);
    console.log(`Categories: ${categories.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

seedData();
