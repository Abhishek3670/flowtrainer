import { Request, Response } from 'express';
import mongoose, { Document, Model, FilterQuery, UpdateQuery } from 'mongoose';

interface IViewport {
    x: number;
    y: number;
    zoom: number;
}

type FlowElement = Record<string, any>;

interface IWorkflow extends Document {
    name: string;
    description?: string;
    nodes: FlowElement[];
    edges: FlowElement[];
    viewport: IViewport;
    category: string;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    version: number;
    createdBy?: mongoose.Types.ObjectId;
    lastModified: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Assume 'Workflow' is a Mongoose model of type IWorkflow
const Workflow: Model<IWorkflow> = require('../models/Workflow');

// Get all workflows
export const getWorkflows = async (req: Request, res: Response): Promise<void> => {
 try {
    const { 
      category, 
      status = 'draft', 
      search,
      tags 
    } = req.query;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const query: FilterQuery<IWorkflow> = {};
    
    if (category) query.category = category as string;
    if (status) query.status = status as 'draft' | 'published' | 'archived';
    if (tags) query.tags = { $in: (tags as string).split(',') };
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    const workflows = await Workflow.find(query)
      .select('_id name description nodes edges category status tags createdBy lastModified createdAt')
      .sort({ lastModified: -1 })
      .limit(limit)
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
 } catch (error: any) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: error.message
    });
 }
};

// Get single workflow
export const getWorkflow = async (req: Request, res: Response): Promise<Response | void> => {
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
 } catch (error: any) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow',
      error: error.message
    });
 }
};

// Create new workflow
export const createWorkflow = async (req: Request, res: Response): Promise<Response | void> => {
 try {
    const {
      name,
      description,
      nodes = [],
      edges = [],
      viewport = { x: 0, y: 0, zoom: 1 },
      category = 'other',
      tags = []
    }: Partial<IWorkflow> = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required'
      });
    }

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

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: savedWorkflow
    });
 } catch (error: any) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: error.message
    });
 }
};

// Update workflow
export const updateWorkflow = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const {
            name, description, nodes, edges, viewport, category, status, tags
        }: Partial<IWorkflow> = req.body;

        const updateData: UpdateQuery<IWorkflow> = {
            $set: { lastModified: new Date() },
            $inc: { version: 1 }
        };

        // Dynamically add fields to the $set operator if they exist in the request body
        if (name !== undefined) updateData.$set.name = name.trim();
        if (description !== undefined) updateData.$set.description = description.trim();
        if (nodes !== undefined) updateData.$set.nodes = nodes;
        if (edges !== undefined) updateData.$set.edges = edges;
        if (viewport !== undefined) updateData.$set.viewport = viewport;
        if (category !== undefined) updateData.$set.category = category;
        if (status !== undefined) updateData.$set.status = status;
        if (tags !== undefined) {
            updateData.$set.tags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
        }

        const workflow = await Workflow.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!workflow) {
            return res.status(404).json({ success: false, message: 'Workflow not found' });
        }

        res.json({
            success: true,
            message: 'Workflow updated successfully',
            data: workflow
        });
    } catch (error: any) {
        console.error('Error updating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update workflow',
            error: error.message
        });
    }
};


// Delete workflow (soft delete)
export const deleteWorkflow = async (req: Request, res: Response): Promise<Response | void> => {
 try {
    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', 'lastModified': new Date() },
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
 } catch (error: any) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow',
      error: error.message
    });
 }
};

// Duplicate workflow
export const duplicateWorkflow = async (req: Request, res: Response): Promise<Response | void> => {
 try {
    const originalWorkflow = await Workflow.findById(req.params.id).lean();
    
    if (!originalWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Create a new object for the new workflow, excluding mongoose-specific fields
    const { _id, version, createdAt, updatedAt, lastModified, ...copyData } = originalWorkflow;

    const duplicatedWorkflow = new Workflow({
      ...copyData,
      name: `${originalWorkflow.name} (Copy)`,
      status: 'draft', // New duplicates should be drafts
    });

    const savedWorkflow = await duplicatedWorkflow.save();

    res.status(201).json({
      success: true,
      message: 'Workflow duplicated successfully',
      data: savedWorkflow
    });
 } catch (error: any) {
    console.error('Error duplicating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate workflow',
      error: error.message
    });
 }
};

// Execute a workflow
export const executeWorkflow = async (req: Request, res: Response): Promise<void> => {
 try {
    const workflowId = req.params.id;
    console.log(`Executing workflow ${workflowId}`);

    // TODO: Add real execution logic (e.g., queue a job, start a process)

    res.json({
      success: true,
      data: { 
        workflowId,
        executionId: `exec-${Date.now()}`,
        status: 'started'
      }
    });

 } catch (err: any) {
    console.error('Error executing workflow:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to start execution'
    });
 }
};