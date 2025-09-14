import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticateJWT, requirePermission, logAdminAction } from '../../middleware/adminAuth';
import { adminRateLimiter } from '../../middleware/rateLimit';
import { getDb } from '../../database/connection';
import logger from '../../utils/logger';

const router = Router();

// Apply middleware to all routes
router.use(authenticateJWT, requirePermission('view_audit_logs'), logAdminAction, adminRateLimiter);

/**
 * @route GET /admin/audit/logs
 * @description Get audit logs with filtering and pagination
 * @access Private/Admin
 */
router.get('/logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      action, 
      entityType, 
      entityId, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const db = await getDb();
    const query: any = {};
    
    // Apply filters
    if (userId && ObjectId.isValid(userId as string)) {
      query.userId = new ObjectId(userId as string);
    }
    
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    if (entityId) {
      query.entityId = entityId;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }
    
    // Get logs with user details
    const [logs, total] = await Promise.all([
      db.collection('user_activities')
        .aggregate([
          { $match: query },
          { $sort: { timestamp: -1 } },
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              action: 1,
              entityType: 1,
              entityId: 1,
              ipAddress: 1,
              status: 1,
              timestamp: 1,
              'user._id': 1,
              'user.name': 1,
              'user.email': 1,
              'user.role': 1
            }
          }
        ])
        .toArray(),
      db.collection('user_activities').countDocuments(query)
    ]);
    
    // Format response
    const data = logs.map(log => ({
      ...log,
      _id: log._id.toString(),
      userId: log.user?._id?.toString(),
      user: log.user ? {
        _id: log.user._id?.toString(),
        name: log.user.name,
        email: log.user.email,
        role: log.user.role
      } : null
    }));
    
    res.json({
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
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /admin/audit/logs/:id
 * @description Get audit log details by ID
 * @access Private/Admin
 */
router.get('/logs/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid log ID' });
    }
    
    const db = await getDb();
    const logId = new ObjectId(req.params.id);
    
    const log = await db.collection('user_activities')
      .aggregate([
        { $match: { _id: { $eq: logId } } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $limit: 1 },
        {
          $project: {
            _id: 1,
            action: 1,
            entityType: 1,
            entityId: 1,
            ipAddress: 1,
            userAgent: 1,
            status: 1,
            metadata: 1,
            timestamp: 1,
            'user._id': 1,
            'user.name': 1,
            'user.email': 1,
            'user.role': 1
          }
        }
      ])
      .next();
    
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    const result = {
      ...log,
      user: log.user ? {
        id: log.user._id,
        email: log.user.email,
        name: log.user.name,
        role: log.user.role
      } : null
    };

    return res.json({ success: true, data: result });
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
router.get('/activities', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = await getDb();
    
    // Build match query
    const matchQuery: any = {};
    
    // Date range filter
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate as string);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate as string);
    }
    
    // Get activity summary
    const activities = await db.collection('user_activities')
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: '%Y-%m-%d', 
                date: '$timestamp' 
              }
            },
            count: { $sum: 1 },
            success: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'success'] }, 1, 0] 
              } 
            },
            failed: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] 
              } 
            },
            actions: { 
              $push: { 
                action: '$action',
                status: '$status',
                timestamp: '$timestamp'
              } 
            }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 } // Last 30 days
      ])
      .toArray();
    
    // Get top users
    const topUsers = await db.collection('user_activities')
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            role: '$user.role',
            count: 1,
            success: 1,
            failed: 1
          }
        }
      ])
      .toArray();
    
    // Get top actions
    const topActions = await db.collection('user_activities')
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray();
    
    res.json({
      success: true,
      data: {
        summary: {
          totalActivities: activities.reduce((sum, day) => sum + day.count, 0),
          totalSuccess: activities.reduce((sum, day) => sum + day.success, 0),
          totalFailed: activities.reduce((sum, day) => sum + day.failed, 0),
          days: activities.length
        },
        activities,
        topUsers,
        topActions
      }
    });
  } catch (error) {
    logger.error('Error fetching activity summary:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
