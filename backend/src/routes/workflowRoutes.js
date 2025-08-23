// backend/src/routes/workflowRoutes.js

const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { CacheService } = require('../cache/redis');

// Import the controller properly
const {
  getWorkflows,
  getWorkflow, 
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  executeWorkflow
} = require('../controllers/workflowController');

// Get cache instance for manual invalidation
const cache = CacheService.getInstance();

// === CACHED ROUTES ===

// Cache GET /api/workflows for 60 seconds
router.get('/', cacheMiddleware(60), getWorkflows);

// Cache individual workflow for 120 seconds
router.get('/:id', cacheMiddleware(120), getWorkflow);

// === ROUTES WITH CACHE INVALIDATION ===

// Create workflow - invalidate cache
router.post('/', async (req, res, next) => {
  try {
    await cache.invalidate('GET:/api/workflows*');
    console.log('🧹 Cache invalidated: workflows');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
}, createWorkflow);

// Update workflow - invalidate cache
router.put('/:id', async (req, res, next) => {
  try {
    await cache.invalidate('GET:/api/workflows*');
    console.log('🧹 Cache invalidated: workflows');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
}, updateWorkflow);

// Delete workflow - invalidate cache
router.delete('/:id', async (req, res, next) => {
  try {
    await cache.invalidate('GET:/api/workflows*');
    console.log('🧹 Cache invalidated: workflows');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
}, deleteWorkflow);

// Duplicate workflow - invalidate cache
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    await cache.invalidate('GET:/api/workflows*');
    console.log('🧹 Cache invalidated: workflows');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
}, duplicateWorkflow);

// Execute workflow - no cache invalidation needed
router.post('/:id/execute', executeWorkflow);

module.exports = router;
