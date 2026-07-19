/**
 * Category color configuration for mobile
 * Mirrors the color/backgroundColor values from: client/src/config/categories.js
 * (icons omitted - no icon library installed in mobile)
 */

export const CATEGORY_CONFIG = {
  ELECTRONICS: { color: '#00BCD4', backgroundColor: '#E0F7FA' },
  DOCUMENTS: { color: '#795548', backgroundColor: '#EFEBE9' },
  JEWELRY: { color: '#9C27B0', backgroundColor: '#F3E5F5' },
  CLOTHING: { color: '#4CAF50', backgroundColor: '#E8F5E9' },
  PETS: { color: '#FF6B6B', backgroundColor: '#FFEBEE' },
  VEHICLES: { color: '#607D8B', backgroundColor: '#ECEFF1' },
  KEYS: { color: '#FF9800', backgroundColor: '#FFF3E0' },
  WALLET: { color: '#FF5722', backgroundColor: '#FBE9E7' },
  BAGS: { color: '#8D6E63', backgroundColor: '#EFEBE9' },
  WATCHES: { color: '#2196F3', backgroundColor: '#E3F2FD' },
  GLASSES: { color: '#3F51B5', backgroundColor: '#E8EAF6' },
  HEADPHONES: { color: '#9C27B0', backgroundColor: '#F3E5F5' },
  BOOKS: { color: '#5E35B1', backgroundColor: '#EDE7F6' },
  SPORTS: { color: '#4CAF50', backgroundColor: '#E8F5E9' },
  TOYS: { color: '#FF9800', backgroundColor: '#FFF3E0' },
  CAMERAS: { color: '#00897B', backgroundColor: '#E0F2F1' },
  MONEY: { color: '#4CAF50', backgroundColor: '#E8F5E9' },
  PERSON: { color: '#F44336', backgroundColor: '#FFEBEE' },
  OTHER: { color: '#9E9E9E', backgroundColor: '#F5F5F5' },
};

export const getCategoryConfig = (code) => {
  return CATEGORY_CONFIG[code?.toUpperCase()] || CATEGORY_CONFIG.OTHER;
};
