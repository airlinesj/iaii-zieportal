import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CpdService } from '../services/cpd.service';
import { formatCpdAmount, getCurrencySymbol, getPaymentStatusBadge, getApprovalStatusBadge } from '../services/cpd-fee.service';

interface CpdApplicationWithPayment {
  _id: string;
  companyName: string;
  courseTitle: string;
  email: string;
  estimatedFee: number;
  adminApproval?: {
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvedAt?: Date;
    approvedByEmail?: string;
    rejectionReason?: string;
  };
  paymentDetails?: {
    amount: number;
    currency: string;
    paymentStatus: string;
    paidAt?: Date;
    transactionId?: string;
  };
  createdAt: Date;
}

@Component({
  selector: 'app-cpd-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-cpd-container">
      <div class="header">
        <h1>CPD Application Management</h1>
        <p>Manage CPD accreditation approvals and payments</p>
      </div>

      <div class="tabs">
        <button 
          class="tab-button" 
          [class.active]="activeTab === 'pending'"
          (click)="switchTab('pending')"
        >
          Pending Approvals ({{ pendingCount }})
        </button>
        <button 
          class="tab-button" 
          [class.active]="activeTab === 'payments'"
          (click)="switchTab('payments')"
        >
          Pending Payments ({{ paymentCount }})
        </button>
        <button 
          class="tab-button" 
          [class.active]="activeTab === 'completed'"
          (click)="switchTab('completed')"
        >
          Completed
        </button>
      </div>

      <!-- Pending Approvals Tab -->
      <div class="tab-content" *ngIf="activeTab === 'pending'">
        <div class="section-header">
          <h2>Pending Approvals</h2>
          <p>Applications awaiting review and approval</p>
        </div>

        <div class="applications-list" *ngIf="pendingApprovals.length > 0">
          <div class="application-card" *ngFor="let app of pendingApprovals">
            <div class="card-header">
              <div class="app-title">
                <h3>{{ app.companyName }}</h3>
                <p class="course-title">{{ app.courseTitle }}</p>
              </div>
              <div class="app-status">
                <span class="status-badge pending">Awaiting Review</span>
              </div>
            </div>

            <div class="card-body">
              <div class="details-grid">
                <div class="detail">
                  <label>Application ID</label>
                  <p>{{ app._id }}</p>
                </div>
                <div class="detail">
                  <label>Contact Email</label>
                  <p>{{ app.email }}</p>
                </div>
                <div class="detail">
                  <label>Estimated Fee</label>
                  <p>{{ app.estimatedFee }}</p>
                </div>
                <div class="detail">
                  <label>Submitted</label>
                  <p>{{ app.createdAt | date: 'short' }}</p>
                </div>
              </div>

              <div class="action-buttons">
                <button class="btn-approve" (click)="showApproveModal(app)">
                  ✓ Approve for Payment
                </button>
                <button class="btn-reject" (click)="showRejectModal(app)">
                  ✗ Reject
                </button>
                <button class="btn-view" (click)="viewDetails(app._id)">
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="pendingApprovals.length === 0 && !loadingPending">
          <p>No pending approvals</p>
        </div>

        <div class="loading" *ngIf="loadingPending">
          <span class="spinner"></span>
          Loading...
        </div>
      </div>

      <!-- Pending Payments Tab -->
      <div class="tab-content" *ngIf="activeTab === 'payments'">
        <div class="section-header">
          <h2>Pending Payments</h2>
          <p>Applications approved for payment awaiting payment completion</p>
        </div>

        <div class="applications-list" *ngIf="pendingPayments.length > 0">
          <div class="application-card" *ngFor="let app of pendingPayments">
            <div class="card-header">
              <div class="app-title">
                <h3>{{ app.companyName }}</h3>
                <p class="course-title">{{ app.courseTitle }}</p>
              </div>
              <div class="app-status">
                <span [ngClass]="'status-badge ' + getPaymentStatusClass(app.paymentDetails?.paymentStatus)">
                  {{ getPaymentStatusText(app.paymentDetails?.paymentStatus) }}
                </span>
              </div>
            </div>

            <div class="card-body">
              <div class="details-grid">
                <div class="detail">
                  <label>Amount Due</label>
                  <p class="amount">{{ app.paymentDetails?.currency || 'ZWL' }} {{ app.paymentDetails?.amount || 0 }}</p>
                </div>
                <div class="detail">
                  <label>Payment Status</label>
                  <p>{{ getPaymentStatusText(app.paymentDetails?.paymentStatus) }}</p>
                </div>
                <div class="detail">
                  <label>Approved On</label>
                  <p>{{ app.adminApproval?.approvedAt | date: 'short' }}</p>
                </div>
                <div class="detail">
                  <label>Transaction ID</label>
                  <p *ngIf="app.paymentDetails?.transactionId">{{ app.paymentDetails?.transactionId }}</p>
                  <p *ngIf="!app.paymentDetails?.transactionId" class="text-muted">Pending</p>
                </div>
              </div>

              <div class="action-buttons">
                <button 
                  class="btn-verify" 
                  *ngIf="app.paymentDetails?.paymentStatus === 'initiated'"
                  (click)="showVerifyPaymentModal(app)"
                >
                  ✓ Verify Payment
                </button>
                <button class="btn-view" (click)="viewDetails(app._id)">
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="pendingPayments.length === 0 && !loadingPayments">
          <p>No pending payments</p>
        </div>

        <div class="loading" *ngIf="loadingPayments">
          <span class="spinner"></span>
          Loading...
        </div>
      </div>

      <!-- Completed Tab -->
      <div class="tab-content" *ngIf="activeTab === 'completed'">
        <div class="section-header">
          <h2>Completed Applications</h2>
          <p>Applications with completed payments</p>
        </div>

        <div class="applications-list" *ngIf="completedApplications.length > 0">
          <div class="application-card" *ngFor="let app of completedApplications">
            <div class="card-header">
              <div class="app-title">
                <h3>{{ app.companyName }}</h3>
                <p class="course-title">{{ app.courseTitle }}</p>
              </div>
              <div class="app-status">
                <span class="status-badge completed">✓ Completed</span>
              </div>
            </div>

            <div class="card-body">
              <div class="details-grid">
                <div class="detail">
                  <label>Amount Paid</label>
                  <p class="amount">{{ app.paymentDetails?.currency || 'ZWL' }} {{ app.paymentDetails?.amount || 0 }}</p>
                </div>
                <div class="detail">
                  <label>Paid On</label>
                  <p>{{ app.paymentDetails?.paidAt | date: 'short' }}</p>
                </div>
                <div class="detail">
                  <label>Transaction ID</label>
                  <p>{{ app.paymentDetails?.transactionId }}</p>
                </div>
                <div class="detail">
                  <label>Applicant</label>
                  <p>{{ app.email }}</p>
                </div>
              </div>

              <div class="action-buttons">
                <button class="btn-view" (click)="viewDetails(app._id)">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="completedApplications.length === 0 && !loadingCompleted">
          <p>No completed applications</p>
        </div>

        <div class="loading" *ngIf="loadingCompleted">
          <span class="spinner"></span>
          Loading...
        </div>
      </div>

      <!-- Approve Modal -->
      <div class="modal-overlay" *ngIf="showApproveModalFlag" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Approve CPD Application</h2>
            <button class="modal-close" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div *ngIf="selectedApp" class="modal-content">
              <h3>{{ selectedApp.companyName }}</h3>
              <p>Course: {{ selectedApp.courseTitle }}</p>
              <div class="form-group">
                <label for="approveNotes">Notes (Optional)</label>
                <textarea 
                  id="approveNotes" 
                  [(ngModel)]="approvalNotes" 
                  class="form-control" 
                  rows="4"
                  placeholder="Add any approval notes here..."
                ></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-primary" (click)="approveApplication()" [disabled]="isProcessing">
              {{ isProcessing ? 'Processing...' : 'Approve for Payment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div class="modal-overlay" *ngIf="showRejectModalFlag" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Reject CPD Application</h2>
            <button class="modal-close" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div *ngIf="selectedApp" class="modal-content">
              <h3>{{ selectedApp.companyName }}</h3>
              <p>Course: {{ selectedApp.courseTitle }}</p>
              <div class="form-group">
                <label for="rejectReason">Reason for Rejection *</label>
                <textarea 
                  id="rejectReason" 
                  [(ngModel)]="rejectionReason" 
                  class="form-control" 
                  rows="4"
                  placeholder="Explain why the application is being rejected..."
                  required
                ></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-danger" (click)="rejectApplication()" [disabled]="isProcessing || !rejectionReason">
              {{ isProcessing ? 'Processing...' : 'Reject Application' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Verify Payment Modal -->
      <div class="modal-overlay" *ngIf="showVerifyPaymentModalFlag" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Verify Payment</h2>
            <button class="modal-close" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div *ngIf="selectedApp" class="modal-content">
              <h3>{{ selectedApp.companyName }}</h3>
              <p>Amount: {{ selectedApp.paymentDetails?.currency }} {{ selectedApp.paymentDetails?.amount }}</p>
              <p>Transaction ID: {{ selectedApp.paymentDetails?.transactionId }}</p>
              <div class="form-group">
                <label>
                  <input type="checkbox" [(ngModel)]="paymentVerified" />
                  Payment verified and approved
                </label>
              </div>
              <div class="form-group">
                <label for="verifyNotes">Notes (Optional)</label>
                <textarea 
                  id="verifyNotes" 
                  [(ngModel)]="paymentVerificationNotes" 
                  class="form-control" 
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn-primary" (click)="verifyPayment()" [disabled]="isProcessing || !paymentVerified">
              {{ isProcessing ? 'Processing...' : 'Verify Payment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div class="message-box" *ngIf="successMessage" class="success">
        <p>{{ successMessage }}</p>
        <button class="message-close" (click)="successMessage = ''">×</button>
      </div>

      <div class="message-box" *ngIf="errorMessage" class="error">
        <p>{{ errorMessage }}</p>
        <button class="message-close" (click)="errorMessage = ''">×</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-cpd-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header {
      margin-bottom: 30px;
      padding: 20px 0;
      border-bottom: 2px solid #ecf0f1;
    }

    .header h1 {
      font-size: 2em;
      color: #2c3e50;
      margin: 0 0 10px 0;
    }

    .header p {
      color: #7f8c8d;
      font-size: 1.05em;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      border-bottom: 2px solid #ecf0f1;
    }

    .tab-button {
      padding: 12px 20px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: #7f8c8d;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tab-button:hover {
      color: #3498db;
    }

    .tab-button.active {
      color: #3498db;
      border-bottom-color: #3498db;
    }

    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .section-header {
      margin-bottom: 25px;
    }

    .section-header h2 {
      font-size: 1.5em;
      color: #2c3e50;
      margin: 0 0 10px 0;
    }

    .section-header p {
      color: #7f8c8d;
      margin: 0;
    }

    .applications-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .application-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .application-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #ecf0f1;
    }

    .app-title h3 {
      margin: 0 0 5px 0;
      color: #2c3e50;
      font-size: 1.2em;
    }

    .course-title {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .app-status {
      flex-shrink: 0;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-badge.pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-badge.completed {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.initiated {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .card-body {
      padding: 20px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .detail label {
      display: block;
      font-size: 0.85em;
      color: #7f8c8d;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .detail p {
      margin: 0;
      color: #2c3e50;
      word-break: break-word;
      font-size: 0.95em;
    }

    .detail p.amount {
      font-size: 1.1em;
      color: #27ae60;
      font-weight: 600;
    }

    .detail p.text-muted {
      color: #7f8c8d;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-approve, .btn-reject, .btn-verify, .btn-view, .btn-primary, .btn-secondary, .btn-danger {
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      font-size: 0.9em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-approve {
      background-color: #27ae60;
      color: white;
    }

    .btn-approve:hover {
      background-color: #229954;
    }

    .btn-reject {
      background-color: #e74c3c;
      color: white;
    }

    .btn-reject:hover {
      background-color: #c0392b;
    }

    .btn-verify {
      background-color: #3498db;
      color: white;
    }

    .btn-verify:hover {
      background-color: #2980b9;
    }

    .btn-view {
      background-color: #95a5a6;
      color: white;
    }

    .btn-view:hover {
      background-color: #7f8c8d;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2980b9;
    }

    .btn-primary:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #95a5a6;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #7f8c8d;
    }

    .btn-danger {
      background-color: #e74c3c;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c0392b;
    }

    .btn-danger:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #7f8c8d;
    }

    .loading {
      text-align: center;
      padding: 40px 20px;
      color: #7f8c8d;
    }

    .spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #ecf0f1;
    }

    .modal-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5em;
      color: #7f8c8d;
      cursor: pointer;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-content h3 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }

    .modal-content p {
      margin: 5px 0;
      color: #7f8c8d;
    }

    .form-group {
      margin: 15px 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #2c3e50;
      font-weight: 600;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #bdc3c7;
      border-radius: 5px;
      font-family: inherit;
      resize: vertical;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
    }

    .form-group label input[type="checkbox"] {
      margin-right: 10px;
    }

    .modal-footer {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding: 20px;
      border-top: 1px solid #ecf0f1;
    }

    .message-box {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
      max-width: 400px;
      z-index: 999;
    }

    .message-box.success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .message-box.error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .message-close {
      background: none;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      color: inherit;
    }

    @media (max-width: 768px) {
      .applications-list {
        grid-template-columns: 1fr;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
      }

      .modal-footer {
        flex-direction: column;
      }

      .modal-footer button {
        width: 100%;
      }
    }
  `]
})
export class CpdAdminManagementComponent implements OnInit {
  activeTab: 'pending' | 'payments' | 'completed' = 'pending';
  pendingApprovals: CpdApplicationWithPayment[] = [];
  pendingPayments: CpdApplicationWithPayment[] = [];
  completedApplications: CpdApplicationWithPayment[] = [];
  
  selectedApp: CpdApplicationWithPayment | null = null;
  approvalNotes = '';
  rejectionReason = '';
  paymentVerified = false;
  paymentVerificationNotes = '';
  
  showApproveModalFlag = false;
  showRejectModalFlag = false;
  showVerifyPaymentModalFlag = false;
  
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  
  loadingPending = false;
  loadingPayments = false;
  loadingCompleted = false;

  get pendingCount(): number {
    return this.pendingApprovals.length;
  }

  get paymentCount(): number {
    return this.pendingPayments.length;
  }

  constructor(private cpdService: CpdService) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loadPendingApprovals();
    this.loadPendingPayments();
    this.loadCompletedApplications();
  }

  loadPendingApprovals() {
    this.loadingPending = true;
    this.cpdService.getPendingApprovals().subscribe(
      (response) => {
        this.pendingApprovals = response.applications || [];
        this.loadingPending = false;
      },
      (error) => {
        this.errorMessage = 'Failed to load pending approvals';
        this.loadingPending = false;
      }
    );
  }

  loadPendingPayments() {
    this.loadingPayments = true;
    this.cpdService.getPendingPayments().subscribe(
      (response) => {
        this.pendingPayments = response.applications || [];
        this.loadingPayments = false;
      },
      (error) => {
        this.errorMessage = 'Failed to load pending payments';
        this.loadingPayments = false;
      }
    );
  }

  loadCompletedApplications() {
    this.loadingCompleted = true;
    this.cpdService.getApplications({ status: 'Payment Completed' }).subscribe(
      (response) => {
        this.completedApplications = response.applications || [];
        this.loadingCompleted = false;
      },
      (error) => {
        this.errorMessage = 'Failed to load completed applications';
        this.loadingCompleted = false;
      }
    );
  }

  switchTab(tab: 'pending' | 'payments' | 'completed') {
    this.activeTab = tab;
  }

  showApproveModal(app: CpdApplicationWithPayment) {
    this.selectedApp = app;
    this.approvalNotes = '';
    this.showApproveModalFlag = true;
  }

  showRejectModal(app: CpdApplicationWithPayment) {
    this.selectedApp = app;
    this.rejectionReason = '';
    this.showRejectModalFlag = true;
  }

  showVerifyPaymentModal(app: CpdApplicationWithPayment) {
    this.selectedApp = app;
    this.paymentVerified = false;
    this.paymentVerificationNotes = '';
    this.showVerifyPaymentModalFlag = true;
  }

  closeModals() {
    this.showApproveModalFlag = false;
    this.showRejectModalFlag = false;
    this.showVerifyPaymentModalFlag = false;
    this.selectedApp = null;
  }

  approveApplication() {
    if (!this.selectedApp) return;

    this.isProcessing = true;
    this.cpdService.approveApplication(this.selectedApp._id, this.approvalNotes).subscribe(
      () => {
        this.successMessage = 'Application approved successfully. Notification sent to applicant.';
        this.closeModals();
        this.isProcessing = false;
        this.loadApplications();
      },
      (error) => {
        this.errorMessage = error.error?.message || 'Failed to approve application';
        this.isProcessing = false;
      }
    );
  }

  rejectApplication() {
    if (!this.selectedApp || !this.rejectionReason) return;

    this.isProcessing = true;
    this.cpdService.rejectApplication(this.selectedApp._id, this.rejectionReason).subscribe(
      () => {
        this.successMessage = 'Application rejected. Notification sent to applicant.';
        this.closeModals();
        this.isProcessing = false;
        this.loadApplications();
      },
      (error) => {
        this.errorMessage = error.error?.message || 'Failed to reject application';
        this.isProcessing = false;
      }
    );
  }

  verifyPayment() {
    if (!this.selectedApp) return;

    this.isProcessing = true;
    this.cpdService.verifyPayment(this.selectedApp._id, this.paymentVerified, this.paymentVerificationNotes).subscribe(
      () => {
        this.successMessage = 'Payment verified successfully.';
        this.closeModals();
        this.isProcessing = false;
        this.loadApplications();
      },
      (error) => {
        this.errorMessage = error.error?.message || 'Failed to verify payment';
        this.isProcessing = false;
      }
    );
  }

  viewDetails(id: string) {
    // Navigate to application details page
    window.open(`/cpd/${id}`, '_blank');
  }

  getPaymentStatusText(status?: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending Payment',
      initiated: 'Payment Initiated',
      completed: 'Payment Completed',
      failed: 'Payment Failed',
      cancelled: 'Payment Cancelled',
    };
    return statusMap[status || ''] || 'Unknown Status';
  }

  getPaymentStatusClass(status?: string): string {
    const classMap: Record<string, string> = {
      pending: 'pending',
      initiated: 'initiated',
      completed: 'completed',
      failed: 'rejected',
      cancelled: 'rejected',
    };
    return classMap[status || ''] || '';
  }
}
