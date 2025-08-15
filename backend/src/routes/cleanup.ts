import { Router, Request, Response } from 'express';
import { CheckpointModel } from '../models/Checkpoint';
import { authenticate } from '../middleware/auth';

const router = Router();

// DELETE /api/cleanup/auto-checkpoints
// Clear all auto-generated checkpoints
router.delete('/auto-checkpoints', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Cleanup] Clearing auto-generated checkpoints...');
    
    // Find auto-generated checkpoints first (for logging)
    const autoCheckpoints = await CheckpointModel.find({
      'metadata.tags': 'auto-generated'
    });
    
    console.log(`[Cleanup] Found ${autoCheckpoints.length} auto-generated checkpoints`);
    
    if (autoCheckpoints.length === 0) {
      res.json({
        success: true,
        message: 'No auto-generated checkpoints to delete',
        deletedCount: 0,
        remainingCount: await CheckpointModel.countDocuments({})
      });
      return;
    }
    
    // Delete all auto-generated checkpoints
    const result = await CheckpointModel.deleteMany({
      'metadata.tags': 'auto-generated'
    });
    
    const remainingCount = await CheckpointModel.countDocuments({});
    
    console.log(`[Cleanup] Successfully deleted ${result.deletedCount} auto-generated checkpoints`);
    console.log(`[Cleanup] ${remainingCount} manual checkpoints remaining`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} auto-generated checkpoints`,
      deletedCount: result.deletedCount,
      remainingCount: remainingCount
    });
    
  } catch (error) {
    console.error('[Cleanup] Error clearing auto-checkpoints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear auto-generated checkpoints'
    });
  }
});

// GET /api/cleanup/auto-checkpoints/count
// Get count of auto-generated checkpoints without deleting
router.get('/auto-checkpoints/count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const autoCheckpointsCount = await CheckpointModel.countDocuments({
      'metadata.tags': 'auto-generated'
    });
    
    const totalCount = await CheckpointModel.countDocuments({});
    const manualCount = totalCount - autoCheckpointsCount;
    
    res.json({
      success: true,
      autoCheckpoints: autoCheckpointsCount,
      manualCheckpoints: manualCount,
      totalCheckpoints: totalCount
    });
    
  } catch (error) {
    console.error('[Cleanup] Error counting checkpoints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to count checkpoints'
    });
  }
});

export default router;
