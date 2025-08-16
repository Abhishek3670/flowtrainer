// backend/src/routes/projectRoutes.ts
import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import path from 'path';

const router = Router();
const projectService = new ProjectService();

// Event stream for real-time updates
const clients = new Set<Response>();

// SSE route: system status
router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add this client to the set
  clients.add(res);

  // Send initial system status
  const sendInitialStatus = async () => {
    try {
      const status = await projectService.getSystemStatus();
      res.write(`event: system_status\ndata: ${JSON.stringify(status)}\n\n`);
    } catch (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to fetch system status' })}\n\n`);
    }
  };

  // Send initial status immediately
  sendInitialStatus();

  // Send periodic system status updates every 10 seconds
  const statusInterval = setInterval(async () => {
    try {
      const status = await projectService.getSystemStatus();
      res.write(`event: system_status\ndata: ${JSON.stringify(status)}\n\n`);
    } catch (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to fetch system status' })}\n\n`);
    }
  }, 10000);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    clearInterval(statusInterval);
  });

  // Handle client disconnect (alternative method)
  req.on('end', () => {
    clients.delete(res);
    clearInterval(statusInterval);
  });
});

router.get('/:projectId/logs/stream', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial logs
  try {
    const logs = await projectService.getExecutionLogs(projectId);
    logs.split('\n').forEach(line => {
      if (line.trim()) {
        res.write(`data: ${JSON.stringify({ message: line })}\n\n`);
      }
    });
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Failed to load logs' })}\n\n`);
  }

  // Keep connection alive and stream new logs
  const logPath = path.join(process.cwd(), 'workflows', projectId, 'logs', 'execution.log');
  
  // Watch for file changes (simplified - you may want to use chokidar)
  const interval = setInterval(async () => {
    try {
      const status = await projectService.getProjectStatus(projectId);
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ status: 'execution_complete' })}\n\n`);
        res.end();
      }
    } catch (error) {
      clearInterval(interval);
      res.end();
    }
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});
// Broadcast events to all connected clients
const broadcastEvent = (event: string, data: any) => {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      clients.delete(client);
    }
  });
};

// Set up event listeners
projectService.on('execution_queued', (data) => broadcastEvent('execution_queued', data));
projectService.on('execution_progress', (data) => broadcastEvent('execution_progress', data));
// projectService.on('execution_progress', data =>
//   res.write(`event: execution_progress\ndata: ${JSON.stringify(data)}\n\n`)
// );

projectService.on('execution_completed', (data) => broadcastEvent('execution_completed', data));
projectService.on('execution_failed', (data) => broadcastEvent('execution_failed', data));

/** POST /api/projects/generate - Generate execution plan */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, workflowId, nodes, edges } = req.body;

    if (!projectId || !workflowId || !nodes || !edges) {
      res.status(400).json({
        error: 'Missing required fields: projectId, workflowId, nodes, edges'
      });
      return;
    }

    await projectService.generateExecutionPlan(projectId, workflowId, nodes, edges);

    res.json({
      success: true,
      message: `Execution plan generated for project ${projectId}`,
      project_id: projectId,
      workflow_id: workflowId,
      nodes_count: nodes.length,
      edges_count: edges.length
    });

  } catch (error) {
    console.error('Failed to generate execution plan:', error);
    res.status(500).json({
      error: 'Failed to generate execution plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
/** POST /api/projects/:projectId/plan - Generate execution plan for specific project */
router.post('/:projectId/plan', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { workflowId, nodes, edges } = req.body;

    if (!workflowId || !nodes || !edges) {
      res.status(400).json({
        error: 'Missing required fields: workflowId, nodes, edges'
      });
      return;
    }

    await projectService.generateExecutionPlan(projectId, workflowId, nodes, edges);

    res.json({
      success: true,
      message: `Execution plan generated for project ${projectId}`,
      project_id: projectId,
      workflow_id: workflowId,
      nodes_count: nodes.length,
      edges_count: edges.length
    });

  } catch (error) {
    console.error(`Failed to generate plan for project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to generate execution plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
/** POST /api/projects/:projectId/execute - Execute workflow */
router.post('/:projectId/execute', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { priority = 1, timeout_minutes } = req.body;

    await projectService.queueExecution(
      projectId, 
      parseInt(priority),
      timeout_minutes ? parseInt(timeout_minutes) : undefined
    );

    res.json({
      success: true,
      message: `Execution queued for project ${projectId}`,
      project_id: projectId,
      priority: parseInt(priority)
    });

  } catch (error) {
    console.error(`Failed to execute project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to execute project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/** GET /api/projects/:projectId/status - Get execution status */
router.get('/:projectId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const status = await projectService.getProjectStatus(projectId);

    res.json({
      success: true,
      project_id: projectId,
      ...status
    });

  } catch (error) {
    console.error(`Failed to get status for project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to get project status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/** GET /api/projects/:projectId/logs - Get execution logs */
router.get('/:projectId/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { stream = false } = req.query;

    if (stream === 'true') {
      // Stream logs in real-time
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // TODO: Implement log streaming
      res.write(`event: log\ndata: {"message": "Log streaming not yet implemented"}\n\n`);
    } else {
      // Return full log content
      const logs = await projectService.getExecutionLogs(projectId);
      
      res.json({
        success: true,
        project_id: projectId,
        logs: logs.split('\n'),
        log_count: logs.split('\n').length
      });
    }

  } catch (error) {
    console.error(`Failed to get logs for project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to get project logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/** POST /api/projects/:projectId/retry - Retry failed execution */
router.post('/:projectId/retry', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { from_step } = req.body;

    await projectService.retryExecution(projectId, from_step);

    res.json({
      success: true,
      message: `Retry queued for project ${projectId}`,
      project_id: projectId,
      from_step: from_step
    });

  } catch (error) {
    console.error(`Failed to retry project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to retry project execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/** DELETE /api/projects/:projectId - Clean up project */
router.delete('/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    await projectService.cleanupProject(projectId);

    res.json({
      success: true,
      message: `Project ${projectId} cleaned up successfully`,
      project_id: projectId
    });

  } catch (error) {
    console.error(`Failed to cleanup project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to cleanup project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/** GET /api/projects/system/status - Get system status and metrics */
router.get('/system/status', (req: Request, res: Response): void => {
  try {
    const systemStatus = projectService.getSystemStatus();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: systemStatus
    });

  } catch (error) {
    console.error('Failed to get system status:', error);
    res.status(500).json({
      error: 'Failed to get system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
