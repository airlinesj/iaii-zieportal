import { AuditLog } from '../models/AuditLog';
import { sendEmail } from './emailService';

export interface AuditAlert {
  type: 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED' | 'MULTIPLE_FAILED_LOGINS' | 'BULK_APPROVALS';
  adminEmail: string;
  adminName?: string;
  message: string;
  details?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class AuditNotificationService {
  /**
   * Check for suspicious activities and send notifications
   */
  static async checkSuspiciousActivities(): Promise<void> {
    try {
      // Check for multiple failed logins in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const failedLogins = await AuditLog.aggregate([
        {
          $match: {
            action: 'LOGIN',
            status: 'FAILURE',
            createdAt: { $gte: oneHourAgo },
          },
        },
        {
          $group: {
            _id: '$adminEmail',
            count: { $sum: 1 },
            adminName: { $first: '$adminName' },
          },
        },
        {
          $match: { count: { $gte: 5 } }, // 5+ failed attempts in one hour still triggers notification
        },
      ]);

      for (const record of failedLogins) {
        await this.sendAlert({
          type: 'MULTIPLE_FAILED_LOGINS',
          adminEmail: record._id,
          adminName: record.adminName,
          message: `Multiple failed login attempts detected (${record.count} attempts in the last hour)`,
          severity: 'HIGH',
          details: { attemptCount: record.count },
        });
      }

      // Check for bulk approvals (more than 20 in 1 hour)
      const bulkApprovals = await AuditLog.aggregate([
        {
          $match: {
            action: 'APPROVE_APPLICATION',
            createdAt: { $gte: oneHourAgo },
          },
        },
        {
          $group: {
            _id: '$adminId',
            count: { $sum: 1 },
            adminEmail: { $first: '$adminEmail' },
            adminName: { $first: '$adminName' },
          },
        },
        {
          $match: { count: { $gte: 20 } },
        },
      ]);

      for (const record of bulkApprovals) {
        await this.sendAlert({
          type: 'BULK_APPROVALS',
          adminEmail: record.adminEmail,
          adminName: record.adminName,
          message: `Unusual approval activity detected (${record.count} approvals in the last hour)`,
          severity: 'MEDIUM',
          details: { approvalCount: record.count },
        });
      }
    } catch (error) {
      console.error('Error checking suspicious activities:', error);
    }
  }

  /**
   * Send an alert notification
   */
  private static async sendAlert(alert: AuditAlert): Promise<void> {
    try {
      const alertEmails = process.env.AUDIT_ALERT_EMAILS?.split(',') || [];
      
      if (alertEmails.length === 0) {
        console.log('No audit alert emails configured');
        return;
      }

      const subject = `[AUDIT ALERT - ${alert.severity}] ${alert.type}`;
      const htmlContent = `
        <h2>Security Alert</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Admin:</strong> ${alert.adminEmail}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        ${alert.details ? `<p><strong>Details:</strong> ${JSON.stringify(alert.details)}</p>` : ''}
        <p>Timestamp: ${new Date().toISOString()}</p>
      `;

      for (const email of alertEmails) {
        await sendEmail(
          email.trim(),
          subject,
          htmlContent
        );
      }
    } catch (error) {
      console.error('Error sending audit alert:', error);
    }
  }

  /**
   * Notify when an account is locked
   */
  static async notifyAccountLocked(email: string, adminName?: string): Promise<void> {
    await this.sendAlert({
      type: 'ACCOUNT_LOCKED',
      adminEmail: email,
      adminName,
      message: `Admin account locked due to multiple failed login attempts`,
      severity: 'CRITICAL',
    });
  }
}
