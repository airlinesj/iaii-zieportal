import { AuditLog } from '../models/AuditLog';
import cron from 'node-cron';

export interface RetentionPolicy {
  name: string;
  retentionDays: number;
  cronSchedule: string;
  enabled: boolean;
}

export class AuditRetentionService {
  private static policies: RetentionPolicy[] = [
    {
      name: 'Default Policy (90 days)',
      retentionDays: 90,
      cronSchedule: '0 2 * * *', // Run daily at 2 AM
      enabled: true,
    },
    {
      name: 'Long Term Storage (1 year)',
      retentionDays: 365,
      cronSchedule: '0 3 * * 0', // Run weekly on Sundays at 3 AM
      enabled: false,
    },
  ];

  static initializeRetention(): void {
    console.log('Initializing audit retention policies...');

    const activePolicy = this.policies.find((p) => p.enabled);
    if (!activePolicy) {
      console.warn('No active retention policy found');
      return;
    }

    console.log(`Audit retention enabled: ${activePolicy.name} (${activePolicy.retentionDays} days)`);

    // Schedule the retention job
    cron.schedule(activePolicy.cronSchedule, async () => {
      try {
        await this.applyRetentionPolicy(activePolicy.retentionDays);
      } catch (error) {
        console.error('Error applying retention policy:', error);
      }
    });
  }

  /**
   * Apply retention policy to clean up old audit logs
   */
  static async applyRetentionPolicy(retentionDays: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      console.log(`Retention policy applied: Deleted ${result.deletedCount} audit logs older than ${retentionDays} days`);

      // Archive the count
      const archivedCount = result.deletedCount;
      const archiveDate = new Date().toISOString();
      console.log(`Archive entry: [${archiveDate}] Archived ${archivedCount} records`);
    } catch (error) {
      console.error('Error applying retention policy:', error);
      throw error;
    }
  }

  /**
   * Get current retention policies
   */
  static getPolicies(): RetentionPolicy[] {
    return this.policies;
  }

  /**
   * Update retention policy
   */
  static updatePolicy(name: string, newPolicy: Partial<RetentionPolicy>): void {
    const policy = this.policies.find((p) => p.name === name);
    if (policy) {
      Object.assign(policy, newPolicy);
      console.log(`Updated retention policy: ${name}`);
    }
  }

  /**
   * Enable/disable a policy by name
   */
  static setPolicy(name: string, enabled: boolean): void {
    const policy = this.policies.find((p) => p.name === name);
    if (policy) {
      policy.enabled = enabled;
      // Disable other policies if enabling this one
      if (enabled) {
        this.policies.forEach((p) => {
          if (p.name !== name && p.enabled) {
            p.enabled = false;
          }
        });
      }
      console.log(`Retention policy '${name}' is now ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get stats about stored audit logs
   */
  static async getAuditLogStats(): Promise<{
    totalLogs: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    logsToDelete: number;
  }> {
    try {
      const totalLogs = await AuditLog.countDocuments();
      const oldestLog = await AuditLog.findOne().sort({ createdAt: 1 }).lean();
      const newestLog = await AuditLog.findOne().sort({ createdAt: -1 }).lean();

      // Count logs that would be deleted with current policy
      const activePolicy = this.policies.find((p) => p.enabled);
      const cutoffDate = new Date();
      if (activePolicy) {
        cutoffDate.setDate(cutoffDate.getDate() - activePolicy.retentionDays);
      }

      const logsToDelete = await AuditLog.countDocuments({
        createdAt: { $lt: cutoffDate },
      });

      return {
        totalLogs,
        oldestLog: oldestLog?.createdAt || null,
        newestLog: newestLog?.createdAt || null,
        logsToDelete,
      };
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      throw error;
    }
  }
}
