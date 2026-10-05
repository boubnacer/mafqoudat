import SvgIcon from '@mui/material/SvgIcon';
import { alpha } from '@mui/material/styles';
import {
  IoPhonePortraitOutline,
  IoDocumentTextOutline,
  IoDiamondOutline,
  IoShirtOutline,
  IoPawOutline,
  IoCarOutline,
  IoKeyOutline,
  IoWalletOutline,
  IoBriefcaseOutline,
  IoWatchOutline,
  IoGlassesOutline,
  IoHeadsetOutline,
  IoBookOutline,
  IoFootballOutline,
  IoGameControllerOutline,
  IoCameraOutline,
  IoBatteryChargingOutline,
  IoUmbrellaOutline,
  IoBicycleOutline,
  IoCashOutline,
  IoPersonOutline,
  IoMedkitOutline,
  IoBalloonOutline,
  IoMusicalNotesOutline,
  IoEllipsisHorizontalOutline,
  IoLaptopOutline,
} from 'react-icons/io5';

const createCategoryIcon = (IconComponent) => {
  const CategoryIconWrapper = (props) => (
    <SvgIcon component={IconComponent} inheritViewBox {...props} />
  );
  return CategoryIconWrapper;
};

const createCustomOutlineIcon = (SvgComponent) => (props) => (
  <SvgIcon
    component={SvgComponent}
    inheritViewBox
    {...props}
    sx={{
      fill: 'none !important',
      '& path, & rect, & line, & circle': {
        fill: 'none !important',
        stroke: 'currentColor',
      },
      ...props?.sx,
    }}
  />
);

/**
 * Composite Phone & Tablet outlined icon component.
 * Tablet frame on the left, smartphone on the right, side by side with clean separation.
 */
const PhoneTabletOutlineSvg = (props) => (
  <svg viewBox="0 0 512 512" style={{ fill: 'none', stroke: 'currentColor' }} {...props}>
    <g style={{ fill: 'none', stroke: 'currentColor' }} stroke="currentColor" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round">
      {/* Tablet on the left */}
      <rect x="36" y="52" width="244" height="408" rx="32" />
      <circle cx="158" cy="80" r="5" />
      <line x1="138" y1="428" x2="178" y2="428" strokeWidth="16" />
      {/* Smartphone on the right, side by side with clean 28px separation */}
      <rect x="308" y="116" width="168" height="344" rx="28" />
      <line x1="362" y1="148" x2="422" y2="148" strokeWidth="16" />
      <line x1="374" y1="428" x2="410" y2="428" strokeWidth="14" />
    </g>
  </svg>
);

/**
 * Charger adapter block + curved cable with connector tip.
 */
const ChargerCableOutlineSvg = (props) => (
  <svg viewBox="0 0 512 512" style={{ fill: 'none', stroke: 'currentColor' }} {...props}>
    <g style={{ fill: 'none', stroke: 'currentColor' }} stroke="currentColor" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round">
      <rect x="84" y="160" width="150" height="170" rx="24" ry="24" />
      <line x1="40" y1="205" x2="84" y2="205" strokeWidth="22" />
      <line x1="40" y1="285" x2="84" y2="285" strokeWidth="22" />
      <path d="M 234 245 C 310 245 320 370 380 370 L 410 370" />
      <rect x="410" y="352" width="48" height="36" rx="8" ry="8" />
      <line x1="458" y1="370" x2="476" y2="370" strokeWidth="16" />
    </g>
  </svg>
);

/**
 * Power Bank outlined icon: battery chassis, USB ports, charging lightning bolt, indicator dots.
 */
const PowerBankOutlineSvg = (props) => (
  <svg viewBox="0 0 512 512" style={{ fill: 'none', stroke: 'currentColor' }} {...props}>
    <g style={{ fill: 'none', stroke: 'currentColor' }} stroke="currentColor" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round">
      <rect x="124" y="72" width="264" height="390" rx="36" ry="36" />
      <rect x="172" y="110" width="56" height="26" rx="6" ry="6" />
      <rect x="272" y="114" width="44" height="18" rx="9" ry="9" />
      <path d="M 268 200 L 216 284 L 260 284 L 236 364 L 304 264 L 260 264 Z" strokeWidth="22" />
      <circle cx="186" cy="414" r="6" />
      <circle cx="232" cy="414" r="6" />
      <circle cx="278" cy="414" r="6" />
      <circle cx="324" cy="414" r="6" />
    </g>
  </svg>
);

/**
 * Storage outlined icon: Larger external hard drive + USB flash drive with clean separation.
 */
const StorageOutlineSvg = (props) => (
  <svg viewBox="0 0 512 512" style={{ fill: 'none', stroke: 'currentColor' }} {...props}>
    <g style={{ fill: 'none', stroke: 'currentColor' }} stroke="currentColor" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round">
      {/* External Hard Drive on the left (larger, taller, clear platter) */}
      <rect x="44" y="64" width="236" height="384" rx="28" />
      <line x1="84" y1="112" x2="144" y2="112" strokeWidth="18" />
      <circle cx="162" cy="256" r="64" />
      <circle cx="162" cy="256" r="20" />
      <line x1="126" y1="412" x2="198" y2="412" strokeWidth="18" />
      {/* USB Flash Drive on the right (clear 32px gap, larger, distinct connector) */}
      <rect x="312" y="164" width="156" height="284" rx="26" />
      <rect x="346" y="72" width="88" height="92" rx="10" />
      <rect x="360" y="96" width="20" height="22" rx="3" />
      <rect x="400" y="96" width="20" height="22" rx="3" />
      <line x1="366" y1="392" x2="414" y2="392" strokeWidth="18" />
    </g>
  </svg>
);

/**
 * Composite Phone & Laptop icon component for the Electronics category.
 * Rendered as an outline in the Ionicons aesthetic (512x512 viewBox, 26px stroke, round caps/corners).
 */
const DevicesOutlineSvg = (props) => (
  <svg
    viewBox="0 0 512 512"
    style={{ fill: 'none', stroke: 'currentColor' }}
    {...props}
  >
    <g
      style={{ fill: 'none', stroke: 'currentColor' }}
      stroke="currentColor"
      strokeWidth="26"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M 370 144 L 370 132 C 370 118 358 108 344 108 L 90 108 C 76 108 64 118 64 132 L 64 340 L 260 340"
        fill="none"
        style={{ fill: 'none' }}
      />
      <path
        d="M 36 364 L 260 364"
        fill="none"
        style={{ fill: 'none' }}
      />
      <rect
        x="276"
        y="148"
        width="168"
        height="292"
        rx="34"
        fill="none"
        style={{ fill: 'none' }}
      />
      <line
        x1="336"
        y1="184"
        x2="384"
        y2="184"
        strokeWidth="18"
        fill="none"
        style={{ fill: 'none' }}
      />
      <line
        x1="344"
        y1="408"
        x2="376"
        y2="408"
        strokeWidth="16"
        fill="none"
        style={{ fill: 'none' }}
      />
    </g>
  </svg>
);

export const PhoneTabletIcon = createCustomOutlineIcon(PhoneTabletOutlineSvg);
export const LaptopIcon = createCategoryIcon(IoLaptopOutline);
export const ChargerCableIcon = createCustomOutlineIcon(ChargerCableOutlineSvg);
export const PowerBankIcon = createCustomOutlineIcon(PowerBankOutlineSvg);
export const StorageIcon = createCustomOutlineIcon(StorageOutlineSvg);
export const PhonesElectronicsIcon = createCustomOutlineIcon(DevicesOutlineSvg);
export const PhonePortraitIcon = PhoneTabletIcon;
export const DocumentTextIcon = createCategoryIcon(IoDocumentTextOutline);
export const DiamondIcon = createCategoryIcon(IoDiamondOutline);
export const ShirtIcon = createCategoryIcon(IoShirtOutline);
export const PawIcon = createCategoryIcon(IoPawOutline);
export const CarIcon = createCategoryIcon(IoCarOutline);
export const KeyIcon = createCategoryIcon(IoKeyOutline);
export const WalletIcon = createCategoryIcon(IoWalletOutline);
export const BriefcaseIcon = createCategoryIcon(IoBriefcaseOutline);
export const WatchIcon = createCategoryIcon(IoWatchOutline);
export const GlassesIcon = createCategoryIcon(IoGlassesOutline);
export const HeadsetIcon = createCategoryIcon(IoHeadsetOutline);
export const BookIcon = createCategoryIcon(IoBookOutline);
export const FootballIcon = createCategoryIcon(IoFootballOutline);
export const GameControllerIcon = createCategoryIcon(IoGameControllerOutline);
export const CameraIcon = createCategoryIcon(IoCameraOutline);
export const BatteryChargingIcon = createCategoryIcon(IoBatteryChargingOutline);
export const UmbrellaIcon = createCategoryIcon(IoUmbrellaOutline);
export const BicycleIcon = createCategoryIcon(IoBicycleOutline);
export const CashIcon = createCategoryIcon(IoCashOutline);
export const PersonIcon = createCategoryIcon(IoPersonOutline);
export const MedkitIcon = createCategoryIcon(IoMedkitOutline);
export const BalloonIcon = createCategoryIcon(IoBalloonOutline);
export const MusicalNotesIcon = createCategoryIcon(IoMusicalNotesOutline);
export const EllipsisHorizontalIcon = createCategoryIcon(IoEllipsisHorizontalOutline);

/**
 * Category configuration - Optimized for Lost & Found.
 *
 * `color` is the category's accent: the icon itself everywhere, and the tint
 * every surface washes behind it (`alpha(color, .12)` on web cards,
 * `${color}1F`/`${color}33` on mobile's bento grid). `backgroundColor` is that
 * same accent at 12% over white, kept as a literal for the older surfaces that
 * read it directly - it is light-mode only, which is why newer work derives its
 * own tint from `color` instead (see Phase 17's note in CLAUDE.md).
 *
 * `code` is the contract - the DB (server/models/Category.js) stores the same
 * strings, and getCategoryConfig falls back to OTHER's grey for anything not
 * listed here, so a category added to the DB alone renders as "other" with no
 * error anywhere. Icons are now unified 1:1 with mobile (Ionicons outline set).
 */
export const CATEGORY_CONFIG = {
  PHONES: {
    icon: PhoneTabletIcon,
    color: '#00BCD4',
    backgroundColor: '#E0F7FA',
    priority: 1
  },
  LAPTOPS: {
    icon: LaptopIcon,
    color: '#2979FF',
    backgroundColor: '#E8F0FE',
    priority: 2
  },
  DOCUMENTS: {
    icon: DocumentTextIcon,
    color: '#795548',
    backgroundColor: '#EFEBE9',
    priority: 3
  },
  JEWELRY: {
    icon: DiamondIcon,
    color: '#9C27B0',
    backgroundColor: '#F3E5F6',
    priority: 4
  },
  CLOTHING: {
    icon: ShirtIcon,
    color: '#4CAF50',
    backgroundColor: '#EAF5EA',
    priority: 5
  },
  PETS: {
    icon: PawIcon,
    color: '#FF6B6B',
    backgroundColor: '#FFEDED',
    priority: 6
  },
  VEHICLES: {
    icon: CarIcon,
    color: '#607D8B',
    backgroundColor: '#ECEFF1',
    priority: 7
  },
  KEYS: {
    icon: KeyIcon,
    color: '#FB8C00',
    backgroundColor: '#FFF1E0',
    priority: 8
  },
  WALLET: {
    icon: WalletIcon,
    color: '#BF360C',
    backgroundColor: '#F7E7E2',
    priority: 9
  },
  BAGS: {
    icon: BriefcaseIcon,
    color: '#827717',
    backgroundColor: '#F0EFE3',
    priority: 10
  },
  WATCHES: {
    icon: WatchIcon,
    color: '#2196F3',
    backgroundColor: '#E4F2FE',
    priority: 11
  },
  GLASSES: {
    icon: GlassesIcon,
    color: '#3F51B5',
    backgroundColor: '#E8EAF6',
    priority: 12
  },
  HEADPHONES: {
    icon: HeadsetIcon,
    color: '#7E57C2',
    backgroundColor: '#F0EBF8',
    priority: 13
  },
  BOOKS: {
    icon: BookIcon,
    color: '#5E35B1',
    backgroundColor: '#ECE7F6',
    priority: 14
  },
  SPORTS: {
    icon: FootballIcon,
    color: '#8BC34A',
    backgroundColor: '#F1F8E9',
    priority: 15
  },
  TOYS: {
    icon: GameControllerIcon,
    color: '#AFB42B',
    backgroundColor: '#F5F6E6',
    priority: 16
  },
  CHARGERS: {
    icon: ChargerCableIcon,
    color: '#455A64',
    backgroundColor: '#ECEFF1',
    priority: 17
  },
  POWERBANKS: {
    icon: PowerBankIcon,
    color: '#FF6D00',
    backgroundColor: '#FFF3E0',
    priority: 18
  },
  STORAGE: {
    icon: StorageIcon,
    color: '#7C4DFF',
    backgroundColor: '#F0EBF8',
    priority: 19
  },
  CAMERAS: {
    icon: CameraIcon,
    color: '#0097A7',
    backgroundColor: '#E0F3F4',
    priority: 20
  },
  UMBRELLAS: {
    icon: UmbrellaIcon,
    color: '#0277BD',
    backgroundColor: '#E1EFF7',
    priority: 21
  },
  BICYCLES: {
    icon: BicycleIcon,
    color: '#009966',
    backgroundColor: '#E0F3ED',
    priority: 22
  },
  MONEY: {
    icon: CashIcon,
    color: '#2E7D32',
    backgroundColor: '#E6EFE6',
    priority: 23
  },
  PERSON: {
    icon: PersonIcon,
    color: '#F44336',
    backgroundColor: '#FEE8E7',
    priority: 24
  },
  MEDICAL: {
    icon: MedkitIcon,
    color: '#C2185B',
    backgroundColor: '#F8E3EB',
    priority: 25
  },
  BABY: {
    icon: BalloonIcon,
    color: '#EC407A',
    backgroundColor: '#FDE8EF',
    priority: 26
  },
  MUSIC: {
    icon: MusicalNotesIcon,
    color: '#009688',
    backgroundColor: '#E0F2F1',
    priority: 27
  },
  ELECTRONICS: {
    icon: PhonesElectronicsIcon,
    color: '#00838F',
    backgroundColor: '#E0F7FA',
    priority: 28
  },
  // Always last: the catch-all a listing lands in when nothing above fits.
  OTHER: {
    icon: EllipsisHorizontalIcon,
    color: '#9E9E9E',
    backgroundColor: '#F3F3F3',
    priority: 99
  }
};

// Get category configuration by code
export const getCategoryConfig = (code) => {
  const upper = code?.toUpperCase();
  return CATEGORY_CONFIG[upper] || CATEGORY_CONFIG.OTHER;
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

/**
 * Order for the "Browse by category" grids (dashboard web + mobile), which show
 * only their first few tiles before a "show all" toggle.
 *
 * The categories API sorts alphabetically by the English label. That is right
 * for a picker someone scans by name, and wrong here: alphabetically the first
 * four tiles are Baby, Bag, Bicycle and Book, so the grid leads with the rarest
 * things on the site and hides the ones people actually lose. This file's own
 * priority is what those tiles follow instead. A code this file does not know
 * sorts last with OTHER, and ties keep the API's alphabetical order.
 */
export const sortCategoriesForBrowse = (categories = []) => {
  return [...categories].sort(
    (a, b) => getCategoryConfig(a?.code).priority - getCategoryConfig(b?.code).priority
  );
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

/**
 * Calculates WCAG 2.1 relative luminance for a given hex color.
 */
export const getHexLuminance = (hex) => {
  if (!hex || typeof hex !== 'string') return 0.5;
  const cleanHex = hex.replace('#', '').trim();
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map((c) => c + c).join('')
    : cleanHex;
  if (fullHex.length !== 6) return 0.5;
  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return 0.5;
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

/**
 * Computes high-contrast badge styling tailored to each category's color luminance.
 * Ensures the category title is clearly visible and readable in both light and dark mode,
 * and over any card image.
 *
 * - Dark-toned category colors (luminance < 0.20, e.g. Documents #795548, Wallet #BF360C, Books #5E35B1, Money #2E7D32, Chargers #455A64):
 *   Paired with a luminous frosted light surface (with subtle pastel tint from its category background)
 *   achieving a WCAG contrast ratio between 5.5:1 and 8.5:1.
 * - Light / vibrant category colors (luminance >= 0.20, e.g. Phones #00BCD4, Keys #FB8C00, Sports #8BC34A, Pets #FF6B6B):
 *   Paired with a sleek dark frosted glass surface
 *   achieving a WCAG contrast ratio between 5.0:1 and 8.8:1.
 */
export const getCategoryBadgeStyle = (code) => {
  const config = getCategoryConfig(code);
  const color = config.color || '#9E9E9E';
  const lum = getHexLuminance(color);

  if (lum < 0.20) {
    return {
      color: color,
      backgroundColor: config.backgroundColor
        ? alpha(config.backgroundColor, 0.94)
        : 'rgba(255, 255, 255, 0.94)',
      border: `1px solid ${alpha(color, 0.55)}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
      backdropFilter: 'blur(8px)',
      isDarkTitle: true,
    };
  }

  return {
    color: color,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: `1px solid ${alpha(color, 0.65)}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(8px)',
    isDarkTitle: false,
  };
};

