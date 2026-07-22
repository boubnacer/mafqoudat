/**
 * Category color/icon configuration for mobile
 * Mirrors the color/backgroundColor values from: client/src/config/categories.js
 * Icons are Ionicons names (an icon library is available via @expo/vector-icons,
 * already used by App.js/OnboardingScreen.js) rather than the MUI icon
 * components the web config uses.
 */

export const CATEGORY_CONFIG = {
  ELECTRONICS: { color: '#00BCD4', backgroundColor: '#E0F7FA', icon: 'phone-portrait-outline' },
  DOCUMENTS: { color: '#795548', backgroundColor: '#EFEBE9', icon: 'document-text-outline' },
  JEWELRY: { color: '#9C27B0', backgroundColor: '#F3E5F5', icon: 'diamond-outline' },
  CLOTHING: { color: '#4CAF50', backgroundColor: '#E8F5E9', icon: 'shirt-outline' },
  PETS: { color: '#FF6B6B', backgroundColor: '#FFEBEE', icon: 'paw-outline' },
  VEHICLES: { color: '#607D8B', backgroundColor: '#ECEFF1', icon: 'car-outline' },
  KEYS: { color: '#FF9800', backgroundColor: '#FFF3E0', icon: 'key-outline' },
  WALLET: { color: '#FF5722', backgroundColor: '#FBE9E7', icon: 'wallet-outline' },
  BAGS: { color: '#8D6E63', backgroundColor: '#EFEBE9', icon: 'briefcase-outline' },
  WATCHES: { color: '#2196F3', backgroundColor: '#E3F2FD', icon: 'watch-outline' },
  GLASSES: { color: '#3F51B5', backgroundColor: '#E8EAF6', icon: 'glasses-outline' },
  HEADPHONES: { color: '#9C27B0', backgroundColor: '#F3E5F5', icon: 'headset-outline' },
  BOOKS: { color: '#5E35B1', backgroundColor: '#EDE7F6', icon: 'book-outline' },
  SPORTS: { color: '#4CAF50', backgroundColor: '#E8F5E9', icon: 'football-outline' },
  TOYS: { color: '#FF9800', backgroundColor: '#FFF3E0', icon: 'game-controller-outline' },
  CAMERAS: { color: '#00897B', backgroundColor: '#E0F2F1', icon: 'camera-outline' },
  MONEY: { color: '#4CAF50', backgroundColor: '#E8F5E9', icon: 'cash-outline' },
  PERSON: { color: '#F44336', backgroundColor: '#FFEBEE', icon: 'person-outline' },
  OTHER: { color: '#9E9E9E', backgroundColor: '#F5F5F5', icon: 'ellipsis-horizontal-outline' },
};

export const getCategoryConfig = (code) => {
  return CATEGORY_CONFIG[code?.toUpperCase()] || CATEGORY_CONFIG.OTHER;
};
