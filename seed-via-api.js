const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3500';

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
    color: '#00BCD4',
    description: 'Electronic devices and gadgets',
    priority: 1,
    iconName: 'PhoneAndroidOutlined'
  },
  {
    code: 'DOCUMENTS',
    labels: { en: 'Documents', fr: 'Documents', ar: 'وثائق' },
    color: '#795548',
    description: 'Important documents and papers',
    priority: 2,
    iconName: 'ArticleOutlined'
  },
  {
    code: 'JEWELRY',
    labels: { en: 'Jewelry', fr: 'Bijoux', ar: 'مجوهرات' },
    color: '#9C27B0',
    description: 'Jewelry and accessories',
    priority: 3,
    iconName: 'AttachMoneyOutlined'
  },
  {
    code: 'CLOTHING',
    labels: { en: 'Clothing', fr: 'Vêtements', ar: 'ملابس' },
    color: '#4CAF50',
    description: 'Clothing and fashion items',
    priority: 4,
    iconName: 'LuggageOutlined'
  },
  {
    code: 'PETS',
    labels: { en: 'Pets', fr: 'Animaux', ar: 'حيوانات أليفة' },
    color: '#795548',
    description: 'Lost or found pets',
    priority: 5,
    iconName: 'PetsOutlined'
  },
  {
    code: 'VEHICLES',
    labels: { en: 'Vehicles', fr: 'Véhicules', ar: 'مركبات' },
    color: '#607D8B',
    description: 'Cars, motorcycles, and other vehicles',
    priority: 6,
    iconName: 'DirectionsCarOutlined'
  },
  {
    code: 'KEYS',
    labels: { en: 'Keys', fr: 'Clés', ar: 'مفاتيح' },
    color: '#FF9800',
    description: 'Keys and keychains',
    priority: 7,
    iconName: 'KeyOutlined'
  },
  {
    code: 'WALLET',
    labels: { en: 'Wallet', fr: 'Portefeuille', ar: 'محفظة' },
    color: '#FF5722',
    description: 'Wallets and purses',
    priority: 8,
    iconName: 'CreditCardOutlined'
  }
];

const seedViaAPI = async () => {
  try {
    console.log('🌱 Starting API-based seeding...');
    
    // Test API connection
    console.log('🔗 Testing API connection...');
    const healthCheck = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ API is accessible:', healthCheck.data);

    console.log('\n📝 Note: This script requires admin endpoints to be implemented.');
    console.log('For now, you can manually add data through your app interface.');
    console.log('Or implement admin endpoints in your backend to add this data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

seedViaAPI();
