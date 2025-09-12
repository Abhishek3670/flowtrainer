// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// Augment Express Request locally to carry a minimal user shape
declare global {
  namespace Express {
    interface Request {
      user?: { id?: string; role: string; roles?: string[] };
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new AppError('User not found', 401);
      }

      // Attach minimal shape needed by downstream checks
      req.user = { id: (user as any)._id?.toString?.(), role: user.role, roles: user.roles };
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw error;
    }
  }
);

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (req.user.role !== requiredRole && !req.user.roles?.includes(requiredRole)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const requireAnyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const userRoles = req.user.roles || [req.user.role];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};
