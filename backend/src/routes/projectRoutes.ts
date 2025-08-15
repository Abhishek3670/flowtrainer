import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
const router = Router();
const projectService = new ProjectService();

// 1. Generate execution plan
router.post('/:projectId/plan', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { workflowId, nodes, edges } = req.body;
  try {
    await projectService.generateExecutionPlan(projectId, workflowId, nodes, edges);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Execute workflow
router.post('/:projectId/execute', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    await projectService.executeWorkflow(projectId);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get project status / results
router.get('/:projectId/status', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const status = await projectService.getProjectStatus(projectId);
    res.status(200).json(status);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
