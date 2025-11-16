// Language utility functions

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  ar: { name: 'العربية', flag: '🇸🇦' },
  fr: { name: 'Français', flag: '🇫🇷' }
};

// Get current language from localStorage
// Uses ONLY 'language' key as the single source of truth
export const getCurrentLanguage = () => {
  try {
    return localStorage.getItem('language') || 'ar';
  } catch (error) {
    console.error('Error getting current language:', error);
    return 'ar';
  }
};


// Set current language
// Uses ONLY 'language' key as the single source of truth
export const setCurrentLanguage = (language) => {
  try {
    if (SUPPORTED_LANGUAGES[language]) {
      // Save to unified key only
      localStorage.setItem('language', language);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting current language:', error);
    return false;
  }
};

// Get API parameters with current language
export const getApiParamsWithLanguage = (additionalParams = {}) => {
  try {
    const currentLang = getCurrentLanguage();
    return {
      language: currentLang,
      ...additionalParams
    };
  } catch (error) {
    console.error('Error getting API params with language:', error);
    return {
      language: 'ar',
      ...additionalParams
    };
  }
};

// Initialize language settings
export const initializeLanguage = (language = null) => {
  const currentLang = language || getCurrentLanguage();
  
  // Set document language attribute
  document.documentElement.setAttribute("lang", currentLang);
  
  // Force re-render for RTL languages
  if (currentLang === "ar") {
    document.body.style.direction = "rtl";
    document.body.style.textAlign = "right";
  } else {
    document.body.style.direction = "ltr";
    document.body.style.textAlign = "left";
  }
  
  return currentLang;
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

// Debug function to check language state
export const debugLanguageState = () => {
  try {
    const currentLang = getCurrentLanguage();
    const bodyDir = document.body.getAttribute('dir');
    const htmlLang = document.documentElement.getAttribute('lang');
    
    return {
      currentLang,
      bodyDir,
      htmlLang,
      isRTL: isRTL(currentLang)
    };
  } catch (error) {
    console.error('Error debugging language state:', error);
    return null;
  }
};

// Export language context (legacy export for backward compatibility)
export const LanguageContextLegacy = {
  current: getCurrentLanguage(),
  set: setCurrentLanguage,
  supported: SUPPORTED_LANGUAGES,
  isRTL,
  getLabel,
  formatCountry,
  formatPostType
}; 