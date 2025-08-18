const mongoose = require('mongoose');
const Country = require('./server/models/Country');
const FoundLost = require('./server/models/FoundLost');
const Category = require('./server/models/Category');

// Railway MongoDB URI (replace with your actual URI)
const MONGODB_URI = 'mongodb+srv://mafqoudat:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority';
// Sample countries data with multilingual support
const countriesData = [
  {
    code: 'MA',
    labels: {
      en: 'MA',
      fr: 'MA',
      ar: 'MA'
    },
    names: {
      en: 'Morocco',
      fr: 'Maroc',
      ar: 'المغرب'
    },
    flag: '🇲🇦'
  },
  {
    code: 'DZ',
    labels: {
      en: 'DZ',
      fr: 'DZ',
      ar: 'DZ'
    },
    names: {
      en: 'Algeria',
      fr: 'Algérie',
      ar: 'الجزائر'
    },
    flag: '🇩🇿'
  },
  {
    code: 'TN',
    labels: {
      en: 'TN',
      fr: 'TN',
      ar: 'TN'
    },
    names: {
      en: 'Tunisia',
      fr: 'Tunisie',
      ar: 'تونس'
    },
    flag: '🇹🇳'
  },
  {
    code: 'EG',
    labels: {
      en: 'EG',
      fr: 'EG',
      ar: 'EG'
    },
    names: {
      en: 'Egypt',
      fr: 'Égypte',
      ar: 'مصر'
    },
    flag: '🇪🇬'
  },
  {
    code: 'SA',
    labels: {
      en: 'SA',
      fr: 'SA',
      ar: 'SA'
    },
    names: {
      en: 'Saudi Arabia',
      fr: 'Arabie Saoudite',
      ar: 'المملكة العربية السعودية'
    },
    flag: '🇸🇦'
  },
  {
    code: 'AE',
    labels: {
      en: 'AE',
      fr: 'AE',
      ar: 'AE'
    },
    names: {
      en: 'United Arab Emirates',
      fr: 'Émirats Arabes Unis',
      ar: 'الإمارات العربية المتحدة'
    },
    flag: '🇦🇪'
  },
  {
    code: 'QA',
    labels: {
      en: 'QA',
      fr: 'QA',
      ar: 'QA'
    },
    names: {
      en: 'Qatar',
      fr: 'Qatar',
      ar: 'قطر'
    },
    flag: '🇶🇦'
  },
  {
    code: 'KW',
    labels: {
      en: 'KW',
      fr: 'KW',
      ar: 'KW'
    },
    names: {
      en: 'Kuwait',
      fr: 'Koweït',
      ar: 'الكويت'
    },
    flag: '🇰🇼'
  },
  {
    code: 'BH',
    labels: {
      en: 'BH',
      fr: 'BH',
      ar: 'BH'
    },
    names: {
      en: 'Bahrain',
      fr: 'Bahreïn',
      ar: 'البحرين'
    },
    flag: '🇧🇭'
  },
  {
    code: 'OM',
    labels: {
      en: 'OM',
      fr: 'OM',
      ar: 'OM'
    },
    names: {
      en: 'Oman',
      fr: 'Oman',
      ar: 'عُمان'
    },
    flag: '🇴🇲'
  },
  {
    code: 'JO',
    labels: {
      en: 'JO',
      fr: 'JO',
      ar: 'JO'
    },
    names: {
      en: 'Jordan',
      fr: 'Jordanie',
      ar: 'الأردن'
    },
    flag: '🇯🇴'
  },
  {
    code: 'LB',
    labels: {
      en: 'Lebanon',
      fr: 'Liban',
      ar: 'لبنان'
    },
    flag: '🇱🇧'
  },
  {
    code: 'SY',
    labels: {
      en: 'Syria',
      fr: 'Syrie',
      ar: 'سوريا'
    },
    flag: '🇸🇾'
  },
  {
    code: 'IQ',
    labels: {
      en: 'Iraq',
      fr: 'Irak',
      ar: 'العراق'
    },
    flag: '🇮🇶'
  },
  {
    code: 'PS',
    labels: {
      en: 'Palestine',
      fr: 'Palestine',
      ar: 'فلسطين'
    },
    flag: '🇵🇸'
  },
  {
    code: 'LY',
    labels: {
      en: 'Libya',
      fr: 'Libye',
      ar: 'ليبيا'
    },
    flag: '🇱🇾'
  },
  {
    code: 'SD',
    labels: {
      en: 'Sudan',
      fr: 'Soudan',
      ar: 'السودان'
    },
    flag: '🇸🇩'
  },
  {
    code: 'SO',
    labels: {
      en: 'Somalia',
      fr: 'Somalie',
      ar: 'الصومال'
    },
    flag: '🇸🇴'
  },
  {
    code: 'DJ',
    labels: {
      en: 'Djibouti',
      fr: 'Djibouti',
      ar: 'جيبوتي'
    },
    flag: '🇩🇯'
  },
  {
    code: 'KM',
    labels: {
      en: 'Comoros',
      fr: 'Comores',
      ar: 'جزر القمر'
    },
    flag: '🇰🇲'
  },
  {
    code: 'MR',
    labels: {
      en: 'Mauritania',
      fr: 'Mauritanie',
      ar: 'موريتانيا'
    },
    flag: '🇲🇷'
  },
  {
    code: 'ML',
    labels: {
      en: 'Mali',
      fr: 'Mali',
      ar: 'مالي'
    },
    flag: '🇲🇱'
  },
  {
    code: 'NE',
    labels: {
      en: 'Niger',
      fr: 'Niger',
      ar: 'النيجر'
    },
    flag: '🇳🇪'
  },
  {
    code: 'TD',
    labels: {
      en: 'Chad',
      fr: 'Tchad',
      ar: 'تشاد'
    },
    flag: '🇹🇩'
  },
  {
    code: 'CF',
    labels: {
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
      ar: 'جمهورية أفريقيا الوسطى'
    },
    flag: '🇨🇫'
  }
];

// Post types data (Found/Lost)
const postTypesData = [
  {
    code: 'FOUND',
    labels: {
      en: 'Found',
      fr: 'Trouvé',
      ar: 'تم العثور عليه'
    },
    color: '#4CAF50',
    icon: '🔍',
    description: 'Items that have been found and are being returned to their owners'
  },
  {
    code: 'LOST',
    labels: {
      en: 'Lost',
      fr: 'Perdu',
      ar: 'مفقود'
    },
    color: '#F44336',
    icon: '❓',
    description: 'Items that have been lost and are being searched for'
  }
];

// Categories data
const categoriesData = [
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
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
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
    console.log(`Countries: ${countries.length} (${countries.map(c => c.code).join(', ')})`);
    console.log(`Post Types: ${postTypes.length} (${postTypes.map(p => p.code).join(', ')})`);
    console.log(`Categories: ${categories.length} (${categories.map(c => c.code).join(', ')})`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedData();
