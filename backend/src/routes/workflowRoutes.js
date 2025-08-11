const express = require('express');
const router = express.Router();

// Debug utility function
const debugLog = (component, action, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow
} = require('../controllers/workflowController');

debugLog('WorkflowRoutes', 'Setting up workflow routes');

// GET /api/workflows - Get all workflows with filtering
router.get('/', (req, res, next) => {
  debugLog('WorkflowRoutes', 'GET / - getWorkflows called', { 
    query: req.query,
    params: req.params 
  });
  getWorkflows(req, res, next);
});

// GET /api/workflows/:id - Get single workflow
router.get('/:id', (req, res, next) => {
  debugLog('WorkflowRoutes', 'GET /:id - getWorkflow called', { 
    id: req.params.id,
    query: req.query 
  });
  getWorkflow(req, res, next);
});

// POST /api/workflows - Create new workflow
router.post('/', (req, res, next) => {
  debugLog('WorkflowRoutes', 'POST / - createWorkflow called', { 
    bodyKeys: Object.keys(req.body || {}),
    hasNodes: !!req.body?.nodes,
    hasEdges: !!req.body?.edges
  });
  createWorkflow(req, res, next);
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', (req, res, next) => {
  debugLog('WorkflowRoutes', 'PUT /:id - updateWorkflow called', { 
    id: req.params.id,
    bodyKeys: Object.keys(req.body || {}),
    hasNodes: !!req.body?.nodes,
    hasEdges: !!req.body?.edges
  });
  updateWorkflow(req, res, next);
});

// DELETE /api/workflows/:id - Delete (archive) workflow
router.delete('/:id', (req, res, next) => {
  debugLog('WorkflowRoutes', 'DELETE /:id - deleteWorkflow called', { 
    id: req.params.id 
  });
  deleteWorkflow(req, res, next);
});

// POST /api/workflows/:id/duplicate - Duplicate workflow
router.post('/:id/duplicate', (req, res, next) => {
  debugLog('WorkflowRoutes', 'POST /:id/duplicate - duplicateWorkflow called', { 
    id: req.params.id 
  });
  duplicateWorkflow(req, res, next);
});

debugLog('WorkflowRoutes', 'Workflow routes setup completed');

module.exports = router;
