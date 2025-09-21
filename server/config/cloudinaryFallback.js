const cloudinary = require('cloudinary').v2;
const { cacheService } = require('./cache');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cache for Cloudinary URLs to avoid repeated transformations
const CLOUDINARY_CACHE_TTL = 3600; // 1 hour

// Fallback upload function without image optimization
const uploadToCloudinary = async (file, folder = 'mafqoudat', options = {}) => {
  try {
    // Generate cache key based on file hash or path
    const fileHash = file.path || file.buffer?.toString('base64').slice(0, 20);
    const cacheKey = `cloudinary:upload:${fileHash}:${folder}`;
    
    // Check cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log('📦 Cloudinary upload served from cache');
      return cachedResult;
    }

    // Default transformations for optimization
    const defaultTransformations = [
      { width: 800, height: 600, crop: 'limit' }, // Resize large images
      { quality: 'auto', fetch_format: 'auto' }, // Optimize quality and format
      { flags: 'progressive' } // Progressive JPEG for better loading
    ];

    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      transformation: options.transformations || defaultTransformations,
      ...options
    };

    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    
    const uploadResult = {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      compressionRatio: 0, // No compression in fallback mode
      isDuplicate: false
    };

    // Cache the result
    await cacheService.set(cacheKey, uploadResult, CLOUDINARY_CACHE_TTL);
    
    console.log('📤 Cloudinary upload completed (fallback mode), cached');
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// Delete image from Cloudinary with cache invalidation
const deleteFromCloudinary = async (public_id) => {
  try {
    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
      
      // Invalidate related cache entries
      await cacheService.invalidatePattern(`cloudinary:upload:*`);
      await cacheService.invalidatePattern(`cloudinary:transform:${public_id}:*`);
      
      console.log('🗑️ Cloudinary image deleted and cache invalidated');
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error for delete failures
  }
};

// Get optimized image URL with caching
const getOptimizedImageUrl = async (public_id, transformations = []) => {
  try {
    // Generate cache key for the transformation
    const transformKey = JSON.stringify(transformations);
    const cacheKey = `cloudinary:transform:${public_id}:${transformKey}`;
    
    // Check cache first
    const cachedUrl = await cacheService.get(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Generate optimized URL
    const optimizedUrl = cloudinary.url(public_id, {
      transformation: transformations,
      secure: true,
      quality: 'auto',
      fetch_format: 'auto'
    });

    // Cache the URL
    await cacheService.set(cacheKey, optimizedUrl, CLOUDINARY_CACHE_TTL);
    
    return optimizedUrl;
  } catch (error) {
    console.error('Cloudinary URL generation error:', error);
    return null;
  }
};

// Batch upload multiple images with caching
const batchUploadToCloudinary = async (files, folder = 'mafqoudat') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    
    console.log(`📤 Batch upload completed: ${results.length} images`);
    return results;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw new Error('Failed to batch upload images to Cloudinary');
  }
};

// Get Cloudinary usage statistics
const getCloudinaryStats = async () => {
  try {
    const cacheKey = 'cloudinary:stats';
    
    // Check cache first
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    // Get usage statistics from Cloudinary
    const stats = await cloudinary.api.usage();
    
    // Cache the stats for 1 hour
    await cacheService.set(cacheKey, stats, 3600);
    
    return stats;
  } catch (error) {
    console.error('Cloudinary stats error:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  batchUploadToCloudinary,
  getCloudinaryStats
};
