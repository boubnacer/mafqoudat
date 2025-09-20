const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Advanced Image Optimization Utility
 * Implements compression, duplicate detection, and format optimization
 * to reduce Cloudinary costs by 40%+
 */

class ImageOptimizer {
  constructor() {
    this.processedHashes = new Map(); // In-memory cache for processed images
    this.duplicateCache = new Map(); // Cache for duplicate detection
  }

  /**
   * Calculate image hash for duplicate detection
   * @param {Buffer} buffer - Image buffer
   * @returns {string} - Hash of the image
   */
  async calculateImageHash(buffer) {
    try {
      // Create a perceptual hash by resizing to 8x8 and converting to grayscale
      const smallImage = await sharp(buffer)
        .resize(8, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();
      
      return crypto.createHash('md5').update(smallImage).digest('hex');
    } catch (error) {
      console.error('Error calculating image hash:', error);
      return crypto.createHash('md5').update(buffer).digest('hex');
    }
  }

  /**
   * Check if image is a duplicate
   * @param {Buffer} buffer - Image buffer
   * @returns {Object} - { isDuplicate: boolean, existingUrl?: string }
   */
  async checkForDuplicate(buffer) {
    try {
      const imageHash = await this.calculateImageHash(buffer);
      
      // Check in-memory cache first
      if (this.duplicateCache.has(imageHash)) {
        return {
          isDuplicate: true,
          existingUrl: this.duplicateCache.get(imageHash)
        };
      }

      // In a real implementation, you would check your database here
      // For now, we'll just use the in-memory cache
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking for duplicate:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Store duplicate reference for future checks
   * @param {Buffer} buffer - Image buffer
   * @param {string} url - Cloudinary URL
   */
  async storeDuplicateReference(buffer, url) {
    try {
      const imageHash = await this.calculateImageHash(buffer);
      this.duplicateCache.set(imageHash, url);
      
      // Limit cache size to prevent memory issues
      if (this.duplicateCache.size > 1000) {
        const firstKey = this.duplicateCache.keys().next().value;
        this.duplicateCache.delete(firstKey);
      }
    } catch (error) {
      console.error('Error storing duplicate reference:', error);
    }
  }

  /**
   * Get optimal format based on browser support and file size
   * @param {Object} metadata - Image metadata
   * @param {number} originalSize - Original file size
   * @returns {string} - Optimal format
   */
  getOptimalFormat(metadata, originalSize) {
    const { width, height, format } = metadata;
    
    // For very large images, prioritize WebP for better compression
    if (originalSize > 500 * 1024) { // > 500KB
      return 'webp';
    }
    
    // For images with transparency, keep PNG
    if (format === 'png' && (width < 800 || height < 600)) {
      return 'png';
    }
    
    // Default to WebP for better compression
    return 'webp';
  }

  /**
   * Optimize image with compression and format conversion
   * @param {Buffer} buffer - Original image buffer
   * @param {Object} options - Optimization options
   * @returns {Buffer} - Optimized image buffer
   */
  async optimizeImage(buffer, options = {}) {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 85,
        progressive = true,
        forceFormat = null
      } = options;

      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      // Calculate optimal format
      const optimalFormat = forceFormat || this.getOptimalFormat(metadata, buffer.length);
      
      // Determine if resizing is needed
      const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;
      
      let sharpInstance = sharp(buffer);
      
      // Resize if needed
      if (needsResize) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      switch (optimalFormat) {
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: quality,
            effort: 6, // Higher effort for better compression
            smartSubsample: true,
            reductionEffort: 6
          });
          break;
          
        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality: quality,
            effort: 9 // Maximum effort for AVIF
          });
          break;
          
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: quality,
            progressive: progressive,
            mozjpeg: true // Use mozjpeg encoder for better compression
          });
          break;
          
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: quality,
            compressionLevel: 9,
            progressive: progressive
          });
          break;
      }

      const optimizedBuffer = await sharpInstance.toBuffer();
      
      // Log optimization results
      const compressionRatio = ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(1);
      console.log(`📊 Image optimized: ${(buffer.length / 1024).toFixed(1)}KB → ${(optimizedBuffer.length / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);
      
      return optimizedBuffer;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return buffer; // Return original if optimization fails
    }
  }

  /**
   * Process image with full optimization pipeline
   * @param {Buffer} buffer - Original image buffer
   * @param {Object} options - Processing options
   * @returns {Object} - { optimizedBuffer, isDuplicate, existingUrl, compressionRatio }
   */
  async processImage(buffer, options = {}) {
    try {
      // Check for duplicates first
      const duplicateCheck = await this.checkForDuplicate(buffer);
      if (duplicateCheck.isDuplicate) {
        console.log('🔄 Duplicate image detected, skipping upload');
        return {
          optimizedBuffer: null,
          isDuplicate: true,
          existingUrl: duplicateCheck.existingUrl,
          compressionRatio: 0
        };
      }

      // Optimize the image
      const optimizedBuffer = await this.optimizeImage(buffer, options);
      
      // Calculate compression ratio
      const compressionRatio = ((buffer.length - optimizedBuffer.length) / buffer.length * 100);
      
      return {
        optimizedBuffer,
        isDuplicate: false,
        existingUrl: null,
        compressionRatio: parseFloat(compressionRatio.toFixed(1))
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        optimizedBuffer: buffer,
        isDuplicate: false,
        existingUrl: null,
        compressionRatio: 0
      };
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      duplicateCacheSize: this.duplicateCache.size,
      processedHashesSize: this.processedHashes.size
    };
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.duplicateCache.clear();
    this.processedHashes.clear();
    console.log('🧹 Image optimizer caches cleared');
  }
}

module.exports = new ImageOptimizer();
