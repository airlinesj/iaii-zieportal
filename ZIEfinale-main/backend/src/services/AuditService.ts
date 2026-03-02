import { AuditLog, IAuditLog } from '../models/AuditLog';
import { Request } from 'express';

export class AuditService {
  /**
   * Log an audit event
   */
  static async logAction(
    adminId: string,
    adminEmail: string,
    action: IAuditLog['action'],
    resourceType: string,
    resourceId: string | any,
    description: string,
    options?: {
      changes?: { before?: any; after?: any };
      ipAddress?: string;
      userAgent?: string;
      status?: 'SUCCESS' | 'FAILURE';
      errorMessage?: string;
      adminName?: string;
    }
  ): Promise<IAuditLog> {
    try {
      const auditLog = new AuditLog({
        adminId,
        adminEmail,
        adminName: options?.adminName,
        action,
        resourceType,
        resourceId,
        description,
        changes: options?.changes,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        status: options?.status || 'SUCCESS',
        errorMessage: options?.errorMessage,
      });

      return await auditLog.save();
    } catch (error) {
      console.error('Failed to log audit action:', error);
      throw error;
    }
  }

  /**
   * Log login action
   */
  static async logLogin(
    adminId: string,
    adminEmail: string,
    adminName: string | undefined,
    req: Request
  ): Promise<IAuditLog> {
    return this.logAction(
      adminId,
      adminEmail,
      'LOGIN',
      'User',
      adminId,
      `Admin ${adminEmail} logged in`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        adminName,
      }
    );
  }

  /**
   * Log logout action
   */
  static async logLogout(
    adminId: string,
    adminEmail: string,
    adminName: string | undefined,
    req: Request
  ): Promise<IAuditLog> {
    return this.logAction(
      adminId,
      adminEmail,
      'LOGOUT',
      'User',
      adminId,
      `Admin ${adminEmail} logged out`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        adminName,
      }
    );
  }

  /**
   * Log application approval
   */
  static async logApproval(
    adminId: string,
    adminEmail: string,
    adminName: string | undefined,
    applicationId: string,
    applicantEmail: string,
    req: Request
  ): Promise<IAuditLog> {
    return this.logAction(
      adminId,
      adminEmail,
      'APPROVE_APPLICATION',
      'Application',
      applicationId,
      `Application from ${applicantEmail} approved by ${adminEmail}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        adminName,
      }
    );
  }

  /**
   * Log application rejection
   */
  static async logRejection(
    adminId: string,
    adminEmail: string,
    adminName: string | undefined,
    applicationId: string,
    applicantEmail: string,
    rejectionReason: string,
    req: Request
  ): Promise<IAuditLog> {
    return this.logAction(
      adminId,
      adminEmail,
      'REJECT_APPLICATION',
      'Application',
      applicationId,
      `Application from ${applicantEmail} rejected: ${rejectionReason}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        adminName,
      }
    );
  }

  /**
   * Log grade assignment
   */
  static async logGradeAssignment(
    adminId: string,
    adminEmail: string,
    adminName: string | undefined,
    applicantId: string,
    grade: string,
    division: string,
    req: Request
  ): Promise<IAuditLog> {
    return this.logAction(
      adminId,
      adminEmail,
      'ASSIGN_GRADE',
      'User',
      applicantId,
      `Assigned grade ${grade} (${division}) to applicant ID ${applicantId}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        adminName,
      }
    );
  }

  /**
   * Get all audit logs (with filters)
   */
  static async getAuditLogs(
    filters?: {
      adminId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const query: any = {};

    if (filters?.adminId) query.adminId = filters.adminId;
    if (filters?.action) query.action = filters.action;
    if (filters?.resourceType) query.resourceType = filters.resourceType;

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters?.startDate) query.createdAt.$gte = filters.startDate;
      if (filters?.endDate) query.createdAt.$lte = filters.endDate;
    }

    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    const total = await AuditLog.countDocuments(query);

    return { logs, total };
  }

  /**
   * Get recent activity for a specific admin
   */
  static async getAdminActivity(
    adminId: string,
    limit: number = 20
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
