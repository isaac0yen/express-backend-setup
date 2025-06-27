import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types/user.controller';

export interface AuthenticatedRequest extends Request {
  context?: UserPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.trim(), process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET') as UserPayload;
      req.context = decoded;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ status: false, message: 'Unauthorized: Invalid token' });
    }
  } else {
    res.status(401).json({ status: false, message: 'Unauthorized: No token provided' });
  }
};