import {
  PhoneAndroidOutlined,
  ArticleOutlined,
  PetsOutlined,
  DirectionsCarOutlined,
  WatchOutlined,
  HeadphonesOutlined,
  CheckroomOutlined,
  MenuBookOutlined,
  SportsSoccerOutlined,
  ToysOutlined,
  CameraAltOutlined,
  PersonSearchOutlined,
  MoreHorizOutlined,
  AccountBalanceWalletOutlined
} from '@mui/icons-material';

import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';

// Custom SVG icon components
const WalletIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 38 32" 
    width="28" 
    height="28" 
    {...props}
    style={{ 
      fill: 'currentColor',
      ...sx 
    }}
  >
    <g>
      <path d="M32.509,7.5c0.276,0,0.5-0.224,0.5-0.5V5.335c0-0.903-0.735-1.638-1.638-1.638h-2.687l-0.613-1.809c-0.086-0.255-0.36-0.397-0.619-0.318L12.899,5.994c-0.264,0.081-0.413,0.36-0.333,0.624c0.066,0.216,0.264,0.354,0.479,0.354c0.048,0,0.097-0.007,0.146-0.021L27.28,2.667l1.343,3.965c0.089,0.262,0.375,0.404,0.634,0.313c0.262-0.088,0.402-0.373,0.313-0.634l-0.547-1.615h2.349c0.352,0,0.638,0.286,0.638,0.638V7C32.009,7.276,32.233,7.5,32.509,7.5z"/>
      <path d="M36.5,15c-0.276,0-0.5,0.224-0.5,0.5s0.224,0.5,0.5,0.5c0.351,0,0.5,0.149,0.5,0.5v6c0,0.351-0.149,0.5-0.5,0.5h-8c-0.351,0-0.5-0.149-0.5-0.5v-5c0-0.351,0.149-0.5,0.5-0.5h6c0.276,0,0.5-0.224,0.5-0.5v-6C35,9.589,34.411,9,33.5,9H3C1.767,9,1,8.233,1,7s0.767-2,2-2h5.076L5.05,5.998C4.788,6.084,4.645,6.367,4.731,6.629c0.069,0.21,0.265,0.343,0.475,0.343c0.052,0,0.104-0.008,0.157-0.025l18.119-5.973c0.262-0.087,0.405-0.369,0.318-0.632c-0.086-0.262-0.369-0.405-0.632-0.318L11.068,4.014C11.045,4.01,11.024,4,11,4H3C1.206,4,0,5.206,0,7v22c0,1.794,1.206,3,3,3h30.5c0.911,0,1.5-0.589,1.5-1.5v-5c0-0.276-0.224-0.5-0.5-0.5S34,25.224,34,25.5v5c0,0.351-0.149,0.5-0.5,0.5H3c-1.233,0-2-0.767-2-2V9.312C1.513,9.745,2.192,10,3,10h30.5c0.351,0,0.5,0.149,0.5,0.5V16h-5.5c-0.911,0-1.5,0.589-1.5,1.5v5c0,0.911,0.589,1.5,1.5,1.5h8c0.911,0,1.5-0.589,1.5-1.5v-6C38,15.589,37.411,15,36.5,15z"/>
      <circle cx="32" cy="20" r="1"/>
    </g>
  </svg>
);

const KeysIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="-0.5 0 25 25" 
    width="28" 
    height="28" 
    fill="none" 
    {...props}
    style={{ 
      stroke: 'currentColor',
      strokeWidth: '1.5',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...sx 
    }}
  >
    <path d="M12.75 9.807C12.7497 8.68487 12.4348 7.5853 11.8409 6.63318C11.247 5.68107 10.3981 4.91457 9.39043 4.42075C8.38279 3.92693 7.25687 3.72558 6.14053 3.83956C5.0242 3.95355 3.9622 4.3783 3.07516 5.06558C2.18812 5.75286 1.51159 6.67512 1.12241 7.7276C0.733232 8.78009 0.647 9.92062 0.87351 11.0197C1.10002 12.1187 1.63019 13.1322 2.40381 13.945C3.17744 14.7579 4.1635 15.3375 5.25 15.618V21.754C5.25 22.1518 5.40804 22.5334 5.68934 22.8147C5.97065 23.096 6.35218 23.254 6.75 23.254C7.14783 23.254 7.52936 23.096 7.81066 22.8147C8.09197 22.5334 8.25 22.1518 8.25 21.754V15.618C9.53819 15.2854 10.6793 14.5341 11.4939 13.4822C12.3085 12.4303 12.7503 11.1374 12.75 9.807V9.807Z"/>
    <path d="M9.74121 4.605C10.8897 3.94419 12.2247 3.68215 13.5377 3.85976C14.8508 4.03737 16.0682 4.64464 16.9998 5.58682C17.9315 6.529 18.5251 7.75309 18.688 9.06808C18.8509 10.3831 18.5739 11.715 17.9002 12.856L22.8102 17.762C23.0834 18.0449 23.2346 18.4238 23.2312 18.8171C23.2278 19.2104 23.0701 19.5866 22.7919 19.8647C22.5138 20.1428 22.1376 20.3006 21.7443 20.304C21.351 20.3074 20.9721 20.1562 20.6892 19.883L15.7822 14.977C15.1145 15.3711 14.3765 15.6314 13.6096 15.7434H13.5664"/>
    <path d="M6.75 10.557C7.57843 10.557 8.25 9.88543 8.25 9.057C8.25 8.22857 7.57843 7.557 6.75 7.557C5.92157 7.557 5.25 8.22857 5.25 9.057C5.25 9.88543 5.92157 10.557 6.75 10.557Z"/>
    <path d="M6.75 7.40625V3C6.75 2.40326 6.98705 1.83097 7.40901 1.40901C7.83097 0.987053 8.40326 0.75 9 0.75C9.59674 0.75 10.169 0.987053 10.591 1.40901C11.0129 1.83097 11.25 2.40326 11.25 3V3.76562"/>
  </svg>
);

const GlassesIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 1200 1200" 
    width="28" 
    height="28" 
    {...props}
    style={{ 
      fill: 'currentColor',
      ...sx 
    }}
  >
    <path d="M1118.948,592.892H732.471l49.909,227.792h312.254L1118.948,592.892z M466.287,592.892H79.809l24.315,227.792h312.253L466.287,592.892z M1189.334,526.346c8.535,9.384,11.948,19.622,10.237,30.714 l-33.272,307.135c-4.563,20.081-18.878,35.561-38.393,35.832h-376.24c-20.231-1.346-33.639-14.035-37.111-31.993l-60.146-267.463 c-32.547-20.271-75.345-17.317-110.057-2.56l-60.147,270.022c-4.772,19.452-18.653,31.768-37.112,31.993H70.851 c-21.166-1.673-35.301-16.94-37.112-35.832L0.465,557.06c-1.706-11.943,1.28-22.182,8.958-30.714l432.548-222.673 c20.748-9.255,41.297-0.366,49.909,17.916c7.223,20.882,2.533,44.668-16.636,53.749L201.383,499.472h792.152L719.673,375.337 c-20.314-11.516-25.569-34.709-17.916-53.749c10.862-19.479,32.864-25.945,51.189-17.916L1189.334,526.346z"/>
  </svg>
);

const MoneyIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width="28" 
    height="28" 
    fill="none"
    {...props}
    style={{ 
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...sx 
    }}
  >
    <rect x="3" y="6" width="18" height="10" rx="2"/>
    <path d="M3 10h18"/>
    <circle cx="12" cy="10" r="1"/>
  </svg>
);

const JewelryIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width="28" 
    height="28" 
    {...props}
    style={{ 
      fill: 'currentColor',
      ...sx 
    }}
  >
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
  </svg>
);

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
    icon: JewelryIcon,  // Changed from DiamondOutlinedIcon
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
    icon: KeysIcon,  // Changed from KeyOutlined
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    priority: 7
  },
  WALLET: {
    icon: AccountBalanceWalletOutlined,  // Changed from AccountBalanceWalletOutlined
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
    icon: GlassesIcon,  // Changed from RemoveRedEyeOutlined
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
    icon: MoneyIcon,  // Changed from AttachMoneyOutlined
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
