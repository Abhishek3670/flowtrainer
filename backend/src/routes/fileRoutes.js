// backend/src/routes/fileRoutes.js

const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { CacheService } = require('../cache/redis');

// Import controller functions
const {
  uploadVideo,
  getFiles,
  getFile,
  deleteFile,
  serveVideo
} = require('../controllers/fileController');

// Get cache instance
const cache = CacheService.getInstance();

// === CACHED ROUTES ===

// Cache file listings for 120 seconds
router.get('/', cacheMiddleware(120), getFiles);

// Cache individual file metadata for 300 seconds (5 min)
router.get('/:id', cacheMiddleware(300), getFile);

// === ROUTES WITH CACHE INVALIDATION ===

// Upload file - invalidate file listings cache
router.post('/', async (req, res, next) => {
  try {
    await cache.invalidate('GET:/api/files');
    console.log('🧹 Cache invalidated: file listings');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
}, uploadVideo);

// Delete file - invalidate cache
router.delete('/:id', async (req, res, next) => {
  try {
    await cache.invalidate('GET:/api/files*');
    console.log('🧹 Cache invalidated: files');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
}, deleteFile);

// === NON-CACHED ROUTES ===

// Video streaming - never cache
router.get('/:id/stream', serveVideo);

module.exports = router;
