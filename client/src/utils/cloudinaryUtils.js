/**
 * Cloudinary URL optimization utilities
 * Adds automatic quality and format optimization, plus appropriate sizing
 */

/**
 * Optimizes a Cloudinary URL with transformations for better performance
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Transformation options
 * @param {number} options.width - Target width (default: 800)
 * @param {string} options.quality - Quality setting (default: 'auto:good')
 * @param {string} options.format - Format setting (default: 'auto')
 * @returns {string} - Optimized Cloudinary URL
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // If it's not a Cloudinary URL, return as is
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width = 800,
    quality = 'auto:good',
    format = 'auto'
  } = options;

  try {
    // Parse the URL to extract the base path and filename
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      // Not a standard Cloudinary URL, return as is
      return url;
    }

    // Check if transformations already exist
    const existingTransformations = urlParts[uploadIndex + 1];
    if (existingTransformations && existingTransformations.includes('w_')) {
      // Transformations already exist, return as is to avoid duplication
      return url;
    }

    // Insert transformations after 'upload'
    const transformations = `w_${width},q_${quality},f_${format}`;
    urlParts.splice(uploadIndex + 1, 0, transformations);
    
    return urlParts.join('/');
  } catch (error) {
    console.warn('Error optimizing Cloudinary URL:', error);
    return url;
  }
};

/**
 * Optimizes image URLs for different use cases
 * @param {string} imageUrl - The original image URL
 * @param {string} useCase - The use case ('thumbnail', 'card', 'detail', 'hero')
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, useCase = 'card') => {
  if (!imageUrl) {
    return null;
  }

  // If it's not a Cloudinary URL, return as is
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  const optimizationConfigs = {
    thumbnail: {
      width: 300,
      quality: 'auto:low',
      format: 'auto'
    },
    card: {
      width: 800,
      quality: 'auto:good',
      format: 'auto'
    },
    detail: {
      width: 1200,
      quality: 'auto:good',
      format: 'auto'
    },
    hero: {
      width: 1600,
      quality: 'auto:good',
      format: 'auto'
    }
  };

  const config = optimizationConfigs[useCase] || optimizationConfigs.card;
  return optimizeCloudinaryUrl(imageUrl, config);
};

/**
 * Creates a responsive image URL with multiple sizes
 * @param {string} imageUrl - The original image URL
 * @returns {Object} - Object with different sized URLs
 */
export const getResponsiveImageUrls = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return {
      small: imageUrl,
      medium: imageUrl,
      large: imageUrl
    };
  }

  return {
    small: optimizeCloudinaryUrl(imageUrl, { width: 400, quality: 'auto:low' }),
    medium: optimizeCloudinaryUrl(imageUrl, { width: 800, quality: 'auto:good' }),
    large: optimizeCloudinaryUrl(imageUrl, { width: 1200, quality: 'auto:good' })
  };
};

/**
 * Checks if a URL is a Cloudinary URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a Cloudinary URL
 */
export const isCloudinaryUrl = (url) => {
  return url && typeof url === 'string' && url.includes('cloudinary.com');
};
