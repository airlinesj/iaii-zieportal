import mongoose from 'mongoose';

/**
 * Interface for file tracking and ownership
 */
interface FileRecord {
  _id?: mongoose.Types.ObjectId;
  filename: string;
  uploadedBy: string; // User ID
  uploadedAt: Date;
  originalName: string;
  mimeType: string;
  size: number;
  applicationId?: string; // Optional reference to application
}

/**
 * In-memory file ownership tracking
 * In production, this should be persisted in MongoDB
 */
class FileOwnershipStore {
  private fileRecords: Map<string, FileRecord> = new Map();

  /**
   * Register a file upload
   */
  registerFile(filename: string, userId: string, metadata: Partial<FileRecord>): void {
    const record: FileRecord = {
      filename,
      uploadedBy: userId,
      uploadedAt: new Date(),
      originalName: metadata.originalName || filename,
      mimeType: metadata.mimeType || 'application/octet-stream',
      size: metadata.size || 0,
      applicationId: metadata.applicationId
    };
    this.fileRecords.set(filename, record);
  }

  /**
   * Check if user owns the file
   */
  canAccessFile(filename: string, userId: string, isAdmin: boolean = false): boolean {
    // Admins can access any file
    if (isAdmin) {
      return true;
    }

    const record = this.fileRecords.get(filename);
    if (!record) {
      return false;
    }

    return record.uploadedBy === userId;
  }

  /**
   * Get all files for a user
   */
  getUserFiles(userId: string): FileRecord[] {
    return Array.from(this.fileRecords.values()).filter(
      record => record.uploadedBy === userId
    );
  }

  /**
   * Delete file record
   */
  removeFile(filename: string): void {
    this.fileRecords.delete(filename);
  }

  /**
   * Get file record
   */
  getFileRecord(filename: string): FileRecord | undefined {
    return this.fileRecords.get(filename);
  }
}

/**
 * Service for managing file access control
 * Ensures users can only access files they uploaded
 */
export class FileAccessControlService {
  private static store = new FileOwnershipStore();

  /**
   * Register a file upload
   * @param filename - Stored filename
   * @param userId - ID of user who uploaded
   * @param metadata - File metadata
   */
  static registerFileUpload(
    filename: string,
    userId: string,
    metadata: {
      originalName?: string;
      mimeType?: string;
      size?: number;
      applicationId?: string;
    }
  ): void {
    this.store.registerFile(filename, userId, metadata);
    console.log(`✓ File registered: ${filename} uploaded by user ${userId}`);
  }

  /**
   * Check if user can access a file
   * @param filename - File to check
   * @param userId - User ID
   * @param userRole - User's role (optional, for admin bypass)
   * @returns true if user can access file
   */
  static canUserAccessFile(filename: string, userId: string, userRole: string = 'Applicant'): boolean {
    const isAdmin = ['Admin', 'SuperAdmin', 'Audit'].includes(userRole);
    const canAccess = this.store.canAccessFile(filename, userId, isAdmin);

    if (!canAccess) {
      console.warn(`🚫 Access denied to file ${filename} by user ${userId}`);
    }

    return canAccess;
  }

  /**
   * Get all files uploaded by a user
   * @param userId - User ID
   * @returns List of files
   */
  static getUserUploadedFiles(userId: string): FileRecord[] {
    return this.store.getUserFiles(userId);
  }

  /**
   * Remove file access record
   * @param filename - File to remove
   */
  static removeFileRecord(filename: string): void {
    this.store.removeFile(filename);
    console.log(`✓ File record removed: ${filename}`);
  }

  /**
   * Get file metadata
   * @param filename - File to get metadata for
   * @returns File metadata or undefined
   */
  static getFileMetadata(filename: string): FileRecord | undefined {
    return this.store.getFileRecord(filename);
  }

  /**
   * Check if multiple files belong to user
   * @param filenames - Array of filenames
   * @param userId - User ID
   * @param userRole - User's role
   * @returns true if all files belong to user
   */
  static canUserAccessFiles(filenames: string[], userId: string, userRole: string = 'Applicant'): boolean {
    return filenames.every(filename => this.canUserAccessFile(filename, userId, userRole));
  }
}

export type { FileRecord };
