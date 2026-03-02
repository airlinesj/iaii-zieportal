import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import refereeRoutes from './routes/sponsorRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(validateRedirectUrl);
app.use(addRedirectHelper);

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

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('=== Server Error ===');
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
