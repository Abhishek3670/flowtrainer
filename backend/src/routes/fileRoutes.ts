import express, { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { CacheService } from '../cache/redis';

// Import controller functions
import {
  uploadVideo,
  getFiles,
  getFile,
  deleteFile,
  serveVideo
} from '../controllers/fileController';

const router: Router = express.Router();

// Get the singleton cache instance
const cache = CacheService.getInstance();

// --- CACHED ROUTES ---

// Cache file listings for 120 seconds
router.get('/', cacheMiddleware(120), getFiles);

// Cache individual file metadata for 300 seconds (5 min)
router.get('/:id', cacheMiddleware(300), getFile);

// --- ROUTES WITH CACHE INVALIDATION ---

// Middleware for POST: Invalidate file listings cache before uploading
const invalidateListingsMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Invalidate the general file list cache
    await cache.invalidate('GET:/api/files');
    console.log('🧹 Cache invalidated: file listings');
  } catch (err) {
    // Log a warning but don't block the request if invalidation fails
    console.warn('⚠️ Cache invalidation failed for file listings:', err);
  }
  next();
};

router.post('/', invalidateListingsMiddleware, uploadVideo);

// Middleware for DELETE: Invalidate all related file caches before deleting
const invalidateAllFilesMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use a wildcard to clear the list and individual file caches
    await cache.invalidate('GET:/api/files*');
    console.log(`🧹 Cache invalidated for pattern: /api/files*`);
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed for all files:', err);
  }
  next();
};

router.delete('/:id', invalidateAllFilesMiddleware, deleteFile);


// --- NON-CACHED ROUTES ---

// Video streaming should never be cached
router.get('/:id/stream', serveVideo);

export default router;
