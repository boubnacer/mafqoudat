/**
 * Language utilities for multilingual support
 */

// Language detection patterns
const languagePatterns = {
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
  french: /[àâäéèêëïîôöùûüÿç]/i,
  english: /^[a-zA-Z\s]+$/
};

/**
 * Detect the language of a given text
 * @param {string} text - The text to analyze
 * @returns {string} - Language code ('ar', 'fr', 'en', or 'unknown')
 */
const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }

  const cleanText = text.trim();
  
  if (languagePatterns.arabic.test(cleanText)) {
    return 'ar';
  }
  
  if (languagePatterns.french.test(cleanText)) {
    return 'fr';
  }
  
  if (languagePatterns.english.test(cleanText)) {
    return 'en';
  }
  
  return 'unknown';
};

/**
 * Get the best matching label for a given language preference
 * @param {Object} labels - Object containing labels for different languages
 * @param {string} preferredLanguage - Preferred language code
 * @param {string} fallbackLanguage - Fallback language code (default: 'en')
 * @returns {string} - The best matching label
 */
const getBestLabel = (labels, preferredLanguage = 'en', fallbackLanguage = 'en') => {
  if (!labels || typeof labels !== 'object') {
    return '';
  }

  // Try preferred language first
  if (labels[preferredLanguage]) {
    return labels[preferredLanguage];
  }

  // Try fallback language
  if (labels[fallbackLanguage]) {
    return labels[fallbackLanguage];
  }

  // Try any available language
  const availableLanguages = Object.keys(labels);
  if (availableLanguages.length > 0) {
    return labels[availableLanguages[0]];
  }

  return '';
};

/**
 * Create search terms for a country or post type
 * @param {Object} item - The item with labels
 * @param {string} code - The item code
 * @returns {Array} - Array of search terms
 */
const createSearchTerms = (item, code) => {
  const terms = [code];
  
  if (item.labels) {
    Object.values(item.labels).forEach(label => {
      if (label && typeof label === 'string') {
        terms.push(label.toLowerCase());
        // Add individual words for better search
        const words = label.toLowerCase().split(/\s+/);
        terms.push(...words);
      }
    });
  }
  
  return [...new Set(terms)]; // Remove duplicates
};

/**
 * Normalize text for search
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
const normalizeSearchText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // Remove special chars but keep Arabic
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Check if text matches any of the search terms
 * @param {string} searchText - The search text
 * @param {Array} searchTerms - Array of search terms
 * @returns {boolean} - True if there's a match
 */
const matchesSearchTerms = (searchText, searchTerms) => {
  if (!searchText || !searchTerms || !Array.isArray(searchTerms)) {
    return false;
  }
  
  const normalizedSearch = normalizeSearchText(searchText);
  
  return searchTerms.some(term => {
    const normalizedTerm = normalizeSearchText(term);
    return normalizedTerm.includes(normalizedSearch) || 
           normalizedSearch.includes(normalizedTerm);
  });
};

/**
 * Get language-specific sorting function
 * @param {string} language - Language code
 * @returns {Function} - Sorting function
 */
const getSortFunction = (language = 'en') => {
  return (a, b) => {
    const labelA = getBestLabel(a.labels, language);
    const labelB = getBestLabel(b.labels, language);
    
    return labelA.localeCompare(labelB, language === 'ar' ? 'ar' : 'en');
  };
};

module.exports = {
  detectLanguage,
  getBestLabel,
  createSearchTerms,
  normalizeSearchText,
  matchesSearchTerms,
  getSortFunction,
  languagePatterns
}; 