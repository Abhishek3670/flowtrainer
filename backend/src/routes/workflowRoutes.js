const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  executeWorkflow
} = require('../controllers/workflowController');

// GET /api/workflows - Get all workflows with filtering
router.get('/', getWorkflows);

// GET /api/workflows/:id - Get single workflow
router.get('/:id', getWorkflow);

// POST /api/workflows - Create new workflow
router.post('/', createWorkflow);

// PUT /api/workflows/:id - Update workflow
router.put('/:id', updateWorkflow);

// DELETE /api/workflows/:id - Delete (archive) workflow
router.delete('/:id', deleteWorkflow);

// POST /api/workflows/:id/duplicate - Duplicate workflow
router.post('/:id/duplicate', duplicateWorkflow);

// POST /api/workflows/:id/execute - Execute workflow
router.post('/:id/execute', executeWorkflow);

module.exports = router;
