import { AuditLog } from '../models/AuditLog';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { AnalyticsService } from './AnalyticsService';

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  adminId?: string;
  action?: string;
}

export class ReportExportService {
  /**
   * Generate CSV export of analytics report
   */
  static async generateAnalyticsCSV(startDate?: Date, endDate?: Date): Promise<string> {
    try {
      const report = await AnalyticsService.generateAnalyticsReport(startDate, endDate);
      const { summary, reportPeriod } = report;

      // Build CSV content with multiple sections
      const lines: string[] = [];

      // Header
      lines.push('Zimbabwe Institution of Engineers - Analytics Report');
      lines.push(`Generated: ${new Date().toISOString()}`);
      if (reportPeriod.startDate || reportPeriod.endDate) {
        lines.push(
          `Report Period: ${reportPeriod.startDate?.toLocaleDateString() || 'N/A'} to ${reportPeriod.endDate?.toLocaleDateString() || 'N/A'}`
        );
      }
      lines.push('');

      // System Overview
      lines.push('SYSTEM OVERVIEW');
      lines.push('Metric,Value');
      lines.push(`Total Applications,${summary.totalApplications}`);
      lines.push(`Approved Applications,${summary.totalApproved}`);
      lines.push(`Rejected Applications,${summary.totalRejected}`);
      lines.push(`Under Review Applications,${summary.totalUnderReview}`);
      lines.push(`Approval Rate,${summary.approvalRate.toFixed(2)}%`);
      lines.push(`Average Processing Time,${summary.averageProcessingTime.toFixed(2)} hours`);
      lines.push('');

      // Payment Statistics
      lines.push('PAYMENT STATISTICS');
      lines.push('Status,Count');
      lines.push(`Pending Payments,${summary.paymentStats.totalPaymentsPending}`);
      lines.push(`Completed Payments,${summary.paymentStats.totalPaymentsCompleted}`);
      lines.push(`Failed Payments,${summary.paymentStats.totalPaymentsFailed}`);
      lines.push(`Payment Completion Rate,${summary.paymentStats.completionRate.toFixed(2)}%`);
      lines.push('');

      // Admin Performance
      if (summary.adminStats && summary.adminStats.length > 0) {
        lines.push('ADMIN PERFORMANCE');
        lines.push('Admin Email,Admin Name,Total Approvals,Total Rejections,Approval Rate (%)');
        summary.adminStats.forEach((admin) => {
          const escapeCsvValue = (value: string): string => {
            if (!value) return '';
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          };

          lines.push(
            `${escapeCsvValue(admin.adminEmail)},${escapeCsvValue(admin.adminName || '')},${admin.totalApprovals},${admin.totalRejections},${admin.approvalRate.toFixed(2)}`
          );
        });
      }

      return lines.join('\n');
    } catch (error) {
      console.error('Error generating analytics CSV:', error);
      throw error;
    }
  }

  /**
   * Generate CSV export of audit logs
   */
  static async generateCSV(options?: ExportOptions): Promise<string> {
    try {
      const query: any = {};
      
      if (options?.startDate || options?.endDate) {
        query.createdAt = {};
        if (options?.startDate) query.createdAt.$gte = options.startDate;
        if (options?.endDate) query.createdAt.$lte = options.endDate;
      }
      if (options?.adminId) query.adminId = options.adminId;
      if (options?.action) query.action = options.action;

      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      // CSV headers
      const headers = [
        'Timestamp',
        'Admin Email',
        'Admin Name',
        'Action',
        'Resource Type',
        'Resource ID',
        'Description',
        'Status',
        'IP Address',
        'Error Message',
      ];

      // Convert logs to CSV rows
      const rows = logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.adminEmail,
        log.adminName || '',
        log.action,
        log.resourceType,
        log.resourceId?.toString() || '',
        log.description,
        log.status,
        log.ipAddress || '',
        log.errorMessage || '',
      ]);

      // Escape CSV values
      const escapeCsvValue = (value: string): string => {
        if (typeof value !== 'string') return '';
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => row.map(escapeCsvValue).join(',')),
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  }

  /**
   * Generate PDF export of audit logs or reports
   */
  static async generatePDF(
    title: string,
    data: any,
    options?: ExportOptions
  ): Promise<any> {
    try {
      const doc = new PDFDocument();

      // Add header
      doc.fontSize(20).font('Helvetica-Bold').text(title, 100, 50);
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toISOString()}`, 100, 80);
      doc.moveDown(2);

      // Add date range if provided
      if (options?.startDate || options?.endDate) {
        const dateRange = `Date Range: ${options?.startDate?.toLocaleDateString() || 'N/A'} to ${options?.endDate?.toLocaleDateString() || 'N/A'}`;
        doc.text(dateRange, 100, doc.y);
        doc.moveDown();
      }

      // Add horizontal line
      doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown();

      // Add content based on data type
      if (title.includes('Audit Trail')) {
        this.addAuditTrailToPDF(doc, data);
      } else if (title.includes('Analytics') || title.includes('Report')) {
        this.addAnalyticsToPDF(doc, data);
      } else {
        doc.text(JSON.stringify(data, null, 2));
      }

      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Add audit trail data to PDF
   */
  private static addAuditTrailToPDF(doc: any, logs: any[]): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Audit Trail Records', 100, doc.y);
    doc.moveDown();

    logs.forEach((log, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index + 1}:`, 100, doc.y);
      doc.fontSize(9)
        .font('Helvetica')
        .text(`Timestamp: ${new Date(log.createdAt).toLocaleString()}`)
        .text(`Admin: ${log.adminEmail}`)
        .text(`Action: ${log.action}`)
        .text(`Resource: ${log.resourceType}`)
        .text(`Description: ${log.description}`)
        .text(`Status: ${log.status}`);

      if (log.ipAddress) {
        doc.text(`IP Address: ${log.ipAddress}`);
      }

      doc.moveDown();

      // Add page break if content is too long
      if (doc.y > 700) {
        doc.addPage();
      }
    });
  }

  /**
   * Add analytics data to PDF
   */
  private static addAnalyticsToPDF(doc: any, analytics: any): void {
    doc.fontSize(12).font('Helvetica-Bold').text('System Analytics Summary', 100, doc.y);
    doc.moveDown();

    const data = [
      ['Total Applications', analytics.totalApplications],
      ['Approved', analytics.totalApproved],
      ['Rejected', analytics.totalRejected],
      ['Under Review', analytics.totalUnderReview],
      ['Approval Rate', `${analytics.approvalRate.toFixed(1)}%`],
      ['Avg Processing Time', `${analytics.averageProcessingTime.toFixed(1)} hours`],
    ];

    doc.fontSize(10);
    data.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, 100, doc.y, { width: 200, continued: true });
      doc.font('Helvetica').text(`: ${value}`, { width: 300 });
    });

    if (analytics.adminStats && analytics.adminStats.length > 0) {
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Admin Performance');
      doc.moveDown();

      analytics.adminStats.slice(0, 10).forEach((admin: any) => {
        doc.fontSize(9)
          .font('Helvetica')
          .text(`${admin.adminEmail}: ${admin.totalApprovals} approvals, ${admin.approvalRate.toFixed(1)}% rate`);
      });
    }
  }
}
