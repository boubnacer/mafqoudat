/**
 * Category color/icon configuration for mobile
 * Mirrors the color/backgroundColor values from: client/src/config/categories.js
 * Icons are Ionicons names (an icon library is available via @expo/vector-icons,
 * already used by App.js/OnboardingScreen.js) rather than the MUI icon
 * components the web config uses.
 */

export const CATEGORY_CONFIG = {
  PHONES: { color: '#00BCD4', backgroundColor: '#E0F7FA', icon: 'phone-portrait-outline', priority: 1 },
  LAPTOPS: { color: '#2979FF', backgroundColor: '#E8F0FE', icon: 'laptop-outline', priority: 2 },
  DOCUMENTS: { color: '#795548', backgroundColor: '#EFEBE9', icon: 'document-text-outline', priority: 3 },
  JEWELRY: { color: '#9C27B0', backgroundColor: '#F3E5F6', icon: 'diamond-outline', priority: 4 },
  CLOTHING: { color: '#4CAF50', backgroundColor: '#EAF5EA', icon: 'shirt-outline', priority: 5 },
  PETS: { color: '#FF6B6B', backgroundColor: '#FFEDED', icon: 'paw-outline', priority: 6 },
  VEHICLES: { color: '#607D8B', backgroundColor: '#ECEFF1', icon: 'car-outline', priority: 7 },
  KEYS: { color: '#FB8C00', backgroundColor: '#FFF1E0', icon: 'key-outline', priority: 8 },
  WALLET: { color: '#BF360C', backgroundColor: '#F7E7E2', icon: 'wallet-outline', priority: 9 },
  BAGS: { color: '#827717', backgroundColor: '#F0EFE3', icon: 'briefcase-outline', priority: 10 },
  WATCHES: { color: '#2196F3', backgroundColor: '#E4F2FE', icon: 'watch-outline', priority: 11 },
  GLASSES: { color: '#3F51B5', backgroundColor: '#E8EAF6', icon: 'glasses-outline', priority: 12 },
  HEADPHONES: { color: '#7E57C2', backgroundColor: '#F0EBF8', icon: 'headset-outline', priority: 13 },
  BOOKS: { color: '#5E35B1', backgroundColor: '#ECE7F6', icon: 'book-outline', priority: 14 },
  SPORTS: { color: '#8BC34A', backgroundColor: '#F1F8E9', icon: 'football-outline', priority: 15 },
  TOYS: { color: '#AFB42B', backgroundColor: '#F5F6E6', icon: 'game-controller-outline', priority: 16 },
  CHARGERS: { color: '#455A64', backgroundColor: '#ECEFF1', icon: 'flash-outline', priority: 17 },
  POWERBANKS: { color: '#FF6D00', backgroundColor: '#FFF3E0', icon: 'battery-charging-outline', priority: 18 },
  STORAGE: { color: '#7C4DFF', backgroundColor: '#F0EBF8', icon: 'save-outline', priority: 19 },
  CAMERAS: { color: '#0097A7', backgroundColor: '#E0F3F4', icon: 'camera-outline', priority: 20 },
  UMBRELLAS: { color: '#0277BD', backgroundColor: '#E1EFF7', icon: 'umbrella-outline', priority: 21 },
  BICYCLES: { color: '#009966', backgroundColor: '#E0F3ED', icon: 'bicycle-outline', priority: 22 },
  MONEY: { color: '#2E7D32', backgroundColor: '#E6EFE6', icon: 'cash-outline', priority: 23 },
  PERSON: { color: '#F44336', backgroundColor: '#FEE8E7', icon: 'person-outline', priority: 24 },
  MEDICAL: { color: '#C2185B', backgroundColor: '#F8E3EB', icon: 'medkit-outline', priority: 25 },
  // Ionicons has no stroller or baby glyph (the web config draws this one with
  // MUI's ChildFriendly), so the balloon stands in as the "for a child" mark.
  BABY: { color: '#EC407A', backgroundColor: '#FDE8EF', icon: 'balloon-outline', priority: 26 },
  MUSIC: { color: '#009688', backgroundColor: '#E0F2F1', icon: 'musical-notes-outline', priority: 27 },
  ELECTRONICS: { color: '#00838F', backgroundColor: '#E0F7FA', icon: 'hardware-chip-outline', priority: 28 },
  OTHER: { color: '#9E9E9E', backgroundColor: '#F3F3F3', icon: 'ellipsis-horizontal-outline', priority: 99 },
};

export const CATEGORY_SVG_XML = {
  PHONES: `<svg viewBox="0 0 512 512" fill="none"><g fill="none" stroke="currentColor" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"><rect x="36" y="52" width="244" height="408" rx="32" /><circle cx="158" cy="80" r="5" /><line x1="138" y1="428" x2="178" y2="428" stroke-width="16" /><rect x="308" y="116" width="168" height="344" rx="28" /><line x1="362" y1="148" x2="422" y2="148" stroke-width="16" /><line x1="374" y1="428" x2="410" y2="428" stroke-width="14" /></g></svg>`,
  STORAGE: `<svg viewBox="0 0 512 512" fill="none"><g fill="none" stroke="currentColor" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"><rect x="44" y="64" width="236" height="384" rx="28" /><line x1="84" y1="112" x2="144" y2="112" stroke-width="18" /><circle cx="162" cy="256" r="64" /><circle cx="162" cy="256" r="20" /><line x1="126" y1="412" x2="198" y2="412" stroke-width="18" /><rect x="312" y="164" width="156" height="284" rx="26" /><rect x="346" y="72" width="88" height="92" rx="10" /><rect x="360" y="96" width="20" height="22" rx="3" /><rect x="400" y="96" width="20" height="22" rx="3" /><line x1="366" y1="392" x2="414" y2="392" stroke-width="18" /></g></svg>`,
  CHARGERS: `<svg viewBox="0 0 512 512" fill="none"><g fill="none" stroke="currentColor" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"><rect x="84" y="160" width="150" height="170" rx="24" ry="24" /><line x1="40" y1="205" x2="84" y2="205" stroke-width="22" /><line x1="40" y1="285" x2="84" y2="285" stroke-width="22" /><path d="M 234 245 C 310 245 320 370 380 370 L 410 370" /><rect x="410" y="352" width="48" height="36" rx="8" ry="8" /><line x1="458" y1="370" x2="476" y2="370" stroke-width="16" /></g></svg>`,
  POWERBANKS: `<svg viewBox="0 0 512 512" fill="none"><g fill="none" stroke="currentColor" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"><rect x="124" y="72" width="264" height="390" rx="36" ry="36" /><rect x="172" y="110" width="56" height="26" rx="6" ry="6" /><rect x="272" y="114" width="44" height="18" rx="9" ry="9" /><path d="M 268 200 L 216 284 L 260 284 L 236 364 L 304 264 L 260 264 Z" stroke-width="22" /><circle cx="186" cy="414" r="6" /><circle cx="232" cy="414" r="6" /><circle cx="278" cy="414" r="6" /><circle cx="324" cy="414" r="6" /></g></svg>`,
  ELECTRONICS: `<svg viewBox="0 0 512 512" fill="none"><g fill="none" stroke="currentColor" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"><path d="M 370 144 L 370 132 C 370 118 358 108 344 108 L 90 108 C 76 108 64 118 64 132 L 64 340 L 260 340" /><path d="M 36 364 L 260 364" /><rect x="276" y="148" width="168" height="292" rx="34" /><line x1="336" y1="184" x2="384" y2="184" stroke-width="18" /><line x1="344" y1="392" x2="376" y2="392" stroke-width="14" /></g></svg>`,
};

export const getCategoryConfig = (code) => {
  const upper = code?.toUpperCase();
  return CATEGORY_CONFIG[upper] || CATEGORY_CONFIG.OTHER;
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

