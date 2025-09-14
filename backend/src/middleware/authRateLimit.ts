import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '../utils/logger';

// Rate limit configuration for auth endpoints
const AUTH_RATE_LIMIT = {
  points: 5, // 5 requests
  duration: 15 * 60, // per 15 minutes per IP per endpoint
  blockDuration: 60 * 60, // Block for 1 hour if limit exceeded
};

// Create rate limiter for login attempts
const loginRateLimiter = new RateLimiterMemory({
  keyPrefix: 'login_fail',
  points: AUTH_RATE_LIMIT.points,
  duration: AUTH_RATE_LIMIT.duration,
  blockDuration: AUTH_RATE_LIMIT.blockDuration,
});

// Create rate limiter for registration
const registerRateLimiter = new RateLimiterMemory({
  keyPrefix: 'register',
  points: 3, // Stricter limit for registration
  duration: AUTH_RATE_LIMIT.duration,
  blockDuration: AUTH_RATE_LIMIT.blockDuration,
});

// Create rate limiter for token refresh
const refreshRateLimiter = new RateLimiterMemory({
  keyPrefix: 'refresh_token',
  points: 10, // Slightly higher limit for refresh
  duration: AUTH_RATE_LIMIT.duration,
  blockDuration: AUTH_RATE_LIMIT.blockDuration,
});

// Rate limiter middleware for login
const loginLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown-ip';
    await loginRateLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for login from IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'too_many_requests',
        message: 'Too many login attempts. Please try again later.',
      },
    });
  }
};

// Rate limiter middleware for registration
const registerLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown-ip';
    await registerRateLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for registration from IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'too_many_requests',
        message: 'Too many registration attempts. Please try again later.',
      },
    });
  }
};

// Rate limiter middleware for token refresh
const refreshTokenLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown-ip';
    await refreshRateLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for token refresh from IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'too_many_requests',
        message: 'Too many token refresh attempts. Please try again later.',
      },
    });
  }
};

export { loginLimiter, registerLimiter, refreshTokenLimiter };
