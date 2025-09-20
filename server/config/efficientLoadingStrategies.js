const mongoose = require('mongoose');

/**
 * Efficient Loading Strategies
 * 
 * This system provides:
 * - Lazy loading for large datasets
 * - Pagination and streaming for massive data
 * - Background preloading
 * - Memory-efficient data structures
 * - Optimized database queries
 * - Progressive loading for better UX
 */

class EfficientLoadingStrategies {
  constructor() {
    this.preloadQueue = [];
    this.preloadInProgress = false;
    this.loadingStats = {
      totalLoaded: 0,
      preloadCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgLoadTime: 0
    };
    
    // Configuration
    this.config = {
      // Batch sizes for different operations
      batchSizes: {
        countries: 1000,      // Load all countries at once (small dataset)
        categories: 500,      // Load all categories at once (small dataset)
        foundlost: 100,       // Load all found/lost options at once (tiny dataset)
        cities: 10000         // Load cities in batches (large dataset)
      },
      
      // Preload strategies
      preloadStrategies: {
        immediate: ['countries', 'categories', 'foundlost'], // Load immediately
        lazy: ['cities'],                                     // Load on demand
        background: ['cities']                                // Preload in background
      },
      
      // Memory limits
      memoryLimits: {
        maxCitiesInMemory: 50000,  // Maximum cities to keep in memory
        maxCacheSize: 100000       // Maximum total cache size
      },
      
      // Streaming configuration
      streaming: {
        chunkSize: 1000,           // Items per chunk
        maxConcurrent: 3,          // Max concurrent streams
        timeout: 30000             // 30 seconds timeout
      }
    };
  }

  // Initialize loading strategies
  async initialize() {
    console.log('🚀 Initializing Efficient Loading Strategies...');
    
    try {
      // Start background preloading
      this.startBackgroundPreloading();
      
      // Initialize loading stats
      this.resetLoadingStats();
      
      console.log('✅ Efficient Loading Strategies initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Efficient Loading Strategies:', error);
      throw error;
    }
  }

  // Load data with optimized strategy based on data type and size
  async loadDataOptimized(dataType, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`📦 Loading ${dataType} with optimized strategy...`);
      
      let data;
      
      switch (dataType) {
        case 'countries':
          data = await this.loadCountriesOptimized(options);
          break;
        case 'categories':
          data = await this.loadCategoriesOptimized(options);
          break;
        case 'foundlost':
          data = await this.loadFoundLostOptimized(options);
          break;
        case 'cities':
          data = await this.loadCitiesOptimized(options);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      const loadTime = Date.now() - startTime;
      this.updateLoadingStats(dataType, true, loadTime, data.length);
      
      console.log(`✅ Loaded ${data.length} ${dataType} in ${loadTime}ms`);
      return data;
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      this.updateLoadingStats(dataType, false, loadTime, 0);
      console.error(`❌ Failed to load ${dataType}:`, error);
      throw error;
    }
  }

  // Load countries with optimization
  async loadCountriesOptimized(options = {}) {
    const Country = require('../models/Country');
    
    // Use lean queries for better performance
    const query = Country.find({ isActive: true })
      .select('_id code labels names flag isActive searchTerms')
      .sort({ 'labels.en': 1 })
      .lean();
    
    // Apply filters
    if (options.search) {
      query.where({
        $or: [
          { code: { $regex: options.search, $options: 'i' } },
          { 'labels.en': { $regex: options.search, $options: 'i' } },
          { 'labels.fr': { $regex: options.search, $options: 'i' } },
          { 'labels.ar': { $regex: options.search, $options: 'i' } },
          { searchTerms: { $regex: options.search, $options: 'i' } }
        ]
      });
    }
    
    return await query.exec();
  }

  // Load categories with optimization
  async loadCategoriesOptimized(options = {}) {
    const Category = require('../models/Category');
    
    const query = Category.find({ isActive: true })
      .select('_id code labels color icon isActive description priority')
      .sort({ priority: -1, 'labels.en': 1 })
      .lean();
    
    if (options.search) {
      query.where({
        $or: [
          { code: { $regex: options.search, $options: 'i' } },
          { 'labels.en': { $regex: options.search, $options: 'i' } },
          { 'labels.fr': { $regex: options.search, $options: 'i' } },
          { 'labels.ar': { $regex: options.search, $options: 'i' } }
        ]
      });
    }
    
    return await query.exec();
  }

  // Load found/lost options with optimization
  async loadFoundLostOptimized(options = {}) {
    const FoundLost = require('../models/FoundLost');
    
    const query = FoundLost.find({ isActive: true })
      .select('_id code labels color icon isActive description')
      .sort({ code: 1 })
      .lean();
    
    return await query.exec();
  }

  // Load cities with optimization (supports streaming for large datasets)
  async loadCitiesOptimized(options = {}) {
    const City = require('../models/City');
    const Country = require('../models/Country');
    
    // Build base query
    let query = City.find({ isActive: true })
      .select('_id code labels isCapital isActive country isDynamic searchTerms')
      .populate('country', '_id code labels flag')
      .sort({ 'labels.en': 1 });
    
    // Apply filters
    if (options.countryId) {
      query.where({ country: options.countryId });
    }
    
    if (options.search) {
      query.where({
        $or: [
          { code: { $regex: options.search, $options: 'i' } },
          { 'labels.en': { $regex: options.search, $options: 'i' } },
          { 'labels.fr': { $regex: options.search, $options: 'i' } },
          { 'labels.ar': { $regex: options.search, $options: 'i' } },
          { searchTerms: { $regex: options.search, $options: 'i' } }
        ]
      });
    }
    
    // Check if we need streaming for large datasets
    const count = await City.countDocuments(query.getQuery());
    
    if (count > this.config.memoryLimits.maxCitiesInMemory) {
      console.log(`📊 Large dataset detected (${count} cities), using streaming strategy`);
      return await this.streamCities(query, options);
    }
    
    // Use regular loading for smaller datasets
    return await query.lean().exec();
  }

  // Stream cities for large datasets
  async streamCities(baseQuery, options = {}) {
    const City = require('../models/City');
    
    const batchSize = this.config.batchSizes.cities;
    const maxItems = options.limit || this.config.memoryLimits.maxCitiesInMemory;
    
    let allCities = [];
    let skip = 0;
    
    while (allCities.length < maxItems) {
      const batch = await baseQuery
        .clone()
        .skip(skip)
        .limit(Math.min(batchSize, maxItems - allCities.length))
        .lean()
        .exec();
      
      if (batch.length === 0) {
        break; // No more data
      }
      
      allCities = allCities.concat(batch);
      skip += batch.length;
      
      // Add small delay to prevent overwhelming the database
      if (batch.length === batchSize) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`📦 Streamed ${allCities.length} cities in ${Math.ceil(allCities.length / batchSize)} batches`);
    return allCities;
  }

  // Background preloading for frequently accessed data
  async startBackgroundPreloading() {
    console.log('🔄 Starting background preloading...');
    
    // Preload immediate data types
    const immediateTypes = this.config.preloadStrategies.immediate;
    
    for (const dataType of immediateTypes) {
      this.schedulePreload(dataType, 'immediate');
    }
    
    // Schedule background preloading for lazy types
    const backgroundTypes = this.config.preloadStrategies.background;
    
    for (const dataType of backgroundTypes) {
      this.schedulePreload(dataType, 'background');
    }
  }

  // Schedule preload for a data type
  schedulePreload(dataType, strategy) {
    const preloadTask = {
      dataType,
      strategy,
      scheduledAt: new Date(),
      priority: strategy === 'immediate' ? 1 : 2
    };
    
    this.preloadQueue.push(preloadTask);
    
    if (!this.preloadInProgress) {
      this.processPreloadQueue();
    }
  }

  // Process preload queue
  async processPreloadQueue() {
    if (this.preloadInProgress || this.preloadQueue.length === 0) {
      return;
    }
    
    this.preloadInProgress = true;
    
    try {
      // Sort by priority (immediate first)
      this.preloadQueue.sort((a, b) => a.priority - b.priority);
      
      while (this.preloadQueue.length > 0) {
        const task = this.preloadQueue.shift();
        
        try {
          console.log(`🔄 Preloading ${task.dataType} (${task.strategy})...`);
          
          const data = await this.loadDataOptimized(task.dataType);
          
          // Store in cache (this would integrate with your cache system)
          console.log(`✅ Preloaded ${data.length} ${task.dataType} items`);
          
          this.loadingStats.preloadCount++;
          
          // Add delay between preloads to prevent overwhelming the system
          if (task.strategy === 'background') {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Preload failed for ${task.dataType}:`, error);
          
          // Retry with lower priority
          if (task.retryCount === undefined) {
            task.retryCount = 1;
            task.priority = 3; // Lower priority for retries
            this.preloadQueue.push(task);
          }
        }
      }
      
    } finally {
      this.preloadInProgress = false;
    }
  }

  // Lazy loading for on-demand data
  async loadLazyData(dataType, key, options = {}) {
    try {
      // Check if data is already cached
      const cached = this.getFromCache(dataType, key);
      if (cached) {
        this.loadingStats.cacheHits++;
        return cached;
      }
      
      this.loadingStats.cacheMisses++;
      
      // Load data on demand
      const data = await this.loadDataOptimized(dataType, { ...options, key });
      
      // Cache the result
      this.setInCache(dataType, key, data);
      
      return data;
      
    } catch (error) {
      console.error(`❌ Lazy loading failed for ${dataType}:${key}:`, error);
      throw error;
    }
  }

  // Progressive loading for better UX
  async loadProgressiveData(dataType, options = {}) {
    const stream = new ReadableStream({
      start(controller) {
        this.loadProgressiveChunks(dataType, options, controller);
      }
    });
    
    return stream;
  }

  // Load data in progressive chunks
  async loadProgressiveChunks(dataType, options, controller) {
    try {
      const chunkSize = this.config.streaming.chunkSize;
      let skip = 0;
      let hasMore = true;
      
      while (hasMore) {
        const chunk = await this.loadDataOptimized(dataType, {
          ...options,
          limit: chunkSize,
          skip
        });
        
        if (chunk.length === 0) {
          hasMore = false;
        } else {
          controller.enqueue(chunk);
          skip += chunk.length;
          
          // Check if we've reached the limit
          if (options.limit && skip >= options.limit) {
            hasMore = false;
          }
        }
      }
      
      controller.close();
      
    } catch (error) {
      controller.error(error);
    }
  }

  // Memory-efficient data structures
  createOptimizedDataStructure(dataType, data) {
    switch (dataType) {
      case 'countries':
        return this.createCountryMaps(data);
      case 'categories':
        return this.createCategoryMaps(data);
      case 'foundlost':
        return this.createFoundLostMaps(data);
      case 'cities':
        return this.createCityMaps(data);
      default:
        return data;
    }
  }

  // Create optimized maps for countries
  createCountryMaps(countries) {
    const maps = {
      byId: new Map(),
      byCode: new Map(),
      bySearchTerm: new Map(),
      sorted: countries.sort((a, b) => a.labels?.en?.localeCompare(b.labels?.en))
    };
    
    countries.forEach(country => {
      maps.byId.set(country._id.toString(), country);
      maps.byCode.set(country.code.toUpperCase(), country);
      
      // Index by search terms
      if (country.searchTerms) {
        country.searchTerms.forEach(term => {
          if (!maps.bySearchTerm.has(term.toLowerCase())) {
            maps.bySearchTerm.set(term.toLowerCase(), []);
          }
          maps.bySearchTerm.get(term.toLowerCase()).push(country);
        });
      }
    });
    
    return maps;
  }

  // Create optimized maps for categories
  createCategoryMaps(categories) {
    const maps = {
      byId: new Map(),
      byCode: new Map(),
      byPriority: new Map(),
      sorted: categories.sort((a, b) => {
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.labels?.en?.localeCompare(b.labels?.en);
      })
    };
    
    categories.forEach(category => {
      maps.byId.set(category._id.toString(), category);
      maps.byCode.set(category.code.toUpperCase(), category);
      
      const priority = category.priority || 0;
      if (!maps.byPriority.has(priority)) {
        maps.byPriority.set(priority, []);
      }
      maps.byPriority.get(priority).push(category);
    });
    
    return maps;
  }

  // Create optimized maps for found/lost options
  createFoundLostMaps(options) {
    const maps = {
      byId: new Map(),
      byCode: new Map(),
      sorted: options.sort((a, b) => a.code.localeCompare(b.code))
    };
    
    options.forEach(option => {
      maps.byId.set(option._id.toString(), option);
      maps.byCode.set(option.code.toUpperCase(), option);
    });
    
    return maps;
  }

  // Create optimized maps for cities
  createCityMaps(cities) {
    const maps = {
      byId: new Map(),
      byCountry: new Map(),
      bySearchTerm: new Map(),
      sorted: cities.sort((a, b) => a.labels?.en?.localeCompare(b.labels?.en))
    };
    
    cities.forEach(city => {
      maps.byId.set(city._id.toString(), city);
      
      // Index by country
      if (city.country && city.country._id) {
        const countryId = city.country._id.toString();
        if (!maps.byCountry.has(countryId)) {
          maps.byCountry.set(countryId, []);
        }
        maps.byCountry.get(countryId).push(city);
      }
      
      // Index by search terms
      if (city.searchTerms) {
        city.searchTerms.forEach(term => {
          if (!maps.bySearchTerm.has(term.toLowerCase())) {
            maps.bySearchTerm.set(term.toLowerCase(), []);
          }
          maps.bySearchTerm.get(term.toLowerCase()).push(city);
        });
      }
    });
    
    return maps;
  }

  // Cache management (simplified - would integrate with your cache system)
  getFromCache(dataType, key) {
    // This would integrate with your actual cache system
    return null;
  }

  setInCache(dataType, key, data) {
    // This would integrate with your actual cache system
    // For now, just log the operation
    console.log(`📦 Cached ${dataType}:${key} (${data.length} items)`);
  }

  // Update loading statistics
  updateLoadingStats(dataType, success, loadTime, itemCount) {
    this.loadingStats.totalLoaded += itemCount;
    
    if (success) {
      // Update average load time
      if (this.loadingStats.avgLoadTime === 0) {
        this.loadingStats.avgLoadTime = loadTime;
      } else {
        this.loadingStats.avgLoadTime = (this.loadingStats.avgLoadTime + loadTime) / 2;
      }
    }
  }

  // Reset loading statistics
  resetLoadingStats() {
    this.loadingStats = {
      totalLoaded: 0,
      preloadCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgLoadTime: 0
    };
  }

  // Get loading statistics
  getLoadingStats() {
    return {
      ...this.loadingStats,
      cacheHitRate: this.loadingStats.cacheHits + this.loadingStats.cacheMisses > 0 
        ? (this.loadingStats.cacheHits / (this.loadingStats.cacheHits + this.loadingStats.cacheMisses)) * 100 
        : 0,
      preloadQueueSize: this.preloadQueue.length,
      preloadInProgress: this.preloadInProgress
    };
  }

  // Health check
  isHealthy() {
    return this.preloadQueue.length < 100 && !this.preloadInProgress;
  }

  // Shutdown
  async shutdown() {
    console.log('🔌 Shutting down Efficient Loading Strategies...');
    
    // Clear preload queue
    this.preloadQueue = [];
    this.preloadInProgress = false;
    
    console.log('✅ Efficient Loading Strategies shutdown complete');
  }
}

// Create singleton instance
const efficientLoadingStrategies = new EfficientLoadingStrategies();

module.exports = {
  efficientLoadingStrategies,
  initializeEfficientLoading: () => efficientLoadingStrategies.initialize(),
  getEfficientLoading: () => efficientLoadingStrategies
};
