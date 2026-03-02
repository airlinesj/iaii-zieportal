import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { ApplicationStatsComponent, MembershipGradeStats } from '../components/application-stats.component';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ApplicationStatsComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="header-section">
        <h1>Super Admin Dashboard - Certificate Management</h1>
        <div class="header-buttons">
          <button (click)="toggleViewMode()" class="btn-view-details">
            <span class="material-symbols-outlined">{{ showListView ? 'dashboard' : 'list' }}</span>
            {{ showListView ? 'Dashboard View' : 'View Details' }}
          </button>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="refresh-section">
          <button (click)="refreshApplications()" class="btn-refresh">
            <span class="material-symbols-outlined">refresh</span>
            Refresh Applications
          </button>
          <button (click)="debugShowAllApplications()" class="btn-debug" style="margin-left: 10px;">
            <span class="material-symbols-outlined">bug_report</span>
            Debug: Show All
          </button>
        </div>

        <!-- LIST VIEW -->
        <div *ngIf="showListView" class="list-view-section">
          <div class="section-header">
            <h2>Applications Awaiting Certificate Approval</h2>
            <span class="count-badge">{{ awaitingApprovalApplications.length }}</span>
          </div>
          
          <div *ngIf="awaitingApprovalApplications.length > 0" class="applications-list">
            <table class="applications-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Grade</th>
                  <th>Division</th>
                  <th>Registration #</th>
                  <th>Interview Passed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let app of awaitingApprovalApplications" class="app-row">
                  <td class="name">{{ app.personalParticulars.firstName }} {{ app.personalParticulars.lastName }}</td>
                  <td class="email">{{ app.personalParticulars.email }}</td>
                  <td class="grade">{{ app.chosenGrade }}</td>
                  <td class="division">{{ app.chosenSpecialistDivision }}</td>
                  <td class="reg-number">{{ app.registrationNumber || 'Pending' }}</td>
                  <td class="interview-date">{{ app.interviewPassedDate ? (app.interviewPassedDate | date: 'short') : '-' }}</td>
                  <td class="action">
                    <button (click)="approveCertificate(app._id)" class="btn-approve-small">
                      <span class="material-symbols-outlined">check_circle</span>
                      Approve
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div *ngIf="awaitingApprovalApplications.length === 0" class="no-data">
            <p>No applications awaiting certificate approval</p>
          </div>
        </div>

        <!-- DASHBOARD VIEW -->

        <div *ngIf="!showListView" class="stats-section">
          <div class="stat-card">
            <h3>Total Applications</h3>
            <p class="stat-value">{{ applications.length }}</p>
          </div>
          <div class="stat-card">
            <h3>Passed Interviews</h3>
            <p class="stat-value">{{ getPassedInterviewCount() }}</p>
          </div>
          <div class="stat-card">
            <h3>Awaiting Approval</h3>
            <p class="stat-value">{{ getAwaitingCertificateCount() }}</p>
          </div>
          <div class="stat-card">
            <h3>Certificates Issued</h3>
            <p class="stat-value">{{ getCertificatesIssuedCount() }}</p>
          </div>
        </div>

        <div *ngIf="!showListView" class="analytics-section">
          <!-- Application Stats by Membership Grade -->
          <div class="stats-by-grade-section">
            <app-application-stats [membershipGrades]="getApplicationStatsByGrade()"></app-application-stats>
          </div>
        </div>

        <!-- Pending Certificate Approvals Section (Dashboard View) -->
        <div *ngIf="!showListView" class="pending-approvals-section">
          <div class="section-header">
            <h2>Certificate Approvals Pending</h2>
            <span class="count-badge">{{ awaitingApprovalApplications.length }}</span>
          </div>
          
          <div class="approvals-list">
            <div *ngIf="awaitingApprovalApplications.length > 0" class="approvals-grid">
              <div *ngFor="let app of awaitingApprovalApplications" class="approval-card">
                <div class="card-header">
                  <h3>{{ app.personalParticulars.firstName }} {{ app.personalParticulars.lastName }}</h3>
                  <span class="grade-badge">{{ app.chosenGrade }}</span>
                </div>
                
                <div class="card-content">
                  <div class="detail-item">
                    <span class="label">Email:</span>
                    <span class="value">{{ app.personalParticulars.email }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Division:</span>
                    <span class="value">{{ app.chosenSpecialistDivision }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Applied:</span>
                    <span class="value">{{ app.createdAt | date: 'medium' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Interview Passed:</span>
                    <span class="value" *ngIf="app.interviewPassedDate">{{ app.interviewPassedDate | date: 'medium' }}</span>
                    <span class="value" *ngIf="!app.interviewPassedDate">-</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Registration Number:</span>
                    <span class="value reg-number" *ngIf="app.registrationNumber">{{ app.registrationNumber }}</span>
                    <span class="value" *ngIf="!app.registrationNumber">Pending Generation</span>
                  </div>
                </div>
                
                <div class="card-actions">
                  <button (click)="approveCertificate(app._id)" class="btn-approve">
                    <span class="material-symbols-outlined">check_circle</span>
                    Approve & Issue Certificate
                  </button>
                </div>
              </div>
            </div>
            
            <div *ngIf="awaitingApprovalApplications.length === 0" class="no-data">
              <p>No applications awaiting certificate approval</p>
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div class="message-area" *ngIf="successMessage || errorMessage">
          <div *ngIf="successMessage" class="success-message">✓ {{ successMessage }}</div>
          <div *ngIf="errorMessage" class="error-message">✗ {{ errorMessage }}</div>
        </div>
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
      margin-top: 80px;
      gap: 20px;
    }

    .header-section h1 {
      margin: 0;
      flex: 1;
      font-size: 24px;
      font-weight: 700;
    }

    .header-buttons {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .btn-view-details,
    .btn-logout,
    .btn-audit,
    .btn-management {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
      white-space: nowrap;
      text-decoration: none;
    }

    .btn-view-details {
      background-color: #B99532;
      color: #004A59;

      &:hover {
        background-color: #a58628;
        transform: translateY(-2px);
      }
    }

    .btn-audit {
      background-color: #1976d2;
      color: white;

      &:hover {
        background-color: #1565c0;
        transform: translateY(-2px);
      }
    }

    .btn-management {
      background-color: #388e3c;
      color: white;

      &:hover {
        background-color: #2e7d32;
        transform: translateY(-2px);
      }
    }

    .btn-logout {
      background-color: #d32f2f;
      color: white;

      &:hover {
        background-color: #b71c1c;
      }
    }

    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      display: inline-block;
      line-height: 1;
      text-transform: none;
      letter-spacing: normal;
      word-wrap: normal;
      white-space: nowrap;
      direction: ltr;
      font-size: 20px;
    }

    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .refresh-section {
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background-color: #004A59;
      color: white;
      border: 2px solid #004A59;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #B99532;
        border-color: #B99532;
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .btn-debug {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background-color: #666;
      color: white;
      border: 2px solid #666;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #888;
        border-color: #888;
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      h3 {
        margin: 0 0 10px 0;
        color: #004A59;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        color: #B99532;
      }
    }

    .analytics-section {
      background: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .stats-by-grade-section {
      width: 100%;
    }

    .pending-approvals-section {
      background: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      background-color: #004A59;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #B99532;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .count-badge {
        display: inline-block;
        background-color: #B99532;
        color: #004A59;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 14px;
      }
    }

    .approvals-list {
      padding: 30px 20px;
    }

    .approvals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .approval-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        border-color: #B99532;
        box-shadow: 0 4px 12px rgba(185, 149, 50, 0.2);
      }
    }

    .card-header {
      background-color: #f9f9f9;
      border-bottom: 2px solid #e0e0e0;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #004A59;
        font-size: 16px;
        font-weight: 700;
      }

      .grade-badge {
        display: inline-block;
        background-color: #B99532;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .card-content {
      padding: 15px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 600;
        color: #004A59;
        min-width: 120px;
      }

      .value {
        color: #333;
        text-align: right;
        flex: 1;
        font-size: 13px;
      }

      .reg-number {
        font-family: 'Courier New', monospace;
        font-weight: 700;
        color: #28a745;
      }
    }

    .card-actions {
      display: flex;
      gap: 10px;
      padding: 15px;
      border-top: 1px solid #e0e0e0;
      background-color: #f9f9f9;
    }

    .btn-approve,
    .btn-view {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-approve {
      background-color: #28a745;
      color: white;

      &:hover {
        background-color: #218838;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        transform: translateY(-2px);
      }
    }

    .btn-view {
      background-color: #004A59;
      color: white;

      &:hover {
        background-color: #003847;
      }
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: #999;

      p {
        margin: 0;
        font-size: 16px;
      }
    }

    .message-area {
      margin-top: 30px;
      padding: 0 20px;

      .success-message,
      .error-message {
        padding: 15px 20px;
        border-radius: 6px;
        font-weight: 600;
      }

      .success-message {
        background-color: #d4edda;
        border: 2px solid #28a745;
        color: #155724;
      }

      .error-message {
        background-color: #f8d7da;
        border: 2px solid #f5c6cb;
        color: #721c24;
      }
    }

    /* List View Styles */
    .list-view-section {
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      margin: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .list-view-section .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }

    .list-view-section h2 {
      margin: 0;
      color: #004A59;
      font-size: 20px;
    }

    .count-badge {
      background-color: #004A59;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .applications-list {
      overflow-x: auto;
    }

    .applications-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .applications-table thead {
      background-color: #f5f5f5;
      border-bottom: 2px solid #004A59;
    }

    .applications-table th {
      padding: 12px;
      text-align: left;
      color: #004A59;
      font-weight: 600;
      white-space: nowrap;
    }

    .applications-table tbody tr {
      border-bottom: 1px solid #e0e0e0;
      transition: background-color 0.2s;
    }

    .applications-table tbody tr:hover {
      background-color: #f9f9f9;
    }

    .applications-table td {
      padding: 12px;
    }

    .applications-table .name {
      font-weight: 600;
      color: #004A59;
    }

    .applications-table .email {
      color: #666;
    }

    .applications-table .grade {
      background-color: #e8f4f8;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .applications-table .division {
      color: #555;
      font-size: 13px;
    }

    .applications-table .reg-number {
      font-weight: 500;
      color: #004A59;
      font-family: monospace;
    }

    .applications-table .interview-date {
      color: #666;
      font-size: 13px;
    }

    .applications-table .action {
      text-align: center;
    }

    .btn-approve-small {
      background-color: #28a745;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.3s;
      white-space: nowrap;
    }

    .btn-approve-small:hover {
      background-color: #218838;
    }

    .btn-approve-small .material-symbols-outlined {
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 15px;
      }

      .header-section h1 {
        font-size: 18px;
      }

      .header-buttons {
        width: 100%;
        flex-wrap: wrap;
      }

      .approvals-grid {
        grid-template-columns: 1fr;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
      }

      .applications-table {
        font-size: 12px;
      }

      .applications-table th,
      .applications-table td {
        padding: 8px;
      }

      .btn-approve-small {
        padding: 4px 8px;
        font-size: 11px;
      }
    }

    @media (max-width: 480px) {
      .dashboard-wrapper {
        padding-bottom: 20px;
      }

      .header-section {
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }

      .header-section h1 {
        font-size: 16px;
        margin: 0;
      }

      .header-buttons {
        width: 100%;
        gap: 8px;
        flex-direction: column;
      }

      .btn-toggle-view {
        padding: 8px 12px;
        font-size: 11px;
        width: 100%;
      }

      .dashboard-content {
        padding: 12px;
      }

      .stats-section {
        grid-template-columns: 1fr;
        gap: 10px;
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

      .approvals-section {
        margin-bottom: 20px;
      }

      .approvals-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .approval-card {
        padding: 12px;
        border-radius: 6px;
      }

      .approval-header {
        font-size: 12px;
        margin-bottom: 8px;
      }

      .approval-content {
        font-size: 11px;
      }

      .btn-approve {
        padding: 8px 12px;
        font-size: 11px;
        margin-top: 8px;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .applications-table {
        min-width: 600px;
        font-size: 11px;
      }

      .applications-table th,
      .applications-table td {
        padding: 6px 4px;
      }

      .applications-table th {
        font-size: 10px;
      }

      .btn-approve-small {
        padding: 4px 6px;
        font-size: 10px;
      }

      .btn-approve-small .material-symbols-outlined {
        font-size: 12px;
      }
    }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  applications: any[] = [];
  awaitingApprovalApplications: any[] = [];
  successMessage = '';
  errorMessage = '';
  currentUser: any;
  showListView = false; // Toggle between dashboard (cards) and list view

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSuperAdminStatus();
    this.loadApplications();
  }

  private checkSuperAdminStatus(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (!user || !user.email?.includes('@superadmin')) {
        this.router.navigate(['/login']);
      }
    });
  }

  loadApplications(): void {
    this.applicationService.getAllApplications().subscribe({
      next: (apps: any[]) => {
        this.applications = apps;
        console.log('📋 Loading applications for super admin...');
        console.log('Total applications:', apps.length);
        console.log('All applications:', apps.map(a => ({
          firstName: a.personalParticulars?.firstName,
          applicationType: a.applicationType,
          status: a.status,
          admissionStatus: a.admissionUpdate?.status,
          interviewPassedDate: a.interviewPassedDate,
          registrationNumber: a.registrationNumber
        })));
        
        // Filter for applications awaiting certificate approval:
        // - Status must be 'Passed' (interview passed or expatriate confirmed by admin)
        // - AND admissionUpdate.status is NOT 'admitted' (not yet approved by super admin)
        this.awaitingApprovalApplications = apps.filter((app) => {
          const hasPassed = app.status === 'Passed';
          const notAdmitted = !app.admissionUpdate || app.admissionUpdate.status !== 'admitted';
          const matches = hasPassed && notAdmitted;
          
          if (matches) {
            console.log(`  ✓ ${app.personalParticulars.firstName} ${app.personalParticulars.lastName} - Type: ${app.applicationType}, Status: ${app.status}, Admission: ${app.admissionUpdate?.status || 'none'}`);
          }
          return matches;
        });
        
        console.log('Awaiting approval:', this.awaitingApprovalApplications.length);
        console.log('Approved:', apps.filter(a => a.admissionUpdate?.status === 'admitted').length);
        
        // Log debug info to help troubleshoot
        if (this.awaitingApprovalApplications.length === 0) {
          console.warn('⚠️ No applications awaiting approval. Debug info:');
          console.warn('  - Total apps:', apps.length);
          console.warn('  - Passed apps:', apps.filter(a => a.status === 'Passed').length);
          console.warn('  - Apps with admissionUpdate:', apps.filter(a => a.admissionUpdate).length);
          console.warn('  - Apps with pending admission:', apps.filter(a => a.admissionUpdate?.status === 'pending').length);
        }
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.errorMessage = 'Failed to load applications. Please refresh the page.';
      },
    });
  }

  refreshApplications(): void {
    console.log('Refreshing applications...');
    this.loadApplications();
  }

  debugShowAllApplications(): void {
    console.log('=== DEBUG: ALL APPLICATIONS ===');
    console.log('Total applications:', this.applications.length);
    this.applications.forEach((app, i) => {
      console.log(`${i + 1}. ${app.personalParticulars?.firstName} ${app.personalParticulars?.lastName}`);
      console.log(`   - Email: ${app.personalParticulars?.email}`);
      console.log(`   - Type: ${app.applicationType}`);
      console.log(`   - Status: ${app.status}`);
      console.log(`   - Admission Status: ${app.admissionUpdate?.status || 'none'}`);
      console.log(`   - Interview Passed: ${app.interviewPassedDate || 'no'}`);
      console.log(`   - Registration Number: ${app.registrationNumber || 'none'}`);
      console.log('---');
    });
    
    console.log('=== FILTERED FOR SUPER ADMIN ===');
    console.log('Awaiting approval:', this.awaitingApprovalApplications.length);
    this.awaitingApprovalApplications.forEach((app, i) => {
      console.log(`${i + 1}. ${app.personalParticulars?.firstName} ${app.personalParticulars?.lastName}`);
    });
    
    alert(`Debug Info Logged. Check console.\n\nTotal Apps: ${this.applications.length}\nAwaiting Approval: ${this.awaitingApprovalApplications.length}\n\nCheck browser console for details.`);
  }

  getPassedInterviewCount(): number {
    return this.applications.filter((app) => app.status === 'Passed').length;
  }

  getAwaitingCertificateCount(): number {
    return this.awaitingApprovalApplications.length;
  }

  getCertificatesIssuedCount(): number {
    return this.applications.filter(
      (app) => app.status === 'Passed' && app.admissionUpdate?.status === 'admitted'
    ).length;
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
      } else if (status === 'Passed') {
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  approveCertificate(applicationId: string): void {
    if (!applicationId) {
      console.error('Application ID is required');
      this.errorMessage = 'Application ID is missing';
      return;
    }

    // Find the application to get name for confirmation
    const app = this.awaitingApprovalApplications.find(a => a._id === applicationId);
    if (!app) {
      console.error('Application not found in list');
      this.errorMessage = 'Application not found';
      return;
    }

    // Confirm approval with user
    const appName = `${app.personalParticulars.firstName} ${app.personalParticulars.lastName}`;
    const confirmApprove = confirm(
      `Approve certificate for ${appName}?\n\nThis will generate and approve their professional certificate.`
    );
    if (!confirmApprove) {
      return;
    }

    console.log('💼 Approving certificate for application:', applicationId);
    console.log('   Applicant:', appName);
    console.log('   Type:', app.applicationType);
    
    this.successMessage = '';
    this.errorMessage = '';

    // Call the backend endpoint to approve certificate
    this.applicationService.confirmExpatriateAdmission(applicationId).subscribe({
      next: (response: any) => {
        console.log('✓ Certificate approved successfully');
        console.log('Response:', response);
        
        const appData = response.application || response;
        this.successMessage = `✓ Certificate approved for ${appName}! Registration: ${appData.registrationNumber}`;
        
        // Reload applications to refresh the list
        setTimeout(() => {
          this.loadApplications();
          this.successMessage = '';
        }, 2500);
      },
      error: (error: any) => {
        console.error('❌ Error approving certificate:', error);
        this.errorMessage = error.error?.message || 'Failed to approve certificate. Please try again.';
        console.error('Full error:', error);
      },
    });
  }

  // Super admin dashboard only needs to approve or reject certificates
  // No need to view full details - the list shows all necessary information
  viewApplicationDetails(applicationId: string): void {
    // Removed navigation - super admin stays on dashboard to manage certificates
    console.log('Viewing application:', applicationId);
  }

  toggleViewMode(): void {
    this.showListView = !this.showListView;
  }

  logout(): void {
    // Use logoutAndNavigate to properly clear browser history and navigate to landing page
    this.authService.logoutAndNavigate();
  }

  goBackToDashboard(): void {
    this.router.navigate(['/super-admin-dashboard']);
  }
}
