import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // For now, mock authentication - replace with actual JWT verification
  // TODO: Implement proper JWT authentication
  req.user = { id: 'mock-user-id' };
  next();
};
