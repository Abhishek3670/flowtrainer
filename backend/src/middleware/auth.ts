import { Request, Response, NextFunction } from 'express';

// Custom type for authenticated request
interface AuthUser {
  userId: string;
  email: string;
  role?: string;
}

// Declare module augmentation
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // For now, mock authentication - replace with actual JWT verification
  // TODO: Implement proper JWT authentication
  req.user = {
    userId: 'mock-user-id',
    email: 'mock@example.com',
    role: 'user'
  };
  next();
};
