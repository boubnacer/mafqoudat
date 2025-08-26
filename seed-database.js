require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Country = require('./server/models/Country');
const FoundLost = require('./server/models/FoundLost');
const Category = require('./server/models/Category');

// MongoDB URI - try environment variable first, then fallback to direct string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

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
      ar: 'عمان'
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
      en: 'LB',
      fr: 'LB',
      ar: 'LB'
    },
    names: {
      en: 'Lebanon',
      fr: 'Liban',
      ar: 'لبنان'
    },
    flag: '🇱🇧'
  },
  {
    code: 'SY',
    labels: {
      en: 'SY',
      fr: 'SY',
      ar: 'SY'
    },
    names: {
      en: 'Syria',
      fr: 'Syrie',
      ar: 'سوريا'
    },
    flag: '🇸🇾'
  },
  {
    code: 'IQ',
    labels: {
      en: 'IQ',
      fr: 'IQ',
      ar: 'IQ'
    },
    names: {
      en: 'Iraq',
      fr: 'Irak',
      ar: 'العراق'
    },
    flag: '🇮🇶'
  },
  {
    code: 'PS',
    labels: {
      en: 'PS',
      fr: 'PS',
      ar: 'PS'
    },
    names: {
      en: 'Palestine',
      fr: 'Palestine',
      ar: 'فلسطين'
    },
    flag: '🇵🇸'
  },
  {
    code: 'LY',
    labels: {
      en: 'LY',
      fr: 'LY',
      ar: 'LY'
    },
    names: {
      en: 'Libya',
      fr: 'Libye',
      ar: 'ليبيا'
    },
    flag: '🇱🇾'
  },
  {
    code: 'SD',
    labels: {
      en: 'SD',
      fr: 'SD',
      ar: 'SD'
    },
    names: {
      en: 'Sudan',
      fr: 'Soudan',
      ar: 'السودان'
    },
    flag: '🇸🇩'
  },
  {
    code: 'SO',
    labels: {
      en: 'SO',
      fr: 'SO',
      ar: 'SO'
    },
    names: {
      en: 'Somalia',
      fr: 'Somalie',
      ar: 'الصومال'
    },
    flag: '🇸🇴'
  },
  {
    code: 'DJ',
    labels: {
      en: 'DJ',
      fr: 'DJ',
      ar: 'DJ'
    },
    names: {
      en: 'Djibouti',
      fr: 'Djibouti',
      ar: 'جيبوتي'
    },
    flag: '🇩🇯'
  },
  {
    code: 'KM',
    labels: {
      en: 'KM',
      fr: 'KM',
      ar: 'KM'
    },
    names: {
      en: 'Comoros',
      fr: 'Comores',
      ar: 'جزر القمر'
    },
    flag: '🇰🇲'
  },
  {
    code: 'MR',
    labels: {
      en: 'MR',
      fr: 'MR',
      ar: 'MR'
    },
    names: {
      en: 'Mauritania',
      fr: 'Mauritanie',
      ar: 'موريتانيا'
    },
    flag: '🇲🇷'
  },
  {
    code: 'ML',
    labels: {
      en: 'ML',
      fr: 'ML',
      ar: 'ML'
    },
    names: {
      en: 'Mali',
      fr: 'Mali',
      ar: 'مالي'
    },
    flag: '🇲🇱'
  },
  {
    code: 'NE',
    labels: {
      en: 'NE',
      fr: 'NE',
      ar: 'NE'
    },
    names: {
      en: 'Niger',
      fr: 'Niger',
      ar: 'النيجر'
    },
    flag: '🇳🇪'
  },
  {
    code: 'TD',
    labels: {
      en: 'TD',
      fr: 'TD',
      ar: 'TD'
    },
    names: {
      en: 'Chad',
      fr: 'Tchad',
      ar: 'تشاد'
    },
    flag: '🇹🇩'
  },
  {
    code: 'CF',
    labels: {
      en: 'CF',
      fr: 'CF',
      ar: 'CF'
    },
    names: {
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
      ar: 'جمهورية أفريقيا الوسطى'
    },
    flag: '🇨🇫'
  }
];

// Post types data
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
    isActive: true,
    description: 'Items that have been found'
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
    isActive: true,
    description: 'Items that have been lost'
  }
];

// Categories data
const categoriesData = [
  {
    code: 'ELECTRONICS',
    labels: {
      en: 'Electronics',
      fr: 'Électronique',
      ar: 'الإلكترونيات'
    },
    color: '#2196F3',
    isActive: true,
    description: 'Electronic devices and gadgets',
    priority: 1,
    searchTerms: ['phone', 'laptop', 'computer', 'tablet', 'camera', 'electronic'],
    iconName: 'PhoneAndroid'
  },
  {
    code: 'DOCUMENTS',
    labels: {
      en: 'Documents',
      fr: 'Documents',
      ar: 'المستندات'
    },
    color: '#FF9800',
    isActive: true,
    description: 'Important documents and papers',
    priority: 2,
    searchTerms: ['passport', 'id', 'license', 'certificate', 'document', 'paper'],
    iconName: 'Description'
  },
  {
    code: 'JEWELRY',
    labels: {
      en: 'Jewelry',
      fr: 'Bijoux',
      ar: 'المجوهرات'
    },
    color: '#E91E63',
    isActive: true,
    description: 'Jewelry and accessories',
    priority: 3,
    searchTerms: ['ring', 'necklace', 'watch', 'bracelet', 'jewelry', 'gold', 'silver'],
    iconName: 'Diamond'
  },
  {
    code: 'CLOTHING',
    labels: {
      en: 'Clothing',
      fr: 'Vêtements',
      ar: 'الملابس'
    },
    color: '#9C27B0',
    isActive: true,
    description: 'Clothing and fashion items',
    priority: 4,
    searchTerms: ['shirt', 'pants', 'dress', 'shoes', 'bag', 'clothing', 'fashion'],
    iconName: 'Checkroom'
  },
  {
    code: 'PETS',
    labels: {
      en: 'Pets',
      fr: 'Animaux',
      ar: 'الحيوانات الأليفة'
    },
    color: '#795548',
    isActive: true,
    description: 'Lost or found pets',
    priority: 5,
    searchTerms: ['dog', 'cat', 'pet', 'animal', 'bird', 'fish'],
    iconName: 'Pets'
  },
  {
    code: 'VEHICLES',
    labels: {
      en: 'Vehicles',
      fr: 'Véhicules',
      ar: 'المركبات'
    },
    color: '#607D8B',
    isActive: true,
    description: 'Cars, motorcycles, and other vehicles',
    priority: 6,
    searchTerms: ['car', 'motorcycle', 'bike', 'vehicle', 'transport'],
    iconName: 'DirectionsCar'
  },
  {
    code: 'BOOKS',
    labels: {
      en: 'Books',
      fr: 'Livres',
      ar: 'الكتب'
    },
    color: '#8BC34A',
    isActive: true,
    description: 'Books and educational materials',
    priority: 7,
    searchTerms: ['book', 'textbook', 'notebook', 'study', 'education'],
    iconName: 'Book'
  },
  {
    code: 'MUSIC',
    labels: {
      en: 'Music',
      fr: 'Musique',
      ar: 'الموسيقى'
    },
    color: '#FF5722',
    isActive: true,
    description: 'Musical instruments and equipment',
    priority: 8,
    searchTerms: ['guitar', 'piano', 'instrument', 'music', 'speaker'],
    iconName: 'MusicNote'
  },
  {
    code: 'SPORTS',
    labels: {
      en: 'Sports',
      fr: 'Sport',
      ar: 'الرياضة'
    },
    color: '#00BCD4',
    isActive: true,
    description: 'Sports equipment and gear',
    priority: 9,
    searchTerms: ['ball', 'racket', 'equipment', 'sport', 'fitness'],
    iconName: 'SportsSoccer'
  },
  {
    code: 'TOYS',
    labels: {
      en: 'Toys',
      fr: 'Jouets',
      ar: 'الألعاب'
    },
    color: '#FFC107',
    isActive: true,
    description: 'Toys and games',
    priority: 10,
    searchTerms: ['toy', 'game', 'doll', 'puzzle', 'play'],
    iconName: 'Toys'
  },
  {
    code: 'KEYS',
    labels: {
      en: 'Keys',
      fr: 'Clés',
      ar: 'المفاتيح'
    },
    color: '#9E9E9E',
    isActive: true,
    description: 'Keys and access cards',
    priority: 11,
    searchTerms: ['key', 'card', 'access', 'lock', 'security'],
    iconName: 'VpnKey'
  },
  {
    code: 'WALLET',
    labels: {
      en: 'Wallet',
      fr: 'Portefeuille',
      ar: 'المحفظة'
    },
    color: '#795548',
    isActive: true,
    description: 'Wallets and purses',
    priority: 12,
    searchTerms: ['wallet', 'purse', 'money', 'card', 'cash'],
    iconName: 'AccountBalanceWallet'
  },
  {
    code: 'OTHER',
    labels: {
      en: 'Other',
      fr: 'Autre',
      ar: 'أخرى'
    },
    color: '#607D8B',
    isActive: true,
    description: 'Other miscellaneous items',
    priority: 13,
    searchTerms: ['other', 'misc', 'various'],
    iconName: 'MoreHorizOutlined'
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Connecting to MongoDB...');
    console.log('Using URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    
    // Connect to MongoDB with better error handling and longer timeout
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data with better error handling
    console.log('🧹 Clearing existing data...');
    try {
      await Country.deleteMany({});
      await FoundLost.deleteMany({});
      await Category.deleteMany({});
      console.log('✅ Cleared existing data');
    } catch (error) {
      console.log('⚠️  Could not clear existing data (database might be empty):', error.message);
    }

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
    console.error('Error details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedData();
