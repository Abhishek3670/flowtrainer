import express, { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { CacheService } from '../cache/redis';

// Import controller functions
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  executeWorkflow
} from '../controllers/workflowController';

const router: Router = express.Router();

// Get the singleton cache instance
const cache = CacheService.getInstance();

// --- Reusable Middleware for Cache Invalidation ---

/**
 * Middleware to invalidate all workflow-related cache entries.
 * It uses a wildcard to clear both the list and individual workflow caches.
 */
const invalidateWorkflowsCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cache.invalidate('GET:/api/workflows*');
    console.log('🧹 Cache invalidated for pattern: /api/workflows*');
  } catch (err) {
    // Log a warning but allow the request to proceed
    console.warn('⚠️ Workflow cache invalidation failed:', err);
  }
  next();
};


// --- CACHED ROUTES ---

// Cache the list of workflows for 60 seconds
router.get('/', cacheMiddleware(60), getWorkflows);

// Cache an individual workflow for 120 seconds
router.get('/:id', cacheMiddleware(120), getWorkflow);


// --- ROUTES WITH CACHE INVALIDATION ---

// Create a new workflow
router.post('/', invalidateWorkflowsCache, createWorkflow);

// Update an existing workflow
router.put('/:id', invalidateWorkflowsCache, updateWorkflow);

// Delete (archive) a workflow
router.delete('/:id', invalidateWorkflowsCache, deleteWorkflow);

// Duplicate a workflow
router.post('/:id/duplicate', invalidateWorkflowsCache, duplicateWorkflow);


// --- NON-CACHED ACTION ROUTES ---

// Execute a workflow - this action does not need to invalidate read-only caches
router.post('/:id/execute', executeWorkflow);

export default router;
