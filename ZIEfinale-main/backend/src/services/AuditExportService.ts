/**
 * AuditExportService
 * Generates PDF and CSV exports of audit logs
 * Handles retention policy exports and on-demand auditor downloads
 */

import { AuditLog, IAuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { sendEmail } from './emailService';

interface ExportOptions {
  format: 'pdf' | 'csv';
  startDate?: Date;
  endDate?: Date;
  adminId?: string;
  action?: string;
  limit?: number;
}

export class AuditExportService {
  private static instance: AuditExportService;
  private exportDir = path.join(process.cwd(), 'audit_exports');

  private constructor() {
    this.ensureExportDirectory();
  }

  static getInstance(): AuditExportService {
    if (!AuditExportService.instance) {
      AuditExportService.instance = new AuditExportService();
    }
    return AuditExportService.instance;
  }

  private ensureExportDirectory(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
      console.log(`✓ Created audit exports directory: ${this.exportDir}`);
    }
  }

  /**
   * Generate audit report (PDF or CSV)
   */
  async generateReport(options: ExportOptions): Promise<{ filePath: string; fileName: string }> {
    try {
      const logs = await this.fetchAuditLogs(options);

      if (logs.length === 0) {
        throw new Error('No audit logs found for the specified criteria');
      }

      let filePath: string;
      let fileName: string;

      if (options.format === 'pdf') {
        ({ filePath, fileName } = await this.generatePDF(logs));
      } else {
        ({ filePath, fileName } = await this.generateCSV(logs));
      }

      console.log(`✓ Generated audit report: ${fileName}`);
      return { filePath, fileName };
    } catch (error: any) {
      console.error('Error generating audit report:', error.message);
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(logs: IAuditLog[]): Promise<{ filePath: string; fileName: string }> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `audit-report-${Date.now()}.pdf`;
        const filePath = path.join(this.exportDir, fileName);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('ZIE Audit Trail Report', { align: 'center' });
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.text(`Total Records: ${logs.length}`, { align: 'center' });
        doc.moveDown();

        // Summary Statistics
        doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics', { underline: true });
        doc.fontSize(10).font('Helvetica');

        const actionCounts = this.getActionCounts(logs);
        const statusCounts = this.getStatusCounts(logs);

        doc.text(`Total Audit Logs: ${logs.length}`);
        doc.text(`Date Range: ${logs[logs.length - 1]?.createdAt?.toLocaleDateString() || 'N/A'} to ${logs[0]?.createdAt?.toLocaleDateString() || 'N/A'}`);
        doc.text(`Successful Actions: ${statusCounts.success}`);
        doc.text(`Failed Actions: ${statusCounts.failure}`);
        doc.moveDown();

        // Action Breakdown
        doc.fontSize(11).font('Helvetica-Bold').text('Action Breakdown:', { underline: true });
        doc.fontSize(9).font('Helvetica');
        Object.entries(actionCounts).forEach(([action, count]) => {
          doc.text(`  • ${action}: ${count}`);
        });
        doc.moveDown();

        // Page break before table
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('Detailed Audit Log', { underline: true });
        doc.moveDown(0.5);

        // Table headers
        const tableTop = doc.y;
        const colWidths = {
          date: 80,
          admin: 80,
          action: 80,
          resource: 70,
          status: 50,
        };
        const rowHeight = 12;

        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Date', 50, tableTop, { width: colWidths.date });
        doc.text('Admin', 50 + colWidths.date, tableTop, { width: colWidths.admin });
        doc.text('Action', 50 + colWidths.date + colWidths.admin, tableTop, { width: colWidths.action });
        doc.text('Resource', 50 + colWidths.date + colWidths.admin + colWidths.action, tableTop, { width: colWidths.resource });
        doc.text('Status', 50 + colWidths.date + colWidths.admin + colWidths.action + colWidths.resource, tableTop, { width: colWidths.status });

        // Draw line under header
        doc.moveTo(50, tableTop + rowHeight).lineTo(550, tableTop + rowHeight).stroke();

        // Table rows
        let currentY = tableTop + rowHeight + 5;
        doc.fontSize(7).font('Helvetica');

        for (const log of logs) {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const dateStr = new Date(log.createdAt).toLocaleDateString() + ' ' + new Date(log.createdAt).toLocaleTimeString();
          const adminName = log.adminName || log.adminEmail.split('@')[0];

          doc.text(dateStr, 50, currentY, { width: colWidths.date, ellipsis: true });
          doc.text(adminName, 50 + colWidths.date, currentY, { width: colWidths.admin, ellipsis: true });
          doc.text(log.action, 50 + colWidths.date + colWidths.admin, currentY, { width: colWidths.action, ellipsis: true });
          doc.text(log.resourceType, 50 + colWidths.date + colWidths.admin + colWidths.action, currentY, { width: colWidths.resource, ellipsis: true });

          const statusColor = log.status === 'SUCCESS' ? '#27ae60' : '#e74c3c';
          doc.fillColor(statusColor).text(log.status, 50 + colWidths.date + colWidths.admin + colWidths.action + colWidths.resource, currentY, { width: colWidths.status });
          doc.fillColor('black');

          currentY += rowHeight;
        }

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#999');
        doc.text('Confidential - For Audit and Compliance Purposes Only', 50, 750, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate CSV report
   */
  private async generateCSV(logs: IAuditLog[]): Promise<{ filePath: string; fileName: string }> {
    try {
      const fileName = `audit-report-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, fileName);

      // CSV headers
      const headers = ['Date', 'Time', 'Admin Name', 'Admin Email', 'Action', 'Resource Type', 'Resource ID', 'Description', 'Status', 'IP Address', 'Changes'];

      // CSV rows
      const rows = logs.map((log) => [
        new Date(log.createdAt).toLocaleDateString(),
        new Date(log.createdAt).toLocaleTimeString(),
        log.adminName || 'N/A',
        log.adminEmail,
        log.action,
        log.resourceType,
        String(log.resourceId),
        log.description.replace(/"/g, '""'), // Escape quotes
        log.status,
        log.ipAddress || 'N/A',
        log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : 'N/A',
      ]);

      // Write CSV file
      const csvContent = [
        headers.map((h) => `"${h}"`).join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      fs.writeFileSync(filePath, csvContent, 'utf-8');

      console.log(`✓ Generated CSV report: ${fileName}`);
      return { filePath, fileName };
    } catch (error: any) {
      console.error('Error generating CSV:', error.message);
      throw error;
    }
  }

  /**
   * Fetch audit logs based on criteria
   */
  private async fetchAuditLogs(options: ExportOptions): Promise<IAuditLog[]> {
    try {
      const query: any = {};

      if (options.startDate) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$gte = options.startDate;
      }

      if (options.endDate) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = options.endDate;
      }

      if (options.adminId) {
        query.adminId = options.adminId;
      }

      if (options.action) {
        query.action = options.action;
      }

      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10000)
        .lean();

      return logs;
    } catch (error: any) {
      console.error('Error fetching audit logs:', error.message);
      throw error;
    }
  }

  /**
   * Count actions by type
   */
  private getActionCounts(logs: IAuditLog[]): Record<string, number> {
    return logs.reduce(
      (counts, log) => {
        counts[log.action] = (counts[log.action] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Count by status
   */
  private getStatusCounts(logs: IAuditLog[]): { success: number; failure: number } {
    return logs.reduce(
      (counts, log) => {
        if (log.status === 'SUCCESS') {
          counts.success++;
        } else {
          counts.failure++;
        }
        return counts;
      },
      { success: 0, failure: 0 }
    );
  }

  /**
   * Export logs before retention deletion and email to auditors/superadmins
   */
  async exportBeforeDeletion(retentionDays: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Get all logs to be deleted
      const logsToExport = await AuditLog.find({ createdAt: { $lt: cutoffDate } });

      if (logsToExport.length === 0) {
        console.log(`ℹ️ No audit logs to export (retention: ${retentionDays} days)`);
        return;
      }

      console.log(`Exporting ${logsToExport.length} audit logs before deletion...`);

      // Generate both PDF and CSV
      const pdfResult = await this.generateReport({
        format: 'pdf',
        startDate: new Date('2000-01-01'),
        endDate: cutoffDate,
      });

      const csvResult = await this.generateReport({
        format: 'csv',
        startDate: new Date('2000-01-01'),
        endDate: cutoffDate,
      });

      // Get all users with auditor rights
      const auditors = await User.find({
        $or: [
          { role: 'Audit' },
          { accountType: 'audit' },
          { role: 'SuperAdmin' },
        ],
        email: { $exists: true },
      });

      if (auditors.length === 0) {
        console.warn('⚠️ No auditors or superadmins found to send export files');
        return;
      }

      // Send emails to each auditor/superadmin
      for (const auditor of auditors) {
        try {
          await this.sendAuditExportEmail(
            auditor.email,
            auditor.email,
            pdfResult.filePath,
            csvResult.filePath,
            logsToExport.length
          );
        } catch (err) {
          console.error(`Failed to send export to ${auditor.email}:`, err);
        }
      }

      console.log(`✓ Audit export complete: ${auditors.length} recipients notified`);
    } catch (error: any) {
      console.error('Error exporting before deletion:', error.message);
    }
  }

  /**
   * Send audit export files via email
   */
  private async sendAuditExportEmail(
    recipientEmail: string,
    recipientName: string,
    pdfPath: string,
    csvPath: string,
    logCount: number
  ): Promise<void> {
    try {
      // Read file buffers
      const pdfBuffer = await fs.promises.readFile(pdfPath);
      const csvBuffer = await fs.promises.readFile(csvPath);

      const transporter = require('nodemailer').createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <h2 style="color: #004A59;">📊 Audit Trail Export - 390 Day Cycle Complete</h2>
              
              <p>Dear <strong>${recipientName}</strong>,</p>
              
              <p>Your automated audit trail export has been generated as part of our 390-day retention and archival policy.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Export Details:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Total Records Exported: <strong>${logCount.toLocaleString()}</strong></li>
                  <li>Export Date: <strong>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</strong></li>
                  <li>File Formats: PDF and CSV</li>
                  <li>Retention Cycle: 390 Days</li>
                </ul>
              </div>
              
              <p><strong>Attached Files:</strong></p>
              <ul>
                <li>📄 audit-report.pdf - Full report with analysis and summary</li>
                <li>📊 audit-report.csv - Detailed data in spreadsheet format</li>
              </ul>
              
              <p style="color: #666; font-size: 14px;">
                These files contain all audit trail records from the completed 390-day cycle. 
                Please store these securely for compliance and archival purposes.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="font-size: 12px; color: #666;">
                This is an automated message from the The ZImbabwe Institution of Engineers Membership Portal audit system.
              </p>
            </div>
          </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipientEmail,
        subject: `📊 Audit Trail Export - 390 Day Cycle Complete`,
        html: htmlContent,
        attachments: [
          {
            filename: path.basename(pdfPath),
            path: pdfPath,
          },
          {
            filename: path.basename(csvPath),
            path: csvPath,
          },
        ],
      };

      await transporter.sendMail(mailOptions);

      console.log(`✉️ Audit export email sent to ${recipientEmail}`);
    } catch (error: any) {
      console.error('Error sending audit export email:', error.message);
      throw error;
    }
  }

  /**
   * Generate on-demand report for auditor
   */
  async generateOnDemandReport(
    auditorId: string,
    format: 'pdf' | 'csv' = 'pdf',
    startDate?: Date,
    endDate?: Date
  ): Promise<{ filePath: string; fileName: string }> {
    try {
      const auditor = await User.findById(auditorId);
      if (!auditor || (auditor.role !== 'Admin' && auditor.role !== 'SuperAdmin')) {
        throw new Error('Only admins/superadmins can generate audit reports');
      }

      // For auditor type accounts, allow access
      if (auditor.role === 'Admin' && auditor.accountType !== 'audit') {
        throw new Error('Only auditor accounts can generate audit reports');
      }

      console.log(`Generating on-demand ${format.toUpperCase()} report for auditor: ${auditor.email}`);

      return await this.generateReport({
        format,
        startDate,
        endDate,
      });
    } catch (error: any) {
      console.error('Error generating on-demand report:', error.message);
      throw error;
    }
  }

  /**
   * Generate CSV export of current audit logs (within 390 days)
   */
  async generateCurrentAuditReportCSV(auditorId: string): Promise<{ filePath: string; fileName: string }> {
    try {
      const auditor = await User.findById(auditorId);
      if (!auditor || (auditor.role !== 'Admin' && auditor.role !== 'SuperAdmin')) {
        throw new Error('Only admins/superadmins can generate audit reports');
      }

      // For auditor type accounts, allow access
      if (auditor.role === 'Admin' && auditor.accountType !== 'audit') {
        throw new Error('Only auditor accounts can generate audit reports');
      }

      // Get logs within the retention period (less than 390 days old)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 390);

      const logs = await AuditLog.find({
        createdAt: { $gte: cutoffDate }
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (logs.length === 0) {
        throw new Error('No current audit logs found');
      }

      return await this.generateCSVFromLogs(logs, 'current-audit-trail');
    } catch (error: any) {
      console.error('Error generating current audit report:', error.message);
      throw error;
    }
  }

  /**
   * Generate CSV export of expired audit logs (390+ days old)
   */
  async generateExpiredAuditReportCSV(auditorId: string): Promise<{ filePath: string; fileName: string }> {
    try {
      const auditor = await User.findById(auditorId);
      if (!auditor || (auditor.role !== 'Admin' && auditor.role !== 'SuperAdmin')) {
        throw new Error('Only admins/superadmins can generate audit reports');
      }

      // For auditor type accounts, allow access
      if (auditor.role === 'Admin' && auditor.accountType !== 'audit') {
        throw new Error('Only auditor accounts can generate audit reports');
      }

      // Get logs beyond the retention period (390+ days old)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 390);

      const logs = await AuditLog.find({
        createdAt: { $lt: cutoffDate }
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (logs.length === 0) {
        throw new Error('No expired audit logs found. All logs are within the 390-day retention period.');
      }

      return await this.generateCSVFromLogs(logs, 'expired-audit-trail');
    } catch (error: any) {
      console.error('Error generating expired audit report:', error.message);
      throw error;
    }
  }

  /**
   * Helper method to generate CSV from logs
   */
  private async generateCSVFromLogs(logs: IAuditLog[], reportName: string): Promise<{ filePath: string; fileName: string }> {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${reportName}-${timestamp}-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, fileName);

      // CSV headers
      const headers = ['Date', 'Time', 'Admin Name', 'Admin Email', 'Action', 'Resource Type', 'Resource ID', 'Description', 'Status', 'IP Address', 'Changes'];

      // CSV rows
      const rows = logs.map((log) => [
        new Date(log.createdAt).toLocaleDateString(),
        new Date(log.createdAt).toLocaleTimeString(),
        log.adminName || log.adminEmail.split('@')[0],
        log.adminEmail,
        log.action,
        log.resourceType,
        log.resourceId,
        log.description,
        log.status,
        log.ipAddress || 'N/A',
        log.changes ? JSON.stringify(log.changes) : '',
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell || '');
              // Escape cells with commas, quotes, or newlines
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      fs.writeFileSync(filePath, csvContent, 'utf-8');
      console.log(`✓ Generated CSV export: ${fileName}`);

      return { filePath, fileName };
    } catch (error: any) {
      console.error('Error generating CSV:', error.message);
      throw error;
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const files = fs.readdirSync(this.exportDir);

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          console.log(`✓ Deleted old export: ${file}`);
        }
      }
    } catch (error: any) {
      console.error('Error cleaning up exports:', error.message);
    }
  }
}

export default AuditExportService;
