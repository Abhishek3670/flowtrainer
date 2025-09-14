import { Request } from 'express';

export interface UserData {
  id: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: UserData;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: UserData;
}
