import {
  PhoneAndroidOutlined,
  ArticleOutlined,
  AttachMoneyOutlined,
  PetsOutlined,
  DirectionsCarOutlined,
  KeyOutlined,
  AccountBalanceWalletOutlined,
  BusinessCenterOutlinedIcon,
  WatchOutlined,
  HeadphonesOutlined,
  CheckroomOutlined,
  MenuBookOutlined,
  SportsSoccerOutlined,
  ToysOutlined,
  CameraAltOutlined,
  PersonSearchOutlined,
  MoreHorizOutlined,
  RemoveRedEyeOutlined,
} from '@mui/icons-material';

import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';

// Category configuration with Material UI icons - Optimized for Lost & Found
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
    icon: DiamondOutlinedIcon,
    color: '#9C27B0',
    backgroundColor: '#F3E5F5',
    priority: 3
  },
  CLOTHING: {
    icon: CheckroomOutlined,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    priority: 4
  },
  PETS: {
    icon: PetsOutlined,
    color: '#FF6B6B',
    backgroundColor: '#FFEBEE',
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
    icon: AccountBalanceWalletOutlined,
    color: '#FF5722',
    backgroundColor: '#FBE9E7',
    priority: 8
  },
  BAGS: {
    icon: BusinessCenterOutlinedIcon,
    color: '#8D6E63',
    backgroundColor: '#EFEBE9',
    priority: 9
  },
  WATCHES: {
    icon: WatchOutlined,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    priority: 10
  },
  GLASSES: {
    icon: RemoveRedEyeOutlined,
    color: '#3F51B5',
    backgroundColor: '#E8EAF6',
    priority: 11
  },
  HEADPHONES: {
    icon: HeadphonesOutlined,
    color: '#9C27B0',
    backgroundColor: '#F3E5F5',
    priority: 12
  },
  BOOKS: {
    icon: MenuBookOutlined,
    color: '#5E35B1',
    backgroundColor: '#EDE7F6',
    priority: 13
  },
  SPORTS: {
    icon: SportsSoccerOutlined,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    priority: 14
  },
  TOYS: {
    icon: ToysOutlined,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    priority: 15
  },
  CAMERAS: {
    icon: CameraAltOutlined,
    color: '#00897B',
    backgroundColor: '#E0F2F1',
    priority: 16
  },
  MONEY: {
    icon: AttachMoneyOutlined,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    priority: 20
  },
  PERSON: {
    icon: PersonSearchOutlined,
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    priority: 21
  },
  OTHER: {
    icon: MoreHorizOutlined,
    color: '#9E9E9E',
    backgroundColor: '#F5F5F5',
    priority: 22
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
