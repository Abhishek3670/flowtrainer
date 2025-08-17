// backend/src/routes/projectRoutes.ts
import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { EventEmitter } from 'events';
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
  console.log(`📊 Starting log stream for project: ${projectId}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Initial logs
  try {
    console.log(`📝 Fetching initial logs for project: ${projectId}`);
    const logText = await projectService.getExecutionLogs(projectId);
    console.log(`📝 Initial logs length: ${logText.length} characters`);
    
    logText.split('\n').forEach(line => {
      if (line.trim()) {
        res.write(`data: ${JSON.stringify({ message: line })}\n\n`);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to load initial logs for project ${projectId}:`, error);
    // Send error event but do NOT end the stream
    res.write(`data: ${JSON.stringify({ error: 'Failed to load logs', details: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
  }

  // Poll for execution complete
  const interval = setInterval(async () => {
    try {
      const status = await projectService.getProjectStatus(projectId);
      console.log(`📊 Status check for project ${projectId}: ${status.status}`);
      
      if (status.status === 'completed' || status.status === 'failed') {
        console.log(`✅ Execution ${status.status} for project ${projectId}, ending stream`);
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ status: 'execution_complete', final_status: status.status })}\n\n`);
        res.end();              // end only here
      }
    } catch (error) {
      console.error(`❌ Status check failed for project ${projectId}:`, error);
      clearInterval(interval);
      res.end();                // end if status lookup fails irrecoverably
    }
  }, 2000);

  req.on('close', () => {
    console.log(`🔌 Client disconnected from log stream for project: ${projectId}`);
    clearInterval(interval);
    // no res.end() here; client closed connection
  });

  return; // Explicit return for async function
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
projectService.on('execution_queued', (data: any) => broadcastEvent('execution_queued', data));
projectService.on('execution_progress', (data: any) => broadcastEvent('execution_progress', data));
projectService.on('execution_completed', (data: any) => broadcastEvent('execution_completed', data));
projectService.on('execution_failed', (data: any) => broadcastEvent('execution_failed', data));

/** POST /api/projects/generate - Generate execution plan */
router.post('/generate', async (req: Request, res: Response) => {
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
    return; // Explicit return for async function

  } catch (error) {
    console.error('Failed to generate execution plan:', error);
    res.status(500).json({
      error: 'Failed to generate execution plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return; // Explicit return for async function
  }
});

/** POST /api/projects/:projectId/plan - Generate execution plan for specific project */
router.post('/:projectId/plan', async (req: Request, res: Response) => {
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
    return; // Explicit return for async function

  } catch (error) {
    console.error(`Failed to generate plan for project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to generate execution plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return; // Explicit return for async function
  }
});

/** POST /api/projects/:projectId/execute - Execute workflow with Docker */
router.post('/:projectId/execute', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { nodes, edges } = req.body;
    
    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Nodes array is required' });
    }
    
    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json({ error: 'Edges array is required' });
    }

    // Set up SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const emitter = new EventEmitter();
    
    // Listen to execution events
    emitter.on('log', (message: any) => {
      res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
    });
    
    emitter.on('done', (result: any) => {
      res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
      res.end();
    });

    // Start execution in background
    projectService.executeMLWorkflowLegacy(projectId, nodes, edges, emitter)
      .catch(error => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      });

    return; // Explicit return for async function

  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute the project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return; // Explicit return for async function
  }
});

/** GET /api/projects/:projectId/results - Get execution results */
router.get('/:projectId/results', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const fs = require('fs').promises;
    const path = require('path');
    
    const resultsPath = path.join(process.cwd(), 'results', projectId);
    
    try {
      const files = await fs.readdir(resultsPath);
      const results = [];
      
      for (const file of files) {
        if (file.endsWith('_result.json')) {
          const content = await fs.readFile(path.join(resultsPath, file), 'utf-8');
          results.push({
            nodeId: file.replace('_result.json', ''),
            result: JSON.parse(content)
          });
        }
      }
      
      res.json({ success: true, results });
      return; // Explicit return for async function
    } catch (error) {
      res.json({ success: true, results: [] });
      return; // Explicit return for async function
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
    return; // Explicit return for async function
  }
});

/** GET /api/projects/:projectId/status - Get execution status */
router.get('/:projectId/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const status = await projectService.getProjectStatus(projectId);
    res.json(status);
    return; // Explicit return for async function
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
    return; // Explicit return for async function
  }
});

/** GET /api/projects/:projectId/logs - Get execution logs */
router.get('/:projectId/logs', async (req: Request, res: Response) => {
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
      return; // Explicit return for async function
    } else {
      // Return full log content
      const logs = await projectService.getExecutionLogs(projectId);

      res.json({
        success: true,
        project_id: projectId,
        logs: logs.split('\n'),
        log_count: logs.split('\n').length
      });
      return; // Explicit return for async function
    }

  } catch (error) {
    console.error(`Failed to get logs for project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to get project logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return; // Explicit return for async function
  }
});

/** POST /api/projects/:projectId/retry - Retry failed execution */
router.post('/:projectId/retry', async (req: Request, res: Response) => {
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
    return; // Explicit return for async function

  } catch (error) {
    console.error(`Failed to retry project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to retry project execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return; // Explicit return for async function
  }
});

/** DELETE /api/projects/:projectId - Clean up project */
router.delete('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    await projectService.cleanupProject(projectId);

    res.json({
      success: true,
      message: `Project ${projectId} cleaned up successfully`,
      project_id: projectId
    });
    return; // Explicit return for async function

  } catch (error) {
    console.error(`Failed to cleanup project ${req.params.projectId}:`, error);
    res.status(500).json({
      error: 'Failed to cleanup project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return; // Explicit return for async function
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
