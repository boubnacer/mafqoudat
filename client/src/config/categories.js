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
} from '@mui/icons-material';

import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';

// Custom SVG icon components
const WalletIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 38 32" 
    width="24" 
    height="24" 
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
    width="24" 
    height="24" 
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
    viewBox="0 0 64 64" 
    width="24" 
    height="24" 
    {...props}
    style={{ 
      fill: 'currentColor',
      ...sx 
    }}
  >
    <path d="M62 32.252l-.047-.105c-.045-.353-.146-.574-.335-.723c-1.213-2.565-5.233-10.563-10.638-16.047c-1.496-1.519-5.822 1.914-7.828 3.969c-2.006 2.055-1.029 5.529.182 4.134c1.498-1.725 5.268-7.137 6.666-6.452c1.381.676 4.977 5.914 8.988 13.905c-1.49-.103-4.142-.201-7.242-.201c-4.498 0-8.086.644-11.621 1.265c-3.506.614-5.842 1.047-8.125 1.047c-2.285 0-4.619-.433-8.125-1.047c-3.537-.621-7.123-1.265-11.621-1.265c-3.1 0-5.751.098-7.242.2c4.01-7.99 7.607-13.229 8.988-13.904c1.398-.685 5.166 4.727 6.664 6.452c1.211 1.396 2.189-2.079.182-4.134c-2.006-2.055-6.33-5.488-7.828-3.969C7.615 20.86 3.596 28.859 2.383 31.424c-.189.148-.291.371-.336.723L2 32.252l.031-.011C2 32.565 2 32.988 2 33.551c0 3.338.383 3.919.545 4.117c.219.27.834.643 1.033.928c.293.418.398 1.012.398 1.652c0 1.338-.398 2.676-.398 4.014c0 2.676.796 5.352 2.388 7.568c1.592 2.216 3.982 3.982 6.771 5.352c2.789 1.37 6.077 2.216 9.565 2.216c3.488 0 6.776-.846 9.565-2.216c2.789-1.37 5.179-3.136 6.771-5.352c1.592-2.216 2.388-4.892 2.388-7.568c0-1.338 0-2.676-.398-4.014c0-.64.105-1.234.398-1.652c.199-.285.814-.658 1.033-.928c.162-.198.545-.779.545-4.117c0-.563 0-.986.031-1.299l-.031.011z"/>
  </svg>
);

const MoneyIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 300.16 300.16" 
    width="24" 
    height="24" 
    {...props}
    style={{ 
      fill: 'currentColor',
      ...sx 
    }}
  >
    <g>
      <g>
        <path d="M261.429,65.357c-8.007,0-14.524-6.516-14.524-14.524v-4.841h-61.47c19.607,14.054,32.422,36.978,32.422,62.937s-12.815,48.882-32.422,62.937h61.204l0.484-4.304c0.876-7.862,6.981-13.972,14.843-14.843l4.304-0.484V65.357H261.429z"/>
        <path d="M95.359,171.866c-19.607-14.054-32.422-36.978-32.422-62.937s12.815-48.882,32.422-62.937H38.73v4.841c0,8.007-6.516,14.524-14.524,14.524h-4.841V152.5h4.841c8.007,0,14.524,6.516,14.524,14.524v4.841L95.359,171.866L95.359,171.866z"/>
        <circle cx="140.397" cy="108.929" r="53.254"/>
        <path d="M293.101,232.406l-41.17-41.175h33.705V26.627H0v164.604h191.105l6.734,7.078l-10.273,10.273l6.846,6.846l6.783-6.783l57.834,57.829c4.551,4.551,10.602,7.059,17.036,7.059s12.486-2.508,17.036-7.059c4.551-4.546,7.059-10.598,7.059-17.036C300.16,242.999,297.652,236.952,293.101,232.406z M275.953,36.31v145.239h-33.705l-6.976-6.976l6.787-6.787l-6.846-6.846l-10.186,10.186l-16.33-16.33c8.831-13.11,14.001-28.893,14.001-45.866c0-31.415-17.709-58.754-43.654-72.619h96.909V36.31z M140.397,181.548c-40.042,0-72.619-32.577-72.619-72.619s32.577-72.619,72.619-72.619s72.619,32.577,72.619,72.619S180.44,181.548,140.397,181.548z M9.683,181.548V36.31h92.067c-25.944,13.865-43.654,41.204-43.654,72.619s17.709,58.754,43.654,72.619H9.683z M179.045,181.548c0.625-0.334,1.23-0.702,1.845-1.051l1.002,1.051H179.045z M189.125,175.104c4.987-3.684,9.557-7.886,13.599-12.578l15.449,15.449l-13.488,13.488L189.125,175.104z M286.255,259.628c-5.446,5.446-14.931,5.446-20.377,0l-57.834-57.829l20.382-20.382l57.834,57.834c2.716,2.721,4.217,6.342,4.217,10.186C290.477,253.281,288.976,256.903,286.255,259.628z"/>
        <path d="M145.239,75.04v-4.841h-9.683v4.841c-10.68,0-19.365,8.685-19.365,19.365s8.685,19.365,19.365,19.365h9.683c5.34,0,9.683,4.343,9.683,9.683s-4.343,9.683-9.683,9.683h-9.683c-5.34,0-9.683-4.343-9.683-9.683v-4.841h-9.683v4.841c0,10.68,8.685,19.365,19.365,19.365v4.841h9.683v-4.841c10.68,0,19.365-8.685,19.365-19.365s-8.685-19.365-19.365-19.365h-9.683c-5.34,0-9.683-4.343-9.683-9.683s4.343-9.683,9.683-9.683h9.683c5.34,0,9.683,4.343,9.683,9.683v4.841h9.683v-4.841C164.604,83.725,155.918,75.04,145.239,75.04z"/>
        <path d="M140.397,50.833c-32.035,0-58.095,26.061-58.095,58.095s26.061,58.095,58.095,58.095s58.095-26.061,58.095-58.095S172.432,50.833,140.397,50.833z M140.397,157.342c-26.695,0-48.413-21.718-48.413-48.413s21.718-48.413,48.413-48.413s48.413,21.718,48.413,48.413S167.092,157.342,140.397,157.342z"/>
      </g>
    </g>
  </svg>
);

const JewelryIcon = ({ sx, ...props }) => (
  <svg 
    viewBox="0 0 511.999 511.999" 
    width="24" 
    height="24" 
    {...props}
    style={{ 
      fill: 'currentColor',
      ...sx 
    }}
  >
    <g>
      <ellipse cx="166.504" cy="166.348" rx="35.445" ry="35.391"/>
      <ellipse cx="345.495" cy="311.15" rx="35.444" ry="35.391"/>
    </g>
    <g>
      <path d="M178.023,108.121h-23.031c-2.873,0-5.224,2.351-5.224,5.224v19.743c0,0.662,0.137,1.291,0.365,1.877c4.9-2.554,10.466-4.006,16.375-4.006c5.909,0,11.476,1.452,16.375,4.006c0.228-0.584,0.365-1.214,0.365-1.877v-19.743C183.247,110.472,180.896,108.121,178.023,108.121z"/>
      <path d="M357.006,252.919h-23.031c-2.873,0-5.224,2.351-5.224,5.224v19.743c0,0.662,0.137,1.291,0.365,1.877c4.9-2.554,10.466-4.006,16.375-4.006c5.909,0,11.476,1.452,16.375,4.006c0.228-0.585,0.365-1.214,0.365-1.877v-19.743C362.23,255.27,359.879,252.919,357.006,252.919z"/>
    </g>
    <g>
      <ellipse cx="166.504" cy="280.649" rx="78.838" ry="78.712"/>
      <ellipse cx="345.495" cy="425.451" rx="78.838" ry="78.712"/>
    </g>
    <path d="M163.555,166.349c0-13.695,7.798-25.568,19.199-31.451c-11.401,5.883-19.199,17.756-19.199,31.451s7.798,25.568,19.199,31.451C171.353,191.917,163.555,180.044,163.555,166.349z"/>
    <path d="M342.546,311.15c0-13.695,7.798-25.568,19.199-31.451c-11.401,5.883-19.199,17.756-19.199,31.451s7.798,25.568,19.199,31.451C350.344,336.718,342.546,324.845,342.546,311.15z"/>
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
    icon: WalletIcon,  // Changed from AccountBalanceWalletOutlined
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
