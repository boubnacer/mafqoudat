import {
  PhoneAndroidOutlined,
  ArticleOutlined,
  AttachMoneyOutlined,
  LuggageOutlined,
  PetsOutlined,
  DirectionsCarOutlined,
  KeyOutlined,
  CreditCardOutlined,
  WatchOutlined,
  SportsEsportsOutlined,
  LocalHospitalOutlined,
  MoreHorizOutlined
} from '@mui/icons-material';

// Category configuration with Material UI icons
export const CATEGORY_CONFIG = {
  ELECTRONICS: {
    icon: PhoneAndroidOutlined,
    color: '#00BCD4',
    backgroundColor: '#E0F7FA',
    priority: 1
  },
  DOCUMENTS: {
    icon: ArticleOutlined,
    color: '#795548',
    backgroundColor: '#EFEBE9',
    priority: 2
  },
  JEWELRY: {
    icon: AttachMoneyOutlined,
    color: '#9C27B0',
    backgroundColor: '#F3E5F5',
    priority: 3
  },
  CLOTHING: {
    icon: LuggageOutlined,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    priority: 4
  },
  PETS: {
    icon: PetsOutlined,
    color: '#795548',
    backgroundColor: '#EFEBE9',
    priority: 5
  },
  VEHICLES: {
    icon: DirectionsCarOutlined,
    color: '#607D8B',
    backgroundColor: '#ECEFF1',
    priority: 6
  },
  KEYS: {
    icon: KeyOutlined,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    priority: 7
  },
  WALLET: {
    icon: CreditCardOutlined,
    color: '#FF5722',
    backgroundColor: '#FBE9E7',
    priority: 8
  },
  WATCHES: {
    icon: WatchOutlined,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    priority: 9
  },
  GAMING: {
    icon: SportsEsportsOutlined,
    color: '#E91E63',
    backgroundColor: '#FCE4EC',
    priority: 10
  },
  MEDICAL: {
    icon: LocalHospitalOutlined,
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    priority: 11
  },
  LUGGAGE: {
    icon: LuggageOutlined,
    color: '#795548',
    backgroundColor: '#EFEBE9',
    priority: 12
  },
  OTHER: {
    icon: MoreHorizOutlined,
    color: '#9E9E9E',
    backgroundColor: '#F5F5F5',
    priority: 13
  }
};

// Get category configuration by code
export const getCategoryConfig = (code) => {
  return CATEGORY_CONFIG[code?.toUpperCase()] || CATEGORY_CONFIG.OTHER;
};

// Get category icon component by code
export const getCategoryIcon = (code) => {
  const config = getCategoryConfig(code);
  return config.icon;
};

// Get category color by code
export const getCategoryColor = (code) => {
  const config = getCategoryConfig(code);
  return config.color;
};

// Get category background color by code
export const getCategoryBackgroundColor = (code) => {
  const config = getCategoryConfig(code);
  return config.backgroundColor;
};

// Get all category codes
export const getCategoryCodes = () => {
  return Object.keys(CATEGORY_CONFIG);
};

// Get sorted categories by priority
export const getSortedCategories = () => {
  return Object.entries(CATEGORY_CONFIG)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([code, config]) => ({
      code,
      ...config
    }));
};

// Legacy export for backward compatibility
export const CATEGORIES = getCategoryCodes();
