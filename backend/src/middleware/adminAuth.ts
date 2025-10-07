import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import logger from '../utils/logger';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { sub: string };
    
    // Find user in database using Mongoose model
    const user = await User.findById(decoded.sub).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Attach user to request object
    req.user = {
      id: user._id?.toString() || '',
      role: user.role || 'user',
      permissions: user.permissions || []
    };

    return next();
  } catch (error) {
    logger.error('JWT verification failed:', error);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const userRole = req.user.role || '';
    
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    return next();
  };
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'super-admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  // @ts-ignore
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // Log the action in the background without blocking the response
    (async () => {
      try {
        const action = {
          userId: req.user?.id || 'anonymous',
          action: `${req.method} ${req.path}`,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          createdAt: new Date()
        };
        
        // For now, we'll just log the action without persisting it
        logger.info('Admin action logged', action);
      } catch (error) {
        logger.error('Failed to log admin action:', error);
      }
    })();
    
    return originalSend.call(this, body);
  };
  
  next();
};