import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import refereeRoutes from './routes/sponsorRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import membershipRoutes from './routes/membershipRoutes';
import { initializeDefaultGrades } from './models/MembershipGrade';
import { AuditRetentionService } from './services/AuditRetentionService';
import { validateRedirectUrl, addRedirectHelper } from './middleware/redirectValidation';
import { validateFileAccess } from './middleware/fileAccessControl';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zie-db';

// Middleware
app.use(helmet());

// CORS configuration - Restrict to production domain with fallback to configured origins
const productionDomain = process.env.PRODUCTION_DOMAIN || 'https://zie.co.zw';
const allowedOrigins = [
  productionDomain,
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// In development, allow localhost origins
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:4200', 'http://localhost:3000');
}

app.use(cors({
  origin: function(origin, callback) {
    // In production: Only allow explicitly whitelisted origins
    if (process.env.NODE_ENV === 'production') {
      // Allow requests with no origin (like mobile apps or internal requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      
      console.warn(`🚫 CORS blocked request from unauthorized origin: ${origin}`);
      callback(new Error('CORS: Origin not allowed'));
    } else {
      // In development: Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow localhost for development
      if (origin.includes('localhost')) return callback(null, true);
      
      // Allow explicitly configured origins
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600 // Cache CORS preflight for 1 hour
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization middleware (prevent NoSQL injection)
app.use(mongoSanitize());

// Rate limiting middleware (disabled in development for testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (much higher for dev/testing)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production', // Skip rate limiting in development
});

// Stricter rate limit for auth endpoints (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 in production, 100 in development
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(limiter);

// Apply auth rate limiter to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve uploaded files with access control
// Protected file download route
app.get('/api/uploads/:filename', authMiddleware, validateFileAccess, (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../uploads', filename);
  
  // Prevent path traversal attacks
  if (!filepath.startsWith(path.join(__dirname, '../uploads'))) {
    return res.status(403).json({ message: 'Access Denied' });
  }
  
  res.download(filepath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    }
  });
});

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Initialize default membership grades
    await initializeDefaultGrades();
    console.log('Default membership grades initialized');
    // Initialize audit retention policies
    AuditRetentionService.initializeRetention();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/referees', refereeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/membership', membershipRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

// Multer error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    console.error('File size limit exceeded:', err);
    return res.status(400).json({ message: 'File size exceeds 5MB limit' });
  }
  if (err.code === 'LIMIT_PART_COUNT') {
    console.error('Too many file parts:', err);
    return res.status(400).json({ message: 'Too many file parts' });
  }
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  }
  // Pass to general error handler
  next(err);
});

// Error handling middleware - Never expose internal errors to clients
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Server Error:', err.message);
  
  // Don't send error details to client in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorResponse = isProduction 
    ? { message: 'Internal server error' }
    : { message: 'Internal server error', error: err.message };
  
  res.status(500).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
