import SvgIcon from '@mui/material/SvgIcon';
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
} from 'react-icons/io5';

const createCategoryIcon = (IconComponent) => {
  const CategoryIconWrapper = (props) => (
    <SvgIcon component={IconComponent} inheritViewBox {...props} />
  );
  return CategoryIconWrapper;
};

export const PhonePortraitIcon = createCategoryIcon(IoPhonePortraitOutline);
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
 * Every accent is distinct: no two are nearer than ~11 CIEDE2000, which is what
 * keeps two categories from reading as the same colour at a 20px icon. Several
 * pairs used to share a hex outright (jewelry/headphones, clothing/sports/money,
 * keys/toys) and two more were a step apart on one Material ramp. So the
 * accents are a measured set, not a per-category pick: changing one means
 * re-checking it against the other twenty-four, not just liking it on its own.
 *
 * `code` is the contract - the DB (server/models/Category.js) stores the same
 * strings, and getCategoryConfig falls back to OTHER's grey for anything not
 * listed here, so a category added to the DB alone renders as "other" with no
 * error anywhere. Icons are now unified 1:1 with mobile (Ionicons outline set).
 */
export const CATEGORY_CONFIG = {
  ELECTRONICS: {
    icon: PhonePortraitIcon,
    color: '#00BCD4',
    backgroundColor: '#E0F7FA',
    priority: 1
  },
  DOCUMENTS: {
    icon: DocumentTextIcon,
    color: '#795548',
    backgroundColor: '#EFEBE9',
    priority: 2
  },
  JEWELRY: {
    icon: DiamondIcon,
    color: '#9C27B0',
    backgroundColor: '#F3E5F6',
    priority: 3
  },
  CLOTHING: {
    icon: ShirtIcon,
    color: '#4CAF50',
    backgroundColor: '#EAF5EA',
    priority: 4
  },
  PETS: {
    icon: PawIcon,
    color: '#FF6B6B',
    backgroundColor: '#FFEDED',
    priority: 5
  },
  VEHICLES: {
    icon: CarIcon,
    color: '#607D8B',
    backgroundColor: '#ECEFF1',
    priority: 6
  },
  KEYS: {
    icon: KeyIcon,
    color: '#FB8C00',
    backgroundColor: '#FFF1E0',
    priority: 7
  },
  WALLET: {
    icon: WalletIcon,
    color: '#BF360C',
    backgroundColor: '#F7E7E2',
    priority: 8
  },
  BAGS: {
    icon: BriefcaseIcon,
    color: '#827717',
    backgroundColor: '#F0EFE3',
    priority: 9
  },
  WATCHES: {
    icon: WatchIcon,
    color: '#2196F3',
    backgroundColor: '#E4F2FE',
    priority: 10
  },
  GLASSES: {
    icon: GlassesIcon,
    color: '#3F51B5',
    backgroundColor: '#E8EAF6',
    priority: 11
  },
  HEADPHONES: {
    icon: HeadsetIcon,
    color: '#7E57C2',
    backgroundColor: '#F0EBF8',
    priority: 12
  },
  BOOKS: {
    icon: BookIcon,
    color: '#5E35B1',
    backgroundColor: '#ECE7F6',
    priority: 13
  },
  SPORTS: {
    icon: FootballIcon,
    color: '#8BC34A',
    backgroundColor: '#F1F8E9',
    priority: 14
  },
  TOYS: {
    icon: GameControllerIcon,
    color: '#AFB42B',
    backgroundColor: '#F5F6E6',
    priority: 15
  },
  CAMERAS: {
    icon: CameraIcon,
    color: '#0097A7',
    backgroundColor: '#E0F3F4',
    priority: 16
  },
  CHARGERS: {
    icon: BatteryChargingIcon,
    color: '#455A64',
    backgroundColor: '#E9EBEC',
    priority: 17
  },
  UMBRELLAS: {
    icon: UmbrellaIcon,
    color: '#0277BD',
    backgroundColor: '#E1EFF7',
    priority: 18
  },
  BICYCLES: {
    icon: BicycleIcon,
    color: '#009966',
    backgroundColor: '#E0F3ED',
    priority: 19
  },
  MONEY: {
    icon: CashIcon,
    color: '#2E7D32',
    backgroundColor: '#E6EFE6',
    priority: 20
  },
  PERSON: {
    icon: PersonIcon,
    color: '#F44336',
    backgroundColor: '#FEE8E7',
    priority: 21
  },
  MEDICAL: {
    icon: MedkitIcon,
    color: '#C2185B',
    backgroundColor: '#F8E3EB',
    priority: 23
  },
  BABY: {
    icon: BalloonIcon,
    color: '#EC407A',
    backgroundColor: '#FDE8EF',
    priority: 24
  },
  MUSIC: {
    icon: MusicalNotesIcon,
    color: '#009688',
    backgroundColor: '#E0F2F1',
    priority: 25
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
