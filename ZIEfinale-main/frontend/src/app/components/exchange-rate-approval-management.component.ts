import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ExchangeRateApproval {
  _id: string;
  requestedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  requestedRate: number;
  currentRate: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvalComment?: string;
  approvalDate?: Date;
  createdAt: Date;
}

@Component({
  selector: 'app-exchange-rate-approval-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exchange-rate-section">
      <div class="section-header">
        <h2>
          <span class="material-symbols-outlined">currency_exchange</span>
          Exchange Rate Update Approvals
        </h2>
        <span class="count-badge pending">{{ pendingApprovals.length }} Pending</span>
        <button (click)="refreshApprovals()" class="btn-refresh-small">
          <span class="material-symbols-outlined">refresh</span>
          Refresh
        </button>
      </div>

      <!-- Current Exchange Rate Info -->
      <div class="exchange-rate-info">
        <div class="rate-display">
          <p class="rate-label">Current Exchange Rate:</p>
          <p class="rate-value">1 USD = ZWL {{ currentRate | number: '1.2-2' }}</p>
          <p class="rate-updated">Last updated: {{ lastUpdated | date: 'medium' }}</p>
        </div>
      </div>

      <!-- Pending Approvals -->
      <div *ngIf="pendingApprovals.length > 0" class="approvals-container">
        <h3>Pending Approvals ({{ pendingApprovals.length }})</h3>
        
        <div *ngFor="let approval of pendingApprovals" class="approval-card pending-card">
          <div class="approval-header">
            <div class="approval-info">
              <p class="requested-by">
                <strong>Requested by:</strong> {{ approval.requestedBy.firstName }} {{ approval.requestedBy.lastName }}
                <span class="email">({{ approval.requestedBy.email }})</span>
              </p>
              <p class="date">
                <span class="material-symbols-outlined">calendar_today</span>
                {{ approval.createdAt | date: 'medium' }}
              </p>
            </div>
            <div class="approval-status pending">PENDING</div>
          </div>

          <div class="rate-comparison">
            <div class="rate-box">
              <p class="label">Current Rate</p>
              <p class="target-rate">1 USD = <strong>ZWL {{ approval.currentRate | number: '1.2-2' }}</strong></p>
            </div>
            <div class="arrow">
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
            <div class="rate-box new">
              <p class="label">Requested Rate</p>
              <p class="target-rate" [ngClass]="approval.requestedRate > approval.currentRate ? 'increase' : 'decrease'">
                1 USD = <strong>ZWL {{ approval.requestedRate | number: '1.2-2' }}</strong>
                <span class="change-percent">
                  ({{ ((approval.requestedRate - approval.currentRate) / approval.currentRate * 100) | number: '1.1-1' }}%)
                </span>
              </p>
            </div>
          </div>

          <div class="reason-section">
            <p class="reason-label"><strong>Reason for Update:</strong></p>
            <p class="reason-text">{{ approval.reason }}</p>
          </div>

          <div class="action-buttons">
            <button (click)="approveRate(approval._id)" class="btn-approve" [disabled]="isProcessing">
              <span class="material-symbols-outlined">check_circle</span>
              Approve
            </button>
            <button (click)="rejectRate(approval._id)" class="btn-reject" [disabled]="isProcessing">
              <span class="material-symbols-outlined">cancel</span>
              Reject
            </button>
          </div>

          <textarea 
            *ngIf="selectedApprovalId === approval._id && showCommentBox"
            [(ngModel)]="approvalComment"
            placeholder="Add optional comment..."
            class="comment-input"
            rows="3">
          </textarea>

          <div *ngIf="selectedApprovalId === approval._id && showCommentBox" class="comment-actions">
            <button (click)="submitApprovalAction()" class="btn-submit" [disabled]="isProcessing">
              {{ approvalAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
            </button>
            <button (click)="cancelAction()" class="btn-cancel">Cancel</button>
          </div>
        </div>
      </div>

      <!-- No Pending Approvals -->
      <div *ngIf="pendingApprovals.length === 0" class="no-data">
        <span class="material-symbols-outlined">done_all</span>
        <p>All exchange rate updates have been processed</p>
      </div>

      <!-- Approval History -->
      <div *ngIf="approvalHistory.length > 0" class="history-section">
        <h3>Recent Approval History</h3>
        
        <div class="history-table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Admin</th>
                <th>Current Rate</th>
                <th>Requested Rate</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of approvalHistory" [ngClass]="'status-' + item.status">
                <td>{{ item.createdAt | date: 'short' }}</td>
                <td>{{ item.requestedBy.firstName }} {{ item.requestedBy.lastName }}</td>
                <td>ZWL {{ item.currentRate | number: '1.2-2' }}</td>
                <td>ZWL {{ item.requestedRate | number: '1.2-2' }}</td>
                <td>
                  <span class="status-badge" [ngClass]="item.status">
                    {{ item.status | uppercase }}
                  </span>
                </td>
                <td>{{ item.approvedBy?.firstName || '-' }} {{ item.approvedBy?.lastName || '' }}</td>
                <td class="comment">{{ item.approvalComment || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div *ngIf="successMessage" class="alert alert-success">
        <span class="material-symbols-outlined">check_circle</span>
        {{ successMessage }}
      </div>

      <div *ngIf="errorMessage" class="alert alert-error">
        <span class="material-symbols-outlined">error</span>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .exchange-rate-section {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 20px 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2.5px solid #004A59;
    }

    .section-header h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      color: #004A59;
      font-weight: 700;
    }

    .section-header .material-symbols-outlined {
      font-size: 28px;
    }

    .count-badge {
      background: #B99532;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
    }

    .count-badge.pending {
      background: #e74c3c;
    }

    .btn-refresh-small {
      background: #3498db;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 700;
    }

    .exchange-rate-info {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 2.5px solid #B99532;
    }

    .rate-display {
      text-align: center;
    }

    .rate-label {
      margin: 0 0 10px 0;
      color: #666;
      font-weight: 600;
    }

    .rate-value {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #004A59;
    }

    .rate-updated {
      margin: 5px 0 0 0;
      color: #999;
      font-size: 12px;
    }

    .approvals-container {
      margin-bottom: 30px;
    }

    .approvals-container h3 {
      color: #004A59;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .approval-card {
      background: white;
      border: 2.5px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
    }

    .approval-card.pending-card {
      border-color: #e74c3c;
      background: #fff5f5;
    }

    .approval-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ddd;
    }

    .approval-info {
      flex: 1;
    }

    .requested-by {
      margin: 0 0 10px 0;
      font-weight: 600;
      color: #333;
    }

    .requested-by .email {
      color: #666;
      font-size: 12px;
      margin-left: 5px;
    }

    .date {
      margin: 0;
      color: #999;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .date .material-symbols-outlined {
      font-size: 16px;
    }

    .approval-status {
      padding: 8px 15px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 12px;
    }

    .approval-status.pending {
      background: #e74c3c;
      color: white;
    }

    .rate-comparison {
      display: flex;
      align-items: center;
      justify-content: space-around;
      margin-bottom: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .rate-box {
      flex: 1;
      text-align: center;
      padding: 10px;
    }

    .rate-box.new {
      border-left: 2.5px solid #B99532;
      padding-left: 20px;
    }

    .rate-box .label {
      margin: 0 0 10px 0;
      color: #666;
      font-weight: 600;
      font-size: 13px;
    }

    .target-rate {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #333;
    }

    .target-rate.increase {
      color: #e74c3c;
    }

    .target-rate.decrease {
      color: #27ae60;
    }

    .change-percent {
      font-size: 12px;
      display: block;
      color: #999;
      margin-top: 5px;
    }

    .arrow {
      margin: 0 20px;
      color: #999;
    }

    .arrow .material-symbols-outlined {
      font-size: 28px;
    }

    .reason-section {
      margin-bottom: 20px;
      padding: 15px;
      background: #f0f8ff;
      border-left: 3px solid #3498db;
      border-radius: 4px;
    }

    .reason-label {
      margin: 0 0 8px 0;
      color: #333;
      font-weight: 600;
    }

    .reason-text {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .btn-approve,
    .btn-reject,
    .btn-submit,
    .btn-cancel {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .btn-approve {
      background: #27ae60;
      color: white;
      flex: 1;
    }

    .btn-approve:hover:not(:disabled) {
      background: #229954;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(39, 174, 96, 0.2);
    }

    .btn-reject {
      background: #e74c3c;
      color: white;
      flex: 1;
    }

    .btn-reject:hover:not(:disabled) {
      background: #c0392b;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(231, 76, 60, 0.2);
    }

    .btn-submit {
      background: #3498db;
      color: white;
      flex: 1;
    }

    .btn-submit:hover:not(:disabled) {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
    }

    .btn-cancel {
      background: #95a5a6;
      color: white;
      flex: 1;
    }

    .btn-cancel:hover {
      background: #7f8c8d;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .comment-input {
      width: 100%;
      padding: 10px;
      border: 2.5px solid #ddd;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      margin-bottom: 10px;
      resize: vertical;
    }

    .comment-actions {
      display: flex;
      gap: 10px;
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .no-data .material-symbols-outlined {
      font-size: 48px;
      display: block;
      margin-bottom: 15px;
      color: #b0b0b0;
    }

    .history-section {
      margin-top: 30px;
    }

    .history-section h3 {
      color: #004A59;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .history-table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 2.5px solid #ddd;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .history-table thead {
      background: #f5f5f5;
      border-bottom: 2.5px solid #004A59;
    }

    .history-table th {
      padding: 12px;
      text-align: left;
      font-weight: 700;
      color: #004A59;
    }

    .history-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }

    .history-table tbody tr:hover {
      background: #fafafa;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 11px;
      display: inline-block;
    }

    .status-badge.approved {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .history-table tbody tr.status-approved {
      border-left: 3px solid #27ae60;
    }

    .history-table tbody tr.status-rejected {
      border-left: 3px solid #e74c3c;
    }

    .alert {
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 2.5px solid #27ae60;
    }

    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 2.5px solid #e74c3c;
    }

    .alert .material-symbols-outlined {
      font-size: 20px;
    }

    @media (max-width: 768px) {
      .rate-comparison {
        flex-direction: column;
        gap: 10px;
      }

      .arrow {
        transform: rotate(90deg);
        margin: 10px 0;
      }

      .history-table {
        font-size: 12px;
      }

      .history-table th,
      .history-table td {
        padding: 8px;
      }

      .approval-header {
        flex-direction: column;
      }

      .approval-status {
        align-self: flex-start;
        margin-top: 10px;
      }
    }
  `]
})
export class ExchangeRateApprovalManagementComponent implements OnInit, OnDestroy {
  pendingApprovals: ExchangeRateApproval[] = [];
  approvalHistory: ExchangeRateApproval[] = [];
  currentRate = 0;
  lastUpdated = new Date();
  
  isProcessing = false;
  showCommentBox = false;
  selectedApprovalId = '';
  approvalAction: 'approve' | 'reject' = 'approve';
  approvalComment = '';
  
  successMessage = '';
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadApprovals();
    this.getCurrentExchangeRate();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentExchangeRate() {
    this.http.get<any>('/api/settings/exchange-rate')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentRate = response.rate;
          this.lastUpdated = new Date();
        },
        error: (error) => {
          console.error('Error fetching exchange rate:', error);
        }
      });
  }

  loadApprovals() {
    this.http.get<any>('/api/settings/exchange-rate/pending')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pendingApprovals = response.approvals || [];
          this.loadApprovalHistory();
        },
        error: (error) => {
          console.error('Error loading approvals:', error);
          this.errorMessage = 'Failed to load pending approvals';
        }
      });
  }

  loadApprovalHistory() {
    this.http.get<any>('/api/settings/exchange-rate/history?limit=10')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.approvalHistory = (response.approvals || []).filter((a: ExchangeRateApproval) => a.status !== 'pending');
        },
        error: (error) => {
          console.error('Error loading history:', error);
        }
      });
  }

  approveRate(approvalId: string) {
    this.selectedApprovalId = approvalId;
    this.approvalAction = 'approve';
    this.showCommentBox = true;
    this.approvalComment = '';
  }

  rejectRate(approvalId: string) {
    this.selectedApprovalId = approvalId;
    this.approvalAction = 'reject';
    this.showCommentBox = true;
    this.approvalComment = '';
  }

  submitApprovalAction() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const endpoint = this.approvalAction === 'approve' 
      ? `/api/settings/exchange-rate/${this.selectedApprovalId}/approve`
      : `/api/settings/exchange-rate/${this.selectedApprovalId}/reject`;

    this.http.post<any>(endpoint, { comment: this.approvalComment })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isProcessing = false;
          this.showCommentBox = false;
          this.selectedApprovalId = '';
          this.loadApprovals();
          this.getCurrentExchangeRate();
          
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          console.error('Error submitting action:', error);
          this.errorMessage = error.error?.message || 'Failed to process request';
          this.isProcessing = false;
          
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
  }

  cancelAction() {
    this.showCommentBox = false;
    this.selectedApprovalId = '';
    this.approvalComment = '';
  }

  refreshApprovals() {
    this.loadApprovals();
    this.getCurrentExchangeRate();
  }
}
