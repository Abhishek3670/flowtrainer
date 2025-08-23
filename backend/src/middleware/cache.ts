// backend/src/middleware/cache.ts

import { Request, Response, NextFunction, RequestHandler } from "express";
import { CacheService } from "../cache/redis";

const cache = CacheService.getInstance();

/**
 * Caching middleware factory
 * @param ttlSeconds Time to live in seconds
 */
export function cacheMiddleware(ttlSeconds: number): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `${req.method}:${req.originalUrl}`;

    try {
      // Attempt cache read
      const cached = await cache.get<string>(key);
      if (cached) {
        console.log(`🗄️ Cache hit: ${key}`);
        res.setHeader("X-Cache", "HIT");
        res.type("application/json").send(cached);
        return;
      }

      console.log(`🆕 Cache miss: ${key}`);
      res.setHeader("X-Cache", "MISS");

      // Intercept send
      const originalSend = res.send.bind(res);
      res.send = (body?: any): Response => {
        const contentType = res.getHeader("Content-Type");
        if (contentType && contentType.toString().includes("application/json") && body) {
          const str = typeof body === "string" ? body : JSON.stringify(body);
          cache.set(key, str, ttlSeconds)
            .catch(err => console.error("⚠️ Error caching response:", err));
        }
        return originalSend(body);
      };

      next();
    } catch (err) {
      console.error("⚠️ Cache middleware error:", err);
      next();
    }
  };
}
