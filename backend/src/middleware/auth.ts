import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { AuthenticatedRequest, SocketData } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authenticateSocket = (socket: Socket & { data: SocketData }, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    socket.data = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};
