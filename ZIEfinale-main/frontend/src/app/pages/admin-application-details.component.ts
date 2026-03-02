import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { RoleBasedDashboardService } from '../services/role-based-dashboard.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-application-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="details-container">
      <!-- Header -->
      <div class="header">
        <button (click)="goBackToList()" class="btn-back">← Back to List</button>
        <h1>Application Details - {{ selectedApplication?.personalParticulars.firstName }} {{ selectedApplication?.personalParticulars.lastName }}</h1>
        <button (click)="logout()" class="btn-logout">Logout</button>
      </div>

      <!-- Main Content -->
      <div class="main-layout">
        <!-- Left Sidebar Navigation -->
        <div class="sidebar-nav">
          <div class="sidebar-header">
            <h3>Application Details</h3>
          </div>
          <nav class="nav-menu">
            <button 
              *ngFor="let section of filteredNavSections" 
              [class.active]="activeSection === section.id"
              (click)="navigateToSection(section.id)"
              class="nav-item">
              {{ section.label }}
            </button>
          </nav>
        </div>

        <!-- Right Content Area -->
        <div class="content-area">
          <div *ngIf="!selectedApplication" class="loading-spinner">
            <p>Loading application details...</p>
          </div>

          <ng-container *ngIf="selectedApplication">
          <!-- Personal Information Section -->
          <section *ngIf="activeSection === 'personal'" #personalSection class="content-section">
            <div class="section-header">
              <h2>Personal Information</h2>
            </div>
            <div class="section-content">
              <div class="detail-row">
                <span class="label">Full Name:</span>
                <span>{{ selectedApplication?.personalParticulars?.firstName }} {{ selectedApplication?.personalParticulars?.lastName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span>{{ selectedApplication.personalParticulars.email }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Phone:</span>
                <span>{{ selectedApplication.personalParticulars.phone }}</span>
              </div>
              <div class="detail-row">
                <span class="label">National ID:</span>
                <span>{{ selectedApplication.personalParticulars.nationalId }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Chosen Grade:</span>
                <span>{{ selectedApplication.chosenGrade }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Chosen Division:</span>
                <span>{{ selectedApplication.chosenSpecialistDivision }}</span>
              </div>
            </div>
          </section>

          <!-- Documents Section -->
          <section *ngIf="activeSection === 'documents'" #documentsSection class="content-section">
            <div class="section-header">
              <h2>Uploaded Documents</h2>
            </div>
            <div class="section-content">
              <!-- For Expatriate Applications: Show only Educational Documents and Referral Letter -->
              <div *ngIf="selectedApplication?.applicationType === 'expatriate'" class="documents-expatriate">
                <div class="document-item">
                  <span class="label">Educational Certificates (PDF):</span>
                  <div *ngIf="selectedApplication.uploadedFiles?.certificatePaths && selectedApplication.uploadedFiles.certificatePaths.length > 0" class="certificate-list">
                    <div *ngFor="let certPath of selectedApplication.uploadedFiles.certificatePaths; let i = index" class="certificate-entry">
                      <span class="status-check">✓</span>
                      <a [href]="uploadsBaseUrl + '/' + certPath"
                         target="_blank"
                         class="document-link">
                        📄 Certificate {{ i + 1 }}
                      </a>
                    </div>
                  </div>
                  <span *ngIf="!selectedApplication.uploadedFiles?.certificatePaths || selectedApplication.uploadedFiles.certificatePaths.length === 0" class="no-document">
                    <span class="status-missing">✗</span> Not uploaded
                  </span>
                </div>
                <div class="document-item">
                  <span class="label">Referral Letter (Company Recommendation):</span>
                  <div *ngIf="selectedApplication.documents?.companyRecommendationLetterPath || selectedApplication.uploadedFiles?.companyRecommendationLetterPath" class="certificate-entry">
                    <span class="status-check">✓</span>
                    <a [href]="uploadsBaseUrl + '/' + (selectedApplication.documents?.companyRecommendationLetterPath || selectedApplication.uploadedFiles?.companyRecommendationLetterPath)"
                       target="_blank"
                       class="document-link">
                      📄 Company Recommendation Letter
                    </a>
                  </div>
                  <span *ngIf="!selectedApplication.documents?.companyRecommendationLetterPath && !selectedApplication.uploadedFiles?.companyRecommendationLetterPath" class="no-document">
                    <span class="status-missing">✗</span> Not uploaded
                  </span>
                </div>
              </div>

              <!-- For Local Applications: Show National ID and Certificates -->
              <div *ngIf="selectedApplication?.applicationType !== 'expatriate'" class="documents-local">
                <div class="document-item">
                  <span class="label">National ID Copy (PDF):</span>
                  <a *ngIf="selectedApplication.uploadedFiles?.nationalIdPath"
                     [href]="uploadsBaseUrl + '/' + selectedApplication.uploadedFiles.nationalIdPath"
                     target="_blank"
                     class="document-link">
                    📄 View PDF
                  </a>
                  <span *ngIf="!selectedApplication.uploadedFiles?.nationalIdPath" class="no-document">Not uploaded</span>
                </div>
                <div class="document-item">
                  <span class="label">Certificates (PDF):</span>
                  <div *ngIf="selectedApplication.uploadedFiles?.certificatePaths && selectedApplication.uploadedFiles.certificatePaths.length > 0" class="certificate-list">
                    <a *ngFor="let certPath of selectedApplication.uploadedFiles.certificatePaths; let i = index"
                       [href]="uploadsBaseUrl + '/' + certPath"
                       target="_blank"
                       class="document-link">
                      📄 Certificate {{ i + 1 }}
                    </a>
                  </div>
                  <span *ngIf="!selectedApplication.uploadedFiles?.certificatePaths || selectedApplication.uploadedFiles.certificatePaths.length === 0" class="no-document">Not uploaded</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Verification Checklist Section -->
          <section *ngIf="activeSection === 'checklist'" #checklistSection class="content-section">
            <div class="section-header">
              <h2>Verification Checklist</h2>
              <p class="progress">{{ getChecklistProgress() }}</p>
            </div>
            <div class="section-content">
              <!-- For Expatriate Applications: Only check Educational Documents and Referral Letter -->
              <div *ngIf="selectedApplication?.applicationType === 'expatriate'" class="checklist-items">
                <div class="checklist-info">
                  <p>Verification for expatriate applicant - Checking uploaded documents only</p>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="certificates" [(ngModel)]="selectedApplication.adminChecklist.certificates" (change)="onChecklistChange()" />
                  <label for="certificates">Educational Certificates - Professional qualifications and credentials verified</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="sponsorships" [(ngModel)]="selectedApplication.adminChecklist.sponsorships" (change)="onChecklistChange()" />
                  <label for="sponsorships">Referral Letter - Company recommendation letter received and verified</label>
                </div>
              </div>

              <!-- For Local Applications: Full checklist -->
              <div *ngIf="selectedApplication?.applicationType !== 'expatriate'" class="checklist-items">
                <div class="checklist-item">
                  <input type="checkbox" id="photo" [(ngModel)]="selectedApplication.adminChecklist.photo" (change)="onChecklistChange()" />
                  <label for="photo">Photo - Professional passport-sized photo</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="m1Form" [(ngModel)]="selectedApplication.adminChecklist.m1Form" (change)="onChecklistChange()" />
                  <label for="m1Form">M1 Form - Completed membership form</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="signature" [(ngModel)]="selectedApplication.adminChecklist.signature" (change)="onChecklistChange()" />
                  <label for="signature">Signature - Authorized signature on form</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="trainingReport" [(ngModel)]="selectedApplication.adminChecklist.trainingReport" (change)="onChecklistChange()" />
                  <label for="trainingReport">Training Report - Professional development records</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="projectReport" [(ngModel)]="selectedApplication.adminChecklist.projectReport" (change)="onChecklistChange()" />
                  <label for="projectReport">Project Report - Technical project report demonstrating competence</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="organogram" [(ngModel)]="selectedApplication.adminChecklist.organogram" (change)="onChecklistChange()" />
                  <label for="organogram">Organogram - Organizational structure showing applicant role</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="referees" [(ngModel)]="selectedApplication.adminChecklist.referees" (change)="onChecklistChange()" />
                  <label for="referees">Referees - Required referee appraisals received</label>
                </div>
                <div class="checklist-item">
                  <input type="checkbox" id="certificates" [(ngModel)]="selectedApplication.adminChecklist.certificates" (change)="onChecklistChange()" />
                  <label for="certificates">Certificates - Educational and professional certificates verified</label>
                </div>
              </div>
              <div class="form-group">
                <label for="adminNotes">Admin Notes:</label>
                <textarea [(ngModel)]="selectedApplication.adminNotes" id="adminNotes" class="form-input notes" placeholder="Add notes for this application..."></textarea>
              </div>
              <button *ngIf="!isSuperAdmin" (click)="updateApplicationChecklist()" class="btn-primary">Save Checklist</button>
            </div>
          </section>

          <!-- Payment Section -->
          <section *ngIf="activeSection === 'payment'" #paymentSection class="content-section">
            <div class="section-header">
              <h2>Payment Verification</h2>
            </div>
            <div class="section-content" *ngIf="selectedApplication.paymentProof; else noPayment">
              <div class="payment-details">
                <div class="detail-row">
                  <span class="label">Application Fee:</span>
                  <span>{{ selectedApplication.applicationFee | number: '1.2-2' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Proof Uploaded:</span>
                  <span>{{ selectedApplication.paymentProof.uploadedAt | date: 'short' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="payment-status-badge" [ngClass]="'status-' + (selectedApplication.paymentProof.verificationStatus || 'pending')">
                    {{ (selectedApplication.paymentProof.verificationStatus || 'pending') | uppercase }}
                  </span>
                </div>
              </div>
              <a *ngIf="selectedApplication.paymentProof.filePath"
                 [href]="uploadsBaseUrl + '/' + selectedApplication.paymentProof.filePath"
                 target="_blank"
                 class="document-link">
                📎 View Payment Proof
              </a>
            </div>
            <ng-template #noPayment>
              <p class="no-document">No payment proof uploaded yet</p>
            </ng-template>
          </section>

          <!-- Manual Grading Section -->
          <section *ngIf="activeSection === 'grading'" #gradingSection class="content-section">
            <div class="section-header">
              <h2>Manual Grade and Division</h2>
            </div>
            <div class="section-content">
              <div *ngIf="selectedApplication?.manualGrade" class="existing-grade">
                <div class="detail-row">
                  <span class="label">Grade:</span>
                  <span>{{ selectedApplication.manualGrade.grade }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Division:</span>
                  <span>{{ selectedApplication.manualGrade.division }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Set By:</span>
                  <span>{{ selectedApplication.manualGrade.setByName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span>{{ selectedApplication.manualGrade.setAt | date: 'short' }}</span>
                </div>
              </div>
              <div *ngIf="!selectedApplication?.manualGrade" class="grading-form">
                <div class="form-group">
                  <label for="manualGrade">Grade:</label>
                  <select [(ngModel)]="manualGradeData.grade" id="manualGrade" class="form-input">
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
                  <input type="text" [(ngModel)]="manualGradeData.division" id="manualDivision" placeholder="Enter division" class="form-input" />
                </div>
                <div class="form-group">
                  <label for="gradeNotes">Notes:</label>
                  <textarea [(ngModel)]="manualGradeData.notes" id="gradeNotes" placeholder="Grade determination notes..." class="form-input notes" rows="2"></textarea>
                </div>
                <button *ngIf="!isSuperAdmin" (click)="setManualGrade()" class="btn-primary">Set Manual Grade</button>
              </div>
            </div>
          </section>

          <!-- Referee/Apprentice Appraisals Section -->
          <section *ngIf="(activeSection === 'referees') && (selectedApplication?.applicationType !== 'expatriate' || selectedApplication?.apprenticeReferee)" #refereesSection class="content-section">
            <div class="section-header">
              <h2>{{ selectedApplication?.applicationType === 'expatriate' ? 'Apprentice Appraisal' : 'Referee Appraisals' }}</h2>
              <p class="referee-count" *ngIf="selectedApplication?.applicationType !== 'expatriate'">
                {{ getRefereeResponseCount() }}/{{ selectedApplication?.sponsors?.length || 0 }} Responses Received
              </p>
              <p class="referee-count" *ngIf="selectedApplication?.applicationType === 'expatriate'">
                {{ selectedApplication?.apprenticeReferee?.responses ? '1' : '0' }}/1 Response Received
              </p>
            </div>
            <div class="section-content">
              <!-- For Expatriate Applications: Show Apprentice Appraisal -->
              <div *ngIf="selectedApplication?.applicationType === 'expatriate'" class="apprentice-appraisal">
                <div *ngIf="!selectedApplication?.apprenticeReferee" class="no-referees">
                  <p>No apprentice/trainee reference has been assigned to this application yet.</p>
                </div>
                <div *ngIf="selectedApplication?.apprenticeReferee" class="referee-card">
                  <div class="referee-header">
                    <h4>Apprentice/Trainee Reference: {{ selectedApplication.apprenticeReferee.refereeName }}</h4>
                    <span class="referee-status" [class.responded]="selectedApplication.apprenticeReferee.responses" [class.pending]="!selectedApplication.apprenticeReferee.responses">
                      {{ selectedApplication.apprenticeReferee.responses ? 'Responded' : 'Pending' }}
                    </span>
                  </div>
                  <div class="referee-email">{{ selectedApplication.apprenticeReferee.refereeEmail }}</div>
                  <div class="referee-relationship">
                    <strong>Relationship:</strong> {{ selectedApplication.apprenticeReferee.refereeRelationship }}
                  </div>
                  
                  <button *ngIf="!isSuperAdmin" (click)="sendApprenticeAppraisalForm()" class="btn-primary" [disabled]="selectedApplication.apprenticeReferee.responses">
                    {{ selectedApplication.apprenticeReferee.responses ? '✓ Form Sent' : '📧 Send Appraisal Form' }}
                  </button>
                  
                  <div *ngIf="selectedApplication.apprenticeReferee.responses" class="appraisal-responses">
                    <div class="response-item">
                      <strong>Your Full Name:</strong>
                      <p>{{ selectedApplication.apprenticeReferee.responses.fullName }}</p>
                    </div>
                    <div class="response-item">
                      <strong>Relationship with Applicant:</strong>
                      <p>{{ selectedApplication.apprenticeReferee.responses.relationship }}</p>
                    </div>
                    <div class="response-item">
                      <strong>What have they learnt under your guidance?</strong>
                      <p>{{ selectedApplication.apprenticeReferee.responses.learnings }}</p>
                    </div>
                    <div class="response-item">
                      <strong>Professional Assessment:</strong>
                      <p>{{ selectedApplication.apprenticeReferee.responses.assessment }}</p>
                    </div>
                    <div class="response-item" *ngIf="selectedApplication.apprenticeReferee.responses.additionalComments">
                      <strong>Additional Comments:</strong>
                      <p>{{ selectedApplication.apprenticeReferee.responses.additionalComments }}</p>
                    </div>
                    <div class="response-date" *ngIf="selectedApplication.apprenticeReferee.submittedAt">
                      <em>Submitted: {{ selectedApplication.apprenticeReferee.submittedAt | date: 'medium' }}</em>
                    </div>
                  </div>
                  
                  <div *ngIf="!selectedApplication.apprenticeReferee.responses" class="pending-notice">
                    <p>Awaiting response from apprentice/trainee reference...</p>
                  </div>
                </div>
              </div>

              <!-- For Local Applications: Show Referee Appraisals -->
              <div *ngIf="selectedApplication?.applicationType !== 'expatriate'">
                <div *ngIf="!selectedApplication?.sponsors || selectedApplication.sponsors.length === 0" class="no-referees">
                  <p>No referees have been assigned to this application yet.</p>
                </div>
                <div *ngFor="let referee of selectedApplication?.sponsors; let i = index" class="referee-card">
                  <div class="referee-header">
                    <h4>Referee {{ i + 1 }}: {{ referee.sponsorName }}</h4>
                    <span class="referee-status" [class.responded]="referee.responses" [class.pending]="!referee.responses">
                      {{ referee.responses ? 'Responded' : 'Pending' }}
                    </span>
                  </div>
                  <div class="referee-email">{{ referee.sponsorEmail }}</div>
                  
                  <div *ngIf="referee.responses" class="appraisal-responses">
                    <div class="response-item">
                      <strong>1. How long have you known the applicant?</strong>
                      <p>{{ referee.responses.question1 }}</p>
                    </div>
                    <div class="response-item">
                      <strong>2. What is your professional relationship with the applicant?</strong>
                      <p>{{ referee.responses.question2 }}</p>
                    </div>
                    <div class="response-item">
                      <strong>3. Describe the applicant's professional competence and technical knowledge.</strong>
                      <p>{{ referee.responses.question3 }}</p>
                    </div>
                    <div class="response-item">
                      <strong>4. What are the applicant's key strengths in their engineering practice?</strong>
                      <p>{{ referee.responses.question4 }}</p>
                    </div>
                    <div class="response-item">
                      <strong>5. Does the applicant meet the ethical standards required by the engineering profession?</strong>
                      <p>{{ referee.responses.question5 }}</p>
                    </div>
                    <div class="response-item">
                      <strong>6. Can you recommend the applicant for membership?</strong>
                      <p class="recommendation" [class.positive]="referee.responses.question6 === 'Yes'" [class.conditional]="referee.responses.question6 === 'Yes with conditions'" [class.negative]="referee.responses.question6 === 'No'">
                        {{ referee.responses.question6 }}
                      </p>
                    </div>
                    <div class="response-item" *ngIf="referee.responses.question7">
                      <strong>7. Conditions/Explanation:</strong>
                      <p>{{ referee.responses.question7 }}</p>
                    </div>
                    <div class="response-item" *ngIf="referee.responses.question8">
                      <strong>8. Additional Comments:</strong>
                      <p>{{ referee.responses.question8 }}</p>
                    </div>
                    <div class="response-date" *ngIf="referee.submittedAt">
                      <em>Submitted: {{ referee.submittedAt | date: 'medium' }}</em>
                    </div>
                  </div>
                  
                  <div *ngIf="!referee.responses" class="pending-notice">
                    <p>Awaiting response from sponsor...</p>
                  </div>
                </div>
                
                <!-- Certify Button for Local Applications -->
                <div class="certify-section" *ngIf="selectedApplication?.sponsors && selectedApplication.sponsors.length > 0 && !isSuperAdmin">
                  <button (click)="verifyRefereeResponses()" class="btn-certify" [disabled]="getRefereeResponseCount() < (selectedApplication?.sponsors?.length || 0)">
                    {{ getRefereeResponseCount() === (selectedApplication?.sponsors?.length || 0) ? '✓ Certify Referee Responses' : 'Waiting for all responses...' }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Application Decision Section (For Expatriates and Local Applicants) -->
          <section *ngIf="activeSection === 'decision'" #decisionSection class="content-section interview-confirmation-section">
            <div class="section-header">
              <h2>{{ selectedApplication?.applicationType === 'expatriate' ? 'Application Approval' : 'Interview Pass Decision' }}</h2>
            </div>
            <div class="section-content">
              <div class="confirmation-card" [class.passed]="selectedApplication?.status === 'Passed'">
                <div class="confirmation-header">
                  <span class="status-indicator" [ngClass]="selectedApplication?.status === 'Passed' ? 'passed' : 'pending'">
                    {{ selectedApplication?.status === 'Passed' ? '✓ PASSED' : '⏳ PENDING' }}
                  </span>
                </div>
                <div class="confirmation-details">
                  <div class="detail-item">
                    <span class="label">Application Status:</span>
                    <span class="value">
                      {{ selectedApplication?.status === 'Passed' ? 'Passed - Approved' : 'Not Yet Approved' }}
                    </span>
                  </div>
                  <div class="detail-item" *ngIf="selectedApplication?.registrationNumber">
                    <span class="label">Registration Number:</span>
                    <span class="value reg-number">{{ selectedApplication.registrationNumber }}</span>
                  </div>
                  <div class="detail-item" *ngIf="selectedApplication?.interviewPassedDate">
                    <span class="label">Approved Date:</span>
                    <span class="value">{{ selectedApplication.interviewPassedDate | date: 'medium' }}</span>
                  </div>
                </div>
                <div class="confirmation-action">
                  <p class="instruction-text">
                    {{ selectedApplication?.applicationType === 'expatriate' 
                      ? 'Click the button below to approve this expatriate applicant. This will set their status to Passed and allow admission decisions to be made.'
                      : 'Click the button below to confirm that this applicant has successfully passed. This will generate a unique registration number and allow the applicant to download their professional certificate.' }}
                  </p>
                  <button *ngIf="!isSuperAdmin"
                    (click)="passInterview()" 
                    class="btn-confirm-interview"
                    [disabled]="!canPassInterview()">
                    {{ selectedApplication?.status === 'Passed' 
                      ? '✓ Already ' + (selectedApplication?.applicationType === 'expatriate' ? 'Approved' : 'Confirmed') 
                      : '✓ ' + (selectedApplication?.applicationType === 'expatriate' ? 'Approve Application' : 'Confirm Interview Pass & Generate Certificate') }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Interviews Section (Local Applicants Only) -->
          <section *ngIf="activeSection === 'interviews' && selectedApplication?.applicationType !== 'expatriate'" #interviewsSection class="content-section">
            <div class="section-header">
              <h2>Interview Approval ({{ selectedApplication?.adminApprovals?.length || 0 }}/3)</h2>
            </div>
            <div class="section-content">
              <div class="progress-bar">
                <div class="progress-fill" [style.width]="((selectedApplication?.adminApprovals?.length || 0) / 3 * 100) + '%'"></div>
              </div>
              <button (click)="addAdminApproval()"
                      [disabled]="!canAddApproval()"
                      class="btn-primary">
                {{ canAddApproval() ? 'Add Approval' : 'Already Approved' }}
              </button>
              <div *ngIf="selectedApplication?.adminApprovals && selectedApplication.adminApprovals.length > 0" class="approvals-list">
                <h4>Approvals:</h4>
                <div *ngFor="let approval of selectedApplication.adminApprovals" class="approval-item">
                  <span>{{ approval.adminName }}</span> - <span class="date">{{ approval.approvedAt | date: 'short' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Interview Notification Section -->
          <section *ngIf="activeSection === 'notification'" #notificationSection class="content-section">
            <div class="section-header">
              <h2>Interview Management</h2>
            </div>
            <div class="section-content">
              <!-- Interview Invitation Status -->
              <div *ngIf="selectedApplication?.interviewNotification" class="existing-notification">
                <div class="notification-badge">INTERVIEW SCHEDULED</div>
                <div class="detail-row">
                  <span class="label">Message:</span>
                  <p class="value">{{ selectedApplication.interviewNotification.message }}</p>
                </div>
                <div class="detail-row">
                  <span class="label">Sent By:</span>
                  <span>{{ selectedApplication.interviewNotification.sentByName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span>{{ selectedApplication.interviewNotification.sentAt | date: 'medium' }}</span>
                </div>
              </div>
              
              <!-- Interview Invitation Form (for admins only) -->
              <div *ngIf="!selectedApplication?.interviewNotification && !isSuperAdmin" class="notification-form">
                <div class="form-group">
                  <label for="interviewMessage">Message:</label>
                  <textarea [(ngModel)]="interviewMessage" id="interviewMessage" placeholder="Enter interview notification message..." class="form-input notes" rows="3"></textarea>
                </div>
                <button (click)="sendInterviewNotification()" class="btn-primary">Send Interview Invitation</button>
              </div>
              
              <!-- For Super Admin: Show Certificate Status -->
              <div *ngIf="isSuperAdmin" class="super-admin-note">
                <p>Certificate approval is handled in the Super Admin Dashboard</p>
              </div>
            </div>
          </section>

          <!-- Interview Results Section (Super Admin Only) -->
          <section *ngIf="activeSection === 'status' && isSuperAdmin" class="content-section interview-confirmation-section">
            <div class="section-header">
              <h2>Interview Results & Certificate Issuance</h2>
            </div>
            <div class="section-content">
              <div class="confirmation-card" [class.passed]="selectedApplication?.status === 'Passed'">
                <div class="confirmation-header">
                  <span class="status-indicator" [ngClass]="selectedApplication?.status === 'Passed' ? 'passed' : 'pending'">
                    {{ selectedApplication?.status === 'Passed' ? '✓ PASSED' : '⏳ PENDING' }}
                  </span>
                </div>
                <div class="confirmation-details">
                  <div class="detail-item">
                    <span class="label">Interview Status:</span>
                    <span class="value">
                      {{ selectedApplication?.status === 'Passed' ? 'Passed - Certificate Ready' : 'Not Yet Confirmed' }}
                    </span>
                  </div>
                  <div class="detail-item" *ngIf="selectedApplication?.registrationNumber">
                    <span class="label">Registration Number:</span>
                    <span class="value reg-number">{{ selectedApplication.registrationNumber }}</span>
                  </div>
                  <div class="detail-item" *ngIf="selectedApplication?.interviewPassedDate">
                    <span class="label">Interview Passed Date:</span>
                    <span class="value">{{ selectedApplication.interviewPassedDate | date: 'medium' }}</span>
                  </div>
                </div>
                <div class="confirmation-action">
                  <p class="instruction-text">
                    Click the button below to confirm that this applicant has successfully passed the interview.
                    This will generate a unique registration number and allow the applicant to download their professional certificate.
                  </p>
                  <button 
                    (click)="passInterview()" 
                    class="btn-confirm-interview"
                    [disabled]="!canPassInterview()">
                    {{ selectedApplication?.status === 'Passed' ? '✓ Interview Already Confirmed' : '🎓 Confirm Interview Pass & Generate Certificate' }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Certificate & Admission Updates Section -->
          <section *ngIf="activeSection === 'updates' && (selectedApplication?.applicationType === 'expatriate' || selectedApplication?.status === 'Passed')" class="content-section">
            <div class="section-header">
              <h2>{{ selectedApplication?.applicationType === 'expatriate' ? 'Admission & Certificate' : 'Certificate' }} Updates</h2>
              <p class="section-subtitle">{{ selectedApplication?.applicationType === 'expatriate' ? 'Confirm admission and manage certificate issuance for expatriate applicants' : 'Approve certificate issuance for passed applicant' }}</p>
            </div>
            <div class="section-content">
              <!-- Workflow Information -->
              <div class="workflow-info-box">
                <h4>ℹ️ Workflow:</h4>
                <ol>
                  <li><strong>Admin Review:</strong> You're reviewing this {{ selectedApplication?.applicationType === 'expatriate' ? 'expatriate' : 'local' }} application</li>
                  <li><strong>Admin Approval:</strong> When you {{ selectedApplication?.applicationType === 'expatriate' ? 'confirm admission' : 'mark interview as passed' }}, the application status becomes "Passed"</li>
                  <li><strong>Super Admin Processing:</strong> The application then appears in the Super Admin Dashboard for final certificate approval</li>
                  <li><strong>Certificate Issue:</strong> Super Admin approves and the applicant receives their registration number</li>
                </ol>
              </div>

              <!-- Admission Status Box -->
              <div class="admission-status-box" [ngClass]="selectedApplication?.admissionUpdate?.status || 'pending'">
                <div class="status-header">
                  <strong>Current Status:</strong>
                  <span class="status-badge" [ngClass]="'status-' + (selectedApplication?.admissionUpdate?.status || 'pending')">
                    {{ (selectedApplication?.admissionUpdate?.status || 'pending').toUpperCase() }}
                  </span>
                </div>
                <div *ngIf="selectedApplication?.admissionUpdate?.confirmedAt" class="status-detail">
                  <span class="label">Confirmed on:</span>
                  <span>{{ selectedApplication.admissionUpdate.confirmedAt | date: 'medium' }} by {{ selectedApplication.admissionUpdate.confirmedByName }}</span>
                </div>
              </div>

              <!-- Admission Confirmation Form -->
              <div *ngIf="selectedApplication?.admissionUpdate?.status !== 'admitted' && !isSuperAdmin" class="admission-form">
                <div class="form-group">
                  <label>{{ selectedApplication?.applicationType === 'expatriate' ? 'Admission' : 'Certificate' }} Status</label>
                  <select [(ngModel)]="admissionStatus" class="form-input">
                    <option value="">Select status</option>
                    <option value="admitted">{{ selectedApplication?.applicationType === 'expatriate' ? 'Admitted' : 'Approve' }}</option>
                    <option value="rejected">{{ selectedApplication?.applicationType === 'expatriate' ? 'Rejected' : 'Reject' }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>{{ selectedApplication?.applicationType === 'expatriate' ? 'Admission' : 'Certificate' }} Message (Optional)</label>
                  <textarea 
                    [(ngModel)]="admissionMessage" 
                    [placeholder]="'Add any message or notes regarding the ' + (selectedApplication?.applicationType === 'expatriate' ? 'admission' : 'certificate') + ' decision...'"
                    class="form-textarea"
                    rows="3"></textarea>
                </div>

                <button (click)="confirmAdmission()" [disabled]="!admissionStatus" class="btn-primary">
                  {{ admissionStatus === 'admitted' ? 
                    (selectedApplication?.applicationType === 'expatriate' ? 'Confirm Admission' : 'Approve Certificate') : 
                    (selectedApplication?.applicationType === 'expatriate' ? 'Confirm Rejection' : 'Reject Certificate') }}
                </button>
              </div>

              <!-- Message Display -->
              <div *ngIf="selectedApplication?.admissionUpdate?.message" class="admission-message-box">
                <h4>Update Message:</h4>
                <p>{{ selectedApplication.admissionUpdate.message }}</p>
              </div>
            </div>
          </section>

          <!-- Messages -->
          <div class="message-area" *ngIf="updateSuccess || updateError">
            <div *ngIf="updateSuccess" class="success-message">✓ Update successful</div>
            <div *ngIf="updateError" class="error-message">✗ {{ updateError }}</div>
          </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .details-container {
      min-height: 100vh;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
      padding-top: 80px;
    }

    .header {
      background-color: #004A59;
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      gap: 20px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1001;

      h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        flex: 1;
      }

      .btn-back {
        background-color: #B99532;
        color: #004A59;
        border: 2px solid #B99532;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        white-space: nowrap;
        font-size: 13px;

        &:hover {
          background-color: #a58628;
        }
      }

      .btn-logout {
        background-color: white;
        color: #004A59;
        border: 2px solid white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        white-space: nowrap;
        font-size: 13px;

        &:hover {
          background-color: #f0f0f0;
        }
      }
    }

    .main-layout {
      display: flex;
      flex: 1;
      gap: 0;
    }

    .sidebar-nav {
      width: 280px;
      background-color: #004A59;
      border-right: 2px solid #B99532;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: sticky;
      top: 80px;
      min-height: calc(100vh - 80px);

      .sidebar-header {
        background-color: #003347;
        border-bottom: 2px solid #B99532;
        padding: 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 0;

        h3 {
          margin: 0;
          color: white;
          font-size: 16px;
          font-weight: 700;
          flex: 1;
        }

        .logout-btn-header {
          background-color: rgba(185, 149, 50, 0.3);
          border: 2px solid #B99532;
          color: white;
          padding: 8px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;

          &:hover {
            background-color: #B99532;
            color: #004A59;
          }

          .icon {
            font-size: 18px;
          }
        }
      }

      .nav-menu {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 15px 0;
      }

      .nav-item {
        background: none;
        border: none;
        border-left: 3px solid transparent;
        color: white;
        padding: 14px 20px;
        text-align: left;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(185, 149, 50, 0.2);
          border-left-color: #B99532;
          padding-left: 17px;
        }

        &.active {
          background-color: rgba(185, 149, 50, 0.3);
          border-left-color: #B99532;
          font-weight: 600;
        }
      }
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 30px;
      width: 100%;
      max-width: 100%;
    }

    .content-section {
      background-color: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      margin-bottom: 30px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      color: #004A59;
      font-size: 16px;
      font-weight: 500;
    }

    .section-header {
      background-color: #004A59;
      color: white;
      padding: 15px 20px;
      border-bottom: 2px solid #003347;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
      }

      .progress {
        background-color: rgba(185, 149, 50, 0.3);
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        margin: 0;
      }
    }

    .section-content {
      padding: 20px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          color: #004A59;
          min-width: 150px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;

          &.status-submitted {
            background-color: #e3f2fd;
            color: #1976d2;
          }

          &.status-under-review {
            background-color: #fff3e0;
            color: #f57c00;
          }

          &.status-approved {
            background-color: #e8f5e9;
            color: #388e3c;
          }

          &.status-pending {
            background-color: #f3e5f5;
            color: #7b1fa2;
          }

          &.status-interview-required {
            background-color: #fff9c4;
            color: #f57f17;
          }

          &.status-rejected {
            background-color: #ffebee;
            color: #c62828;
          }
        }
      }
    }

    .document-item {
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 600;
        color: #004A59;
      }

      .certificate-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .document-link {
        background-color: #004A59;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.3s ease;
        display: inline-block;

        &:hover {
          background-color: #B99532;
          text-decoration: none;
        }
      }

      .no-document {
        color: #999;
        font-style: italic;
        font-size: 13px;
      }
    }

    .checklist-items {
      margin-bottom: 20px;

      .checklist-item {
        display: flex;
        align-items: flex-start;
        padding: 10px 0;
        gap: 12px;

        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          cursor: pointer;
          border: 2px solid #004A59;
          accent-color: #B99532;
        }

        label {
          cursor: pointer;
          margin: 0;
          line-height: 1.4;
          color: #333;
        }
      }
    }

    .existing-grade {
      background-color: #e8f5e9;
      border: 1px solid #4caf50;
      padding: 15px;
      border-radius: 4px;
      color: #2e7d32;

      .detail-row {
        border-bottom: 1px solid rgba(76, 175, 80, 0.2);

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #2e7d32;
          font-weight: 600;
        }
      }
    }

    .grading-form {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;

      .form-group {
        margin-bottom: 15px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-weight: 600;
        color: #004A59;
        font-size: 13px;
      }

      .form-input {
        padding: 10px;
        border: 2px solid #004A59;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: #B99532;
          box-shadow: 0 0 4px rgba(185, 149, 50, 0.3);
        }

        &.notes {
          resize: vertical;
          min-height: 80px;
        }
      }
    }

    .progress-bar {
      width: 100%;
      height: 24px;
      background-color: #f0f0f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 15px;
      border: 1px solid #ddd;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #B99532 0%, #004A59 100%);
      transition: width 0.3s ease;
    }

    .approvals-list {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #f0f0f0;

      h4 {
        margin: 0 0 10px 0;
        color: #004A59;
        font-size: 13px;
      }

      .approval-item {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 13px;
        display: flex;
        justify-content: space-between;

        &:last-child {
          border-bottom: none;
        }

        .date {
          color: #999;
          font-size: 12px;
        }
      }
    }

    .existing-notification {
      background-color: #fff9c4;
      border: 1px solid #f9a825;
      padding: 15px;
      border-radius: 4px;
      color: #6d4c41;

      .notification-badge {
        display: inline-block;
        background-color: #27ae60;
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-weight: 600;
        font-size: 11px;
        margin-bottom: 10px;
      }

      .detail-row {
        padding: 8px 0;

        .label {
          color: #6d4c41;
        }

        .value {
          color: #6d4c41;
          margin: 0;
          font-size: 13px;
        }
      }
    }

    .notification-form {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    /* Sponsor Appraisals Styles */
    .sponsor-count {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .no-sponsors {
      text-align: center;
      padding: 30px;
      color: #666;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .sponsor-card {
      background-color: #f9f9f9;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .sponsor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      h4 {
        margin: 0;
        color: #004A59;
        font-size: 16px;
      }
    }

    .sponsor-status {
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 600;

      &.responded {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      &.pending {
        background-color: #fff3e0;
        color: #ef6c00;
      }
    }

    .sponsor-email {
      color: #666;
      font-size: 13px;
      margin-bottom: 15px;
    }

    .appraisal-responses {
      border-top: 2px solid #B99532;
      padding-top: 15px;
      margin-top: 10px;
    }

    .response-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      strong {
        display: block;
        color: #004A59;
        font-size: 13px;
        margin-bottom: 8px;
      }

      p {
        margin: 0;
        color: #333;
        font-size: 14px;
        line-height: 1.5;
        background-color: white;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }
    }

    .recommendation {
      font-weight: 600 !important;

      &.positive {
        color: #2e7d32 !important;
        background-color: #e8f5e9 !important;
        border-color: #a5d6a7 !important;
      }

      &.conditional {
        color: #ef6c00 !important;
        background-color: #fff3e0 !important;
        border-color: #ffcc80 !important;
      }

      &.negative {
        color: #c62828 !important;
        background-color: #ffebee !important;
        border-color: #ef9a9a !important;
      }
    }

    .response-date {
      text-align: right;
      color: #999;
      font-size: 12px;
      margin-top: 10px;
    }

    .super-admin-note {
      background-color: #e3f2fd;
      border-left: 4px solid #1976d2;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;

      p {
        margin: 0;
        color: #1565c0;
        font-weight: 500;
        font-size: 14px;
      }
    }

    .pending-notice {
      text-align: center;
      padding: 20px;
      color: #ef6c00;
      background-color: #fff3e0;
      border-radius: 4px;
      border: 1px dashed #ef6c00;

      p {
        margin: 0;
      }
    }

    .certify-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #004A59;
      display: flex;
      justify-content: flex-end;
    }

    .btn-certify {
      background-color: #28a745;
      color: white;
      border: 2px solid #28a745;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &:hover:not(:disabled) {
        background-color: #218838;
        border-color: #1e7e34;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        transform: translateY(-2px);
      }

      &:disabled {
        background-color: #ccc;
        border-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .payment-details {
      margin-bottom: 15px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          color: #004A59;
        }

        .payment-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;

          &.status-pending {
            background-color: #fff3e0;
            color: #e65100;
          }

          &.status-verified {
            background-color: #e8f5e9;
            color: #2e7d32;
          }

          &.status-rejected {
            background-color: #ffebee;
            color: #c62828;
          }
        }
      }
    }

    .btn-primary {
      background-color: #004A59;
      color: white;
      border: 2px solid #004A59;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
      width: 100%;
      margin-top: 15px;

      &:hover:not(:disabled) {
        background-color: #B99532;
        border-color: #B99532;
      }

      &:disabled {
        background-color: #ccc;
        border-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .btn-success {
      background-color: #28a745;
      color: white;
      border: 2px solid #28a745;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
      width: 100%;
      margin-top: 15px;

      &:hover:not(:disabled) {
        background-color: #218838;
        border-color: #218838;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      }

      &:disabled {
        background-color: #ccc;
        border-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 15px;

      button {
        flex: 1;
        min-width: 200px;
        margin-top: 0 !important;
      }
    }

    .interview-action,
    .certificate-action,
    .regular-status-update {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #B99532;
      margin-top: 15px;
    }

    .interview-action {
      border-left-color: #FFA500;
      background-color: #fffbf0;
    }

    .certificate-action {
      border-left-color: #28a745;
      background-color: #f0f9f6;
    }

    .rejection-info-box {
      background-color: #ffeceb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #c62828;
      margin-top: 15px;
      border: 2px solid #ffcccc;
    }

    .rejection-detail {
      margin-bottom: 15px;

      &:last-child {
        margin-bottom: 0;
      }

      strong {
        display: block;
        color: #c62828;
        font-weight: 700;
        margin-bottom: 5px;
      }

      p {
        margin: 0;
        color: #555;
        font-size: 14px;
        line-height: 1.5;
      }

      &.edit-window {
        p {
          &.warning {
            color: #ff9800;
            font-weight: 600;
          }

          &.expired {
            color: #c62828;
            font-weight: 600;
          }
        }
      }
    }

    .action-description {
      margin: 0 0 15px 0;
      font-size: 14px;
      color: #555;
      line-height: 1.5;
    }

    .reg-display {
      background-color: white;
      padding: 12px 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 14px;
      border: 1px solid #ddd;
    }

    .reg-display strong {
      display: block;
      margin-bottom: 8px;
      color: #333;
    }

    .btn-interview,
    .btn-certificate {
      width: 100%;
      padding: 12px 20px;
      border: 2px solid;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 0;

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .btn-interview {
      background-color: #FFA500;
      color: white;
      border-color: #FF8C00;

      &:hover {
        background-color: #FF8C00;
        box-shadow: 0 4px 12px rgba(255, 165, 0, 0.3);
        transform: translateY(-2px);
      }
    }

    .btn-certificate {
      background-color: #28a745;
      color: white;
      border-color: #218838;

      &:hover {
        background-color: #218838;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        transform: translateY(-2px);
      }
    }

    .expatriate-notice {
      background-color: #fff3e0;
      border: 2px solid #B99532;
      border-radius: 6px;
      padding: 15px;
      margin-top: 15px;
    }

    .notice-text {
      color: #B99532;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
    }

    .interview-confirmation-section {
      border-top: 3px solid #28a745;
      background-color: #f0f9f6;
      margin-bottom: 20px;
    }

    .confirmation-card {
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background-color: white;
      transition: all 0.3s ease;

      &.passed {
        border-color: #28a745;
        background-color: #f0f9f6;
      }
    }

    .confirmation-header {
      margin-bottom: 15px;
    }

    .status-indicator {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.pending {
        background-color: #fff3cd;
        color: #856404;
      }

      &.passed {
        background-color: #d4edda;
        color: #155724;
      }
    }

    .confirmation-details {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 6px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 600;
        color: #004A59;
        min-width: 180px;
      }

      .value {
        color: #333;
        text-align: right;
        flex: 1;

        &.reg-number {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #28a745;
          font-size: 15px;
        }
      }
    }

    .confirmation-action {
      padding: 15px;
      background-color: #f0f9f6;
      border-left: 4px solid #28a745;
      border-radius: 4px;
    }

    .instruction-text {
      margin: 0 0 15px 0;
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    .btn-confirm-interview {
      width: 100%;
      padding: 12px 20px;
      background-color: #28a745;
      color: white;
      border: 2px solid #28a745;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &:hover:not(:disabled) {
        background-color: #218838;
        border-color: #1e7e34;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        transform: translateY(-2px);
      }

      &:disabled {
        background-color: #ccc;
        border-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .message-area {
      margin-top: 20px;

      .success-message, .error-message {
        padding: 12px 15px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 13px;
      }

      .success-message {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #4caf50;
      }

      .error-message {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ef5350;
      }
    }

    .no-document {
      color: #999;
      font-style: italic;
      font-size: 13px;
    }

    /* Workflow Information Styles */
    .workflow-info-box {
      background-color: #e3f2fd;
      border: 2px solid #004A59;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;

      h4 {
        color: #004A59;
        margin: 0 0 12px 0;
        font-size: 15px;
        font-weight: 700;
      }

      ol {
        margin: 0;
        padding-left: 20px;
        color: #333;
        
        li {
          margin-bottom: 10px;
          font-size: 13px;
          line-height: 1.5;
          
          strong {
            color: #004A59;
            font-weight: 600;
          }
        }
      }
    }

    /* Admission Updates Styles */
    .admission-status-box {
      background: linear-gradient(135deg, #f5f5f5 0%, #fff 100%);
      border: 2px solid #B99532;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      
      &.pending {
        border-color: #ff9800;
        background: linear-gradient(135deg, #fff3e0 0%, #fff 100%);
      }

      &.admitted {
        border-color: #28a745;
        background: linear-gradient(135deg, #f0f9f6 0%, #fff 100%);
      }

      &.rejected {
        border-color: #c62828;
        background: linear-gradient(135deg, #ffebee 0%, #fff 100%);
      }
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .status-badge {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        &.status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        &.status-admitted {
          background-color: #d4edda;
          color: #155724;
        }

        &.status-rejected {
          background-color: #f8d7da;
          color: #721c24;
        }
      }
    }

    .status-detail {
      font-size: 13px;
      color: #555;
      padding-top: 8px;
      border-top: 1px solid rgba(185, 149, 50, 0.2);

      .label {
        font-weight: 600;
        color: #004A59;
        margin-right: 8px;
      }
    }

    .admission-form {
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      min-height: 80px;

      &:focus {
        outline: none;
        border-color: #004A59;
        box-shadow: 0 0 0 3px rgba(0, 74, 89, 0.1);
      }
    }

    .admission-message-box {
      background-color: #f5f5f5;
      border-left: 4px solid #B99532;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;

      h4 {
        color: #004A59;
        margin: 0 0 10px 0;
        font-size: 14px;
      }

      p {
        margin: 0;
        color: #555;
        font-size: 13px;
        line-height: 1.5;
      }
    }

    .section-subtitle {
      font-size: 13px;
      color: #666;
      margin: 5px 0 0 0;
    }

    @media (max-width: 768px) {
      .main-layout {
        flex-direction: column;
      }

      .sidebar-nav {
        width: 100%;
        position: static;
        flex-direction: row;
        padding: 10px;
        height: auto;
        border-right: none;
        border-bottom: 2px solid #B99532;

        .nav-menu {
          flex-direction: row;
          overflow-x: auto;
          gap: 5px;
        }

        .nav-item {
          white-space: nowrap;
          padding: 8px 12px;
          font-size: 12px;
        }

        .logout-btn {
          margin: 0;
          flex-shrink: 0;
        }
      }

      .content-area {
        padding: 15px;
      }
    }

    @media (max-width: 480px) {
      .main-layout {
        flex-direction: column;
      }

      .sidebar-nav {
        width: 100%;
        position: static;
        flex-direction: row;
        padding: 8px;
        height: auto;
        border-right: none;
        border-bottom: 2px solid #B99532;
        overflow-x: auto;

        .nav-menu {
          flex-direction: row;
          gap: 4px;
          width: 100%;
        }

        .nav-item {
          white-space: nowrap;
          padding: 6px 10px;
          font-size: 11px;
          border: 1px solid #B99532;
        }

        .logout-btn {
          padding: 6px 10px;
          font-size: 10px;
          margin: 0;
          flex-shrink: 0;
        }
      }

      .content-area {
        padding: 12px;
        max-width: 100%;
      }

      .section-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;

        h2 {
          font-size: 16px;
          margin-bottom: 0;
        }

        .tabs {
          width: 100%;
          gap: 4px;

          button {
            padding: 6px 8px;
            font-size: 10px;
          }
        }
      }

      .form-section {
        padding: 12px;
        margin-bottom: 12px;

        h3 {
          font-size: 13px;
        }
      }

      .form-group {
        margin-bottom: 12px;

        label {
          font-size: 12px;
        }

        input, textarea, select {
          padding: 6px 8px;
          font-size: 12px;
        }
      }

      .button-group {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;

        button {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
        }

        .form-group {
          width: 100%;
          margin-bottom: 0;
        }
      }

      .status-badge,
      .section-content {
        font-size: 12px;
      }

      table {
        font-size: 11px;
        min-width: 600px;
        overflow-x: auto;
        display: block;
      }

      th, td {
        padding: 6px 4px !important;
      }
    }

    .button-group {
      display: flex;
      gap: 15px;
      align-items: flex-end;
      flex-wrap: wrap;

      .form-group {
        flex: 1;
        min-width: 200px;
      }

      button {
        flex-shrink: 0;
      }

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;

        button {
          width: 100%;
        }

        .form-group {
          width: 100%;
        }
      }
    }
  `]
})
export class AdminApplicationDetailsComponent implements OnInit {
  selectedApplication: any = null;
  activeSection = 'personal';
  selectedStatus = '';
  updateSuccess = false;
  updateError = '';
  isEditingChecklist = false;
  isSuperAdmin = false;
  
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

  // Valid status transitions - mirrors backend logic
  validStatusTransitions: { [key: string]: string[] } = {
    'Draft': ['Submitted', 'Rejected'],
    'Submitted': ['Under Review', 'Rejected'],
    'Pending': ['Under Review', 'Interview Required', 'Rejected'],
    'Under Review': ['Approved', 'Rejected', 'Approved with Conditions', 'Interview Required'],
    'Interview Required': ['Approved', 'Rejected', 'Approved with Conditions', 'Passed'],
    'Approved': ['Passed'],
    'Rejected': ['Submitted'],  // Allow re-submission within 24 hours
    'Approved with Conditions': ['Approved', 'Rejected', 'Passed'],
    'Passed': [],
  };

  rejectionReason = '';
  rejectionEditWindowRemaining = 0;  // In seconds

  navSections = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'documents', label: 'Documents' },
    { id: 'checklist', label: 'Verification' },
    { id: 'payment', label: 'Payment' },
    { id: 'grading', label: 'Manual Grading' },
    { id: 'referees', label: 'Referee Appraisal' },
    { id: 'decision', label: 'Application Decision' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'notification', label: 'Interview Notification' },
    { id: 'updates', label: 'Admission Updates' },
  ];

  // Admission update properties for expatriates
  admissionStatus = ''; // 'pending', 'admitted', 'rejected'
  admissionMessage = '';
  admissionConfirmedAt: Date | null = null;
  admissionConfirmedBy = '';
  digitalSignature: File | null = null;

  get filteredNavSections() {
    if (!this.selectedApplication) return this.navSections;
    
    // For expatriates: show decision, documents, checklist, payment, grading, referees, updates
    // Hide interviews and notification sections
    if (this.selectedApplication?.applicationType === 'expatriate') {
      return this.navSections.filter(s => 
        !['interviews', 'notification'].includes(s.id)
      );
    }
    
    // For local applications: show decision and interviews sections
    // Show updates only if they passed
    if (this.selectedApplication?.status === 'Passed') {
      return this.navSections.filter(s => s.id !== 'notification');
    }
    
    // Remove updates and decision sections for locals not yet passed
    return this.navSections.filter(s => !['updates'].includes(s.id));
  }

  getSponsorResponseCount(): number {
    if (!this.selectedApplication?.sponsors) return 0;
    return this.selectedApplication.sponsors.filter((s: any) => s.responses).length;
  }

  getRefereeResponseCount(): number {
    if (!this.selectedApplication?.sponsors) return 0;
    return this.selectedApplication.sponsors.filter((s: any) => s.responses).length;
  }

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private roleBasedDashboardService: RoleBasedDashboardService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.roleBasedDashboardService.isSuperAdmin();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadApplication(params['id']);
      }
    });
  }

  loadApplication(appId: string): void {
    // Use auto-refresh to get real-time updates every 5 seconds
    // but only if not currently editing the checklist
    const subscription = this.applicationService.getApplicationByIdWithAutoRefresh(appId).subscribe({
      next: (app) => {
        if (!this.isEditingChecklist) {
          this.selectedApplication = app;
          this.updateRejectionEditWindow();
        }
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.updateError = 'Failed to load application';
      },
    });
  }

  updateRejectionEditWindow(): void {
    if (this.selectedApplication?.rejectionInfo?.allowEditUntil) {
      const now = new Date();
      const allowEditUntil = new Date(this.selectedApplication.rejectionInfo.allowEditUntil);
      const remainingMs = allowEditUntil.getTime() - now.getTime();
      this.rejectionEditWindowRemaining = Math.max(0, Math.floor(remainingMs / 1000));
    }
  }

  getRejectionEditWindowDisplay(): string {
    if (this.rejectionEditWindowRemaining <= 0) {
      return 'Editing window closed';
    }
    const hours = Math.floor(this.rejectionEditWindowRemaining / 3600);
    const minutes = Math.floor((this.rejectionEditWindowRemaining % 3600) / 60);
    const seconds = this.rejectionEditWindowRemaining % 60;
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  }

  navigateToSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  goBackToList(): void {
    this.router.navigate(['/applications-list']);
  }

  getChecklistProgress(): string {
    if (!this.selectedApplication) return '0/8';
    const checklist = this.selectedApplication.adminChecklist;
    const checked = Object.values(checklist).filter((v: any) => v === true).length;
    const total = Object.keys(checklist).length;
    return `${checked}/${total}`;
  }

  updateApplicationChecklist(): void {
    if (!this.selectedApplication) return;

    const checklistData = {
      photo: this.selectedApplication.adminChecklist.photo,
      m1Form: this.selectedApplication.adminChecklist.m1Form,
      signature: this.selectedApplication.adminChecklist.signature,
      trainingReport: this.selectedApplication.adminChecklist.trainingReport,
      projectReport: this.selectedApplication.adminChecklist.projectReport,
      organogram: this.selectedApplication.adminChecklist.organogram,
      sponsorships: this.selectedApplication.adminChecklist.sponsorships,
      certificates: this.selectedApplication.adminChecklist.certificates,
      adminNotes: this.selectedApplication.adminNotes,
    };

    this.isEditingChecklist = true;
    this.applicationService.updateApplicationChecklist(this.selectedApplication._id, checklistData).subscribe({
      next: (response) => {
        // Update the full application with response to preserve all data
        this.selectedApplication = response.application || this.selectedApplication;
        this.updateSuccess = true;
        this.updateError = '';
        // Keep flag true for 1 second after save to prevent race conditions
        setTimeout(() => {
          this.isEditingChecklist = false;
        }, 1000);
      },
      error: (error) => {
        this.updateError = error.error?.message || 'Failed to update checklist';
        this.isEditingChecklist = false;
      },
    });
  }

  onChecklistChange(): void {
    // Set flag to prevent auto-refresh while user is editing
    this.isEditingChecklist = true;
  }

  updateApplicationStatus(): void {
    if (!this.selectedStatus) {
      this.updateError = 'Please select a status';
      return;
    }

    // If rejecting, require a reason
    if (this.selectedStatus === 'Rejected' && !this.rejectionReason.trim()) {
      this.updateError = 'Please provide a rejection reason';
      return;
    }

    const statusData: any = { status: this.selectedStatus };
    
    if (this.selectedStatus === 'Rejected') {
      statusData.rejectionReason = this.rejectionReason;
    }

    this.applicationService.updateApplicationStatus(this.selectedApplication._id, statusData).subscribe({
      next: (response) => {
        // Update the full application object to preserve all fields
        this.selectedApplication = response;
        this.updateRejectionEditWindow();
        this.updateSuccess = true;
        this.updateError = '';
        this.rejectionReason = '';
        setTimeout(() => (this.updateSuccess = false), 3000);
      },
      error: (error) => {
        this.updateError = error.error?.reason || error.error?.message || 'Failed to update status';
      },
    });
  }

  setManualGrade(): void {
    if (!this.selectedApplication || !this.manualGradeData.grade || !this.manualGradeData.division) {
      this.updateError = 'Please fill in grade and division';
      return;
    }

    this.applicationService.setManualGrade(this.selectedApplication._id, this.manualGradeData).subscribe({
      next: (response: any) => {
        this.selectedApplication.manualGrade = response.manualGrade;
        this.updateSuccess = true;
        this.updateError = '';
        this.manualGradeData = { grade: '', division: '', notes: '' };
        setTimeout(() => (this.updateSuccess = false), 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to set manual grade';
      },
    });
  }

  canAddApproval(): boolean {
    if (!this.selectedApplication) return false;
    const approvals = this.selectedApplication.adminApprovals || [];
    return !approvals.some((app: any) => app.adminId === localStorage.getItem('userId'));
  }

  addAdminApproval(): void {
    if (!this.selectedApplication) {
      this.updateError = 'No application selected';
      return;
    }

    this.applicationService.addAdminApproval(this.selectedApplication._id).subscribe({
      next: (response: any) => {
        this.selectedApplication.adminApprovals = response.adminApprovals;
        this.selectedApplication.status = response.status;
        this.updateSuccess = true;
        this.updateError = '';
        setTimeout(() => (this.updateSuccess = false), 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to add approval';
      },
    });
  }

  verifyRefereeResponses(): void {
    if (!this.selectedApplication) {
      this.updateError = 'No application selected';
      return;
    }

    if (this.getRefereeResponseCount() < (this.selectedApplication?.sponsors?.length || 0)) {
      this.updateError = 'All referees must provide responses before certifying';
      return;
    }

    this.applicationService.verifyRefereeResponses(this.selectedApplication._id).subscribe({
      next: (response: any) => {
        this.selectedApplication = response;
        this.updateSuccess = true;
        this.updateError = '';
        setTimeout(() => (this.updateSuccess = false), 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to verify referee responses';
      },
    });
  }

  sendApprenticeAppraisalForm(): void {
    if (!this.selectedApplication || !this.selectedApplication.apprenticeReferee) {
      this.updateError = 'No apprentice reference found';
      return;
    }

    if (!this.selectedApplication.apprenticeReferee.refereeEmail) {
      this.updateError = 'Apprentice email is missing';
      return;
    }

    const confirmSend = confirm(
      `Send appraisal form to ${this.selectedApplication.apprenticeReferee.refereeName} (${this.selectedApplication.apprenticeReferee.refereeEmail})?`
    );
    if (!confirmSend) {
      return;
    }

    const payload = {
      apprenticeName: this.selectedApplication.apprenticeReferee.refereeName,
      apprenticeEmail: this.selectedApplication.apprenticeReferee.refereeEmail,
      applicantName: `${this.selectedApplication.personalParticulars.firstName} ${this.selectedApplication.personalParticulars.lastName}`,
      relationship: this.selectedApplication.apprenticeReferee.refereeRelationship,
    };

    this.applicationService.sendApprenticeAppraisalForm(this.selectedApplication._id, payload).subscribe({
      next: (response: any) => {
        this.updateSuccess = true;
        this.updateError = '';
        this.selectedApplication.apprenticeReferee.formSentAt = new Date();
        alert(`Appraisal form sent to ${this.selectedApplication.apprenticeReferee.refereeName}`);
        setTimeout(() => (this.updateSuccess = false), 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to send appraisal form';
        console.error('Error sending appraisal form:', error);
      },
    });
  }

  sendInterviewNotification(): void {
    if (!this.selectedApplication || !this.interviewMessage.trim()) {
      this.updateError = 'Please enter an interview message';
      return;
    }

    this.applicationService.sendInterviewNotification(this.selectedApplication._id, this.interviewMessage).subscribe({
      next: (response: any) => {
        this.selectedApplication.interviewNotification = response.interviewNotification;
        this.updateSuccess = true;
        this.updateError = '';
        this.interviewMessage = '';
        setTimeout(() => (this.updateSuccess = false), 3000);
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to send interview notification';
      },
    });
  }

  canPassInterview(): boolean {
    return this.selectedApplication && this.selectedApplication.status !== 'Passed';
  }

  inviteForInterview(): void {
    if (!this.selectedApplication) {
      this.updateError = 'No application selected';
      return;
    }

    if (confirm('Send interview invitation to ' + this.selectedApplication.personalParticulars.firstName + '?')) {
      this.applicationService.sendInterviewNotification(this.selectedApplication._id, 'You have been invited for your interview. Please check your portal for details.').subscribe({
        next: (response: any) => {
          this.updateSuccess = true;
          this.updateError = '';
          console.log('Interview invitation sent successfully');
          setTimeout(() => (this.updateSuccess = false), 3000);
        },
        error: (error: any) => {
          console.error('Error sending interview invitation:', error);
          this.updateError = error.error?.message || 'Failed to send interview invitation';
        },
      });
    }
  }

  downloadCertificate(): void {
    if (this.selectedApplication && this.selectedApplication._id) {
      this.router.navigate(['/certificate', this.selectedApplication._id]);
    }
  }

  passInterview(): void {
    if (!this.selectedApplication) {
      this.updateError = 'No application selected';
      return;
    }

    if (confirm('Are you sure you want to mark this interview as passed and generate a certificate?')) {
      this.applicationService.passInterview(this.selectedApplication._id).subscribe({
        next: (response: any) => {
          // Extract from nested application object in response
          const appData = response.application || response;
          this.selectedApplication.status = appData.status || 'Passed';
          this.selectedApplication.registrationNumber = appData.registrationNumber;
          this.selectedApplication.interviewPassedDate = appData.interviewPassedDate;
          this.updateSuccess = true;
          this.updateError = '';
          console.log('Interview passed successfully. Registration Number:', appData.registrationNumber);
          setTimeout(() => (this.updateSuccess = false), 3000);
        },
        error: (error: any) => {
          console.error('Error passing interview:', error);
          this.updateError = error.error?.message || 'Failed to mark interview as passed';
        },
      });
    }
  }

  confirmAdmission(): void {
    if (!this.selectedApplication || !this.admissionStatus) {
      this.updateError = 'Please select an admission status';
      return;
    }

    const confirmMsg = this.admissionStatus === 'admitted' 
      ? 'Are you sure you want to confirm this applicant\'s admission?' 
      : 'Are you sure you want to reject this applicant?';

    if (confirm(confirmMsg)) {
      const admissionData = {
        status: this.admissionStatus,
        message: this.admissionMessage,
      };

      this.applicationService.updateExpatriateAdmission(
        this.selectedApplication._id, 
        admissionData
      ).subscribe({
        next: (response: any) => {
          const appData = response.application || response;
          this.selectedApplication.admissionUpdate = appData.admissionUpdate;
          
          this.updateSuccess = true;
          this.updateError = '';
          this.admissionStatus = '';
          this.admissionMessage = '';
          
          console.log('Admission status updated:', appData.status);
          setTimeout(() => (this.updateSuccess = false), 3000);
        },
        error: (error: any) => {
          console.error('Error updating admission:', error);
          this.updateError = error.error?.message || 'Failed to update admission status';
        },
      });
    }
  }

  /**
   * Get available status options based on current status
   */
  getAvailableStatuses(): string[] {
    if (!this.selectedApplication) {
      return [];
    }
    return this.validStatusTransitions[this.selectedApplication.status] || [];
  }

  viewCertificate(): void {
    if (this.selectedApplication && this.selectedApplication._id) {
      this.router.navigate(['/certificate', this.selectedApplication._id]);
    }
  }

  logout(): void {
    console.log('🚪 Admin Application Details: Logging out');
    // Use logoutAndNavigate to ensure complete state cleanup and hard refresh
    this.authService.logoutAndNavigate();
  }
}
