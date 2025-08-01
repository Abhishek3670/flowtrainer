import express from 'express';
import Workflow from '../models/Workflow';
import WorkflowRevision from '../models/WorkflowRevision';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: Get all workflows for the authenticated user
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workflows
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    const workflows = await Workflow.find({
      $or: [
        { ownerId: userId },
        { collaborators: userId },
        { isPublic: true }
      ]
    })
    .populate('ownerId', 'email')
    .populate('collaborators', 'email')
    .sort({ updatedAt: -1 });

    res.json(workflows);
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/workflows/{id}:
 *   get:
 *     summary: Get a specific workflow by ID
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow details
 *       404:
 *         description: Workflow not found
 */
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const workflow = await Workflow.findOne({
      _id: id,
      $or: [
        { ownerId: userId },
        { collaborators: userId },
        { isPublic: true }
      ]
    })
    .populate('ownerId', 'email')
    .populate('collaborators', 'email');

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: Create a new workflow
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               nodes:
 *                 type: array
 *               edges:
 *                 type: array
 *     responses:
 *       201:
 *         description: Workflow created successfully
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, nodes = [], edges = [] } = req.body;
    const userId = req.user?.userId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const workflow = new Workflow({
      title,
      description,
      nodes,
      edges,
      ownerId: userId,
      collaborators: [],
      isPublic: false,
      version: 1
    });

    await workflow.save();

    // Create initial revision
    const revision = new WorkflowRevision({
      workflowId: workflow._id,
      version: 1,
      nodes,
      edges,
      createdBy: userId,
      changeDescription: 'Initial version'
    });

    await revision.save();

    res.status(201).json(workflow);
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/workflows/{id}:
 *   put:
 *     summary: Update a workflow
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 */
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, nodes, edges, changeDescription } = req.body;
    const userId = req.user?.userId;

    const workflow = await Workflow.findOne({
      _id: id,
      $or: [
        { ownerId: userId },
        { collaborators: userId }
      ]
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or access denied' });
    }

    // Update workflow
    if (title !== undefined) workflow.title = title;
    if (description !== undefined) workflow.description = description;
    if (nodes !== undefined) workflow.nodes = nodes;
    if (edges !== undefined) workflow.edges = edges;
    
    workflow.version += 1;
    await workflow.save();

    // Create revision if nodes or edges changed
    if (nodes !== undefined || edges !== undefined) {
      const revision = new WorkflowRevision({
        workflowId: workflow._id,
        version: workflow.version,
        nodes: workflow.nodes,
        edges: workflow.edges,
        createdBy: userId,
        changeDescription: changeDescription || `Update version ${workflow.version}`
      });

      await revision.save();
    }

    res.json(workflow);
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/workflows/{id}:
 *   delete:
 *     summary: Delete a workflow
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow deleted successfully
 */
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const workflow = await Workflow.findOneAndDelete({
      _id: id,
      ownerId: userId // Only owner can delete
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or access denied' });
    }

    // Delete all revisions
    await WorkflowRevision.deleteMany({ workflowId: id });

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/workflows/{id}/history:
 *   get:
 *     summary: Get workflow revision history
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow revision history
 */
router.get('/:id/history', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Check if user has access to the workflow
    const workflow = await Workflow.findOne({
      _id: id,
      $or: [
        { ownerId: userId },
        { collaborators: userId },
        { isPublic: true }
      ]
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or access denied' });
    }

    const revisions = await WorkflowRevision.find({ workflowId: id })
      .populate('createdBy', 'email')
      .sort({ version: -1 });

    res.json(revisions);
  } catch (error) {
    console.error('Get workflow history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
