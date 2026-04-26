import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'user';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authentication required. Invalid token format.' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      res.status(500).json({ message: 'Internal server error.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as { id: number; email: string; role: 'admin' | 'user' };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    return;
  }

  next();
};