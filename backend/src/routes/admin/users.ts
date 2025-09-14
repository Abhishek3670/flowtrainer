import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticateJWT, requirePermission, logAdminAction } from '../../middleware/adminAuth';
import { adminRateLimiter } from '../../middleware/rateLimit';
import { getDb } from '../../database/connection';
import logger from '../../utils/logger';
import { validate, Joi } from 'express-validation';
import bcrypt from 'bcryptjs';

const router = Router();

// Validation schemas
const userValidation = {
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('user', 'admin', 'super-admin').default('user'),
    permissions: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(true),
    emailVerified: Joi.boolean().default(false)
  })
};

const updateUserValidation = {
  body: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(8),
    role: Joi.string().valid('user', 'admin', 'super-admin'),
    permissions: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
    emailVerified: Joi.boolean()
  }).min(1) // At least one field to update
};

// Apply middleware to all routes
router.use(authenticateJWT, requirePermission('manage_users'), logAdminAction, adminRateLimiter);

/**
 * @route GET /admin/users
 * @description Get all users with pagination
 * @access Private/Admin
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const db = await getDb();
    const query: any = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      db.collection('users')
        .find(query, { projection: { password: 0 } })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      db.collection('users').countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /admin/users/:id
 * @description Get user by ID
 * @access Private/Admin
 */
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const db = await getDb();
    const userId = new ObjectId(req.params.id);
    const user = await db.collection('users').findOne(
      { _id: userId } as any,
      { projection: { password: 0 } } // Exclude password from response
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /admin/users
 * @description Create a new user
 * @access Private/Admin
 */
router.post('/', validate(userValidation), async (req, res) => {
  try {
    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ 
      email: req.body.email 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    // Create user
    const newUser = {
      ...req.body,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      loginAttempts: 0,
      lockUntil: null,
      __v: 0
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Remove password from response
    delete newUser.password;
    
    return res.status(201).json({
      success: true,
      data: {
        ...newUser,
        _id: result.insertedId
      }
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route PUT /admin/users/:id
 * @description Update a user
 * @access Private/Admin
 */
router.put('/:id', validate(updateUserValidation), async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const { password, ...updateData } = req.body;
    const updates: any = { ...updateData, updatedAt: new Date() };

    // Hash password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const db = await getDb();
    const userId = new ObjectId(req.params.id);
    const result = await db.collection('users').findOneAndUpdate(
      { _id: userId } as any,
      { $set: updates },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: result.value });
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route DELETE /admin/users/:id
 * @description Delete a user
 * @access Private/Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    
    // Prevent deleting own account
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot delete your own account' 
      });
    }
    
    const db = await getDb();
    const userId = new ObjectId(req.params.id);
    const result = await db.collection('users').deleteOne({
      _id: userId
    } as any);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
