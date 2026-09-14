/**
 * Category color/icon configuration for mobile
 * Mirrors the color/backgroundColor values from: client/src/config/categories.js
 * Icons are Ionicons names (an icon library is available via @expo/vector-icons,
 * already used by App.js/OnboardingScreen.js) rather than the MUI icon
 * components the web config uses.
 */

export const CATEGORY_CONFIG = {
  ELECTRONICS: { color: '#00BCD4', backgroundColor: '#E0F7FA', icon: 'phone-portrait-outline', priority: 1 },
  DOCUMENTS: { color: '#795548', backgroundColor: '#EFEBE9', icon: 'document-text-outline', priority: 2 },
  JEWELRY: { color: '#9C27B0', backgroundColor: '#F3E5F6', icon: 'diamond-outline', priority: 3 },
  CLOTHING: { color: '#4CAF50', backgroundColor: '#EAF5EA', icon: 'shirt-outline', priority: 4 },
  PETS: { color: '#FF6B6B', backgroundColor: '#FFEDED', icon: 'paw-outline', priority: 5 },
  VEHICLES: { color: '#607D8B', backgroundColor: '#ECEFF1', icon: 'car-outline', priority: 6 },
  KEYS: { color: '#FB8C00', backgroundColor: '#FFF1E0', icon: 'key-outline', priority: 7 },
  WALLET: { color: '#BF360C', backgroundColor: '#F7E7E2', icon: 'wallet-outline', priority: 8 },
  BAGS: { color: '#827717', backgroundColor: '#F0EFE3', icon: 'briefcase-outline', priority: 9 },
  WATCHES: { color: '#2196F3', backgroundColor: '#E4F2FE', icon: 'watch-outline', priority: 10 },
  GLASSES: { color: '#3F51B5', backgroundColor: '#E8EAF6', icon: 'glasses-outline', priority: 11 },
  HEADPHONES: { color: '#7E57C2', backgroundColor: '#F0EBF8', icon: 'headset-outline', priority: 12 },
  BOOKS: { color: '#5E35B1', backgroundColor: '#ECE7F6', icon: 'book-outline', priority: 13 },
  SPORTS: { color: '#8BC34A', backgroundColor: '#F1F8E9', icon: 'football-outline', priority: 14 },
  TOYS: { color: '#AFB42B', backgroundColor: '#F5F6E6', icon: 'game-controller-outline', priority: 15 },
  CAMERAS: { color: '#0097A7', backgroundColor: '#E0F3F4', icon: 'camera-outline', priority: 16 },
  CHARGERS: { color: '#455A64', backgroundColor: '#E9EBEC', icon: 'battery-charging-outline', priority: 17 },
  UMBRELLAS: { color: '#0277BD', backgroundColor: '#E1EFF7', icon: 'umbrella-outline', priority: 18 },
  BICYCLES: { color: '#009966', backgroundColor: '#E0F3ED', icon: 'bicycle-outline', priority: 19 },
  MONEY: { color: '#2E7D32', backgroundColor: '#E6EFE6', icon: 'cash-outline', priority: 20 },
  PERSON: { color: '#F44336', backgroundColor: '#FEE8E7', icon: 'person-outline', priority: 21 },
  MEDICAL: { color: '#C2185B', backgroundColor: '#F8E3EB', icon: 'medkit-outline', priority: 23 },
  // Ionicons has no stroller or baby glyph (the web config draws this one with
  // MUI's ChildFriendly), so the balloon stands in as the "for a child" mark.
  BABY: { color: '#EC407A', backgroundColor: '#FDE8EF', icon: 'balloon-outline', priority: 24 },
  MUSIC: { color: '#009688', backgroundColor: '#E0F2F1', icon: 'musical-notes-outline', priority: 25 },
  OTHER: { color: '#9E9E9E', backgroundColor: '#F3F3F3', icon: 'ellipsis-horizontal-outline', priority: 99 },
};

export const getCategoryConfig = (code) => {
  return CATEGORY_CONFIG[code?.toUpperCase()] || CATEGORY_CONFIG.OTHER;
};

/**
 * Order for the Home screen's "Browse by category" bento grid, mirroring web's
 * sortCategoriesForBrowse. The categories API sorts alphabetically by the
 * English label, which puts Baby, Bag, Bicycle and Book in the featured card
 * and the four cells beside it - the rarest things on the site in the only
 * tiles shown before "show all". Ties keep the API's alphabetical order.
 */
export const sortCategoriesForBrowse = (categories = []) => {
  return [...categories].sort(
    (a, b) => getCategoryConfig(a?.code).priority - getCategoryConfig(b?.code).priority
  );
};
