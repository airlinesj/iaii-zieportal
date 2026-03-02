import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface AdminStats {
  adminId: string;
  adminEmail: string;
  adminName?: string;
  totalApprovals: number;
  totalRejections: number;
  approvalRate: number;
}

interface SystemAnalytics {
  totalApplications: number;
  totalApproved: number;
  totalRejected: number;
  totalUnderReview: number;
  approvalRate: number;
  averageProcessingTime: number;
  adminStats: AdminStats[];
  topPerformingAdmin?: AdminStats;
}

interface MonthlyReport {
  month: string;
  year: number;
  analytics: SystemAnalytics;
  generatedAt: Date;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-wrapper">
      <div class="analytics-header">
        <h2>System Analytics & Reports</h2>
        <p>Monitor admin performance and system statistics</p>
      </div>

      <!-- System Overview Cards -->
      <div class="overview-cards">
        <div class="card">
          <h3>Total Applications</h3>
          <p class="stat-value">{{ systemAnalytics?.totalApplications || 0 }}</p>
        </div>
        <div class="card">
          <h3>Approved</h3>
          <p class="stat-value approved">{{ systemAnalytics?.totalApproved || 0 }}</p>
        </div>
        <div class="card">
          <h3>Rejected</h3>
          <p class="stat-value rejected">{{ systemAnalytics?.totalRejected || 0 }}</p>
        </div>
        <div class="card">
          <h3>Under Review</h3>
          <p class="stat-value pending">{{ systemAnalytics?.totalUnderReview || 0 }}</p>
        </div>
        <div class="card">
          <h3>Approval Rate</h3>
          <p class="stat-value">{{ systemAnalytics?.approvalRate !== undefined ? systemAnalytics!.approvalRate.toFixed(1) : 0 }}%</p>
        </div>
        <div class="card">
          <h3>Avg Processing Time</h3>
          <p class="stat-value">{{ systemAnalytics?.averageProcessingTime !== undefined ? systemAnalytics!.averageProcessingTime.toFixed(1) : 0 }} hrs</p>
        </div>
      </div>

      <!-- Top Performing Admin -->
      <div *ngIf="systemAnalytics?.topPerformingAdmin" class="top-admin-card">
        <h3>Top Performing Admin</h3>
        <div class="admin-info">
          <p><strong>Email:</strong> {{ systemAnalytics?.topPerformingAdmin?.adminEmail }}</p>
          <p><strong>Total Approvals:</strong> {{ systemAnalytics?.topPerformingAdmin?.totalApprovals }}</p>
          <p><strong>Approval Rate:</strong> {{ systemAnalytics?.topPerformingAdmin?.approvalRate !== undefined ? systemAnalytics!.topPerformingAdmin!.approvalRate.toFixed(1) : 0 }}%</p>
        </div>
      </div>

      <!-- Admin Performance Table -->
      <div class="admin-performance-section">
        <h3>Admin Performance Breakdown</h3>
        <div class="performance-table">
          <table *ngIf="systemAnalytics?.adminStats && systemAnalytics!.adminStats!.length > 0">
            <thead>
              <tr>
                <th>Admin Email</th>
                <th>Total Approvals</th>
                <th>Total Rejections</th>
                <th>Total Actions</th>
                <th>Approval Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let admin of systemAnalytics?.adminStats">
                <td>{{ admin.adminEmail }}</td>
                <td class="approved">{{ admin.totalApprovals }}</td>
                <td class="rejected">{{ admin.totalRejections }}</td>
                <td>{{ admin.totalApprovals + admin.totalRejections }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="admin.approvalRate"></div>
                    <span class="progress-text">{{ admin.approvalRate.toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!systemAnalytics?.adminStats || systemAnalytics?.adminStats?.length === 0" class="no-data">
            No admin performance data available.
          </div>
        </div>
      </div>

      <!-- Monthly Report Section -->
      <div class="monthly-report-section">
        <h3>Monthly Report</h3>
        <div class="report-controls">
          <select [(ngModel)]="selectedMonth" (change)="generateMonthlyReport()">
            <option value="">Select Month</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
          <select [(ngModel)]="selectedYear" (change)="generateMonthlyReport()">
            <option value="">Select Year</option>
            <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
          </select>
        </div>

        <div *ngIf="monthlyReport" class="report-content">
          <h4>{{ monthlyReport.month }} {{ monthlyReport.year }}</h4>
          <div class="report-stats">
            <div class="report-stat">
              <label>Total Applications:</label>
              <span>{{ monthlyReport.analytics.totalApplications }}</span>
            </div>
            <div class="report-stat">
              <label>Approved:</label>
              <span class="approved">{{ monthlyReport.analytics.totalApproved }}</span>
            </div>
            <div class="report-stat">
              <label>Rejected:</label>
              <span class="rejected">{{ monthlyReport.analytics.totalRejected }}</span>
            </div>
            <div class="report-stat">
              <label>Approval Rate:</label>
              <span>{{ monthlyReport.analytics.approvalRate.toFixed(1) }}%</span>
            </div>
          </div>
        <!-- Export Buttons -->
      <div class="export-section">
        <h4>Export Report</h4>
        <button (click)="exportCSV()" class="btn-export-csv">📥 Export as CSV</button>
        <button (click)="exportPDF()" class="btn-export-pdf">📄 Export as PDF</button>
      </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-wrapper {
      padding: 20px;
      background-color: #f5f5f5;
    }

    .analytics-header {
      margin-bottom: 30px;
    }

    .analytics-header h2 {
      margin: 0;
      color: #333;
    }

    .analytics-header p {
      color: #666;
      margin: 5px 0 0 0;
    }

    .overview-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .card {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .stat-value {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }

    .stat-value.approved {
      color: #28a745;
    }

    .stat-value.rejected {
      color: #dc3545;
    }

    .stat-value.pending {
      color: #ffc107;
    }

    .top-admin-card {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
      border-left: 4px solid #007bff;
    }

    .top-admin-card h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .admin-info p {
      margin: 8px 0;
      color: #666;
    }

    .admin-performance-section {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .admin-performance-section h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .performance-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background-color: #f9f9f9;
      border-bottom: 2px solid #ddd;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    td.approved {
      color: #28a745;
      font-weight: 600;
    }

    td.rejected {
      color: #dc3545;
      font-weight: 600;
    }

    .progress-bar {
      position: relative;
      width: 100%;
      height: 24px;
      background-color: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745, #20c997);
      transition: width 0.3s ease;
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #333;
      font-weight: 600;
      font-size: 12px;
    }

    .no-data {
      text-align: center;
      padding: 20px;
      color: #999;
    }

    .monthly-report-section {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .monthly-report-section h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .report-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .report-controls select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .report-content {
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }

    .report-content h4 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .report-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .report-stat {
      display: flex;
      flex-direction: column;
    }

    .report-stat label {
      font-weight: 600;
      color: #666;
      font-size: 12px;
      margin-bottom: 5px;
    }

    .report-stat span {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .report-stat span.approved {
      color: #28a745;
    }

    .report-stat span.rejected {
      color: #dc3545;
    }

    .btn-download {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-download:hover {
      background-color: #0056b3;
    }

    .export-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }

    .export-section h4 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .btn-export-csv,
    .btn-export-pdf {
      padding: 10px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      margin-right: 10px;
      transition: all 0.3s;
    }

    .btn-export-csv {
      background-color: #28a745;
      color: white;
      border-color: #28a745;
    }

    .btn-export-csv:hover {
      background-color: #218838;
    }

    .btn-export-pdf {
      background-color: #dc3545;
      color: white;
      border-color: #dc3545;
    }

    .btn-export-pdf:hover {
      background-color: #c82333;
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  systemAnalytics: SystemAnalytics | null = null;
  monthlyReport: MonthlyReport | null = null;
  selectedMonth = '';
  selectedYear = '';
  availableYears: number[] = [];

  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSystemAnalytics();
    this.initializeYearOptions();
  }


  exportCSV(): void {
    const url = `${this.apiUrl}/export/csv`;
    this.downloadFile(url, `audit-logs-${new Date().toISOString()}.csv`);
  }

  exportPDF(): void {
    const url = `${this.apiUrl}/export/pdf?type=analytics`;
    this.downloadFile(url, `analytics-report-${new Date().toISOString()}.pdf`);
  }

  private downloadFile(url: string, filename: string): void {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const blob = xhr.response;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    };
    xhr.onerror = () => {
      console.error('Error downloading file');
    };
    xhr.send();
  }
  loadSystemAnalytics() {
    this.http.get<{ success: boolean; data: SystemAnalytics }>(`${this.apiUrl}/system-analytics`)
      .subscribe(
        (response) => {
          this.systemAnalytics = response.data;
        },
        (error) => {
          console.error('Error loading analytics:', error);
        }
      );
  }

  generateMonthlyReport() {
    if (!this.selectedMonth || !this.selectedYear) {
      alert('Please select both month and year');
      return;
    }

    this.http.get<{ success: boolean; data: MonthlyReport }>(
      `${this.apiUrl}/monthly-report/${this.selectedMonth}/${this.selectedYear}`
    ).subscribe(
      (response) => {
        this.monthlyReport = response.data;
      },
      (error) => {
        console.error('Error generating report:', error);
      }
    );
  }

  downloadReport() {
    if (!this.monthlyReport) return;

    const reportContent = this.formatReportForDownload();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${this.monthlyReport.month}-${this.monthlyReport.year}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private formatReportForDownload(): string {
    if (!this.monthlyReport) return '';

    const report = this.monthlyReport;
    const analytics = report.analytics;

    return `
System Analytics Report
Generated: ${new Date().toLocaleString()}
Period: ${report.month} ${report.year}

SUMMARY
=================================
Total Applications: ${analytics.totalApplications}
Approved: ${analytics.totalApproved}
Rejected: ${analytics.totalRejected}
Under Review: ${analytics.totalUnderReview}
Approval Rate: ${analytics.approvalRate.toFixed(1)}%
Average Processing Time: ${analytics.averageProcessingTime.toFixed(1)} hours

ADMIN PERFORMANCE
=================================
${analytics.adminStats.map((admin) =>
  `Email: ${admin.adminEmail}
Approvals: ${admin.totalApprovals}
Rejections: ${admin.totalRejections}
Approval Rate: ${admin.approvalRate.toFixed(1)}%
---`
).join('\n')}
    `;
  }

  private initializeYearOptions() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear; i++) {
      this.availableYears.push(i);
    }
  }
}
