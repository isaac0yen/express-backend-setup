import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types/user.controller';
import { SessionManager } from '../modules/sessionManager';
import { logger } from '../modules/logger';

export interface AuthenticatedRequest extends Request {
  context?: UserPayload;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    try {
      // Extract token - remove 'Bearer ' prefix if it exists
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : authHeader.trim();

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET') as UserPayload & { sessionToken?: string };
      
       if (decoded.sessionToken) {
          const isValidSession = await SessionManager.validateSession(decoded.sessionToken);
          if (!isValidSession) {
            res.status(401).json({
              status: false,
              message: 'Session expired. Please login again.',
              code: 'SESSION_EXPIRED'
            });
            return;
          }
        }

      req.context = decoded;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(401).json({ status: false, message: 'Unauthorized: Invalid token' });
    }
  } else {
    res.status(401).json({ status: false, message: 'Unauthorized: No token provided' });
  }
};