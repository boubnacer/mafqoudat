const cloudinary = require('cloudinary').v2;
const { cacheService } = require('./cache');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cache for Cloudinary URLs
const CLOUDINARY_CACHE_TTL = 3600; // 1 hour

// Simple upload function without complex transformations
const uploadToCloudinary = async (file, folder = 'mafqoudat', options = {}) => {
  let tempFilePath = null;
  
  try {
    // Generate cache key
    const fileHash = file.path || file.buffer?.toString('base64').slice(0, 20);
    const cacheKey = `cloudinary:upload:${fileHash}:${folder}`;
    
    // Check cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log('📦 Cloudinary upload served from cache');
      return cachedResult;
    }

    // Simple upload options without complex transformations
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
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
      compressionRatio: 0, // No compression in simple mode
      isDuplicate: false
    };

    // Cache the result
    await cacheService.set(cacheKey, uploadResult, CLOUDINARY_CACHE_TTL);
    
    console.log('📤 Cloudinary upload completed (simple mode), cached');
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await require('fs').promises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError.message);
      }
    }
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (public_id) => {
  try {
    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
      
      // Invalidate related cache entries
      await cacheService.invalidatePattern(`cloudinary:upload:*`);
      
      console.log('🗑️ Cloudinary image deleted and cache invalidated');
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Get optimized image URL
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
      quality: 'auto'
    });

    // Cache the URL
    await cacheService.set(cacheKey, optimizedUrl, CLOUDINARY_CACHE_TTL);
    
    return optimizedUrl;
  } catch (error) {
    console.error('Cloudinary URL generation error:', error);
    return null;
  }
};

// Batch upload
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

// Get Cloudinary stats
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
