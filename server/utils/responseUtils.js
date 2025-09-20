/**
 * Response Utilities for API Optimization
 * 
 * Features:
 * - Field projection and selection
 * - Response data optimization
 * - Payload compression
 * - Smart data transformation
 */

const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Parse field selection from query parameters
 * @param {string} fieldQuery - Field selection query string
 * @param {object} defaultFields - Default field configuration
 * @returns {object} Parsed field selection
 */
function parseFieldSelection(fieldQuery, defaultFields = {}) {
  if (!fieldQuery) {
    return defaultFields;
  }
  
  const selectedFields = {};
  const fields = fieldQuery.split(',').map(field => field.trim());
  
  for (const field of fields) {
    // Handle nested field selection (e.g., "user.id,user.username")
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!selectedFields[parent]) {
        selectedFields[parent] = {};
      }
      selectedFields[parent][child] = true;
    } else {
      selectedFields[field] = true;
    }
  }
  
  return selectedFields;
}

/**
 * Optimize response data by removing unnecessary fields and data
 * @param {any} data - Response data to optimize
 * @param {object} options - Optimization options
 * @returns {any} Optimized data
 */
function optimizeResponseData(data, options = {}) {
  const {
    removeNullFields = true,
    removeEmptyArrays = false,
    removeEmptyObjects = false,
    compressNestedData = true,
    maxNestingLevel = 3,
    selectedFields = null
  } = options;
  
  if (!data) return data;
  
  // Apply field projection if specified
  if (selectedFields) {
    data = applyFieldProjection(data, selectedFields);
  }
  
  // Recursively optimize data structure
  return optimizeDataStructure(data, {
    removeNullFields,
    removeEmptyArrays,
    removeEmptyObjects,
    compressNestedData,
    maxNestingLevel,
    currentLevel: 0
  });
}

/**
 * Apply field projection to data based on selected fields
 * @param {any} data - Data to project
 * @param {object} selectedFields - Field selection configuration
 * @returns {any} Projected data
 */
function applyFieldProjection(data, selectedFields) {
  if (Array.isArray(data)) {
    return data.map(item => applyFieldProjection(item, selectedFields));
  }
  
  if (typeof data === 'object' && data !== null) {
    const projected = {};
    
    for (const [field, config] of Object.entries(selectedFields)) {
      if (data[field] !== undefined) {
        if (typeof config === 'object' && config.fields) {
          // Handle nested field projection
          projected[field] = applyFieldProjection(data[field], config.fields);
        } else if (config === true) {
          // Include field as-is
          projected[field] = data[field];
        }
      }
    }
    
    return projected;
  }
  
  return data;
}

/**
 * Recursively optimize data structure
 * @param {any} data - Data to optimize
 * @param {object} options - Optimization options
 * @returns {any} Optimized data
 */
function optimizeDataStructure(data, options) {
  const {
    removeNullFields,
    removeEmptyArrays,
    removeEmptyObjects,
    compressNestedData,
    maxNestingLevel,
    currentLevel
  } = options;
  
  // Prevent infinite recursion
  if (currentLevel >= maxNestingLevel) {
    return data;
  }
  
  if (Array.isArray(data)) {
    const optimizedArray = data
      .map(item => optimizeDataStructure(item, { ...options, currentLevel: currentLevel + 1 }))
      .filter(item => {
        if (removeNullFields && item === null) return false;
        if (removeEmptyArrays && Array.isArray(item) && item.length === 0) return false;
        if (removeEmptyObjects && typeof item === 'object' && item !== null && Object.keys(item).length === 0) return false;
        return true;
      });
    
    return optimizedArray;
  }
  
  if (typeof data === 'object' && data !== null) {
    const optimized = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip null fields if configured
      if (removeNullFields && value === null) {
        continue;
      }
      
      // Skip empty arrays if configured
      if (removeEmptyArrays && Array.isArray(value) && value.length === 0) {
        continue;
      }
      
      // Skip empty objects if configured
      if (removeEmptyObjects && typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
        continue;
      }
      
      // Recursively optimize nested data
      optimized[key] = optimizeDataStructure(value, { ...options, currentLevel: currentLevel + 1 });
    }
    
    return optimized;
  }
  
  return data;
}

/**
 * Compress response data using gzip
 * @param {any} data - Data to compress
 * @param {object} options - Compression options
 * @returns {Promise<object>} Compressed data with metadata
 */
async function compressResponse(data, options = {}) {
  const {
    threshold = 1024,
    compressionLevel = 6
  } = options;
  
  try {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length <= threshold) {
      return {
        compressed: false,
        data: jsonString,
        originalSize: jsonString.length,
        compressedSize: jsonString.length,
        compressionRatio: 0
      };
    }
    
    const compressed = await gzip(jsonString, { level: compressionLevel });
    
    return {
      compressed: true,
      data: compressed,
      originalSize: jsonString.length,
      compressedSize: compressed.length,
      compressionRatio: ((jsonString.length - compressed.length) / jsonString.length * 100).toFixed(2)
    };
  } catch (error) {
    console.error('Compression error:', error);
    return {
      compressed: false,
      data: JSON.stringify(data),
      originalSize: JSON.stringify(data).length,
      compressedSize: JSON.stringify(data).length,
      compressionRatio: 0,
      error: error.message
    };
  }
}

/**
 * Decompress response data
 * @param {Buffer} compressedData - Compressed data
 * @returns {Promise<any>} Decompressed data
 */
async function decompressResponse(compressedData) {
  try {
    const decompressed = await gunzip(compressedData);
    return JSON.parse(decompressed.toString());
  } catch (error) {
    console.error('Decompression error:', error);
    throw error;
  }
}

/**
 * Calculate response size metrics
 * @param {any} data - Response data
 * @returns {object} Size metrics
 */
function calculateResponseMetrics(data) {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
  
  return {
    sizeInBytes,
    sizeInKB: (sizeInBytes / 1024).toFixed(2),
    sizeInMB: (sizeInBytes / (1024 * 1024)).toFixed(2),
    characterCount: jsonString.length,
    estimatedTransmissionTime: {
      '3G': `${(sizeInBytes / (150 * 1024)).toFixed(2)}s`, // 150KB/s
      '4G': `${(sizeInBytes / (1 * 1024 * 1024)).toFixed(2)}s`, // 1MB/s
      'WiFi': `${(sizeInBytes / (10 * 1024 * 1024)).toFixed(2)}s` // 10MB/s
    }
  };
}

/**
 * Optimize posts response specifically
 * @param {object} postsResponse - Posts API response
 * @param {object} options - Optimization options
 * @returns {object} Optimized posts response
 */
function optimizePostsResponse(postsResponse, options = {}) {
  const {
    removeDebugInfo = true,
    optimizeImages = true,
    compressUserData = true,
    limitDescriptionLength = 200
  } = options;
  
  if (!postsResponse || !postsResponse.postsWithUser) {
    return postsResponse;
  }
  
  const optimizedPosts = postsResponse.postsWithUser.map(post => {
    const optimized = { ...post };
    
    // Remove debug information
    if (removeDebugInfo && optimized.cityDebug) {
      delete optimized.cityDebug;
    }
    
    // Optimize image URLs
    if (optimizeImages && optimized.image) {
      // Add image optimization parameters if it's a Cloudinary URL
      if (optimized.image.includes('cloudinary.com')) {
        optimized.image = optimizeImageUrl(optimized.image);
      }
    }
    
    // Compress user data
    if (compressUserData && optimized.username) {
      optimized.user = {
        username: optimized.username
      };
      delete optimized.username;
    }
    
    // Limit description length for list views
    if (limitDescriptionLength && optimized.description) {
      if (optimized.description.length > limitDescriptionLength) {
        optimized.description = optimized.description.substring(0, limitDescriptionLength) + '...';
        optimized.descriptionTruncated = true;
      }
    }
    
    // Remove unnecessary nested data
    if (optimized.cityLabels && optimized.city) {
      delete optimized.cityLabels; // Already included in city object
    }
    
    if (optimized.countryLabels && optimized.country) {
      delete optimized.countryLabels; // Already included in country object
    }
    
    return optimized;
  });
  
  return {
    ...postsResponse,
    postsWithUser: optimizedPosts,
    _optimized: {
      timestamp: new Date().toISOString(),
      optimizations: {
        removeDebugInfo,
        optimizeImages,
        compressUserData,
        limitDescriptionLength
      }
    }
  };
}

/**
 * Optimize image URL for better performance
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized image URL
 */
function optimizeImageUrl(imageUrl) {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  // Add Cloudinary optimization parameters
  const url = new URL(imageUrl);
  
  // Add format optimization (auto-format)
  if (!url.searchParams.has('f_auto')) {
    url.searchParams.set('f_auto', '');
  }
  
  // Add quality optimization
  if (!url.searchParams.has('q_auto')) {
    url.searchParams.set('q_auto', '');
  }
  
  // Add responsive images
  if (!url.searchParams.has('w_auto')) {
    url.searchParams.set('w_auto', '');
  }
  
  return url.toString();
}

/**
 * Generate response metadata
 * @param {any} data - Response data
 * @param {object} options - Metadata options
 * @returns {object} Response metadata
 */
function generateResponseMetadata(data, options = {}) {
  const {
    includeMetrics = true,
    includeOptimizationInfo = true,
    includePaginationInfo = true
  } = options;
  
  const metadata = {
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  if (includeMetrics) {
    metadata.metrics = calculateResponseMetrics(data);
  }
  
  if (includeOptimizationInfo) {
    metadata.optimization = {
      enabled: true,
      fieldProjection: true,
      payloadOptimization: true,
      compression: true
    };
  }
  
  if (includePaginationInfo && data.page && data.totalPages) {
    metadata.pagination = {
      page: data.page,
      totalPages: data.totalPages,
      total: data.total,
      hasNext: data.page < data.totalPages,
      hasPrevious: data.page > 1
    };
  }
  
  return metadata;
}

module.exports = {
  parseFieldSelection,
  optimizeResponseData,
  applyFieldProjection,
  optimizeDataStructure,
  compressResponse,
  decompressResponse,
  calculateResponseMetrics,
  optimizePostsResponse,
  optimizeImageUrl,
  generateResponseMetadata
};
