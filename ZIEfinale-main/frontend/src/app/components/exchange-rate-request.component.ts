import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ExchangeRateRequest {
  newRate: number;
  reason: string;
}

@Component({
  selector: 'app-exchange-rate-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exchange-rate-request-section">
      <div class="section-header">
        <h2>
          <span class="material-symbols-outlined">currency_exchange</span>
          Request Exchange Rate Update
        </h2>
      </div>

      <div class="current-rate-info">
        <div class="rate-box">
          <p class="label">Current Exchange Rate</p>
          <p class="rate-value">1 USD = ZWL {{ currentRate | number: '1.2-2' }}</p>
          <p class="updated-date">{{ lastUpdated | date: 'medium' }}</p>
        </div>
      </div>

      <form (ngSubmit)="submitRequest()" [ngClass]="{'submitting': submitting}">
        <div class="form-group">
          <label for="newRate">
            <span class="label-text">New Exchange Rate (USD to ZWL)</span>
            <span class="required">*</span>
          </label>
          <input
            type="number"
            id="newRate"
            [(ngModel)]="request.newRate"
            name="newRate"
            step="0.01"
            min="0.01"
            placeholder="Enter new rate (e.g., 27.50)"
            [disabled]="submitting"
            class="rate-input"
          />
          <p class="rate-preview" *ngIf="request.newRate > 0">
            <strong>Change from current rate:</strong>
            <span [ngClass]="request.newRate > currentRate ? 'increase' : 'decrease'">
              {{ request.newRate > currentRate ? '+' : '' }}ZWL {{ (request.newRate - currentRate) | number: '1.2-2' }}
              ({{ ((request.newRate - currentRate) / currentRate * 100) | number: '1.1-1' }}%)
            </span>
          </p>
          <p class="error-message" *ngIf="errors.newRate">{{ errors.newRate }}</p>
        </div>

        <div class="form-group">
          <label for="reason">
            <span class="label-text">Reason for Update</span>
            <span class="required">*</span>
          </label>
          <textarea
            id="reason"
            [(ngModel)]="request.reason"
            name="reason"
            placeholder="Provide a detailed reason for the exchange rate update request..."
            rows="5"
            [disabled]="submitting"
            class="reason-input"
          ></textarea>
          <p class="char-count">{{ request.reason.length }}/500</p>
          <p class="error-message" *ngIf="errors.reason">{{ errors.reason }}</p>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" [disabled]="submitting">
            <span class="material-symbols-outlined">send</span>
            {{ submitting ? 'Submitting...' : 'Submit Request for Approval' }}
          </button>
          <button type="button" (click)="resetForm()" class="btn-reset" [disabled]="submitting">
            <span class="material-symbols-outlined">refresh</span>
            Clear Form
          </button>
        </div>
      </form>

      <!-- Success Message -->
      <div *ngIf="successMessage" class="alert alert-success">
        <span class="material-symbols-outlined">check_circle</span>
        <div>
          <p class="alert-title">Request Submitted Successfully</p>
          <p class="alert-message">{{ successMessage }}</p>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="alert alert-error">
        <span class="material-symbols-outlined">error</span>
        <div>
          <p class="alert-title">Error</p>
          <p class="alert-message">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <span class="material-symbols-outlined">info</span>
        <div>
          <p class="info-title">How the Approval Process Works</p>
          <ol>
            <li>You submit a request with the new exchange rate and reason</li>
            <li>All superadmins receive an email notification with your request</li>
            <li>Superadmins review and approve or reject your request</li>
            <li>You'll receive an email confirming the decision</li>
            <li>If approved, the new rate becomes active immediately in the system</li>
          </ol>
        </div>
      </div>

      <!-- Recent Requests -->
      <div *ngIf="recentRequests.length > 0" class="recent-requests-section">
        <h3>Your Recent Requests</h3>
        
        <table class="requests-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Current Rate</th>
              <th>Requested Rate</th>
              <th>Status</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of recentRequests" [ngClass]="'status-' + req.status">
              <td class="date">{{ req.createdAt | date: 'short' }}</td>
              <td class="rate">ZWL {{ req.currentRate | number: '1.2-2' }}</td>
              <td class="rate">ZWL {{ req.requestedRate | number: '1.2-2' }}</td>
              <td>
                <span class="status-badge" [ngClass]="req.status">
                  {{ req.status | uppercase }}
                </span>
              </td>
              <td class="comment">{{ req.approvalComment || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .exchange-rate-request-section {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 20px 0;
    }

    .section-header {
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

    .current-rate-info {
      margin-bottom: 30px;
    }

    .rate-box {
      background: white;
      border: 2.5px solid #B99532;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }

    .rate-box .label {
      margin: 0 0 10px 0;
      color: #666;
      font-weight: 600;
      font-size: 14px;
    }

    .rate-box .rate-value {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 700;
      color: #004A59;
    }

    .rate-box .updated-date {
      margin: 0;
      color: #999;
      font-size: 12px;
    }

    form {
      background: white;
      padding: 30px;
      border-radius: 8px;
      border: 2.5px solid #ddd;
      margin-bottom: 20px;
    }

    form.submitting {
      opacity: 0.6;
    }

    .form-group {
      margin-bottom: 25px;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 10px;
      font-weight: 700;
      color: #333;
    }

    .label-text {
      color: #333;
    }

    .required {
      color: #e74c3c;
    }

    .rate-input,
    .reason-input {
      width: 100%;
      padding: 12px;
      border: 2.5px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .rate-input:focus,
    .reason-input:focus {
      outline: none;
      border-color: #004A59;
      box-shadow: 0 0 0 3px rgba(0, 74, 89, 0.1);
    }

    .rate-input:disabled,
    .reason-input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .rate-preview {
      margin: 10px 0 0 0;
      font-size: 13px;
      color: #666;
    }

    .rate-preview .increase {
      color: #e74c3c;
      font-weight: 700;
    }

    .rate-preview .decrease {
      color: #27ae60;
      font-weight: 700;
    }

    .char-count {
      margin: 5px 0 0 0;
      font-size: 12px;
      color: #999;
      text-align: right;
    }

    .error-message {
      margin: 8px 0 0 0;
      color: #e74c3c;
      font-size: 13px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;
    }

    .btn-submit,
    .btn-reset {
      flex: 1;
      padding: 12px 20px;
      border: none;
      border-radius: 4px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
      font-size: 14px;
    }

    .btn-submit {
      background: #004A59;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #003844;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 74, 89, 0.2);
    }

    .btn-reset {
      background: #95a5a6;
      color: white;
    }

    .btn-reset:hover:not(:disabled) {
      background: #7f8c8d;
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert {
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      gap: 15px;
      border: 2.5px solid;
    }

    .alert-success {
      background: #d4edda;
      border-color: #27ae60;
      color: #155724;
    }

    .alert-error {
      background: #f8d7da;
      border-color: #e74c3c;
      color: #721c24;
    }

    .alert .material-symbols-outlined {
      font-size: 28px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-title {
      margin: 0 0 5px 0;
      font-weight: 700;
      font-size: 16px;
    }

    .alert-message {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .info-box {
      background: #e8f4f8;
      border: 2.5px solid #3498db;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
    }

    .info-box .material-symbols-outlined {
      font-size: 28px;
      color: #3498db;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-title {
      margin: 0 0 10px 0;
      font-weight: 700;
      color: #004A59;
      font-size: 15px;
    }

    .info-box ol {
      margin: 0;
      padding-left: 20px;
      color: #555;
      line-height: 1.8;
    }

    .info-box li {
      margin-bottom: 8px;
      font-size: 13px;
    }

    .recent-requests-section {
      margin-top: 30px;
    }

    .recent-requests-section h3 {
      color: #004A59;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .requests-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      border: 2.5px solid #ddd;
    }

    .requests-table thead {
      background: #f5f5f5;
      border-bottom: 2.5px solid #004A59;
    }

    .requests-table th {
      padding: 12px;
      text-align: left;
      font-weight: 700;
      color: #004A59;
      font-size: 14px;
    }

    .requests-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }

    .requests-table tbody tr:hover {
      background: #fafafa;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      display: inline-block;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.approved {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .requests-table tbody tr.status-approved {
      border-left: 3px solid #27ae60;
    }

    .requests-table tbody tr.status-rejected {
      border-left: 3px solid #e74c3c;
    }

    .requests-table tbody tr.status-pending {
      border-left: 3px solid #f39c12;
    }

    @media (max-width: 768px) {
      .form-actions {
        flex-direction: column;
      }

      .btn-submit,
      .btn-reset {
        width: 100%;
      }

      .requests-table {
        font-size: 12px;
      }

      .requests-table th,
      .requests-table td {
        padding: 8px;
      }

      .info-box {
        flex-direction: column;
      }

      .info-box .material-symbols-outlined {
        margin-top: 0;
      }
    }
  `]
})
export class ExchangeRateRequestComponent implements OnInit, OnDestroy {
  private apiUrl = `${environment.apiUrl}/settings`;
  request: ExchangeRateRequest = {
    newRate: 0,
    reason: ''
  };

  currentRate = 0;
  lastUpdated = new Date();
  recentRequests: any[] = [];
  
  submitting = false;
  successMessage = '';
  errorMessage = '';
  errors: any = {};
  
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCurrentRate();
    this.loadMyRequests();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentRate() {
    this.http.get<any>(`${this.apiUrl}/exchange-rate`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentRate = response.rate;
          this.lastUpdated = new Date();
        },
        error: (error) => {
          console.error('Error loading exchange rate:', error);
        }
      });
  }

  loadMyRequests() {
    this.http.get<any>(`${this.apiUrl}/exchange-rate/history?limit=5`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentRequests = response.approvals || [];
        },
        error: (error) => {
          console.error('Error loading requests:', error);
        }
      });
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.request.newRate || this.request.newRate <= 0) {
      this.errors.newRate = 'Exchange rate must be greater than 0';
    }

    if (this.request.newRate === this.currentRate) {
      this.errors.newRate = 'New rate must be different from current rate';
    }

    if (!this.request.reason || this.request.reason.trim().length === 0) {
      this.errors.reason = 'Reason is required';
    }

    if (this.request.reason.length > 500) {
      this.errors.reason = 'Reason cannot exceed 500 characters';
    }

    return Object.keys(this.errors).length === 0;
  }

  submitRequest() {
    if (!this.validateForm()) {
      return;
    }

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.post<any>(`${this.apiUrl}/exchange-rate/request`, {
      newRate: this.request.newRate,
      reason: this.request.reason
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Your exchange rate update request has been submitted successfully. All superadmins have been notified and will review your request shortly.';
          this.submitting = false;
          this.resetForm();
          this.loadMyRequests();
          
          setTimeout(() => this.successMessage = '', 8000);
        },
        error: (error) => {
          console.error('Error submitting request:', error);
          this.errorMessage = error.error?.message || 'Failed to submit request. Please try again.';
          this.submitting = false;
          
          setTimeout(() => this.errorMessage = '', 8000);
        }
      });
  }

  resetForm() {
    this.request = {
      newRate: 0,
      reason: ''
    };
    this.errors = {};
  }
}
