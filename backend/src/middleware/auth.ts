import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserData } from '../types/express/index';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Response;

interface AuthenticatedRequest extends Request {
  user: UserData;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void | Response => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: { 
          code: 'missing_auth_token',
          message: 'Authentication token is required' 
        } 
      });
    }

    const token = authHeader.split(' ')[1];
    
    const payload = verifyAccessToken(token);

    // Attach user data to the request object
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      role: payload.role,
      permissions: payload.permissions,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Token expired') {
      return res.status(401).json({
        error: {
          code: 'token_expired',
          message: 'Authentication token has expired',
        },
      });
    }

    return res.status(401).json({
      error: {
        code: 'invalid_token',
        message: 'Invalid authentication token',
      },
    });
  }
};

/**
 * Middleware to check if user has required permissions
 * @param requiredPermissions Array of permission strings or a single permission string
 * @param options Optional configuration
 */
export const checkPermissions = (
  requiredPermissions: string | string[],
  options: { requireAll: boolean } = { requireAll: true }
): MiddlewareFunction => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const user = (req as any).user as UserData | undefined;
    
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Authentication required',
        },
      });
    }

    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasPermission = options.requireAll
      ? permissions.every(perm => user.permissions.includes(perm))
      : permissions.some(perm => user.permissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'forbidden',
          message: 'Insufficient permissions',
          required: permissions,
          has: user.permissions,
        },
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has required role
 * @param roles Array of role strings or a single role string
 */
export const checkRole = (roles: string | string[]): MiddlewareFunction => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const user = (req as any).user as UserData | undefined;
    
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Authentication required',
        },
      });
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.includes(user.role)) {
      return res.status(403).json({
        error: {
          code: 'forbidden',
          message: 'Insufficient role',
          required: requiredRoles,
          has: user.role,
        },
      });
    }

    next();
  };
};
