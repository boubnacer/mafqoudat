const mongoose = require('mongoose');

// Use the Railway MongoDB URI (with mafqoudat database)
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function seedRailwayDatabase() {
  try {
    console.log('🔌 Connecting to Railway database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Railway database');
    
    // Import models
    const Country = require('./server/models/Country');
    const Category = require('./server/models/Category');
    const FoundLost = require('./server/models/FoundLost');
    const City = require('./server/models/City');
    
    console.log('\n🌱 Seeding Railway database...');
    
    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await Country.deleteMany({});
    await Category.deleteMany({});
    await FoundLost.deleteMany({});
    await City.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Seed countries
    console.log('\n🌍 Seeding countries...');
    const countries = [
      {
        code: 'MA',
        labels: { en: 'MA', fr: 'MA', ar: 'MA' },
        names: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' },
        flag: '🇲🇦',
        isActive: true
      },
      {
        code: 'DZ',
        labels: { en: 'DZ', fr: 'DZ', ar: 'DZ' },
        names: { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' },
        flag: '🇩🇿',
        isActive: true
      },
      {
        code: 'TN',
        labels: { en: 'TN', fr: 'TN', ar: 'TN' },
        names: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
        flag: '🇹🇳',
        isActive: true
      }
    ];
    
    const createdCountries = await Country.insertMany(countries);
    console.log(`✅ Created ${createdCountries.length} countries`);
    
    // Get Morocco ID for cities
    const morocco = createdCountries.find(c => c.code === 'MA');
    
    // Seed categories
    console.log('\n📂 Seeding categories...');
    const categories = [
      {
        code: 'CLOTHING',
        labels: { en: 'Clothing', fr: 'Vêtements', ar: 'ملابس' },
        color: '#4CAF50',
        isActive: true,
        description: 'Clothing and fashion items'
      },
      {
        code: 'DOCUMENTS',
        labels: { en: 'Documents', fr: 'Documents', ar: 'وثائق' },
        color: '#795548',
        isActive: true,
        description: 'Important documents and papers'
      },
      {
        code: 'ELECTRONICS',
        labels: { en: 'Electronics', fr: 'Électronique', ar: 'إلكترونيات' },
        color: '#00BCD4',
        isActive: true,
        description: 'Electronic devices and gadgets'
      },
      {
        code: 'JEWELRY',
        labels: { en: 'Jewelry', fr: 'Bijoux', ar: 'مجوهرات' },
        color: '#9C27B0',
        isActive: true,
        description: 'Jewelry and accessories'
      },
      {
        code: 'PETS',
        labels: { en: 'Pets', fr: 'Animaux', ar: 'حيوانات أليفة' },
        color: '#795548',
        isActive: true,
        description: 'Lost or found pets'
      }
    ];
    
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    // Seed found/lost options
    console.log('\n🔍 Seeding found/lost options...');
    const foundLostOptions = [
      {
        code: 'FOUND',
        labels: { en: 'Found', fr: 'Trouvé', ar: 'تم العثور عليه' },
        color: '#4CAF50',
        icon: '🔍',
        isActive: true,
        description: 'Items that have been found and are being returned to their owners'
      },
      {
        code: 'LOST',
        labels: { en: 'Lost', fr: 'Perdu', ar: 'مفقود' },
        color: '#F44336',
        icon: '❓',
        isActive: true,
        description: 'Items that have been lost and are being searched for'
      }
    ];
    
    const createdFoundLost = await FoundLost.insertMany(foundLostOptions);
    console.log(`✅ Created ${createdFoundLost.length} found/lost options`);
    
    // Seed cities for Morocco
    if (morocco) {
      console.log('\n🏙️ Seeding cities for Morocco...');
      const cities = [
        {
          code: 'CASABLANCA',
          country: morocco._id,
          labels: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
          names: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
          isActive: true,
          isCapital: false,
          isDynamic: false
        },
        {
          code: 'RABAT',
          country: morocco._id,
          labels: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
          names: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
          isActive: true,
          isCapital: true,
          isDynamic: false
        },
        {
          code: 'MARRAKECH',
          country: morocco._id,
          labels: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
          names: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
          isActive: true,
          isCapital: false,
          isDynamic: false
        }
      ];
      
      const createdCities = await City.insertMany(cities);
      console.log(`✅ Created ${createdCities.length} cities for Morocco`);
    }
    
    console.log('\n✅ Railway database seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`  Countries: ${createdCountries.length}`);
    console.log(`  Categories: ${createdCategories.length}`);
    console.log(`  Found/Lost options: ${createdFoundLost.length}`);
    if (morocco) {
      console.log(`  Cities for Morocco: 3`);
    }
    
    // Show the IDs that the client should use
    console.log('\n🎯 IDs for client to use:');
    const moroccoCountry = createdCountries.find(c => c.code === 'MA');
    const clothingCategory = createdCategories.find(c => c.code === 'CLOTHING');
    const foundOption = createdFoundLost.find(f => f.code === 'FOUND');
    
    if (moroccoCountry) {
      console.log(`  Morocco Country ID: ${moroccoCountry._id}`);
    }
    if (clothingCategory) {
      console.log(`  CLOTHING Category ID: ${clothingCategory._id}`);
    }
    if (foundOption) {
      console.log(`  FOUND Option ID: ${foundOption._id}`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from Railway database');
  }
}

seedRailwayDatabase();
