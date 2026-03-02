import { NextFunction, Response } from 'express';
import { FileAccessControlService } from '../services/FileAccessControlService';
import { AuthRequest } from './auth';

/**
 * Middleware to validate file access
 * Ensures users can only download files they uploaded (or admins can access any file)
 */
export const validateFileAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get filename from URL path
  const filename = req.params.filename || req.query.filename;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ message: 'Filename required' });
  }

  // If user is authenticated, check file ownership
  if (req.userId) {
    const userRole = req.userRole || 'Applicant';
    const canAccess = FileAccessControlService.canUserAccessFile(filename, req.userId, userRole);

    if (!canAccess) {
      console.warn(`🚫 Unauthorized file access attempt by ${req.userId} for file ${filename}`);
      return res.status(403).json({
        message: 'Access Denied',
        error: 'You do not have permission to access this file'
      });
    }
  } else {
    // Unauthenticated users cannot access files
    return res.status(401).json({
      message: 'Authentication Required',
      error: 'You must be logged in to download files'
    });
  }

  next();
};

/**
 * Middleware to register file uploads and track ownership
 * Should be applied after file upload middleware
 */
export const registerFileUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Handle single file upload
  if (req.file && req.userId) {
    FileAccessControlService.registerFileUpload(
      req.file.filename,
      req.userId,
      {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        applicationId: req.body.applicationId
      }
    );
  }

  // Handle multiple file uploads (from fields)
  if (req.files && typeof req.files === 'object' && req.userId) {
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };

    // If it's an array of files
    if (Array.isArray(files)) {
      files.forEach(file => {
        FileAccessControlService.registerFileUpload(
          file.filename,
          req.userId!,
          {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            applicationId: req.body.applicationId
          }
        );
      });
    } else {
      // If it's an object with fieldname keys and arrays of files
      Object.values(files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach(file => {
            FileAccessControlService.registerFileUpload(
              file.filename,
              req.userId!,
              {
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                applicationId: req.body.applicationId
              }
            );
          });
        }
      });
    }
  }

  next();
};

/**
 * Middleware to validate multiple files belong to user
 */
export const validateMultipleFileAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const filenames = req.body.filenames || req.query.filenames;

  if (!filenames) {
    return next(); // Skip if no filenames provided
  }

  // Convert to array if needed
  const filenameArray = Array.isArray(filenames) ? filenames : [filenames];

  // Remove non-string values
  const stringFilenames = filenameArray.filter((f): f is string => typeof f === 'string');

  if (stringFilenames.length === 0) {
    return next();
  }

  // If user is authenticated, check all file ownership
  if (req.userId) {
    const userRole = req.userRole || 'Applicant';
    const canAccessAll = FileAccessControlService.canUserAccessFiles(stringFilenames, req.userId, userRole);

    if (!canAccessAll) {
      console.warn(`🚫 Unauthorized multi-file access attempt by ${req.userId}`);
      return res.status(403).json({
        message: 'Access Denied',
        error: 'You do not have permission to access some of these files'
      });
    }
  } else {
    return res.status(401).json({
      message: 'Authentication Required',
      error: 'You must be logged in to access files'
    });
  }

  next();
};
