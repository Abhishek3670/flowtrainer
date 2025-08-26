import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../profiling/performance-monitor';

// Simple in-memory cache for performance optimization
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const requestCache = new Map<string, Promise<any>>();

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum cache entries

// Performance optimization middleware
export const performanceOptimization = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Generate cache key
  const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;
  
  // Check if request is already in progress (deduplication)
  if (requestCache.has(cacheKey)) {
    console.log(`🔄 Request deduplication: ${req.method} ${req.originalUrl}`);
    return requestCache.get(cacheKey)!.then(result => {
      res.json(result);
    });
  }
  
  // Check cache for GET requests
  if (req.method === 'GET' && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < cached.ttl) {
      console.log(`⚡ Cache hit: ${req.method} ${req.originalUrl}`);
      
      // Add cache headers
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Age', String(Math.floor((Date.now() - cached.timestamp) / 1000)));
      
      return res.json(cached.data);
    } else {
      // Expired cache entry
      cache.delete(cacheKey);
    }
  }
  
  // Create request promise for deduplication
  const requestPromise = new Promise((resolve) => {
    // Override res.json to cache responses
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode === 200 && req.method === 'GET') {
        cacheResponse(cacheKey, data);
      }
      
      // Add performance headers
      const duration = Date.now() - startTime;
      res.set('X-Response-Time', `${duration}ms`);
      res.set('X-Cache', 'MISS');
      
      // Record performance metrics
      performanceMonitor.recordRequest({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        memoryUsage: 0, // Will be calculated by performance middleware
        timestamp: new Date()
      });
      
      resolve(data);
      return originalJson.call(this, data);
    };
    
    next();
  });
  
  // Store request promise for deduplication
  requestCache.set(cacheKey, requestPromise);
  
  // Clean up request cache after completion
  requestPromise.finally(() => {
    requestCache.delete(cacheKey);
  });
  
  // Ensure next() is called
  return;
};

// Cache management functions
function cacheResponse(key: string, data: any, ttl: number = CACHE_TTL) {
  // Implement LRU eviction if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Cache cleanup function
export function cleanupCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
  }
}

// Cache statistics
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    utilization: Math.round((cache.size / MAX_CACHE_SIZE) * 100),
    requestCacheSize: requestCache.size
  };
}

// Clear cache
export function clearCache() {
  const size = cache.size;
  cache.clear();
  requestCache.clear();
  console.log(`🧹 Cache cleared: removed ${size} entries`);
}

// Cache middleware for specific routes
export const cacheMiddleware = (ttl: number = CACHE_TTL) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `${req.method}:${req.originalUrl}`;
    
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < ttl) {
        res.set('X-Cache', 'HIT');
        return res.json(cached.data);
      }
    }
    
    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cacheResponse(cacheKey, data, ttl);
      }
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };
    
    next();
    return;
  };
};

// Response compression middleware
export const responseCompression = (req: Request, res: Response, next: NextFunction) => {
  // Check if client supports compression
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    res.set('Content-Encoding', 'gzip');
    // Note: In production, use compression middleware
  }
  
  next();
};

// Request rate limiting (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  if (!requestCounts.has(clientId) || now > requestCounts.get(clientId)!.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
  } else {
    const current = requestCounts.get(clientId)!;
    current.count++;
    
    if (current.count > RATE_LIMIT) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
  }
  
  // Add rate limit headers
  const current = requestCounts.get(clientId)!;
  res.set('X-RateLimit-Limit', String(RATE_LIMIT));
  res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT - current.count)));
  res.set('X-RateLimit-Reset', String(current.resetTime));
  
  next();
  return;
};

// Start cache cleanup interval
setInterval(cleanupCache, 60 * 1000); // Every minute

export default performanceOptimization;
