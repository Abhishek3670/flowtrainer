import { Router, Request, Response } from 'express';
import { authenticateJWT, requirePermission, logAdminAction } from '../../middleware/adminAuth';
import { adminRateLimiter } from '../../middleware/rateLimit';
import { User } from '../../models/User';
import UserActivity from '../../models/UserActivity';
import logger from '../../utils/logger';

const router = Router();

// Apply middleware to all routes
router.use(authenticateJWT, requirePermission('read_audit_logs'), logAdminAction, adminRateLimiter);

/**
 * @route GET /admin/audit/logs
 * @description Get audit logs with filtering and pagination
 * @access Private/Admin
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      action, 
      entityType, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query as any;

    // Build filter object
    const filter: any = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (action) {
      filter.action = { $regex: action, $options: 'i' };
    }
    
    if (entityType) {
      filter.entityType = entityType;
    }
    
    // Handle date range filtering
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Fetch logs with filtering and pagination
    const [logs, total] = await Promise.all([
      UserActivity.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserActivity.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /admin/audit/logs/:id
 * @description Get audit log details by ID
 * @access Private/Admin
 */
router.get('/logs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid log ID' });
    }
    
    const log = await UserActivity.findById(id);
    
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }
    
    return res.json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Error fetching audit log:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /admin/audit/activities
 * @description Get user activities summary
 * @access Private/Admin
 */
router.get('/activities', async (req: Request, res: Response) => {
  try {
    // Get recent activities (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [recentActivities, totalActivities] = await Promise.all([
      UserActivity.find({ timestamp: { $gte: twentyFourHoursAgo } })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      UserActivity.countDocuments({ timestamp: { $gte: twentyFourHoursAgo } })
    ]);
    
    // Get user activity stats
    const userActivityStats = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      { $group: { 
          _id: '$userId', 
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalActivities,
        recentActivities,
        userActivityStats
      }
    });
  } catch (error) {
    logger.error('Error fetching user activities:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;