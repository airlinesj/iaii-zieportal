import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign({ userId, role }, secret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): { userId: string; role: string } => {
  const secret = process.env.JWT_SECRET || 'default_secret';
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
  console.log('\n🔐 ADMIN MIDDLEWARE CHECK:');
  console.log('  - User ID:', req.userId);
  console.log('  - User Role:', req.userRole);
  console.log('  - Is Admin?:', req.userRole === 'Admin');
  console.log('  - Is SuperAdmin?:', req.userRole === 'SuperAdmin');
  
  if (req.userRole !== 'Admin' && req.userRole !== 'SuperAdmin') {
    console.log('  ❌ REJECTED: Role is neither Admin nor SuperAdmin');
    return res.status(403).json({ 
      message: 'Admin access required',
      debug: `Your role is '${req.userRole}', but only 'Admin' or 'SuperAdmin' can access this.`
    });
  }
  console.log('  ✅ ALLOWED: Admin/SuperAdmin role confirmed\n');
  next();
};
