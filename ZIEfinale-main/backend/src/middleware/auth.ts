import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable not set. Cannot generate secure tokens.');
  }
  // Extended token expiry (7 days) for better user experience in development
  // In production, consider using refresh tokens with shorter expiry (1-2 hours)
  return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string; role: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable not set. Cannot verify tokens.');
  }
  return jwt.verify(token, secret) as { userId: string; role: string };
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'Admin' && req.userRole !== 'SuperAdmin') {
    return res.status(403).json({ 
      message: 'Admin access required'
    });
  }
  next();
};
