import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CpdService } from '../services/cpd.service';
import { formatCpdAmount, getCurrencySymbol, getPaymentStatusBadge, getApprovalStatusBadge } from '../services/cpd-fee.service';

@Component({
  selector: 'app-cpd-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="cpd-payment-container">
      <div class="payment-header">
        <h1>CPD Training Payment</h1>
        <p class="subtitle">Complete your payment to confirm your training programme</p>
      </div>

      <div class="payment-content" *ngIf="application">
        <!-- Application Details Card -->
        <div class="card application-details">
          <h2>Application Details</h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>Organization</label>
              <p>{{ application.companyName }}</p>
            </div>
            <div class="detail-item">
              <label>Course Title</label>
              <p>{{ application.courseTitle }}</p>
            </div>
            <div class="detail-item">
              <label>Contact Email</label>
              <p>{{ application.email }}</p>
            </div>
            <div class="detail-item">
              <label>Application ID</label>
              <p>{{ application._id }}</p>
            </div>
          </div>
        </div>

        <!-- Approval Status Card -->
        <div class="card approval-status" *ngIf="application.adminApproval">
          <h2>Approval Status</h2>
          <div class="status-badge" [ngClass]="getApprovalStatusClass()">
            {{ getApprovalStatusText() }}
          </div>
          <div *ngIf="application.adminApproval.rejectionReason" class="rejection-reason">
            <h3>Reason for Non-Approval:</h3>
            <p>{{ application.adminApproval.rejectionReason }}</p>
          </div>
          <div *ngIf="application.adminApproval.approvalStatus === 'approved'" class="approval-info">
            <p>✓ Your application has been approved for payment.</p>
            <p *ngIf="application.adminApproval.approvedAt">
              Approved on: {{ application.adminApproval.approvedAt | date: 'medium' }}
            </p>
          </div>
        </div>

        <!-- Payment Details Card -->
        <div class="card payment-details" *ngIf="application.paymentDetails">
          <h2>Payment Information</h2>
          
          <div class="payment-amount">
            <span class="label">Total Amount Due:</span>
            <span class="amount">{{ formatAmount() }}</span>
          </div>

          <div class="payment-status">
            <span class="label">Payment Status:</span>
            <span class="status-badge" [ngClass]="getPaymentStatusClass()">
              {{ getPaymentStatusText() }}
            </span>
          </div>

          <div class="currency-note" *ngIf="application.paymentDetails.currency">
            <p>Currency: <strong>{{ application.paymentDetails.currency }}</strong></p>
          </div>

          <!-- Payment Methods -->
          <div class="payment-methods" *ngIf="application.paymentDetails.paymentStatus === 'pending'">
            <h3>Select Payment Method</h3>
            <div class="method-options">
              <label class="method-option">
                <input type="radio" [(ngModel)]="selectedPaymentMethod" value="stripe" name="paymentMethod" />
                <span class="method-name">Credit/Debit Card (Stripe)</span>
                <span class="method-description">Visa, MasterCard, American Express</span>
              </label>
              <label class="method-option">
                <input type="radio" [(ngModel)]="selectedPaymentMethod" value="bank-transfer" name="paymentMethod" />
                <span class="method-name">Bank Transfer</span>
                <span class="method-description">Direct bank deposit</span>
              </label>
              <label class="method-option">
                <input type="radio" [(ngModel)]="selectedPaymentMethod" value="mobile-money" name="paymentMethod" />
                <span class="method-name">Mobile Money</span>
                <span class="method-description">Available in selected regions</span>
              </label>
            </div>
          </div>

          <!-- Payment Action Buttons -->
          <div class="payment-actions" *ngIf="application.paymentDetails.paymentStatus === 'pending'">
            <button 
              class="btn-primary" 
              (click)="initiatePayment()"
              [disabled]="!selectedPaymentMethod || isProcessing"
            >
              {{ isProcessing ? 'Processing...' : 'Proceed to Payment' }}
            </button>
            <button class="btn-secondary" (click)="goBack()" [disabled]="isProcessing">
              Back
            </button>
          </div>

          <!-- Completed Payment Info -->
          <div class="completed-info" *ngIf="application.paymentDetails.paymentStatus === 'completed'">
            <div class="success-icon">✓</div>
            <h3>Payment Completed Successfully</h3>
            <div class="completed-details">
              <p><strong>Transaction ID:</strong> {{ application.paymentDetails.transactionId }}</p>
              <p *ngIf="application.paymentDetails.paidAt">
                <strong>Paid on:</strong> {{ application.paymentDetails.paidAt | date: 'medium' }}
              </p>
            </div>
            <p class="success-message">
              A confirmation email has been sent to <strong>{{ application.email }}</strong> with your training details.
            </p>
            <button class="btn-primary" (click)="goToDashboard()">
              Back to Dashboard
            </button>
          </div>

          <!-- In Progress -->
          <div class="in-progress-info" *ngIf="application.paymentDetails.paymentStatus === 'initiated'">
            <div class="loading-spinner"></div>
            <h3>Payment In Progress</h3>
            <p>Please complete the payment in the gateway. Do not close this page.</p>
          </div>
        </div>

        <!-- Training Mode & Elements Summary -->
        <div class="card training-summary">
          <h2>Training Programme Details</h2>
          
          <div class="training-modes">
            <h3>Training Modes:</h3>
            <ul>
              <li *ngIf="application.trainingMode?.sandwich">✓ Sandwich Programme</li>
              <li *ngIf="application.trainingMode?.undergraduate">✓ Undergraduate Programme</li>
              <li *ngIf="application.trainingMode?.postgraduate">✓ Postgraduate Programme</li>
            </ul>
          </div>

          <div class="training-elements">
            <h3>Training Elements (ZIE Codes):</h3>
            <ul>
              <li *ngIf="application.trainingElements?.A">✓ Element A</li>
              <li *ngIf="application.trainingElements?.B">✓ Element B</li>
              <li *ngIf="application.trainingElements?.C1">✓ Element C1</li>
              <li *ngIf="application.trainingElements?.C2">✓ Element C2</li>
              <li *ngIf="application.trainingElements?.C3">✓ Element C3</li>
              <li *ngIf="application.trainingElements?.C4">✓ Element C4</li>
              <li *ngIf="application.trainingElements?.C5">✓ Element C5</li>
              <li *ngIf="application.trainingElements?.C6">✓ Element C6</li>
              <li *ngIf="application.trainingElements?.C7">✓ Element C7</li>
              <li *ngIf="application.trainingElements?.C8">✓ Element C8</li>
              <li *ngIf="application.trainingElements?.HS">✓ Health & Safety</li>
              <li *ngIf="application.trainingElements?.CS">✓ Communication Skills</li>
              <li *ngIf="application.trainingElements?.IAM">✓ Information & Assessment Methods</li>
            </ul>
          </div>
        </div>

        <!-- Important Notes -->
        <div class="card important-notes">
          <h2>Important Information</h2>
          <ul>
            <li>Your payment must be completed within 30 days of approval to secure your training slot.</li>
            <li>A confirmation email will be sent immediately after successful payment.</li>
            <li>CPD hours will be credited upon successful course completion.</li>
            <li>If you experience any payment issues, please contact cpd&#64;zie.org.zw</li>
            <li>Keep your transaction ID for your records.</li>
          </ul>
        </div>

        <!-- Error Messages -->
        <div class="error-message" *ngIf="errorMessage">
          <p>{{ errorMessage }}</p>
          <button class="btn-secondary" (click)="clearError()">Dismiss</button>
        </div>

        <!-- Success Messages -->
        <div class="success-message-banner" *ngIf="successMessage">
          <p>{{ successMessage }}</p>
          <button class="btn-close" (click)="clearSuccess()">×</button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading" *ngIf="!application && !errorMessage">
        <div class="spinner"></div>
        <p>Loading application details...</p>
      </div>

      <!-- Not Found -->
      <div class="not-found" *ngIf="!application && errorMessage && errorMessage.includes('not found')">
        <p>Application not found.</p>
        <button class="btn-primary" (click)="goToDashboard()">Return to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .cpd-payment-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .payment-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px 0;
    }

    .payment-header h1 {
      font-size: 2.5em;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .payment-header .subtitle {
      font-size: 1.1em;
      color: #7f8c8d;
    }

    .payment-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #3498db;
    }

    .card h2 {
      font-size: 1.5em;
      color: #2c3e50;
      margin-bottom: 20px;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }

    .card h3 {
      font-size: 1.1em;
      color: #34495e;
      margin: 15px 0 10px 0;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .detail-item label {
      display: block;
      font-size: 0.9em;
      color: #7f8c8d;
      margin-bottom: 5px;
      font-weight: 600;
    }

    .detail-item p {
      font-size: 1.1em;
      color: #2c3e50;
      word-break: break-word;
    }

    .status-badge {
      display: inline-block;
      padding: 10px 15px;
      border-radius: 5px;
      font-weight: 600;
      font-size: 1em;
    }

    .status-badge.approved {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.rejected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-badge.pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .payment-amount {
      font-size: 1.3em;
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .payment-amount .label {
      color: #34495e;
      font-weight: 600;
    }

    .payment-amount .amount {
      font-size: 1.5em;
      color: #27ae60;
      font-weight: bold;
    }

    .payment-status {
      margin: 15px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .payment-status .label {
      font-weight: 600;
      color: #34495e;
    }

    .currency-note {
      background-color: #ecf0f1;
      padding: 10px 15px;
      border-radius: 5px;
      margin: 15px 0;
      color: #2c3e50;
    }

    .method-options {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin: 15px 0;
    }

    .method-option {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      border: 2px solid #ecf0f1;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .method-option:hover {
      border-color: #3498db;
      background-color: #f8f9fa;
    }

    .method-option input[type="radio"] {
      margin-right: 15px;
      margin-top: 3px;
      cursor: pointer;
    }

    .method-option input[type="radio"]:checked + .method-name {
      color: #3498db;
      font-weight: 600;
    }

    .method-name {
      display: block;
      color: #2c3e50;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .method-description {
      display: block;
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .payment-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      padding: 12px 25px;
      border: none;
      border-radius: 5px;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #27ae60;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #229954;
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

    .btn-secondary:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    .success-icon {
      font-size: 3em;
      color: #27ae60;
      text-align: center;
      margin-bottom: 15px;
    }

    .completed-info h3 {
      color: #27ae60;
      text-align: center;
    }

    .completed-details {
      background-color: #d4edda;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      color: #155724;
    }

    .success-message {
      color: #27ae60;
      text-align: center;
      margin: 15px 0;
    }

    .in-progress-info {
      text-align: center;
      padding: 30px;
    }

    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .training-modes ul, .training-elements ul {
      list-style: none;
      padding: 0;
    }

    .training-modes li, .training-elements li {
      padding: 8px 0;
      color: #2c3e50;
    }

    .important-notes ul {
      list-style: none;
      padding: 0;
    }

    .important-notes li {
      padding: 10px 0 10px 30px;
      color: #2c3e50;
      position: relative;
    }

    .important-notes li:before {
      content: "•";
      color: #3498db;
      font-weight: bold;
      position: absolute;
      left: 0;
    }

    .error-message {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }

    .success-message-banner {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5em;
      color: #155724;
      cursor: pointer;
    }

    .loading, .not-found {
      text-align: center;
      padding: 50px 20px;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .rejection-reason {
      background-color: #f8d7da;
      border-left: 4px solid #721c24;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      color: #721c24;
    }

    .approval-info {
      background-color: #d4edda;
      border-left: 4px solid #155724;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      color: #155724;
    }

    @media (max-width: 768px) {
      .payment-header h1 {
        font-size: 1.8em;
      }

      .payment-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class CpdPaymentComponent implements OnInit {
  application: any;
  selectedPaymentMethod: string = '';
  isProcessing = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private cpdService: CpdService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.loadApplication(params['id']);
      }
    });
  }

  loadApplication(id: string) {
    this.cpdService.getApplication(id).subscribe(
      (data) => {
        this.application = data;
        // Set default payment method
        if (this.application.paymentDetails?.paymentStatus === 'pending') {
          this.selectedPaymentMethod = 'stripe';
        }
      },
      (error) => {
        this.errorMessage = error.error?.message || 'Failed to load application';
        console.error('Error loading application:', error);
      }
    );
  }

  initiatePayment() {
    if (!this.selectedPaymentMethod) {
      this.errorMessage = 'Please select a payment method';
      return;
    }

    this.isProcessing = true;
    this.cpdService.initiatePayment(this.application._id, this.selectedPaymentMethod).subscribe(
      (response) => {
        this.successMessage = 'Payment initiated. Redirecting to payment gateway...';
        // In a real implementation, you would redirect to the payment gateway here
        // For now, we'll just complete the payment after a short delay
        setTimeout(() => {
          this.completePaymentFlow(response.transactionId);
        }, 2000);
      },
      (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Failed to initiate payment';
      }
    );
  }

  completePaymentFlow(transactionId: string) {
    this.cpdService.completePayment(this.application._id, transactionId).subscribe(
      (response) => {
        this.successMessage = 'Payment completed successfully!';
        this.application = response.application;
        this.isProcessing = false;
      },
      (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Failed to complete payment';
      }
    );
  }

  formatAmount(): string {
    if (!this.application?.paymentDetails) return '';
    const { amount, currency } = this.application.paymentDetails;
    const symbol = currency === 'USD' ? '$' : 'ZWL';
    return `${symbol} ${amount.toFixed(2)}`;
  }

  getPaymentStatusText(): string {
    const status = this.application?.paymentDetails?.paymentStatus;
    const statusMap: Record<string, string> = {
      pending: 'Pending Payment',
      initiated: 'Payment In Progress',
      completed: 'Payment Completed',
      failed: 'Payment Failed',
      cancelled: 'Payment Cancelled',
    };
    return statusMap[status] || 'Unknown Status';
  }

  getPaymentStatusClass(): string {
    const status = this.application?.paymentDetails?.paymentStatus;
    const classMap: Record<string, string> = {
      pending: 'pending',
      initiated: 'pending',
      completed: 'approved',
      failed: 'rejected',
      cancelled: 'rejected',
    };
    return classMap[status] || '';
  }

  getApprovalStatusText(): string {
    const status = this.application?.adminApproval?.approvalStatus;
    const statusMap: Record<string, string> = {
      pending: 'Awaiting Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return statusMap[status] || 'Unknown Status';
  }

  getApprovalStatusClass(): string {
    const status = this.application?.adminApproval?.approvalStatus;
    const classMap: Record<string, string> = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
    };
    return classMap[status] || '';
  }

  goBack() {
    this.router.navigate(['/cpd']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  clearError() {
    this.errorMessage = '';
  }

  clearSuccess() {
    this.successMessage = '';
  }
}
