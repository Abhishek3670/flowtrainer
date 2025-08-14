import { Router, Request, Response } from 'express';
import { CheckpointService } from '../services/checkpoint.service';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });
const checkpointService = new CheckpointService();

// Create a new checkpoint
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, nodes, edges, viewport, metadata } = req.body;
    
    const checkpoint = await checkpointService.createCheckpoint({
      workflowId: req.params.id,
      name,
      description,
      createdBy: req.user!.id,
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

// List all checkpoints for a workflow
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkpoints = await checkpointService.getWorkflowCheckpoints(req.params.id);
    res.json(checkpoints);
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
});

// Get workflow checkpoint statistics
router.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await checkpointService.getCheckpointStats(req.params.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching checkpoint stats:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoint statistics' });
  }
});

// Get a specific checkpoint
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

// Restore a checkpoint: returns its data for frontend to apply
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

// Create auto-checkpoint from current workflow state
router.post('/auto', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodes, edges, viewport } = req.body;
    
    const checkpoint = await checkpointService.createAutoCheckpoint(
      req.params.id,
      req.user!.id,
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
