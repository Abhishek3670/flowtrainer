const Workflow = require('../models/Workflow');

// Get all workflows
const getWorkflows = async (req, res) => {
  try {
    const { 
      category, 
      status = 'draft', 
      page = 1, 
      limit = 10,
      search,
      tags 
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const workflows = await Workflow.find(query)
      .select('_id name description nodes edges category status tags createdBy lastModified createdAt')
      .sort({ lastModified: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Workflow.countDocuments(query);

    res.json({
      success: true,
      data: {
        workflows,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: workflows.length,
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: error.message
    });
  }
};

// Add at top with other exports:
const executeWorkflow = async (req, res) => {
  try {
    const workflowId = req.params.id;
    console.log(`Executing workflow ${workflowId}`);

    // TODO: put your real execution logic here (queue job, start process, etc.)

    res.json({
      success: true,
      data: { executionId: `exec-${Date.now()}` }
    });

  } catch (err) {
    console.error('Error executing workflow:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to start execution'
    });
  }
};

// Get single workflow
const getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow',
      error: error.message
    });
  }
};

// Create new workflow
const createWorkflow = async (req, res) => {
  try {
    console.log('Received workflow data:'); // 👈 Add this
    console.log('nodes:', req.body.nodes); // 👈 Add this
    console.log('edges:', req.body.edges); // 👈 Add this

    const {
      name,
      description,
      nodes = [],
      edges = [],
      viewport = { x: 0, y: 0, zoom: 1 },
      category = 'other',
      tags = []
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required'
      });
    }

    console.log('About to save nodes:', nodes); // 👈 Add this
    console.log('About to save edges:', edges); // 👈 Add this

    // Check for duplicate names (optional)
    const existingWorkflow = await Workflow.findOne({ 
      name: name.trim(),
      status: { $ne: 'archived' }
    });

    if (existingWorkflow) {
      return res.status(409).json({
        success: false,
        message: 'Workflow with this name already exists'
      });
    }

    const workflow = new Workflow({
      name: name.trim(),
      description: description?.trim(),
      nodes,
      edges,
      viewport,
      category,
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
    });

    const savedWorkflow = await workflow.save();
    console.log('Saved workflow nodes:', savedWorkflow.nodes); // 👈 Add this
    console.log('Saved workflow edges:', savedWorkflow.edges); // 👈 Add this

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: savedWorkflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: error.message
    });
  }
};

// Update workflow
const updateWorkflow = async (req, res) => {
  try {
    const {
      name,
      description,
      nodes,
      edges,
      viewport,
      category,
      status,
      tags
    } = req.body;

    const updateData = {
      $inc: { version: 1 }, 
      $set: {} 
    };
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (viewport !== undefined) updateData.viewport = viewport;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) {
      updateData.tags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    updateData.$set.lastModified = new Date();

    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: workflow
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow',
      error: error.message
    });
  }
};

// Delete workflow (soft delete by archiving)
const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow archived successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow',
      error: error.message
    });
  }
};

// Duplicate workflow
const duplicateWorkflow = async (req, res) => {
  try {
    const originalWorkflow = await Workflow.findById(req.params.id);
    
    if (!originalWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const duplicatedWorkflow = new Workflow({
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      nodes: originalWorkflow.nodes,
      edges: originalWorkflow.edges,
      viewport: originalWorkflow.viewport,
      category: originalWorkflow.category,
      tags: originalWorkflow.tags
    });

    const savedWorkflow = await duplicatedWorkflow.save();

    res.status(201).json({
      success: true,
      message: 'Workflow duplicated successfully',
      data: savedWorkflow
    });
  } catch (error) {
    console.error('Error duplicating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate workflow',
      error: error.message
    });
  }
};


module.exports = {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  executeWorkflow
};
