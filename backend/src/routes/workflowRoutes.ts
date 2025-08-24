import express, { Router, Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { CacheService } from '../cache/redis';
import { WorkflowController } from '../controllers';
import { AuthenticatedRequest } from '../types';

// Define type-safe request handler
type TypedRequestHandler<T> = (req: Request & T, res: Response, next: NextFunction) => Promise<void> | void;

const router: Router = express.Router();
const workflowController = new WorkflowController();
const cache = CacheService.getInstance();

// Apply authentication middleware to all routes
router.use(authenticate);

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

// Get all workflows (cached for 60 seconds)
router.get('/', cacheMiddleware(60), (req: AuthenticatedRequest, res) => {
  return workflowController.getWorkflows(req, res);
});

// Get single workflow (cached for 120 seconds)
router.get('/:id', cacheMiddleware(120), (req: AuthenticatedRequest, res) => {
  return workflowController.getWorkflow(req, res);
});

// Get workflow history
router.get('/:id/history', cacheMiddleware(60), (req: AuthenticatedRequest, res) => {
  return workflowController.getWorkflowHistory(req, res);
});

// --- ROUTES WITH CACHE INVALIDATION ---

// Create new workflow
router.post('/', invalidateWorkflowsCache, (req: AuthenticatedRequest, res) => {
  return workflowController.createWorkflow(req, res);
});

// Update workflow
router.put('/:id', invalidateWorkflowsCache, (req: AuthenticatedRequest, res) => {
  return workflowController.updateWorkflow(req, res);
});

// Delete workflow
router.delete('/:id', invalidateWorkflowsCache, (req: AuthenticatedRequest, res) => {
  return workflowController.deleteWorkflow(req, res);
});

// Duplicate workflow
router.post('/:id/duplicate', invalidateWorkflowsCache, (req: AuthenticatedRequest, res) => {
  return workflowController.duplicateWorkflow(req, res);
});

// --- NON-CACHED ACTION ROUTES ---

// Execute workflow - this action does not need to invalidate read-only caches
router.post('/:id/execute', (req: AuthenticatedRequest, res) => {
  return workflowController.executeWorkflow(req, res);
});

export default router;
