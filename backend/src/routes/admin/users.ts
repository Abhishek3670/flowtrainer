import { Router } from 'express';
import { authenticateJWT, requirePermission, logAdminAction } from '../../middleware/adminAuth';
import { adminRateLimiter } from '../../middleware/rateLimit';
import { User, IUser } from '../../models/User';
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

// Validation schema for role update
const roleUpdateValidation = {
  body: Joi.object({
    role: Joi.string().valid('user', 'admin', 'super-admin').required()
  })
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
    
    const query: any = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(Number(limit))
        .select('-password')
        .lean(),
      User.countDocuments(query)
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
    const user = await User.findById(req.params.id).select('-password');
    
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
    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: req.body.email 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }
    
    // Create user
    const newUser = new User({
      ...req.body,
      firstName: req.body.name.split(' ')[0],
      lastName: req.body.name.split(' ').slice(1).join(' ') || req.body.name
    });
    
    await newUser.save();
    
    // Remove password from response
    const userObj: any = newUser.toObject();
    delete userObj.password;
    
    return res.status(201).json({
      success: true,
      data: userObj
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
    const { password, ...updateData } = req.body;
    const updates: any = { ...updateData };

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route PUT /admin/users/:id/role
 * @description Update user role (Super Admin only)
 * @access Private/Super Admin
 */
router.put('/:id/role', validate(roleUpdateValidation), async (req, res) => {
  try {
    // Check if user is super-admin (additional permission check)
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only super-admins can update user roles' 
      });
    }

    const { role } = req.body;
    
    // Prevent removing super-admin role from self
    if (req.params.id === req.user?.id && role !== 'super-admin') {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot remove super-admin role from yourself' 
      });
    }
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Prevent changing role of other super-admins
    if (user.role === 'super-admin' && req.params.id !== req.user?.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot change role of other super-admins' 
      });
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Log the action
    logger.info(`User role updated: ${user.email} (${user.role} -> ${role}) by ${req.user?.id}`);

    return res.json({ 
      success: true, 
      message: 'User role updated successfully',
      data: updatedUser 
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
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
    // Prevent deleting own account
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot delete your own account' 
      });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
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