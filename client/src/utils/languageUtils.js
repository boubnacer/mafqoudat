// Language utilities for multilingual support

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  ar: { name: 'العربية', flag: '🇸🇦' }
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Get current language from localStorage or browser
export const getCurrentLanguage = () => {
  // Check localStorage first
  const savedLanguage = localStorage.getItem('app_language');
  if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
    return savedLanguage;
  }

  // Check browser language
  const browserLanguage = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES[browserLanguage]) {
    return browserLanguage;
  }

  // Fallback to default
  return DEFAULT_LANGUAGE;
};

// Initialize language settings
export const initializeLanguage = () => {
  const currentLang = getCurrentLanguage();
  
  // Set document direction for RTL languages
  document.body.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  
  return currentLang;
};

// Set current language
export const setCurrentLanguage = (language) => {
  if (SUPPORTED_LANGUAGES[language]) {
    localStorage.setItem('app_language', language);
    return true;
  }
  return false;
};

// Get label from multilingual object
export const getLabel = (labels, language = null) => {
  if (!labels) return '';
  
  const currentLang = language || getCurrentLanguage();
  
  // Try current language first
  if (labels[currentLang]) {
    return labels[currentLang];
  }
  
  // Fallback to English
  if (labels.en) {
    return labels.en;
  }
  
  // Fallback to first available label
  const availableLabels = Object.values(labels);
  return availableLabels[0] || '';
};

// Format country name with flag
export const formatCountry = (country, language = null) => {
  if (!country) return '';
  
  const label = getLabel(country.labels, language);
  const flag = country.flag || '';
  
  return `${flag} ${label}`;
};

// Format post type with color
export const formatPostType = (postType, language = null) => {
  if (!postType) return '';
  
  const label = getLabel(postType.labels, language);
  const color = postType.color || '#666666';
  
  return { label, color };
};

// Language detection utilities
export const detectLanguage = (text) => {
  // Simple language detection based on character sets
  const arabicRegex = /[\u0600-\u06FF]/;
  const frenchRegex = /[àâäéèêëïîôöùûüÿç]/i;
  
  if (arabicRegex.test(text)) {
    return 'ar';
  } else if (frenchRegex.test(text)) {
    return 'fr';
  } else {
    return 'en';
  }
};

// RTL language support
export const isRTL = (language = null) => {
  const currentLang = language || getCurrentLanguage();
  return currentLang === 'ar';
};

// Export language context
export const LanguageContext = {
  current: getCurrentLanguage(),
  set: setCurrentLanguage,
  supported: SUPPORTED_LANGUAGES,
  isRTL,
  getLabel,
  formatCountry,
  formatPostType
};

// Import translation function
export { t, tWithFallback } from './translations'; 