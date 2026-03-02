import { AuditLog } from '../models/AuditLog';
import { Application } from '../models/Application';
import { User } from '../models/User';
import mongoose from 'mongoose';

export interface AdminApprovalStats {
  adminId: string;
  adminEmail: string;
  adminName?: string;
  totalApprovals: number;
  totalRejections: number;
  approvalRate: number;
}

export interface SystemAnalytics {
  totalApplications: number;
  totalApproved: number;
  totalRejected: number;
  totalUnderReview: number;
  approvalRate: number;
  averageProcessingTime: number;
  adminStats: AdminApprovalStats[];
  topPerformingAdmin?: AdminApprovalStats;
}

export interface MonthlyReport {
  month: string;
  year: number;
  startDate: Date;
  endDate: Date;
  analytics: SystemAnalytics;
  generatedAt: Date;
}

export class AnalyticsService {
  /**
   * Get approval statistics for all admins
   */
  static async getAdminApprovalStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<AdminApprovalStats[]> {
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Get approval logs
    const approvalLogs = await AuditLog.find({
      ...query,
      action: 'APPROVE_APPLICATION',
    }).exec();

    // Get rejection logs
    const rejectionLogs = await AuditLog.find({
      ...query,
      action: 'REJECT_APPLICATION',
    }).exec();

    // Group by admin
    const statsMap = new Map<
      string,
      { adminId: string; adminEmail: string; adminName?: string; approvals: number; rejections: number }
    >();

    approvalLogs.forEach((log) => {
      const key = log.adminId.toString();
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          adminId: key,
          adminEmail: log.adminEmail,
          adminName: log.adminName,
          approvals: 0,
          rejections: 0,
        });
      }
      statsMap.get(key)!.approvals++;
    });

    rejectionLogs.forEach((log) => {
      const key = log.adminId.toString();
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          adminId: key,
          adminEmail: log.adminEmail,
          adminName: log.adminName,
          approvals: 0,
          rejections: 0,
        });
      }
      statsMap.get(key)!.rejections++;
    });

    // Convert to array and calculate rates
    const stats = Array.from(statsMap.values()).map((stat) => ({
      adminId: stat.adminId,
      adminEmail: stat.adminEmail,
      adminName: stat.adminName,
      totalApprovals: stat.approvals,
      totalRejections: stat.rejections,
      approvalRate:
        stat.approvals + stat.rejections > 0
          ? (stat.approvals / (stat.approvals + stat.rejections)) * 100
          : 0,
    }));

    return stats.sort((a, b) => b.totalApprovals - a.totalApprovals);
  }

  /**
   * Get overall system analytics
   */
  static async getSystemAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<SystemAnalytics> {
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Get application counts by status
    const totalApplications = await Application.countDocuments();
    const approved = await Application.countDocuments({
      status: 'Approved',
      ...query,
    });
    const rejected = await Application.countDocuments({
      status: 'Rejected',
      ...query,
    });
    const underReview = await Application.countDocuments({
      status: 'Under Review',
      ...query,
    });

    // Calculate approval rate
    const processed = approved + rejected;
    const approvalRate = processed > 0 ? (approved / processed) * 100 : 0;

    // Get admin stats
    const adminStats = await this.getAdminApprovalStats(startDate, endDate);

    // Find top performing admin
    const topPerformingAdmin = adminStats.length > 0 ? adminStats[0] : undefined;

    return {
      totalApplications,
      totalApproved: approved,
      totalRejected: rejected,
      totalUnderReview: underReview,
      approvalRate,
      averageProcessingTime: await this.getAverageProcessingTime(),
      adminStats,
      topPerformingAdmin,
    };
  }

  /**
   * Get average processing time (in hours)
   */
  private static async getAverageProcessingTime(): Promise<number> {
    const applications = await Application.find({ status: 'Approved' })
      .select('createdAt adminApprovals')
      .exec();

    if (applications.length === 0) return 0;

    const processingTimes = applications
      .filter((app) => app.adminApprovals && app.adminApprovals.length > 0 && app.adminApprovals[0].approvedAt)
      .map((app) => {
        const created = new Date(app.createdAt).getTime();
        const approved = new Date((app.adminApprovals[0] as any).approvedAt).getTime();
        return (approved - created) / (1000 * 60 * 60); // Convert to hours
      });

    if (processingTimes.length === 0) return 0;

    return processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  }

  /**
   * Generate monthly report
   */
  static async generateMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const analytics = await this.getSystemAnalytics(startDate, endDate);

    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
    });

    return {
      month: monthName,
      year,
      startDate,
      endDate,
      analytics,
      generatedAt: new Date(),
    };
  }

  /**
   * Get current month report
   */
  static async getCurrentMonthReport(): Promise<MonthlyReport> {
    const now = new Date();
    return this.generateMonthlyReport(now.getMonth() + 1, now.getFullYear());
  }

  /**
   * Get admin performance trend over time
   */
  static async getAdminPerformanceTrend(adminId: string, monthsBack: number = 6) {
    const trends = [];

    for (let i = 0; i < monthsBack; i++) {
      const now = new Date();
      const month = now.getMonth() - i;
      const year = month < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = month < 0 ? month + 12 : month;

      const startDate = new Date(year, adjustedMonth, 1);
      const endDate = new Date(year, adjustedMonth + 1, 0, 23, 59, 59);

      const approvals = await AuditLog.countDocuments({
        adminId: new mongoose.Types.ObjectId(adminId),
        action: 'APPROVE_APPLICATION',
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const rejections = await AuditLog.countDocuments({
        adminId: new mongoose.Types.ObjectId(adminId),
        action: 'REJECT_APPLICATION',
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const monthName = new Date(year, adjustedMonth).toLocaleDateString('en-US', {
        month: 'short',
      });

      trends.push({
        month: monthName,
        year,
        approvals,
        rejections,
        total: approvals + rejections,
      });
    }

    return trends.reverse();
  }
}
