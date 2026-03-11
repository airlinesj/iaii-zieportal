import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { MembershipService } from '../services/membership.service';
import { AnalyticsReportService } from '../services/analytics-report.service';
import { ApplicationStatsComponent, MembershipGradeStats } from '../components/application-stats.component';
import { RefereeResponsesComponent } from '../components/referee-responses.component';
import { ExchangeRateRequestComponent } from '../components/exchange-rate-request.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ApplicationStatsComponent, RefereeResponsesComponent, ExchangeRateRequestComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="header-section">
        <h1>Admin Dashboard</h1>
        <div class="header-buttons">
          <a routerLink="/applications-list" class="btn-view-details">
            <span class="material-symbols-outlined">description</span>
            View Details
          </a>
          <a *ngIf="canAccessAuditTrail" routerLink="/audit-trail" class="btn-audit">
            <span class="material-symbols-outlined">history</span>
            Audit Trail
          </a>
          <a *ngIf="canAccessAuditTrail" routerLink="/analytics" class="btn-analytics">
            <span class="material-symbols-outlined">bar_chart</span>
            Analytics
          </a>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="stats-section">
          <div class="stat-card">
            <h3>Total Applications</h3>
            <p class="stat-value">{{ applications.length }}</p>
          </div>
          <div class="stat-card">
            <h3>Submitted</h3>
            <p class="stat-value">{{ getStatusCount('Submitted') }}</p>
          </div>
          <div class="stat-card">
            <h3>Under Review</h3>
            <p class="stat-value">{{ getStatusCount('Under Review') }}</p>
          </div>
          <div class="stat-card">
            <h3>Approved</h3>
            <p class="stat-value">{{ getStatusCount('Approved') }}</p>
          </div>
        </div>

        <!-- Analytics Report Generator Card -->
        <div class="analytics-report-section">
          <div class="report-card">
            <div class="report-header">
              <span class="material-symbols-outlined report-icon">bar_chart</span>
              <div class="report-title-section">
                <h3 class="report-title">Generate Analytics Report</h3>
                <p class="report-description">Download a comprehensive CSV report with system analytics</p>
              </div>
            </div>
            
            <div class="report-content">
              <div class="report-metrics">
                <div class="metric">
                  <span class="metric-label">Report Includes:</span>
                  <ul class="metric-list">
                    <li>Total Applications (Approved, Rejected, Under Review)</li>
                    <li>Application Approval Rate</li>
                    <li>Payment Statistics (Pending, Completed, Failed)</li>
                    <li>Average Processing Time</li>
                    <li>Admin Performance Summary</li>
                  </ul>
                </div>
              </div>
              
              <div class="button-group">
                <button (click)="downloadAnalyticsReport()" class="btn-download" [disabled]="isGeneratingReport">
                  <span class="material-symbols-outlined">download</span>
                  <span *ngIf="!isGeneratingReport">Download CSV Report</span>
                  <span *ngIf="isGeneratingReport">Generating...</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-section">
          <!-- Current Applications Card -->
          <div class="analytics-card">
            <div class="card-header">
              <h2>Latest Applicants</h2>
              <span class="count-badge">{{ getNewApplicationsCount() }}</span>
            </div>
            <div class="card-content">
              <div class="new-apps-list">
                <div *ngIf="getNewApplications().length > 0" class="apps-grid">
                  <div *ngFor="let app of getNewApplications()" class="app-item">
                    <div class="app-name">{{ app.personalParticulars.firstName }} {{ app.personalParticulars.lastName }}</div>
                    <div class="app-grade">{{ app.chosenGrade }}</div>
                    <div class="app-date">{{ app.createdAt | date: 'short' }}</div>
                  </div>
                </div>
                <div *ngIf="getNewApplications().length === 0" class="no-data">
                  <p>No applications available</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        <!-- Application Stats by Membership Grade -->
        <div class="stats-by-grade-section">
          <app-application-stats [membershipGrades]="getApplicationStatsByGrade()"></app-application-stats>
        </div>

        <!-- Referee Responses Section -->
        <app-referee-responses></app-referee-responses>

        <!-- Exchange Rate Request Section -->
        <app-exchange-rate-request></app-exchange-rate-request>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      min-height: 100vh;
      background-color: #f5f5f5;
      padding-bottom: 40px;
    }

    .header-section {
      background-color: #004A59;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header-section h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }

    .header-buttons {
      display: flex;
      gap: 15px;
    }

    .btn-view-details,
    .btn-logout {
      border: 2px solid white;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-view-details {
      background-color: #0088cc;
      color: white;
    }

    .btn-view-details:hover {
      background-color: #0066aa;
      transform: translateY(-2px);
    }

    .btn-audit,
    .btn-analytics {
      border: 2px solid white;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: white;
    }

    .btn-audit {
      background-color: #f0ad4e;
    }

    .btn-audit:hover {
      background-color: #ec971f;
      transform: translateY(-2px);
    }

    .btn-analytics {
      background-color: #5cb85c;
    }

    .btn-analytics:hover {
      background-color: #449944;
      transform: translateY(-2px);
    }

    .btn-logout {
      background-color: white;
      color: #004A59;
    }

    .btn-logout:hover {
      background-color: #f0f0f0;
      transform: translateY(-2px);
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background-color: white;
      border: 2px solid #004A59;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-card h3 {
      color: #004A59;
      margin: 0 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-card .stat-value {
      color: #B99532;
      font-size: 36px;
      font-weight: 700;
      margin: 0;
    }

    .analytics-section {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .analytics-card {
      background-color: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      padding: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .analytics-card .card-header {
      background-color: #004A59;
      color: white;
      padding: 20px;
      border-bottom: 2px solid #003347;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .analytics-card .card-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }

    .analytics-card .card-header .count-badge {
      background-color: #B99532;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 18px;
      font-weight: 700;
    }

    .analytics-card .card-content {
      padding: 20px;
    }

    .new-apps-list .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 15px;
    }

    .new-apps-list .apps-grid .app-item {
      background-color: #f9f9f9;
      border: 2px solid #B99532;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }

    .new-apps-list .apps-grid .app-item .app-name {
      font-weight: 600;
      color: #004A59;
      font-size: 13px;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .new-apps-list .apps-grid .app-item .app-grade {
      color: #B99532;
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .new-apps-list .apps-grid .app-item .app-date {
      color: #999;
      font-size: 11px;
    }

    .new-apps-list .no-data {
      text-align: center;
      padding: 30px 20px;
      color: #999;
      font-size: 14px;
    }

    .no-results {
      padding: 40px 20px;
      text-align: center;
      color: #666;
      font-size: 16px;
    }

    /* Analytics Report Section Styles */
    .analytics-report-section {
      margin-bottom: 40px;
    }

    .report-card {
      background-color: white;
      border: 2px solid #B99532;
      border-radius: 8px;
      padding: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .report-card:hover {
      box-shadow: 0 5px 15px rgba(185, 149, 50, 0.15);
    }

    .report-header {
      display: flex;
      gap: 15px;
      padding: 20px;
      background-color: #f8f8f8;
      border-bottom: 2px solid #B99532;
    }

    .report-icon {
      font-size: 40px;
      color: #B99532;
      flex-shrink: 0;
      margin-top: 5px;
    }

    .report-title-section {
      text-align: left;
      flex: 1;
    }

    .report-title {
      font-size: 16px;
      font-weight: 700;
      color: #004A59;
      margin: 0 0 5px 0;
    }

    .report-description {
      font-size: 12px;
      color: #666;
      margin: 0;
      line-height: 1.4;
    }

    .report-content {
      padding: 20px;
    }

    .report-metrics {
      margin-bottom: 20px;
    }

    .metric {
      text-align: left;
    }

    .metric-label {
      font-weight: 700;
      color: #004A59;
      font-size: 13px;
      display: block;
      margin-bottom: 8px;
    }

    .metric-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .metric-list li {
      font-size: 12px;
      color: #555;
      padding: 4px 0 4px 15px;
      position: relative;
    }

    .metric-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #B99532;
      font-weight: 700;
    }

    .button-group {
      display: flex;
      gap: 10px;
      justify-content: flex-start;
      margin-top: 15px;
    }

    .btn-download {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 25px;
      background-color: #B99532;
      color: white;
      border: 2px solid #B99532;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-download:hover:not(:disabled) {
      background-color: #a58628;
      border-color: #004A59;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(4, 74, 89, 0.2);
    }

    .btn-download:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-download span {
      font-size: 18px;
      font-variation-settings: 'wght' 600;
    }

    @media (max-width: 768px) {
      .report-header {
        gap: 10px;
        padding: 15px;
      }

      .report-icon {
        font-size: 32px;
      }

      .report-title {
        font-size: 14px;
      }

      .report-description {
        font-size: 11px;
      }

      .report-content {
        padding: 15px;
      }

      .metric-list li {
        font-size: 11px;
        padding: 3px 0 3px 12px;
      }

      .btn-download {
        padding: 10px 20px;
        font-size: 13px;
      }

      .btn-download span {
        font-size: 16px;
      }
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 10px;
        padding: 15px;
      }

      .header-section h1 {
        font-size: 22px;
      }

      .header-buttons {
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        width: 100%;
      }

      .btn-view-details,
      .btn-logout,
      .btn-audit,
      .btn-analytics {
        padding: 8px 12px;
        font-size: 12px;
        flex: 1;
        min-width: 120px;
      }

      .dashboard-content {
        padding: 20px 10px;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 30px;
      }

      .stat-card {
        padding: 15px;
      }

      .stat-card h3 {
        font-size: 12px;
      }

      .stat-card .stat-value {
        font-size: 28px;
      }

      .analytics-card .card-header {
        padding: 15px;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .analytics-card .card-header h2 {
        font-size: 16px;
      }

      .new-apps-list .apps-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
      }

      .new-apps-list .apps-grid .app-item {
        padding: 10px;
      }

      .new-apps-list .apps-grid .app-item .app-name {
        font-size: 12px;
        margin-bottom: 6px;
      }
    }

    @media (max-width: 480px) {
      .dashboard-wrapper {
        padding-bottom: 20px;
      }

      .header-section {
        padding: 12px 10px;
      }

      .header-section h1 {
        font-size: 18px;
      }

      .header-buttons {
        width: 100%;
      }

      .btn-view-details,
      .btn-logout,
      .btn-audit,
      .btn-analytics {
        padding: 8px 10px;
        font-size: 11px;
        min-width: auto;
      }

      .dashboard-content {
        padding: 15px 10px;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }

      .stat-card {
        padding: 12px;
        border: 1.5px solid #004A59;
      }

      .stat-card h3 {
        font-size: 11px;
      }

      .stat-card .stat-value {
        font-size: 24px;
      }

      .analytics-card .card-header {
        padding: 12px;
      }

      .analytics-card .card-header h2 {
        font-size: 14px;
      }

      .analytics-card .card-header .count-badge {
        padding: 6px 12px;
        font-size: 16px;
      }

      .analytics-card .card-content {
        padding: 15px;
      }

      .new-apps-list .apps-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .new-apps-list .apps-grid .app-item {
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .new-apps-list .apps-grid .app-item .app-name {
        text-align: left;
        flex: 1;
        font-size: 11px;
        margin-bottom: 0;
      }

      .new-apps-list .apps-grid .app-item .app-grade {
        margin-bottom: 0;
      }

      .new-apps-list .apps-grid .app-item .app-date {
        white-space: nowrap;
      }
    }

    /* Exchange Rate Management Styles */
    .exchange-rate-section {
      margin-top: 40px;
    }

    .exchange-rate-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .exchange-rate-card .card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .exchange-rate-card .card-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .exchange-rate-card .card-content {
      padding: 25px;
    }

    .rate-display {
      margin-bottom: 25px;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }

    .current-rate {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .current-rate .label {
      font-weight: 600;
      color: #333;
    }

    .current-rate .rate-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }

    .current-rate .rate-source {
      font-size: 12px;
      color: #999;
      padding: 4px 8px;
      background-color: #e9ecef;
      border-radius: 3px;
    }

    .current-rate .rate-source.manual {
      background-color: #fff3cd;
      color: #856404;
      font-weight: 600;
    }

    .rate-form {
      margin-bottom: 25px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .rate-form .form-group {
      margin-bottom: 15px;
    }

    .rate-form label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }

    .rate-form input {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .rate-form input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .rate-form input:disabled {
      background-color: #e9ecef;
      cursor: not-allowed;
    }

    .btn-update-rate {
      width: 100%;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-update-rate:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-update-rate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .rate-form .message {
      margin-top: 15px;
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    }

    .rate-form .message.success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .rate-form .message:not(.success) {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .rate-info {
      padding: 15px;
      background-color: #e7f3ff;
      border-left: 4px solid #0066cc;
      border-radius: 4px;
    }

    .rate-info p {
      margin: 0;
      font-size: 13px;
      color: #0066cc;
      line-height: 1.5;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .exchange-rate-card .card-header h2 {
        font-size: 16px;
      }

      .exchange-rate-card .card-content {
        padding: 15px;
      }

      .current-rate {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .current-rate .rate-value {
        font-size: 20px;
      }

      .rate-form {
        padding: 15px;
      }

      .rate-info p {
        font-size: 12px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  applications: any[] = [];
  canAccessAuditTrail = false;
  isGeneratingReport = false;

  // Exchange rate management properties
  exchangeRate: number = 26.5;
  newExchangeRate: number | null = null;
  isLoadingRate: boolean = false;
  isManualRate: boolean = false;
  rateUpdateMessage: string = '';
  rateUpdateSuccess: boolean = false;

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private membershipService: MembershipService,
    private analyticsReportService: AnalyticsReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
    this.checkAuditTrailAccess();
    this.loadExchangeRate();
  }

  checkAuditTrailAccess(): void {
    this.authService.getCurrentUser().subscribe(
      (user: any) => {
        // Allow if user is SuperAdmin or has canAccessAuditTrail flag
        this.canAccessAuditTrail = user.role === 'SuperAdmin' || user.canAccessAuditTrail;
      },
      (error: any) => {
        console.error('Error checking audit trail access:', error);
      }
    );
  }

  loadApplications(): void {
    this.applicationService.getAllApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
      },
    });
  }

  getStatusCount(status: string): number {
    return this.applications.filter((app) => app.status === status).length;
  }

  getNewApplications(): any[] {
    // Sort all applications by creation date (most recent first) and limit to 6
    return this.applications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }

  getNewApplicationsCount(): number {
    return this.getNewApplications().length;
  }

  getApplicationStatsByGrade(): MembershipGradeStats[] {
    // Group all applications by membership grade and status
    const gradeStats: { [key: string]: { [key: string]: number } } = {};

    this.applications.forEach((app) => {
      const grade = app.chosenGrade || 'Unknown';
      const status = app.status || 'Submitted';

      if (!gradeStats[grade]) {
        gradeStats[grade] = {
          pending: 0,
          inReview: 0,
          approved: 0,
          rejected: 0,
        };
      }

      // Map application status to our category
      if (status === 'Submitted') {
        gradeStats[grade]['pending'] += 1;
      } else if (status === 'Under Review') {
        gradeStats[grade]['inReview'] += 1;
      } else if (status === 'Approved') {
        gradeStats[grade]['approved'] += 1;
      } else if (status === 'Rejected') {
        gradeStats[grade]['rejected'] += 1;
      }
    });

    // Convert to array format
    return Object.entries(gradeStats)
      .map(([name, counts]) => ({
        name,
        pending: counts['pending'],
        inReview: counts['inReview'],
        approved: counts['approved'],
        rejected: counts['rejected'],
      }))
      .sort((a, b) => (b.pending + b.inReview + b.approved + b.rejected) - (a.pending + a.inReview + a.approved + a.rejected));
  }

  logout(): void {
    // Use logoutAndNavigate to properly clear browser history and navigate to landing page
    this.authService.logoutAndNavigate();
  }

  /**
   * Download analytics report as CSV
   */
  downloadAnalyticsReport(): void {
    this.isGeneratingReport = true;
    this.analyticsReportService.downloadAnalyticsCSV()
      .then(() => {
        console.log('Analytics report downloaded successfully');
      })
      .catch((error) => {
        console.error('Failed to download analytics report:', error);
      })
      .finally(() => {
        this.isGeneratingReport = false;
      });
  }

  /**
   * Load the current exchange rate from the API
   */
  loadExchangeRate(): void {
    this.isLoadingRate = true;
    this.membershipService.getExchangeRateInfo().subscribe({
      next: (response: any) => {
        this.exchangeRate = response.exchangeRate;
        this.isManualRate = response.isManual || false;
        this.newExchangeRate = response.exchangeRate;
        this.isLoadingRate = false;
      },
      error: (error: any) => {
        console.error('Error loading exchange rate:', error);
        this.rateUpdateMessage = 'Failed to load exchange rate. Using default.';
        this.rateUpdateSuccess = false;
        this.isLoadingRate = false;
      },
    });
  }

  /**
   * Update the exchange rate manually
   */
  updateExchangeRate(): void {
    if (!this.newExchangeRate || this.newExchangeRate <= 0) {
      this.rateUpdateMessage = 'Please enter a valid exchange rate greater than 0.';
      this.rateUpdateSuccess = false;
      return;
    }

    this.isLoadingRate = true;
    this.membershipService.setExchangeRate(this.newExchangeRate).subscribe({
      next: (response: any) => {
        this.exchangeRate = response.exchangeRate;
        this.isManualRate = response.isManual;
        this.rateUpdateMessage = `✓ Exchange rate updated successfully to ${response.exchangeRate} ZWG per USD`;
        this.rateUpdateSuccess = true;
        this.isLoadingRate = false;

        // Clear message after 5 seconds
        setTimeout(() => {
          this.rateUpdateMessage = '';
        }, 5000);
      },
      error: (error: any) => {
        console.error('Error updating exchange rate:', error);
        const errorMsg = error.error?.message || 'Failed to update exchange rate. Please try again.';
        this.rateUpdateMessage = `✗ ${errorMsg}`;
        this.rateUpdateSuccess = false;
        this.isLoadingRate = false;

        // Clear message after 5 seconds
        setTimeout(() => {
          this.rateUpdateMessage = '';
        }, 5000);
      },
    });
  }
}
