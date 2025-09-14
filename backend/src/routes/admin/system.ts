import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ObjectId, Db, WithId, Document, MongoClient } from 'mongodb';
import { authenticateJWT, requirePermission, logAdminAction } from '../../middleware/adminAuth';
import { adminRateLimiter } from '../../middleware/rateLimit';
import { getDb } from '../../database/connection';
// Import the logger with require to avoid type issues
const logger = require('../../utils/logger');
import Joi from 'joi';

// Type assertion for the database connection
type Database = ReturnType<MongoClient['db']>;

// Define types for our data models
interface SystemConfig extends WithId<Document> {
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description?: string;
  isPublic: boolean;
  version: number;
  createdBy: ObjectId;
  updatedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemMetric extends WithId<Document> {
  timestamp: Date;
  metric: string;
  value: number;
  metadata: Record<string, any>;
}

// Validation schemas
const configValidation = {
  body: Joi.object<SystemConfig>({
    key: Joi.string().required(),
    value: Joi.any().required(),
    dataType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array').required(),
    category: Joi.string().default('general'),
    description: Joi.string(),
    isPublic: Joi.boolean().default(false)
  })
};

const updateConfigValidation = {
  body: Joi.object<Partial<SystemConfig>>({
    value: Joi.any(),
    category: Joi.string(),
    description: Joi.string(),
    isPublic: Joi.boolean()
  }).min(1)
};

// Helper function to validate request against schema
const validateRequest = (schema: { body: Joi.ObjectSchema }): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.body.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => ({
          message: d.message,
          path: d.path,
          type: d.type
        }))
      });
      return;
    }
    next();
  };
};

const router = Router();

// Apply middleware to all routes
router.use(authenticateJWT, requirePermission('manage_system'), logAdminAction, adminRateLimiter);

/**
 * @route GET /admin/system/config
 * @description Get all system configurations with pagination
 * @access Private/Admin
 */
router.get('/config', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { page = 1, limit = 20, category, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const db = (await getDb()) as unknown as Db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    const query: any = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [configs, total] = await Promise.all([
      db.collection('system_configs')
        .find(query)
        .sort({ key: 1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      db.collection('system_configs').countDocuments(query)
    ]);
    
    // Format response
    const data = configs.map((config: any) => ({
      ...config,
      _id: config._id.toString()
    }));
    
    return res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching system configs:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /admin/system/config/:key
 * @description Get a specific system configuration by key
 * @access Private/Admin
 */
router.get('/config/:key', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const db = (await getDb()) as unknown as Db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    const config = await db.collection('system_configs').findOne<{
      _id: ObjectId;
      key: string;
      value: any;
      version: number;
      [key: string]: any;
    }>({
      key: req.params.key
    });
    
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuration not found' 
      });
    }
    
    return res.json({
      success: true,
      data: {
        ...config,
        _id: config._id.toString()
      }
    });
  } catch (error) {
    logger.error('Error fetching system config:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /admin/system/config
 * @description Create a new system configuration
 * @access Private/Admin
 */
router.post('/config', validateRequest(configValidation), async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const db = (await getDb()) as unknown as Db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    
    // Check if config with this key already exists
    const existingConfig = await db.collection('system_configs').findOne({
      key: req.body.key
    });
    
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        error: 'Configuration with this key already exists'
      });
    }
    
    // Create new config
    const newConfig = {
      ...req.body,
      version: 1,
      createdBy: new ObjectId(req.user?.id),
      updatedBy: new ObjectId(req.user?.id),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('system_configs').insertOne(newConfig);
    
    return res.status(201).json({
      success: true,
      data: {
        ...newConfig,
        _id: result.insertedId.toString(),
        createdBy: req.user?.id,
        updatedBy: req.user?.id
      }
    });
  } catch (error) {
    logger.error('Error creating system config:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route PUT /admin/system/config/:key
 * @description Update a system configuration
 * @access Private/Admin
 */
router.put('/config/:key', validateRequest(updateConfigValidation), async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const db = (await getDb()) as unknown as Db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    
    // Get current config
    const currentConfig = await db.collection<SystemConfig>('system_configs').findOne({
      key: req.params.key
    });
    
    if (!currentConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    // Prepare update data
    const updateData = {
      ...req.body,
      updatedBy: new ObjectId(req.user?.id),
      updatedAt: new Date(),
      version: currentConfig.version + 1
    };
    
    // Update config
    const result = await db.collection<SystemConfig>('system_configs').findOneAndUpdate(
      { key: req.params.key },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result || !result.value) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found or could not be updated'
      });
    }
    
    // Return success response
    return res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        ...result.value,
        _id: result.value._id.toString()
      }
    });
  } catch (error) {
    logger.error('Error updating system config:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route DELETE /admin/system/config/:key
 * @description Delete a system configuration
 * @access Private/Admin
 */
router.delete('/config/:key', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const db = (await getDb()) as unknown as Db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    
    // Check if config exists
    const config = await db.collection<SystemConfig>('system_configs').findOne({
      key: req.params.key
    });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    // Delete config
    await db.collection('system_configs').deleteOne({
      key: req.params.key
    });
    
    return res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting system config:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /admin/system/metrics
 * @description Get system metrics
 * @access Private/Admin
 */
router.get('/metrics', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { startDate, endDate, metric } = req.query;
    const db = (await getDb()) as unknown as Db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    
    // Build query
    const query: any = {};
    
    // Add date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }
    
    // Add metric filter
    if (metric) {
      query['metadata.metric'] = metric;
    }
    
    // Get metrics from database
    const metrics = await db.collection<SystemMetric>('system_metrics')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    // Format response
    const data = metrics.map((m: any) => ({
      ...m,
      _id: m._id.toString(),
      timestamp: m.timestamp.toISOString()
    }));
    
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
