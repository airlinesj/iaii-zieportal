import { Router, Request, Response } from 'express';
import { createGzip } from 'zlib';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/AuditService';
import { AnalyticsService } from '../services/AnalyticsService';
import { ReportExportService } from '../services/ReportExportService';
import { AuditRetentionService } from '../services/AuditRetentionService';
import AuditExportService from '../services/AuditExportService';
import { User } from '../models/User';

const router = Router();

// Middleware to check audit trail access
const auditAccessMiddleware = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only auditors (audit account type) can access audit logs
    if (user.role === 'Admin' && user.accountType === 'audit') {
      // Only audit-type admin accounts can access
      next();
      return;
    }

    // All other users (admins, superadmins, applicants, members) are blocked
    return res.status(403).json({
      message: 'Only auditors can access audit logs.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking audit access', error });
  }
};

// Get all audit logs (with filters)
router.get('/logs', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { adminId, action, resourceType, startDate, endDate, limit, skip } = req.query;

    const filters: any = {};
    if (adminId) filters.adminId = adminId;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (skip) filters.skip = parseInt(skip as string);

    const result = await AuditService.getAuditLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      limit: filters.limit || 50,
      skip: filters.skip || 0,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs', error });
  }
});

// Get audit logs for current admin
router.get('/my-activity', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const logs = await AuditService.getAdminActivity(userId as string, limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    res.status(500).json({ message: 'Error fetching admin activity', error });
  }
});

// Get system analytics
router.get('/system-analytics', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await AnalyticsService.getSystemAnalytics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({ message: 'Error fetching system analytics', error });
  }
});

// Get admin approval statistics
router.get('/admin-stats', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AnalyticsService.getAdminApprovalStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin stats', error });
  }
});

// Get monthly report
router.get('/monthly-report/:month/:year', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.params;

    const report = await AnalyticsService.generateMonthlyReport(
      parseInt(month),
      parseInt(year)
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'Error generating monthly report', error });
  }
});

// Get current month report
router.get('/monthly-report/current', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await AnalyticsService.getCurrentMonthReport();

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating current month report:', error);
    res.status(500).json({ message: 'Error generating current month report', error });
  }
});

// Get admin performance trend
router.get('/admin-trend/:adminId', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { adminId } = req.params;
    const { months } = req.query;

    const trend = await AnalyticsService.getAdminPerformanceTrend(
      adminId,
      months ? parseInt(months as string) : 6
    );

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    console.error('Error fetching admin trend:', error);
    res.status(500).json({ message: 'Error fetching admin trend', error });
  }
});

// Export audit logs as CSV
router.get('/export/csv', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, adminId, action } = req.query;

    const csv = await ReportExportService.generateCSV({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      adminId: adminId as string,
      action: action as string,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting CSV', error });
  }
});

// Export report as PDF
router.get('/export/pdf', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, action, type } = req.query;
    const reportType = (type as string) || 'audit-trail';

    let title = 'Audit Trail Report';
    let data: any = [];

    if (reportType === 'audit-trail') {
      const filters: any = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: 500,
      };
      
      // Add action filter if provided
      if (action) {
        filters.action = action as string;
      }
      
      const auditLogs = await AuditService.getAuditLogs(filters);
      data = auditLogs.logs;
    } else if (reportType === 'analytics') {
      title = 'Analytics Report';
      data = await AnalyticsService.getSystemAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No data available for export' });
    }

    const doc = await ReportExportService.generatePDF(title, data, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportType}-${new Date().toISOString()}.pdf"`
    );
    // Enable gzip compression for faster download
    res.setHeader('Content-Encoding', 'gzip');

    const gzip = createGzip();
    doc.pipe(gzip).pipe(res);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Error exporting PDF', error });
  }
});

// Get retention policy stats (Auditor only)
router.get('/retention/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin' || user.accountType !== 'audit') {
      return res.status(403).json({
        message: 'Only auditors can view retention policy stats.',
      });
    }

    const stats = await AuditRetentionService.getAuditLogStats();

    res.json({
      success: true,
      data: stats,
      policies: AuditRetentionService.getPolicies(),
    });
  } catch (error) {
    console.error('Error fetching retention stats:', error);
    res.status(500).json({ message: 'Error fetching retention stats', error });
  }
});

// Manually trigger retention policy (Auditor only)
router.post('/retention/apply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin' || user.accountType !== 'audit') {
      return res.status(403).json({
        message: 'Only auditors can trigger retention policies.',
      });
    }

    const { retentionDays } = req.body;
    if (!retentionDays || retentionDays < 1) {
      return res.status(400).json({ message: 'Invalid retention days' });
    }

    await AuditRetentionService.applyRetentionPolicy(retentionDays);

    res.json({
      success: true,
      message: `Retention policy applied: logs older than ${retentionDays} days deleted`,
    });
  } catch (error) {
    console.error('Error applying retention policy:', error);
    res.status(500).json({ message: 'Error applying retention policy', error });
  }
});

// === SuperAdmin Audit Management Routes ===

// Get all audit capable admins (SuperAdmin or Audit Admin)
router.get('/admin/audit-admins', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !(user.role === 'Admin' && user.accountType === 'audit')) {
      return res.status(403).json({
        message: 'Only auditors can manage audit permissions.',
      });
    }

    const auditAdmins = await User.find({
      $or: [
        { canAccessAuditTrail: true },
        { accountType: 'audit' },
      ],
    }).select('email accountType canAccessAuditTrail createdAt');

    res.json({
      success: true,
      data: auditAdmins,
    });
  } catch (error) {
    console.error('Error fetching audit admins:', error);
    res.status(500).json({ message: 'Error fetching audit admins', error });
  }
});

// Grant audit trail access to an admin
router.post('/admin/grant-access/:adminId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin' || user.accountType !== 'audit') {
      return res.status(403).json({
        message: 'Only auditors can grant audit permissions.',
      });
    }

    const { adminId } = req.params;
    const targetAdmin = await User.findById(adminId);

    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (targetAdmin.role !== 'Admin' && targetAdmin.accountType !== 'audit') {
      return res.status(400).json({
        message: 'Only admin accounts can be granted audit access',
      });
    }

    targetAdmin.canAccessAuditTrail = true;
    await targetAdmin.save();

    res.json({
      success: true,
      message: `Audit trail access granted to ${targetAdmin.email}`,
      data: targetAdmin,
    });
  } catch (error) {
    console.error('Error granting audit access:', error);
    res.status(500).json({ message: 'Error granting audit access', error });
  }
});

// Revoke audit trail access from an admin
router.post('/admin/revoke-access/:adminId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin' || user.accountType !== 'audit') {
      return res.status(403).json({
        message: 'Only auditors can revoke audit permissions.',
      });
    }

    const { adminId } = req.params;
    const targetAdmin = await User.findById(adminId);

    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.canAccessAuditTrail = false;
    await targetAdmin.save();

    res.json({
      success: true,
      message: `Audit trail access revoked from ${targetAdmin.email}`,
      data: targetAdmin,
    });
  } catch (error) {
    console.error('Error revoking audit access:', error);
    res.status(500).json({ message: 'Error revoking audit access', error });
  }
});

// Unlock a locked admin account
router.post('/admin/unlock/:adminId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin' || user.accountType !== 'audit') {
      return res.status(403).json({
        message: 'Only auditors can unlock accounts.',
      });
    }

    const { adminId } = req.params;
    const targetAdmin = await User.findById(adminId);

    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.locked = false;
    targetAdmin.lockedUntil = undefined;
    targetAdmin.failedLoginAttempts = 0;
    targetAdmin.lastFailedLogin = undefined;
    await targetAdmin.save();

    res.json({
      success: true,
      message: `Account unlocked for ${targetAdmin.email}`,
      data: targetAdmin,
    });
  } catch (error) {
    console.error('Error unlocking account:', error);
    res.status(500).json({ message: 'Error unlocking account', error });
  }
});

/**
 * AUDIT EXPORT ENDPOINTS
 * Auditors can export audit trail data as PDF or CSV
 */

// Export audit logs as PDF
router.get('/export/pdf', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const exportService = AuditExportService.getInstance();
    const { filePath, fileName } = await exportService.generateOnDemandReport(
      req.userId as string,
      'pdf',
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    // Enable gzip compression for faster download
    res.setHeader('Content-Encoding', 'gzip');
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending PDF file:', err);
      }
    });
  } catch (error: any) {
    console.error('Error exporting PDF:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF export',
      error: error.message,
    });
  }
});

// Export current audit logs as CSV (within 390 days)
router.get('/export/csv', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exportService = AuditExportService.getInstance();
    const { filePath, fileName } = await exportService.generateCurrentAuditReportCSV(
      req.userId as string
    );

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending CSV file:', err);
      }
    });
  } catch (error: any) {
    console.error('Error exporting current audit CSV:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV export',
      error: error.message,
    });
  }
});

// Export expired audit logs as CSV (390+ days old)
router.get('/export/csv-expired', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exportService = AuditExportService.getInstance();
    const { filePath, fileName } = await exportService.generateExpiredAuditReportCSV(
      req.userId as string
    );

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending expired audit CSV file:', err);
      }
    });
  } catch (error: any) {
    console.error('Error exporting expired audit CSV:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate expired audit CSV export',
      error: error.message,
    });
  }
});

// Get export availability info
router.get('/export/info', authMiddleware, auditAccessMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await AuditRetentionService.getAuditLogStats();

    res.json({
      success: true,
      message: 'Export information retrieved',
      data: {
        totalLogs: stats.totalLogs,
        oldestLog: stats.oldestLog,
        newestLog: stats.newestLog,
        retentionDays: 390,
        formats: ['pdf', 'csv'],
        info: 'Audit logs are retained for a non-negotiable 390 days. Data is kept in backend storage but not visible in frontend after retention period.',
      },
    });
  } catch (error: any) {
    console.error('Error getting export info:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve export information',
      error: error.message,
    });
  }
});

// Generate analytics report CSV export (Admin/SuperAdmin only)
router.get('/export/analytics-csv', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has admin role (use cached role from auth middleware)
    if (!req.userRole || (req.userRole !== 'Admin' && req.userRole !== 'SuperAdmin')) {
      return res.status(403).json({
        message: 'Only admins and superadmins can generate analytics reports.',
      });
    }

    const { startDate, endDate } = req.query;

    const csv = await ReportExportService.generateAnalyticsCSV(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting analytics CSV:', error);
    res.status(500).json({ message: 'Error exporting analytics CSV', error });
  }
});

// General analytics report download endpoint (for any admin/superadmin to use)
router.get('/export/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has admin role
    if (!req.userRole || (req.userRole !== 'Admin' && req.userRole !== 'SuperAdmin')) {
      return res.status(403).json({
        message: 'Only admins and superadmins can download analytics reports.',
      });
    }

    const { startDate, endDate } = req.query;

    const csv = await ReportExportService.generateAnalyticsCSV(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Error exporting analytics', error });
  }
});

export default router;
