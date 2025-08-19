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
      en: 'Syria',
      fr: 'Syrie',
      ar: 'سوريا'
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
      en: 'Iraq',
      fr: 'Irak',
      ar: 'العراق'
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
      en: 'Palestine',
      fr: 'Palestine',
      ar: 'فلسطين'
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
      en: 'Libya',
      fr: 'Libye',
      ar: 'ليبيا'
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
      en: 'Sudan',
      fr: 'Soudan',
      ar: 'السودان'
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
      en: 'Somalia',
      fr: 'Somalie',
      ar: 'الصومال'
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
      en: 'Djibouti',
      fr: 'Djibouti',
      ar: 'جيبوتي'
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
      en: 'Comoros',
      fr: 'Comores',
      ar: 'جزر القمر'
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
      en: 'Mauritania',
      fr: 'Mauritanie',
      ar: 'موريتانيا'
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
      en: 'Mali',
      fr: 'Mali',
      ar: 'مالي'
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
      en: 'Niger',
      fr: 'Niger',
      ar: 'النيجر'
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
      en: 'Chad',
      fr: 'Tchad',
      ar: 'تشاد'
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
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
      ar: 'جمهورية أفريقيا الوسطى'
    },
    names: {
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

// Categories data - Updated to match new model structure
const categoriesData = [
  {
    code: 'ELECTRONICS',
    labels: {
      en: 'Electronics',
      fr: 'Électronique',
      ar: 'إلكترونيات'
    },
    color: '#00BCD4',
    description: 'Electronic devices and gadgets',
    priority: 1,
    iconName: 'PhoneAndroidOutlined'
  },
  {
    code: 'DOCUMENTS',
    labels: {
      en: 'Documents',
      fr: 'Documents',
      ar: 'وثائق'
    },
    color: '#795548',
    description: 'Important documents and papers',
    priority: 2,
    iconName: 'ArticleOutlined'
  },
  {
    code: 'JEWELRY',
    labels: {
      en: 'Jewelry',
      fr: 'Bijoux',
      ar: 'مجوهرات'
    },
    color: '#9C27B0',
    description: 'Jewelry and accessories',
    priority: 3,
    iconName: 'AttachMoneyOutlined'
  },
  {
    code: 'CLOTHING',
    labels: {
      en: 'Clothing',
      fr: 'Vêtements',
      ar: 'ملابس'
    },
    color: '#4CAF50',
    description: 'Clothing and fashion items',
    priority: 4,
    iconName: 'LuggageOutlined'
  },
  {
    code: 'PETS',
    labels: {
      en: 'Pets',
      fr: 'Animaux',
      ar: 'حيوانات أليفة'
    },
    color: '#795548',
    description: 'Lost or found pets',
    priority: 5,
    iconName: 'PetsOutlined'
  },
  {
    code: 'VEHICLES',
    labels: {
      en: 'Vehicles',
      fr: 'Véhicules',
      ar: 'مركبات'
    },
    color: '#607D8B',
    description: 'Cars, motorcycles, and other vehicles',
    priority: 6,
    iconName: 'DirectionsCarOutlined'
  },
  {
    code: 'KEYS',
    labels: {
      en: 'Keys',
      fr: 'Clés',
      ar: 'مفاتيح'
    },
    color: '#FF9800',
    description: 'Keys and keychains',
    priority: 7,
    iconName: 'KeyOutlined'
  },
  {
    code: 'WALLET',
    labels: {
      en: 'Wallet',
      fr: 'Portefeuille',
      ar: 'محفظة'
    },
    color: '#FF5722',
    description: 'Wallets and purses',
    priority: 8,
    iconName: 'CreditCardOutlined'
  },
  {
    code: 'WATCHES',
    labels: {
      en: 'Watches',
      fr: 'Montres',
      ar: 'ساعات'
    },
    color: '#2196F3',
    description: 'Watches and timepieces',
    priority: 9,
    iconName: 'WatchOutlined'
  },
  {
    code: 'GAMING',
    labels: {
      en: 'Gaming',
      fr: 'Jeux',
      ar: 'ألعاب'
    },
    color: '#E91E63',
    description: 'Gaming consoles, controllers, and accessories',
    priority: 10,
    iconName: 'SportsEsportsOutlined'
  },
  {
    code: 'MEDICAL',
    labels: {
      en: 'Medical',
      fr: 'Médical',
      ar: 'طبي'
    },
    color: '#F44336',
    description: 'Medical devices and health equipment',
    priority: 11,
    iconName: 'LocalHospitalOutlined'
  },
  {
    code: 'LUGGAGE',
    labels: {
      en: 'Luggage',
      fr: 'Bagages',
      ar: 'أمتعة'
    },
    color: '#795548',
    description: 'Luggage and travel bags',
    priority: 12,
    iconName: 'LuggageOutlined'
  },
  {
    code: 'OTHER',
    labels: {
      en: 'Other',
      fr: 'Autre',
      ar: 'أخرى'
    },
    color: '#9E9E9E',
    description: 'Other miscellaneous items',
    priority: 13,
    iconName: 'MoreHorizOutlined'
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Connecting to MongoDB...');
    console.log('Using URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    
    // Connect to MongoDB with better error handling
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
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
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
};

// Run the seeding
seedData();
