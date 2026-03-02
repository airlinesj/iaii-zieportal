import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="details-wrapper">
      <!-- Sidebar Navigation -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Application Review</h2>
        </div>

        <nav class="sidebar-nav">
          <button 
            *ngFor="let section of sections"
            [class.active]="activeSection === section.id"
            (click)="setActiveSection(section.id)"
            class="nav-button">
            {{ section.label }}
          </button>
        </nav>

        <button (click)="logout()" class="logout-btn">Logout</button>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div *ngIf="!application" class="loading">
          <p>Loading application details...</p>
        </div>

        <div *ngIf="application" class="content-area">
          <!-- Personal Information Section -->
          <div *ngIf="activeSection === 'personal'" class="section-panel">
            <h2>Personal Information</h2>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span>{{ application.personalParticulars.firstName }} {{ application.personalParticulars.lastName }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email:</span>
              <span>{{ application.personalParticulars.email }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Phone:</span>
              <span>{{ application.personalParticulars.phone }}</span>
            </div>
            <div class="detail-row">
              <span class="label">National ID:</span>
              <span>{{ application.personalParticulars.nationalId }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Chosen Grade:</span>
              <span>{{ application.chosenGrade }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Chosen Division:</span>
              <span>{{ application.chosenSpecialistDivision }}</span>
            </div>
            <!-- Professional Registration Number Field -->
            <div class="detail-row registration-row">
              <span class="label">Professional Registration Number:</span>
              <input 
                type="text" 
                class="registration-input"
                [value]="application.registrationNumber || 'Assigned upon successful interview'"
                [class.pending]="!application.registrationNumber"
                readonly
              />
            </div>
          </div>

          <!-- Uploaded Documents Section -->
          <div *ngIf="activeSection === 'documents'" class="section-panel">
            <h2>Uploaded Documents</h2>
            <div class="document-item">
              <span class="label">National ID Copy (PDF):</span>
              <a *ngIf="application.uploadedFiles?.nationalIdPath"
                 [href]="uploadsBaseUrl + '/' + application.uploadedFiles.nationalIdPath"
                 target="_blank"
                 class="document-link">
                📄 View PDF
              </a>
              <span *ngIf="!application.uploadedFiles?.nationalIdPath" class="no-document">Not uploaded</span>
            </div>
            <div class="document-item">
              <span class="label">Certificates (PDF):</span>
              <div *ngIf="application.uploadedFiles?.certificatePaths && application.uploadedFiles.certificatePaths.length > 0" class="certificate-list">
                <a *ngFor="let certPath of application.uploadedFiles.certificatePaths; let i = index"
                   [href]="uploadsBaseUrl + '/' + certPath"
                   target="_blank"
                   class="document-link">
                  📄 Certificate {{ i + 1 }}
                </a>
              </div>
              <span *ngIf="!application.uploadedFiles?.certificatePaths || application.uploadedFiles.certificatePaths.length === 0" class="no-document">Not uploaded</span>
            </div>
            <div class="document-item">
              <span class="label">Technical Report (PDF):</span>
              <a *ngIf="application.uploadedFiles?.technicalReportPath"
                 [href]="uploadsBaseUrl + '/' + application.uploadedFiles.technicalReportPath"
                 target="_blank"
                 class="document-link">
                📄 View PDF
              </a>
              <span *ngIf="!application.uploadedFiles?.technicalReportPath" class="no-document">Not uploaded</span>
            </div>
          </div>

          <!-- Automated Grading Section -->
          <div *ngIf="activeSection === 'grading'" class="section-panel">
            <h2>Automated Grading and Division</h2>
            <div class="detail-row">
              <span class="label">Suggested Grade:</span>
              <span>{{ application.suggestedGrade }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Suggested Division:</span>
              <span>{{ application.suggestedDivision }}</span>
            </div>
            <p class="info-text">System has automatically suggested a grade and division based on application data.</p>
          </div>

          <!-- Checklist Section -->
          <div *ngIf="activeSection === 'checklist'" class="section-panel">
            <h2>Verification Checklist ({{ getChecklistProgress() }})</h2>
            <div class="checklist-items">
              <div class="checklist-item">
                <input type="checkbox" id="photo" [(ngModel)]="application.adminChecklist.photo" />
                <label for="photo">Photo - Professional passport-sized photo</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="m1Form" [(ngModel)]="application.adminChecklist.m1Form" />
                <label for="m1Form">M1 Form - Completed membership form</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="signature" [(ngModel)]="application.adminChecklist.signature" />
                <label for="signature">Signature - Authorized signature on form</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="trainingReport" [(ngModel)]="application.adminChecklist.trainingReport" />
                <label for="trainingReport">Training Report - Professional development records</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="projectReport" [(ngModel)]="application.adminChecklist.projectReport" />
                <label for="projectReport">Project Report - Technical project report demonstrating competence</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="organogram" [(ngModel)]="application.adminChecklist.organogram" />
                <label for="organogram">Organogram - Organizational structure showing applicant role</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="referees" [(ngModel)]="application.adminChecklist.referees" />
                <label for="referees">Referees - Required referee appraisals received</label>
              </div>
              <div class="checklist-item">
                <input type="checkbox" id="certificates" [(ngModel)]="application.adminChecklist.certificates" />
                <label for="certificates">Certificates - Educational and professional certificates verified</label>
              </div>
            </div>

            <div class="referee-section">
              <h3>Referee Appraisals</h3>
              <div *ngFor="let referee of application.referees" class="referee-info">
                <p><strong>{{ referee.refereeName }}</strong> ({{ referee.refereeEmail }})</p>
                <p *ngIf="referee.appraisalResponse">
                  <span class="badge-confidential">Confidential Response Received</span>
                </p>
                <p *ngIf="!referee.appraisalResponse" class="pending">Pending Response</p>
              </div>
            </div>

            <textarea
              [(ngModel)]="application.adminNotes"
              placeholder="Admin notes for this application..."
              class="form-input notes"
            ></textarea>
            <button (click)="updateApplicationChecklist()" class="btn-primary">Save Checklist</button>
          </div>

          <!-- Payment Proof Section -->
          <div *ngIf="activeSection === 'payment'" class="section-panel">
            <h2>Payment Verification</h2>
            <div *ngIf="application.paymentProof; else noPayment">
              <div class="payment-info-box">
                <div class="payment-details">
                  <div class="detail-row">
                    <span class="label">Application Fee:</span>
                    <span>{{ application.applicationFee | number: '1.2-2' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Proof Uploaded:</span>
                    <span>{{ application.paymentProof.uploadedAt | date: 'short' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="payment-status-badge" 
                          [ngClass]="'status-' + (application.paymentProof.verificationStatus || 'pending')">
                      {{ (application.paymentProof.verificationStatus || 'pending') | uppercase }}
                    </span>
                  </div>
                </div>

                <div class="proof-file">
                  <a *ngIf="application.paymentProof.filePath"
                     [href]="uploadsBaseUrl + '/' + application.paymentProof.filePath"
                     target="_blank"
                     class="view-proof-link">
                    📎 View Payment Proof
                  </a>
                </div>

                <div class="verification-controls" *ngIf="!application.paymentProof.verificationStatus || application.paymentProof.verificationStatus === 'pending'">
                  <div class="control-group">
                    <label for="rejectionReason">Rejection Reason (if applicable):</label>
                    <textarea
                      id="rejectionReason"
                      [(ngModel)]="paymentRejectionReason"
                      placeholder="Enter reason for rejection..."
                      class="form-input notes"
                      rows="3"
                    ></textarea>
                  </div>
                  <div class="button-group">
                    <button (click)="verifyPayment(true)" class="btn-approve">
                      ✓ Approve Payment
                    </button>
                    <button (click)="verifyPayment(false)" class="btn-reject">
                      ✗ Reject Payment
                    </button>
                  </div>
                </div>

                <div class="verification-confirmed" *ngIf="application.paymentProof.verificationStatus && application.paymentProof.verificationStatus !== 'pending'">
                  <p class="verified-text">
                    <span *ngIf="application.paymentProof.verificationStatus === 'verified'">
                      ✓ Payment verified on {{ application.paymentProof.verifiedAt | date: 'short' }}
                    </span>
                    <span *ngIf="application.paymentProof.verificationStatus === 'rejected'">
                      ✗ Payment rejected on {{ application.paymentProof.verifiedAt | date: 'short' }}
                      <br *ngIf="application.paymentProof.rejectionReason" />
                      <span *ngIf="application.paymentProof.rejectionReason" class="rejection-reason">
                        Reason: {{ application.paymentProof.rejectionReason }}
                      </span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <ng-template #noPayment>
              <p class="no-document">No payment proof uploaded yet</p>
            </ng-template>
          </div>

          <!-- Manual Grading Section -->
          <div *ngIf="activeSection === 'manual-grade'" class="section-panel">
            <h2>Manual Grade and Division</h2>
            <div *ngIf="application.manualGrade; else gradeForm" class="existing-grade">
              <div class="detail-row">
                <span class="label">Grade:</span>
                <span>{{ application.manualGrade.grade }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Division:</span>
                <span>{{ application.manualGrade.division }}</span>
              </div>
              <div class="detail-row" *ngIf="application.manualGrade.notes">
                <span class="label">Notes:</span>
                <span>{{ application.manualGrade.notes }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Set By:</span>
                <span>{{ application.manualGrade.setByName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date Set:</span>
                <span>{{ application.manualGrade.setAt | date: 'short' }}</span>
              </div>
            </div>
            <ng-template #gradeForm>
              <div class="grading-form">
                <div class="form-group">
                  <label for="manualGrade">Grade:</label>
                  <select [(ngModel)]="manualGradeData.grade" class="form-input">
                    <option value="">Select Grade</option>
                    <option value="Student">Student</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Technician">Technician</option>
                    <option value="Technologist">Technologist</option>
                    <option value="Member">Member</option>
                    <option value="Fellow">Fellow</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="manualDivision">Division:</label>
                  <input type="text" [(ngModel)]="manualGradeData.division" placeholder="Enter division" class="form-input" />
                </div>
                <div class="form-group">
                  <label for="gradeNotes">Notes:</label>
                  <textarea [(ngModel)]="manualGradeData.notes" placeholder="Grade determination notes..." class="form-input notes" rows="2"></textarea>
                </div>
                <button (click)="setManualGrade()" class="btn-primary">Set Manual Grade</button>
              </div>
            </ng-template>
          </div>

          <!-- Interview Section -->
          <div *ngIf="activeSection === 'interview'" class="section-panel">
            <h2>Interview Management</h2>

            <!-- Admin Approval Section -->
            <div class="subsection">
              <h3>Interview Approval System ({{ application.adminApprovals?.length || 0 }}/3 Approvals)</h3>
              <div class="progress-bar">
                <div class="progress-fill" [style.width]="((application.adminApprovals?.length || 0) / 3 * 100) + '%'"></div>
              </div>
              <button (click)="addAdminApproval()"
                      [disabled]="!canAddApproval()"
                      class="btn-primary">
                {{ canAddApproval() ? 'Add Approval' : 'Already Approved' }}
              </button>
              <div *ngIf="application.adminApprovals && application.adminApprovals.length > 0" class="approvals-list">
                <h4>Approvals:</h4>
                <div *ngFor="let approval of application.adminApprovals" class="approval-item">
                  <span>{{ approval.adminName }}</span> - <span class="date">{{ approval.approvedAt | date: 'short' }}</span>
                </div>
              </div>
            </div>

            <!-- Interview Notification Section -->
            <div class="subsection">
              <h3>Send Interview Notification</h3>
              <div *ngIf="application.interviewNotification; else notificationForm" class="existing-notification">
                <div class="notification-badge">INTERVIEW SCHEDULED</div>
                <div class="detail-row">
                  <span class="label">Message:</span>
                  <p class="value">{{ application.interviewNotification.message }}</p>
                </div>
                <div class="detail-row">
                  <span class="label">Sent By:</span>
                  <span>{{ application.interviewNotification.sentByName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Sent On:</span>
                  <span>{{ application.interviewNotification.sentAt | date: 'medium' }}</span>
                </div>
              </div>
              <ng-template #notificationForm>
                <div class="notification-form">
                  <textarea [(ngModel)]="interviewMessage" placeholder="Enter interview notification message..." class="form-input notes" rows="3"></textarea>
                  <button (click)="sendInterviewNotification()" class="btn-primary">Send Interview Notification</button>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- Status Section -->
          <div *ngIf="activeSection === 'status'" class="section-panel">
            <h2>Update Application Status</h2>
            <div class="detail-row">
              <span class="label">Current Status:</span>
              <span class="status-badge" [ngClass]="'status-' + application.status.toLowerCase().replace(' ', '-')">
                {{ application.status }}
              </span>
            </div>

            <div class="form-group">
              <label for="statusUpdate">New Status:</label>
              <select [(ngModel)]="selectedStatus" class="form-input">
                <option value="">Select Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Interview Required">Interview Required</option>
                <option value="Approved with Conditions">Approved with Conditions</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button (click)="updateApplicationStatus()" class="btn-primary">Update Status</button>
          </div>
        </div>

        <!-- Messages -->
        <div *ngIf="updateSuccess" class="success-message">✓ Update successful</div>
        <div *ngIf="updateError" class="error-message">✗ {{ updateError }}</div>
      </div>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    .details-wrapper {
      display: flex;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .sidebar {
      width: 250px;
      background-color: white;
      border-right: 2px solid #004A59;
      display: flex;
      flex-direction: column;
      padding: 20px;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #004A59;
    }

    .sidebar-header h2 {
      color: #004A59;
      font-size: 18px;
      margin: 0;
      font-weight: 700;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 30px;
    }

    .nav-button {
      padding: 12px 15px;
      background-color: white;
      border: 2px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: #333;
      text-align: left;
      transition: all 0.3s ease;
    }

    .nav-button:hover {
      border-color: #B99532;
      background-color: #fffbf0;
    }

    .nav-button.active {
      background-color: #004A59;
      color: white;
      border-color: #004A59;
    }

    .logout-btn {
      padding: 12px 15px;
      background-color: #B99532;
      color: #004A59;
      border: 2px solid #B99532;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background-color: #a58628;
      border-color: #a58628;
    }

    .main-content {
      flex: 1;
      padding: 40px;
      overflow-y: auto;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
      font-size: 16px;
    }

    .content-area {
      max-width: 1000px;
      margin: 0 auto;
    }

    .section-panel {
      background-color: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section-panel h2 {
      color: #004A59;
      font-size: 24px;
      margin: 0 0 20px 0;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row.registration-row {
      align-items: center;
      gap: 20px;
    }

    .registration-input {
      flex: 1;
      padding: 10px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 4px;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      background-color: #f9f9f9;
      color: #004A59;
      text-align: right;
      transition: all 0.3s ease;
      max-width: 250px;
    }

    .registration-input.pending {
      color: #999;
      font-style: italic;
      border-color: #ddd;
    }

    .registration-input:focus {
      outline: none;
      border-color: #004A59;
      background-color: #fff;
      box-shadow: 0 0 0 3px rgba(0, 74, 89, 0.1);
    }

    .label {
      font-weight: 700;
      color: #004A59;
      min-width: 150px;
    }

    .value {
      color: #333;
      flex: 1;
      text-align: right;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-submitted {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-under-review {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .status-approved {
      background-color: #d4edda;
      color: #155724;
    }

    .status-pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-interview-required {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .status-rejected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .document-item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .document-item:last-child {
      border-bottom: none;
    }

    .document-link {
      display: inline-block;
      color: #004A59;
      text-decoration: none;
      font-weight: 600;
      padding: 8px 12px;
      background-color: #f0f0f0;
      border-radius: 4px;
      transition: all 0.3s ease;
      margin-top: 8px;
    }

    .document-link:hover {
      background-color: #B99532;
      color: white;
    }

    .no-document {
      color: #999;
      font-size: 12px;
    }

    .certificate-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .info-text {
      color: #666;
      font-size: 14px;
      font-style: italic;
      margin: 15px 0 0 0;
    }

    .checklist-items {
      margin-bottom: 20px;
    }

    .checklist-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 10px;
    }

    .checklist-item input[type="checkbox"] {
      margin-top: 3px;
      cursor: pointer;
    }

    .checklist-item label {
      font-size: 14px;
      color: #333;
      cursor: pointer;
      flex: 1;
    }

    .referee-section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }

    .referee-section h3 {
      color: #004A59;
      font-size: 14px;
      margin: 0 0 10px 0;
    }

    .referee-info {
      padding: 10px;
      margin-bottom: 8px;
      background-color: white;
      border-left: 3px solid #B99532;
      border-radius: 3px;
    }

    .referee-info p {
      margin: 5px 0;
      font-size: 13px;
    }

    .badge-confidential {
      display: inline-block;
      background-color: #27ae60;
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }

    .pending {
      color: #ff9800;
      font-weight: 600;
    }

    .payment-info-box {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }

    .payment-details {
      margin-bottom: 15px;
    }

    .payment-status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }

    .payment-status-badge.status-verified {
      background-color: #d4edda;
      color: #155724;
    }

    .payment-status-badge.status-rejected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .payment-status-badge.status-pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .view-proof-link {
      display: inline-block;
      color: #004A59;
      text-decoration: none;
      font-weight: 600;
      padding: 8px 12px;
      background-color: white;
      border: 1.5px solid #004A59;
      border-radius: 4px;
      transition: all 0.3s ease;
      margin-top: 10px;
    }

    .view-proof-link:hover {
      background-color: #004A59;
      color: white;
    }

    .verification-controls {
      margin-top: 15px;
      padding: 15px;
      background-color: white;
      border: 1.5px solid #ddd;
      border-radius: 4px;
    }

    .control-group {
      margin-bottom: 15px;
    }

    .control-group label {
      display: block;
      font-weight: 600;
      color: #004A59;
      margin-bottom: 5px;
      font-size: 13px;
    }

    .button-group {
      display: flex;
      gap: 10px;
    }

    .btn-approve {
      flex: 1;
      background-color: #27ae60;
      color: white;
      border: 2px solid #27ae60;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
    }

    .btn-approve:hover {
      background-color: #229954;
    }

    .btn-reject {
      flex: 1;
      background-color: #e74c3c;
      color: white;
      border: 2px solid #e74c3c;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
    }

    .btn-reject:hover {
      background-color: #c0392b;
    }

    .verification-confirmed {
      margin-top: 15px;
      padding: 15px;
      background-color: #f0f8ff;
      border: 1.5px solid #004A59;
      border-radius: 4px;
    }

    .verified-text {
      margin: 0;
      font-weight: 600;
      color: #004A59;
    }

    .rejection-reason {
      display: block;
      margin-top: 5px;
      color: #666;
      font-size: 13px;
    }

    .existing-grade,
    .grading-form,
    .existing-notification,
    .notification-form {
      margin-top: 15px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }

    .grading-form {
      background-color: white;
      border: 1.5px solid #ddd;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #004A59;
      margin-bottom: 5px;
      font-size: 13px;
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 1.5px solid #004A59;
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
    }

    .form-input.notes {
      resize: vertical;
      min-height: 80px;
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 15px;
      border: 1px solid #ddd;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #B99532 0%, #004A59 100%);
      transition: width 0.3s ease;
    }

    .btn-primary {
      width: 100%;
      background-color: #004A59;
      color: white;
      border: 2px solid #004A59;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
      margin-top: 15px;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #B99532;
      border-color: #B99532;
    }

    .btn-primary:disabled {
      background-color: #ccc;
      border-color: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .subsection {
      margin-bottom: 25px;
      padding-bottom: 25px;
      border-bottom: 1px solid #f0f0f0;
    }

    .subsection:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .subsection h3 {
      color: #004A59;
      font-size: 16px;
      margin: 0 0 15px 0;
      font-weight: 700;
    }

    .approvals-list {
      margin-top: 15px;
      padding: 10px;
      background-color: white;
      border-radius: 4px;
    }

    .approvals-list h4 {
      color: #004A59;
      font-size: 13px;
      margin: 0 0 10px 0;
    }

    .approval-item {
      padding: 8px;
      background-color: #f9f9f9;
      border-left: 3px solid #B99532;
      border-radius: 3px;
      margin-bottom: 5px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
    }

    .notification-badge {
      display: inline-block;
      background-color: #27ae60;
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 15px;
    }

    .success-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #155724;
      background-color: #d4edda;
      padding: 25px 40px;
      border: 2px solid #c3e6cb;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      text-align: center;
      font-size: 18px;
    }

    .error-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #721c24;
      background-color: #f8d7da;
      padding: 25px 40px;
      border: 2px solid #f5c6cb;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      text-align: center;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .details-wrapper {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 2px solid #004A59;
      }

      .main-content {
        padding: 20px;
      }
    }
  `]
})
export class ApplicationDetailsComponent implements OnInit {
  application: any = null;
  activeSection = 'personal';
  selectedStatus = '';
  updateSuccess = false;
  updateError = '';
  paymentRejectionReason = '';

  // Dynamic base URL for uploads
  get uploadsBaseUrl(): string {
    return `${environment.apiUrl}/uploads`;
  }

  manualGradeData = {
    grade: '',
    division: '',
    notes: '',
  };
  interviewMessage = '';

  sections = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'documents', label: 'Uploaded Documents' },
    { id: 'grading', label: 'Automated Grading' },
    { id: 'checklist', label: 'Verification Checklist' },
    { id: 'payment', label: 'Payment Proof' },
    { id: 'manual-grade', label: 'Manual Grade' },
    { id: 'interview', label: 'Interview' },
    { id: 'status', label: 'Update Status' },
  ];

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const appId = params['id'];
      if (appId) {
        this.loadApplication(appId);
      }
    });
  }

  loadApplication(id: string): void {
    // Use auto-refresh to get real-time status updates
    this.applicationService.getApplicationByIdWithAutoRefresh(id).subscribe({
      next: (app) => {
        this.application = app;
        this.selectedStatus = app.status || '';
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.updateError = 'Failed to load application';
      },
    });
  }

  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  getChecklistProgress(): string {
    if (!this.application) return '0/8';
    const checklist = this.application.adminChecklist;
    const checked = Object.values(checklist).filter((v: any) => v === true).length;
    const total = Object.keys(checklist).length;
    return `${checked}/${total}`;
  }

  updateApplicationChecklist(): void {
    if (!this.application) return;

    const checklistData = {
      photo: this.application.adminChecklist.photo,
      m1Form: this.application.adminChecklist.m1Form,
      signature: this.application.adminChecklist.signature,
      trainingReport: this.application.adminChecklist.trainingReport,
      projectReport: this.application.adminChecklist.projectReport,
      organogram: this.application.adminChecklist.organogram,
      sponsorships: this.application.adminChecklist.referees,
      certificates: this.application.adminChecklist.certificates,
      adminNotes: this.application.adminNotes,
    };

    this.applicationService.updateApplicationChecklist(this.application._id, checklistData).subscribe({
      next: (response) => {
        this.updateSuccess = true;
        this.updateError = '';
        setTimeout(() => { this.updateSuccess = false; }, 3000);
      },
      error: (error) => {
        this.updateError = error.error?.message || 'Failed to update checklist';
      },
    });
  }

  updateApplicationStatus(): void {
    if (!this.selectedStatus) {
      this.updateError = 'Please select a status';
      return;
    }

    this.applicationService.updateApplicationStatus(this.application._id, this.selectedStatus).subscribe({
      next: (response) => {
        this.application.status = this.selectedStatus;
        this.updateSuccess = true;
        this.updateError = '';
        setTimeout(() => { this.updateSuccess = false; }, 3000);
      },
      error: (error) => {
        this.updateError = error.error?.message || 'Failed to update status';
      },
    });
  }

  verifyPayment(approved: boolean): void {
    if (!approved && !this.paymentRejectionReason.trim()) {
      this.updateError = 'Please provide a rejection reason';
      return;
    }

    this.applicationService.verifyPayment(this.application._id, approved).subscribe({
      next: (response: any) => {
        this.application.paymentProof.verificationStatus = approved ? 'verified' : 'rejected';
        this.application.paymentProof.verifiedAt = new Date();
        if (!approved) {
          this.application.paymentProof.rejectionReason = this.paymentRejectionReason;
        }
        this.paymentRejectionReason = '';
        this.updateSuccess = true;
        this.updateError = '';
        setTimeout(() => { this.updateSuccess = false; }, 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to verify payment';
      },
    });
  }

  setManualGrade(): void {
    if (!this.manualGradeData.grade || !this.manualGradeData.division) {
      this.updateError = 'Please fill in grade and division';
      return;
    }

    this.applicationService.setManualGrade(this.application._id, this.manualGradeData).subscribe({
      next: (response: any) => {
        this.application.manualGrade = response.manualGrade;
        this.updateSuccess = true;
        this.updateError = '';
        this.manualGradeData = { grade: '', division: '', notes: '' };
        setTimeout(() => { this.updateSuccess = false; }, 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to set manual grade';
      },
    });
  }

  canAddApproval(): boolean {
    if (!this.application) return false;
    const approvals = this.application.adminApprovals || [];
    return !approvals.some((app: any) => app.adminId === localStorage.getItem('userId'));
  }

  addAdminApproval(): void {
    this.applicationService.addAdminApproval(this.application._id).subscribe({
      next: (response: any) => {
        this.application.adminApprovals = response.adminApprovals;
        this.application.status = response.status;
        this.updateSuccess = true;
        this.updateError = '';
        setTimeout(() => { this.updateSuccess = false; }, 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to add approval';
      },
    });
  }

  sendInterviewNotification(): void {
    if (!this.interviewMessage.trim()) {
      this.updateError = 'Please enter an interview message';
      return;
    }

    this.applicationService.sendInterviewNotification(this.application._id, this.interviewMessage).subscribe({
      next: (response: any) => {
        this.application.interviewNotification = response.interviewNotification;
        this.updateSuccess = true;
        this.updateError = '';
        this.interviewMessage = '';
        setTimeout(() => { this.updateSuccess = false; }, 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to send interview notification';
      },
    });
  }

  logout(): void {
    // Use logoutAndNavigate to properly clear browser history and navigate to landing page
    this.authService.logoutAndNavigate();
  }
}
