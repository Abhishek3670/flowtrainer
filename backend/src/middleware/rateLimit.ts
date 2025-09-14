import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { CacheService } from '../cache/redis';
import logger from '../utils/logger';

// Rate limit configuration
const RATE_LIMIT_POINTS = 100; // Number of points
const RATE_LIMIT_DURATION = 60; // Per 60 seconds

// Create and export rate limiter instance
export let rateLimiter: RateLimiterMemory;

// Initialize rate limiter
const initRateLimiter = async () => {
  try {
    // Using in-memory rate limiter for now
    // We can switch to Redis later if distributed rate limiting is needed
    rateLimiter = new RateLimiterMemory({
      keyPrefix: 'rate_limit',
      points: RATE_LIMIT_POINTS,
      duration: RATE_LIMIT_DURATION,
      blockDuration: 60 * 15, // Block for 15 minutes if limit is exceeded
    });
    
    logger.info('Rate limiter initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize rate limiter:', error);
    throw error;
  }
};

// Middleware to rate limit requests
const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for certain paths (e.g., health checks)
  if (req.path === '/api/health') {
    return next();
  }

  try {
    // Use IP address as the rate limiter key
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Consume 1 point per request
    const rateLimitRes = await rateLimiter.consume(clientIp, 1);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT_POINTS,
      'X-RateLimit-Remaining': rateLimitRes.remainingPoints,
      'X-RateLimit-Reset': Math.ceil(rateLimitRes.msBeforeNext / 1000)
    });
    
    next();
  } catch (error) {
    // Rate limit exceeded
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
};

// Admin-specific rate limiting (more lenient)
const adminRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for certain paths
  if (req.path === '/api/health') {
    return next();
  }

  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Admin endpoints have higher limits (5x the normal limit)
    // Only consume 1/5 of a point per request
    const rateLimitRes = await rateLimiter.consume(clientIp, 0.2);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT_POINTS * 5, // 5x higher limit for admin
      'X-RateLimit-Remaining': Math.floor(rateLimitRes.remainingPoints * 5),
      'X-RateLimit-Reset': Math.ceil(rateLimitRes.msBeforeNext / 1000)
    });
    
    next();
  } catch (error) {
    // Rate limit exceeded for admin endpoint
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for admin endpoint. Please try again later.'
    });
  }
};

export { initRateLimiter, rateLimiterMiddleware, adminRateLimiter };
