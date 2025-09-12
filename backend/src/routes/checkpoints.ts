/**
 * Checkpoint Management Routes
 * 
 * This module provides RESTful API endpoints for managing workflow checkpoints.
 * Checkpoints allow users to save and restore workflow states at different points
 * in time, enabling version control and recovery capabilities.
 * 
 * Endpoints:
 * - POST /: Create new checkpoint
 * - GET /: List all checkpoints for a workflow
 * - GET /stats: Get checkpoint statistics
 * - GET /:cpId: Get specific checkpoint
 * - POST /:cpId/restore: Restore checkpoint data
 * - POST /auto: Create automatic checkpoint
 * 
 * Authentication: All endpoints require valid user authentication
 * Workflow Context: Routes are nested under /api/workflows/:id/checkpoints
 */

import { Router, Request, Response } from 'express';
import { CheckpointService } from '../services/checkpoint.service';
import { authenticate } from '../middleware/auth';

// Allow req.user from auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: { id?: string; role: string; roles?: string[] };
    }
  }
}

// Create router with mergeParams to access parent route parameters
const router = Router({ mergeParams: true });
const checkpointService = new CheckpointService();

// ===== CHECKPOINT CREATION =====

/**
 * POST / - Create a new checkpoint
 * 
 * Creates a new checkpoint with the current workflow state.
 * Users can provide a name and description for the checkpoint.
 * 
 * Request Body:
 * - name: Checkpoint name (optional)
 * - description: Checkpoint description (optional)
 * - nodes: Current workflow nodes
 * - edges: Current workflow edges
 * - viewport: Current canvas viewport
 * - metadata: Additional checkpoint metadata
 * 
 * Response: 201 with created checkpoint data
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, nodes, edges, viewport, metadata } = req.body;
    
    const checkpoint = await checkpointService.createCheckpoint({
      workflowId: req.params.id,
      name,
      description,
      createdBy: req.user!.id || '' ,
      nodes,
      edges,
      viewport,
      metadata
    });
    
    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    res.status(400).json({ error: 'Failed to create checkpoint' });
  }
});

// ===== CHECKPOINT RETRIEVAL =====

/**
 * GET / - List all checkpoints for a workflow
 * 
 * Retrieves all checkpoints associated with the specified workflow.
 * Returns checkpoint metadata without the full workflow state.
 * 
 * Response: 200 with array of checkpoint summaries
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkpoints = await checkpointService.getWorkflowCheckpoints(req.params.id);
    res.json(checkpoints);
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
});

/**
 * GET /stats - Get workflow checkpoint statistics
 * 
 * Returns aggregated statistics about checkpoints for a workflow,
 * such as total count, creation frequency, and storage usage.
 * 
 * Response: 200 with checkpoint statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await checkpointService.getCheckpointStats(req.params.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching checkpoint stats:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoint statistics' });
  }
});

/**
 * GET /:cpId - Get a specific checkpoint
 * 
 * Retrieves the complete data for a specific checkpoint,
 * including the full workflow state (nodes, edges, viewport).
 * 
 * Parameters:
 * - cpId: Checkpoint ID to retrieve
 * 
 * Response: 200 with checkpoint data or 404 if not found
 */
router.get('/:cpId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkpoint = await checkpointService.getCheckpointById(req.params.cpId);
    if (!checkpoint) {
      res.status(404).json({ error: 'Checkpoint not found' });
      return;
    }
    res.json(checkpoint);
  } catch (error) {
    console.error('Error fetching checkpoint:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoint' });
  }
});

// ===== CHECKPOINT RESTORATION =====

/**
 * POST /:cpId/restore - Restore a checkpoint
 * 
 * Retrieves checkpoint data for restoration purposes.
 * The frontend applies this data to restore the workflow state.
 * 
 * Parameters:
 * - cpId: Checkpoint ID to restore
 * 
 * Response: 200 with checkpoint data or 404 if not found
 */
router.post('/:cpId/restore', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const restoredData = await checkpointService.restoreCheckpoint(req.params.cpId);
    if (!restoredData) {
      res.status(404).json({ error: 'Checkpoint not found' });
      return;
    }
    res.json(restoredData);
  } catch (error) {
    console.error('Error restoring checkpoint:', error);
    res.status(500).json({ error: 'Failed to restore checkpoint' });
  }
});

// ===== AUTOMATIC CHECKPOINTS =====

/**
 * POST /auto - Create automatic checkpoint
 * 
 * Creates a checkpoint automatically without user input.
 * Used for auto-save functionality and background state preservation.
 * 
 * Request Body:
 * - nodes: Current workflow nodes
 * - edges: Current workflow edges
 * - viewport: Current canvas viewport
 * 
 * Response: 201 with created auto-checkpoint data
 */
router.post('/auto', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodes, edges, viewport } = req.body;
    
    const checkpoint = await checkpointService.createAutoCheckpoint(
      req.params.id,
      req.user!.id || '',
      { nodes, edges, viewport }
    );
    
    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Error creating auto-checkpoint:', error);
    res.status(400).json({ error: 'Failed to create auto-checkpoint' });
  }
});

// Delete a checkpoint
router.delete('/:cpId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await checkpointService.deleteCheckpoint(req.params.cpId);
    if (!result) {
      res.status(404).json({ error: 'Checkpoint not found' });
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting checkpoint:', error);
    res.status(500).json({ error: 'Failed to delete checkpoint' });
  }
});

export default router;
