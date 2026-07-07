import { Component, OnInit, ViewChild, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { DocumentValidationService } from '../services/document-validation.service';
import { FormValidationService } from '../services/form-validation.service';
import { FormPersistenceService } from '../services/form-persistence.service';
import { getFeeBreakdown } from '../services/membership-fee.service';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DynamicValidationModalComponent } from '../components/dynamic-validation-modal.component';

// Custom Validators
class CustomValidators {
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // allow empty value to be validated by required validator
    }
    const phoneValue = String(control.value).replace(/\D/g, ''); // Remove all non-digits
    // Accept phone numbers with 9-15 digits to accommodate various formats (local and international)
    // The country-specific validator will enforce exact format requirements
    if (phoneValue.length < 9 || phoneValue.length > 15) {
      return { invalidPhone: true };
    }
    return null;
  }

  static nationalId(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    // Pattern: "63-2345678 D 48" (digits-digits space letter space digits)
    const pattern = /^\d{2}-\d{7}\s[A-Z]\s\d{2}$/;
    if (!pattern.test(String(control.value).toUpperCase())) {
      return { invalidNationalId: true };
    }
    return null;
  }
}

@Component({
  selector: 'app-form-m1',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="form-container">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isSubmitting">
        <div class="loader"></div>
        <p class="loading-text">Submitting your application...</p>
      </div>

      <h1>Form M1 - The ZImbabwe Institution of Engineers Membership Application</h1>

      <mat-stepper #stepper>
        <!-- Step 1: Personal Particulars -->
        <mat-step [stepControl]="personalParticularsForm" label="Personal Particulars">
          <form [formGroup]="personalParticularsForm">
            <div class="step-content">
              <div class="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  formControlName="firstName"
                  placeholder="Enter first name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  formControlName="lastName"
                  placeholder="Enter last name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="Enter email"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  formControlName="phone"
                  placeholder="Enter phone number (with or without country code)"
                  class="form-input"
                />
                <div class="error-message" *ngIf="personalParticularsForm.get('phone')?.errors && (personalParticularsForm.get('phone')?.touched || personalParticularsForm.get('phone')?.dirty)">
                  <span *ngIf="personalParticularsForm.get('phone')?.errors?.['required']">Phone number is required</span>
                  <span *ngIf="personalParticularsForm.get('phone')?.errors?.['invalidPhone']">Phone number must be exactly 10 digits</span>
                </div>
              </div>

              <div class="form-group">
                <label>National ID Number</label>
                <input
                  type="text"
                  formControlName="nationalId"
                  placeholder="Format: 63-2345678 D 48"
                  class="form-input"
                />
                <div class="error-message" *ngIf="personalParticularsForm.get('nationalId')?.errors && (personalParticularsForm.get('nationalId')?.touched || personalParticularsForm.get('nationalId')?.dirty)">
                  <span *ngIf="personalParticularsForm.get('nationalId')?.errors?.['required']">National ID is required</span>
                  <span *ngIf="personalParticularsForm.get('nationalId')?.errors?.['invalidNationalId']">National ID must be in format: 63-2345678 D 48</span>
                </div>
              </div>

              <div class="verification-section">
                <button type="button" (click)="openVerificationModal()" class="btn-verify">
                  🔐 Verify Your National ID & Experience
                </button>
                <p class="verification-help">
                  Use this to quickly verify your National ID and years of experience
                </p>
              </div>

              <div class="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  formControlName="dateOfBirth"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Nationality</label>
                <input
                  type="text"
                  formControlName="nationality"
                  placeholder="Enter nationality"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Professional Registration Number (if any)</label>
                <input
                  type="text"
                  formControlName="professionalNumber"
                  placeholder="Enter professional number"
                  class="form-input"
                />
              </div>
            </div>
            <div class="step-buttons">
              <button matStepperNext type="button" class="btn-primary" [disabled]="!personalParticularsForm.valid">
                Next
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Education -->
        <mat-step [stepControl]="educationForm" label="Education">
          <form [formGroup]="educationForm">
            <div class="step-content">
              <div formArrayName="education">
                <div *ngFor="let edu of educationArray.controls; let i = index" class="education-item">
                  <h4>Qualification {{ i + 1 }}</h4>
                  <div [formGroupName]="i">
                    <div class="form-group">
                      <label>Institution</label>
                      <input
                        type="text"
                        formControlName="institution"
                        placeholder="University/Institution name"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label>Qualification</label>
                      <input
                        type="text"
                        formControlName="qualification"
                        placeholder="e.g., Bachelor of Engineering"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label>Year Obtained</label>
                      <input type="number" formControlName="year" placeholder="YYYY" class="form-input" />
                    </div>

                    <div class="form-group">
                      <label>Major/Specialization</label>
                      <input
                        type="text"
                        formControlName="major"
                        placeholder="e.g., Civil Engineering"
                        class="form-input"
                      />
                    </div>

                    <button
                      type="button"
                      (click)="removeEducation(i)"
                      class="btn-secondary"
                      *ngIf="educationArray.length > 1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <button type="button" (click)="addEducation()" class="btn-secondary">
                + Add Another Qualification
              </button>
            </div>

            <div class="step-buttons">
              <button matStepperPrevious type="button" class="btn-secondary">Back</button>
              <button matStepperNext type="button" class="btn-primary">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Experience -->
        <mat-step [stepControl]="experienceForm" label="Engineering Experience">
          <form [formGroup]="experienceForm">
            <div class="step-content">
              <div formArrayName="experience">
                <div *ngFor="let exp of experienceArray.controls; let i = index" class="experience-item">
                  <h4>Position {{ i + 1 }}</h4>
                  <div [formGroupName]="i">
                    <div class="form-group">
                      <label>Company/Organization</label>
                      <input
                        type="text"
                        formControlName="company"
                        placeholder="Company name"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label>Job Title/Position</label>
                      <input
                        type="text"
                        formControlName="position"
                        placeholder="Your position"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label>Start Year</label>
                      <input type="number" formControlName="startYear" placeholder="YYYY" class="form-input" />
                    </div>

                    <div class="form-group">
                      <label>End Year</label>
                      <input type="number" formControlName="endYear" placeholder="YYYY or 'Present'" class="form-input" />
                    </div>

                    <div class="form-group">
                      <label>Description of Duties</label>
                      <textarea formControlName="description" placeholder="Describe your responsibilities" class="form-input"></textarea>
                    </div>

                    <button
                      type="button"
                      (click)="removeExperience(i)"
                      class="btn-secondary"
                      *ngIf="experienceArray.length > 1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <button type="button" (click)="addExperience()" class="btn-secondary">
                + Add Another Position
              </button>
            </div>

            <div class="step-buttons">
              <button matStepperPrevious type="button" class="btn-secondary">Back</button>
              <button matStepperNext type="button" class="btn-primary">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 4: Membership Grade & Division -->
        <mat-step [stepControl]="gradeForm" label="Membership Grade & Division" (click)="calculateAutoGrade()">
          <form [formGroup]="gradeForm">
            <div class="step-content">
              <!-- Auto-suggested grade notification -->
              <div class="grade-suggestion" *ngIf="suggestedGrade && suggestedGrade !== gradeForm.get('chosenGrade')?.value">
                <p class="suggestion-text">
                  <strong>System Suggestion:</strong> Based on your education and experience, 
                  we recommend <span class="suggested-grade">{{ suggestedGrade }}</span> grade.
                  You can choose a different grade if you believe it better fits your qualifications.
                </p>
              </div>

              <div class="form-group">
                <label>Membership Grade</label>
                <select formControlName="chosenGrade" (change)="onGradeChange()" class="form-input">
                  <option value="">Select a Grade</option>
                  <option value="Student">Student Member</option>
                  <option value="Graduate">Graduate Member</option>
                  <option value="Technician">Technician</option>
                  <option value="Technologist">Technologist</option>
                  <option value="Member">Full Member</option>
                  <option value="Fellow">Fellow</option>
                </select>
              </div>

              <div class="grade-info" *ngIf="gradeForm.get('chosenGrade')?.value">
                <p>
                  <strong>Requirements for {{ gradeForm.get('chosenGrade')?.value }}:</strong>
                </p>
                <ul *ngIf="selectedGradeRequirements">
                  <li *ngIf="selectedGradeRequirements.requiresDiploma">Diploma or higher qualification required</li>
                  <li *ngIf="selectedGradeRequirements.requiresTechnicalReport">Technical Project Report required</li>
                  <li>Minimum {{ selectedGradeRequirements.minYearsExperience }} years experience</li>
                  <li>Application Fee: {{ selectedGradeRequirements.baseFee }} USD (≈ {{ calculateZWLAmount(selectedGradeRequirements.baseFee) }} ZWL)</li>
                </ul>
              </div>

              <!-- Fee Breakdown Display for Local Applicants -->
              <div class="fee-breakdown" *ngIf="feeBreakdown">
                <div class="fee-breakdown-header">
                  <h4>💰 Membership Fee Breakdown - {{ feeBreakdown.gradeName }}</h4>
                </div>
                <div class="fee-items">
                  <div class="fee-item" *ngFor="let item of (feeBreakdown.fees | keyvalue)">
                    <span class="fee-label">{{ item.key }}</span>
                    <span class="fee-amount">$ {{ item.value }}</span>
                  </div>
                  <div class="fee-total">
                    <strong>Total Annual Fee:</strong>
                    <strong class="total-amount">$ {{ feeBreakdown.total }} (≈ {{ calculateZWLAmount(feeBreakdown.total) }} ZWL)</strong>
                  </div>
                </div>
                <p class="fee-note">
                  <em>All fees shown in USD with ZWL equivalent at current exchange rate (1 USD = 0.015 ZWL).</em>
                </p>
              </div>

              <div class="form-group">
                <label>Specialist Division</label>
                <select formControlName="chosenSpecialistDivision" class="form-input">
                  <option value="">Select Division</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Electrical">Electrical Engineering</option>
                  <option value="Chemical">Chemical Engineering</option>
                  <option value="Mining">Mining Engineering</option>
                  <option value="Water">Water Resources Engineering</option>
                </select>
              </div>

              <!-- File uploads based on grade -->
              <div class="uploads-section" *ngIf="gradeForm.get('chosenGrade')?.value">
                <h4>Required Documents</h4>

                <div class="upload-group">
                  <label>National ID Copy (PDF)</label>
                  <div class="upload-zone" (click)="triggerFileInput('nationalIdCopy')" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'nationalIdCopy')">
                    <input 
                      id="nationalIdCopyInput"
                      type="file" 
                      accept=".pdf" 
                      (change)="onFileSelected($event, 'nationalIdCopy')" 
                    />
                    <p>Drag and drop or click to upload</p>
                  </div>
                  <div *ngIf="uploadedFileNames.nationalIdCopy" class="file-confirmation">
                    <p class="success-text">✓ File selected: {{ uploadedFileNames.nationalIdCopy }}</p>
                  </div>
                </div>

                <div class="upload-group">
                  <label>Certified Certificates (PDF)</label>
                  <div class="upload-zone" (click)="triggerFileInput('certificates')" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'certificates')">
                    <input 
                      id="certificatesInput"
                      type="file" 
                      accept=".pdf" 
                      multiple 
                      (change)="onFileSelected($event, 'certificates')" 
                    />
                    <p>Drag and drop or click to upload</p>
                  </div>
                  <div *ngIf="uploadedFileNames.certificates && uploadedFileNames.certificates.length > 0" class="file-confirmation">
                    <p class="success-text">✓ {{ uploadedFileNames.certificates.length }} file(s) selected:</p>
                    <ul class="file-list">
                      <li *ngFor="let fileName of uploadedFileNames.certificates">{{ fileName }}</li>
                    </ul>
                  </div>
                </div>

                <div class="upload-group" *ngIf="selectedGradeRequirements?.requiresTechnicalReport">
                  <label>Technical Project Report (PDF)</label>
                  <div class="upload-zone" (click)="triggerFileInput('technicalReport')" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'technicalReport')">
                    <input 
                      id="technicalReportInput"
                      type="file" 
                      accept=".pdf" 
                      (change)="onFileSelected($event, 'technicalReport')" 
                    />
                    <p>Drag and drop or click to upload</p>
                  </div>
                  <div *ngIf="uploadedFileNames.technicalReport" class="file-confirmation">
                    <p class="success-text">✓ File selected: {{ uploadedFileNames.technicalReport }}</p>
                  </div>
                </div>
              </div>

              <div class="terms-confirmation">
                <label>
                  <input type="checkbox" formControlName="agreeTerms" />
                  <span>I certify that the information provided is accurate and complete</span>
                </label>
              </div>
            </div>

            <div class="step-buttons">
              <button matStepperPrevious type="button" class="btn-secondary">Back</button>
              <button matStepperNext type="button" class="btn-primary" [disabled]="!gradeForm.valid">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 5: Referees -->
        <mat-step [stepControl]="refereesForm" label="Referees">
          <form [formGroup]="refereesForm">
            <div class="step-content">
              <p class="info-text">
                Please list three professional referees who can provide appraisals for your application.
                These should be qualified professionals in your field with knowledge of your work.
              </p>

              <div formArrayName="referees">
                <div *ngFor="let referee of refereesArray.controls; let i = index" class="referee-item">
                  <h4>Referee {{ i + 1 }}</h4>
                  <div [formGroupName]="i">
                    <div class="form-group">
                      <label>Referee Name</label>
                      <input
                        type="text"
                        formControlName="name"
                        placeholder="Full name"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label>Referee Email</label>
                      <input
                        type="email"
                        formControlName="email"
                        placeholder="Email address"
                        class="form-input"
                      />
                    </div>

                    <button
                      type="button"
                      (click)="removeReferee(i)"
                      class="btn-secondary"
                      *ngIf="refereesArray.length > 1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <button type="button" (click)="addReferee()" class="btn-secondary" *ngIf="refereesArray.length < 3">
                + Add Referee
              </button>
            </div>

            <div class="step-buttons">
              <button matStepperPrevious type="button" class="btn-secondary">Back</button>
              <button
                matStepperNext
                type="button"
                class="btn-primary"
                [disabled]="!refereesForm.valid || refereesArray.length < 3"
              >
                Review & Submit
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 6: Review & Submit -->
        <mat-step label="Review & Submit">
          <div class="review-content">
            <h3>Application Summary</h3>

            <div class="review-section">
              <h4>Personal Particulars</h4>
              <p><strong>Name:</strong> {{ personalParticularsForm.get('firstName')?.value }} {{ personalParticularsForm.get('lastName')?.value }}</p>
              <p><strong>Email:</strong> {{ personalParticularsForm.get('email')?.value }}</p>
              <p><strong>Phone:</strong> {{ personalParticularsForm.get('phone')?.value }}</p>
            </div>

            <div class="review-section">
              <h4>Membership Grade</h4>
              <p><strong>Grade:</strong> {{ gradeForm.get('chosenGrade')?.value }}</p>
              <p><strong>Specialist Division:</strong> {{ gradeForm.get('chosenSpecialistDivision')?.value }}</p>
              <p><strong>Application Fee:</strong> {{ getBaseFeeForGrade(gradeForm.get('chosenGrade')?.value) }} USD (≈ {{ estimatedFee }} ZWL)</p>
            </div>

            <div class="review-section">
              <h4>Referees</h4>
              <ul>
                <li *ngFor="let referee of refereesArray.controls">
                  {{ referee.get('name')?.value }} ({{ referee.get('email')?.value }})
                </li>
              </ul>
            </div>

            <div class="step-buttons">
              <button matStepperPrevious type="button" class="btn-secondary">Back</button>
              <button (click)="downloadFormAsPDF()" type="button" class="btn-secondary" title="Download a copy of your form with entered data">
                📥 Download Form (PDF)
              </button>
              <button (click)="submitApplication()" type="button" class="btn-primary" [disabled]="isSubmitting || !gradeForm.get('agreeTerms')?.value">
                {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>

            <div class="success-message" *ngIf="successMessage">{{ successMessage }}</div>
            <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 100%;
      width: 100%;
      margin: 20px 0 40px 0;
      padding: 30px;
      position: relative;
    }

    @media (max-width: 768px) {
      .form-container {
        padding: 20px 15px;
        margin: 15px 0 30px 0;
      }

      h1 {
        font-size: 22px;
        margin-bottom: 20px;
      }

      .step-content {
        padding: 15px 0;
      }

      .form-group {
        margin-bottom: 12px;
      }

      label {
        font-size: 13px;
        margin-bottom: 4px;
      }

      .form-input {
        padding: 8px;
        font-size: 13px;
        border: 2.5px solid #004A59 !important;
      }

      .education-item, .experience-item, .referee-item {
        border: 2.5px solid #004A59;
        padding: 12px;
        margin-bottom: 12px;

        h4 {
          font-size: 13px;
        }
      }

      .upload-zone {
        padding: 15px;
        border: 2.5px dashed #004A59;
      }

      .upload-zone p {
        font-size: 12px;
      }

      .btn-add-item {
        padding: 8px 12px;
        font-size: 12px;
      }
    }

    @media (max-width: 480px) {
      .form-container {
        padding: 15px 12px;
        margin: 10px 0 20px 0;
      }

      h1 {
        font-size: 18px;
        margin-bottom: 15px;
      }

      .loading-text {
        font-size: 14px;
        margin-top: 20px;
      }

      .step-content {
        padding: 12px 0;
      }

      .form-group {
        margin-bottom: 10px;
      }

      label {
        font-size: 12px;
        margin-bottom: 3px;
      }

      .form-input {
        padding: 8px;
        font-size: 12px;
        border: 2px solid #004A59 !important;
      }

      textarea.form-input {
        min-height: 80px;
      }

      .education-item, .experience-item, .referee-item {
        border: 2px solid #004A59;
        padding: 10px;
        margin-bottom: 10px;

        h4 {
          font-size: 12px;
          margin: 0 0 8px 0;
        }
      }

      .upload-zone {
        padding: 12px;
        border: 2px dashed #004A59;
      }

      .upload-zone p {
        font-size: 11px;
      }

      .btn-add-item,
      .btn-delete-item {
        padding: 6px 10px;
        font-size: 11px;
      }
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 74, 89, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 9999;
      pointer-events: auto;
    }

    .loader {
      position: relative;
      font-size: 16px;
      width: 5.5em;
      height: 5.5em;
    }

    .loader:before {
      content: '';
      position: absolute;
      transform: translate(-50%, -50%) rotate(45deg);
      height: 100%;
      width: 4px;
      background: #B99532;
      left: 50%;
      top: 50%;
    }

    .loader:after {
      content: '';
      position: absolute;
      left: 0.2em;
      bottom: 0.18em;
      width: 1em;
      height: 1em;
      background-color: #B99532;
      border-radius: 15%;
      animation: rollingRock 2.5s cubic-bezier(.79, 0, .47, .97) infinite;
    }

    @keyframes rollingRock {
      0% {
        transform: translate(0, -1em) rotate(-45deg)
      }

      5% {
        transform: translate(0, -1em) rotate(-50deg)
      }

      20% {
        transform: translate(1em, -2em) rotate(47deg)
      }

      25% {
        transform: translate(1em, -2em) rotate(45deg)
      }

      30% {
        transform: translate(1em, -2em) rotate(40deg)
      }

      45% {
        transform: translate(2em, -3em) rotate(137deg)
      }

      50% {
        transform: translate(2em, -3em) rotate(135deg)
      }

      55% {
        transform: translate(2em, -3em) rotate(130deg)
      }

      70% {
        transform: translate(3em, -4em) rotate(217deg)
      }

      75% {
        transform: translate(3em, -4em) rotate(220deg)
      }

      100% {
        transform: translate(0, -1em) rotate(-225deg)
      }
    }

    .loading-text {
      margin-top: 30px;
      color: #FFFFFF;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    h1 {
      color: #004A59;
      text-align: center;
      margin-bottom: 30px;
      font-weight: 700;
      font-size: 28px;
    }

    .step-content {
      padding: 20px 0;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #004A59;
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 2.5px solid #004A59 !important;
      border-radius: 4px;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: #B99532 !important;
      }
    }

    textarea.form-input {
      min-height: 100px;
      resize: vertical;
    }

    .education-item, .experience-item, .referee-item {
      border: 2.5px solid #004A59;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;

      h4 {
        color: #004A59;
        margin-top: 0;
      }
    }

    .upload-zone {
      border: 2.5px dashed #004A59;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      background-color: #f5f5f5;

      input[type="file"] {
        display: none;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    .file-confirmation {
      margin-top: 12px;
      padding: 12px;
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;
      border-radius: 4px;

      .success-text {
        color: #2e7d32;
        font-weight: 600;
        margin: 0 0 8px 0;
        font-size: 14px;
      }

      .file-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          color: #1b5e20;
          padding: 4px 0 4px 20px;
          position: relative;
          font-size: 13px;

          &:before {
            content: "✓";
            position: absolute;
            left: 0;
            font-weight: bold;
          }
        }
      }
    }

    .grade-info {
      border: 2.5px solid #B99532;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      background-color: #fafaf5;

      p {
        margin: 0 0 10px 0;
        color: #004A59;
        font-weight: 600;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 5px;
        }
      }
    }

    .grade-suggestion {
      border: 2.5px solid #004A59;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      background-color: #f0f7ff;

      .suggestion-text {
        margin: 0;
        color: #004A59;
        font-size: 14px;
        line-height: 1.5;

        .suggested-grade {
          font-weight: 700;
          color: #004A59;
          font-size: 16px;
        }
      }
    }

    .review-content {
      padding: 20px 0;
    }

    .review-section {
      border: 2.5px solid #004A59;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;

      h4 {
        color: #004A59;
        margin-top: 0;
      }

      p {
        margin: 5px 0;
      }

      ul {
        margin: 10px 0;
        padding-left: 20px;
      }
    }

    .terms {
      label {
        display: flex;
        align-items: center;
        font-weight: normal;

        input {
          margin-right: 10px;
        }
      }
    }

    .step-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border-radius: 8px;
      border: 2.5px solid;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-primary {
      background-color: #004A59;
      color: white;
      border-color: #004A59;

      &:hover:not(:disabled) {
        background-color: darken(#004A59, 10%);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background-color: #FFFFFF;
      color: #004A59;
      border-color: #004A59;

      &:hover {
        background-color: #f5f5f5;
      }
    }

    .overlay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #d32f2f;
      padding: 20px 25px;
      background-color: #ffebee;
      border: 2px solid #d32f2f;
      border-radius: 6px;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(211, 47, 47, 0.3);
      animation: slideDown 0.3s ease-out;
    }

    .success-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #388e3c;
      padding: 20px 25px;
      background-color: #e8f5e9;
      border: 2px solid #388e3c;
      border-radius: 6px;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(56, 142, 60, 0.3);
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .verification-section {
      background-color: #e3f2fd;
      border-left: 4px solid #004A59;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }

    .btn-verify {
      background-color: #004A59;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      font-size: 14px;
    }

    .btn-verify:hover {
      background-color: #003039;
      box-shadow: 0 2px 8px rgba(0, 74, 89, 0.3);
    }

    .verification-help {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
      margin-bottom: 0;
      font-style: italic;
    }

    .info-text {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .fee-breakdown {
      background-color: #f5f5f5;
      border: 2px solid #B99532;
      border-radius: 4px;
      padding: 20px;
      margin-top: 25px;
      margin-bottom: 20px;
    }

    .fee-breakdown-header {
      border-bottom: 2px solid #B99532;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }

    .fee-breakdown-header h4 {
      color: #004A59;
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .fee-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fee-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
    }

    .fee-label {
      font-weight: 600;
      color: #004A59;
      flex: 1;
    }

    .fee-amount {
      font-weight: 700;
      color: #B99532;
      min-width: 180px;
      text-align: right;
    }

    .fee-zwl {
      display: block;
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }

    .fee-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      margin-top: 8px;
      border-top: 2px solid #B99532;
      font-size: 14px;
    }

    .total-amount {
      color: #B99532;
      font-size: 16px;
    }

    .total-zwl {
      display: block;
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }

    .fee-note {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      font-style: italic;
      margin-bottom: 0;
    }
  `]
})
export class FormM1Component implements OnInit, OnDestroy {
  personalParticularsForm!: FormGroup;
  educationForm!: FormGroup;
  experienceForm!: FormGroup;
  gradeForm!: FormGroup;
  refereesForm!: FormGroup;
  isSubmitting = false;
  private submissionDialogRef: MatDialogRef<SubmissionSuccessDialog> | null = null;
  errorMessage = '';
  successMessage = '';
  estimatedFee = 0;
  feeBreakdown: any = null;
  selectedGradeRequirements: any = null;
  suggestedGrade: string = '';
  currentUserId: string | null = null;
  
  // File handling properties
  uploadedFiles: {
    nationalIdCopy?: File;
    certificates: File[];
    technicalReport?: File;
  } = {
    certificates: [],
  };
  uploadedFileNames: {
    nationalIdCopy?: string;
    certificates: string[];
    technicalReport?: string;
  } = {
    certificates: [],
  };

  constructor(
    private fb: FormBuilder,
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private docValidationService: DocumentValidationService,
    private formValidationService: FormValidationService,
    private formPersistenceService: FormPersistenceService
  ) {}

  ngOnInit(): void {
    // Verify user is local applicant (not expatriate)
    const currentUser = this.authService.getCurrentUser();
    console.log('📋 M1 Form.ngOnInit - Current user:', currentUser);
    
    if (!currentUser) {
      console.warn('⚠ M1 Form - No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('📋 M1 Form - User applicationType:', currentUser.applicationType);
    
    if (currentUser.applicationType === 'expatriate') {
      console.warn('❌ M1 Form - Expatriate user detected, redirecting to expatriate form');
      this.router.navigate(['/expatriate-form']);
      return;
    }
    
    console.log('✓ M1 Form - User is local applicant, loading form');
    
    this.initializeForms();
    
    // Watch for user data changes - if user becomes expatriate, redirect
    this.authService.currentUser$.subscribe((user: any) => {
      console.log('👁️ M1 Form - User data changed');
      
      // Check if applicationType changed to expatriate (e.g., from server refresh)
      if (user?.applicationType === 'expatriate') {
        console.warn('❌ M1 Form - Applicant type changed to expatriate, redirecting');
        this.router.navigate(['/expatriate-form']);
        return;
      }
      
      const newUserId = user?.id;
      
      // If user changed (different user or user logged out), clear form
      if (this.currentUserId !== newUserId) {
        this.currentUserId = newUserId;
        
        // Clear form controls
        this.clearForms();
        
        // Clear localStorage form data when user changes
        localStorage.removeItem('applicationFormData');
        
        // If a new user logged in, load their saved data (if any)
        if (newUserId) {
          setTimeout(() => {
            this.loadApplicationsAndFormData();
          }, 100);
        }
      }
    });
    
    // Initial load - check for rejected applications
    this.loadApplicationsAndFormData();

    // Watch for nationality changes and update validators
    const nationalityControl = this.personalParticularsForm.get('nationality');
    if (nationalityControl) {
      nationalityControl.valueChanges.subscribe((nationality: string) => {
        if (nationality) {
          this.applyCountrySpecificValidators(nationality);
        }
      });
    }
    
    // Auto-save form data every 5 seconds
    setInterval(() => {
      this.saveFormData();
    }, 5000);
  }

  ngOnDestroy(): void {
    // Close any open dialogs on component destruction
    if (this.submissionDialogRef) {
      this.submissionDialogRef.close();
      this.submissionDialogRef = null;
    }
  }

  /**
   * Load user's applications and populate form if rejection is within 48 hours
   */
  loadApplicationsAndFormData(): void {
    this.applicationService.getApplicationByUser().subscribe({
      next: (applications: any[]) => {
        // Check for rejected applications within 48-hour window
        const rejectedApp = applications.find(app => 
          app.status === 'Rejected' && 
          app.rejectionInfo?.allowEditUntil &&
          new Date(app.rejectionInfo.allowEditUntil) > new Date()
        );

        if (rejectedApp) {
          // Pre-populate form with rejected application data
          this.loadApplicationDataToForm(rejectedApp);
          
          // Show notification about rejection reason and edit window
          const hoursRemaining = Math.floor(
            (new Date(rejectedApp.rejectionInfo.allowEditUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60)
          );
          alert(
            `Your application was rejected.\n\nReason: ${rejectedApp.rejectionInfo.rejectionReason}\n\nYou have ${hoursRemaining} hours remaining to make corrections and resubmit.`
          );
        } else {
          // No rejected app or 48 hours have passed - load from localStorage
          this.loadFormData();
        }
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        // Fallback to localStorage
        this.loadFormData();
      }
    });
  }

  /**
   * Load application data from server into form
   */
  loadApplicationDataToForm(application: any): void {
    try {
      // Personal Particulars
      if (application.personalParticulars) {
        this.personalParticularsForm.patchValue(application.personalParticulars);
        // Apply country-specific validators based on nationality
        const nationality = application.personalParticulars.nationality;
        if (nationality) {
          this.applyCountrySpecificValidators(nationality);
        }
      }

      // Education
      if (application.education && application.education.length > 0) {
        const educationArray = this.educationForm.get('education') as FormArray;
        // Clear existing
        while (educationArray.length > 0) {
          educationArray.removeAt(0);
        }
        // Add education entries
        application.education.forEach((edu: any) => {
          const group = this.createEducationGroup();
          group.patchValue(edu);
          educationArray.push(group);
        });
      }

      // Experience
      if (application.experience && application.experience.length > 0) {
        const experienceArray = this.experienceForm.get('experience') as FormArray;
        // Clear existing
        while (experienceArray.length > 0) {
          experienceArray.removeAt(0);
        }
        // Add experience entries
        application.experience.forEach((exp: any) => {
          const group = this.createExperienceGroup();
          group.patchValue(exp);
          experienceArray.push(group);
        });
      }

      // Grade
      if (application.chosenGrade) {
        this.gradeForm.patchValue({
          grade: application.chosenGrade,
          specialistDivision: application.chosenSpecialistDivision
        });
        this.onGradeChange();
      }

      // Referees
        if (application.sponsors && application.sponsors.length > 0) {
        const refereesArray = this.refereesForm.get('referees') as FormArray;
        // Clear existing
        while (refereesArray.length > 0) {
          refereesArray.removeAt(0);
        }
        // Add referee entries
        application.sponsors.forEach((sponsor: any) => {
          const group = this.createRefereeGroup();
          group.patchValue({
            name: sponsor.sponsorName,
            email: sponsor.sponsorEmail
          });
          refereesArray.push(group);
        });
      }

      console.log('Application data loaded from rejected submission');
    } catch (error) {
      console.error('Error loading application data to form:', error);
    }
  }

  /**
   * Save form data to localStorage
   */
  saveFormData(): void {
    if (this.personalParticularsForm && this.educationForm && this.experienceForm) {
      const formData = {
        personalParticulars: this.personalParticularsForm.value,
        education: this.educationForm.value,
        experience: this.experienceForm.value,
        grade: this.gradeForm?.value,
        sponsors: this.refereesForm?.value,
      };
      // Save to localStorage using persistence service
      this.formPersistenceService.saveFormData('m1-form', formData);
      // Also save to local storage for backward compatibility
      localStorage.setItem('applicationFormData', JSON.stringify(formData));
      console.log('✅ Form data saved to persistence service');
    }
  }

  /**
   * Load form data from localStorage
   */
  loadFormData(): void {
    const savedData = localStorage.getItem('applicationFormData');
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);
        if (formData.personalParticulars) {
          this.personalParticularsForm.patchValue(formData.personalParticulars);
          // Apply country-specific validators when personal particulars are loaded
          const nationality = formData.personalParticulars.nationality;
          if (nationality) {
            this.applyCountrySpecificValidators(nationality);
          }
        }
        if (formData.education && formData.education.education) {
          const educationArray = this.educationForm.get('education') as FormArray;
          formData.education.education.forEach((edu: any, index: number) => {
            if (index > 0) {
              educationArray.push(this.createEducationGroup());
            }
            educationArray.at(index).patchValue(edu);
          });
        }
        if (formData.experience && formData.experience.experience) {
          const experienceArray = this.experienceForm.get('experience') as FormArray;
          formData.experience.experience.forEach((exp: any, index: number) => {
            if (index > 0) {
              experienceArray.push(this.createExperienceGroup());
            }
            experienceArray.at(index).patchValue(exp);
          });
        }
        if (formData.grade) {
          this.gradeForm.patchValue(formData.grade);
          this.onGradeChange();
        }
        if (formData.sponsors && formData.sponsors.sponsors) {
          const refereesArray = this.refereesForm.get('referees') as FormArray;
          formData.sponsors.sponsors.forEach((sponsor: any, index: number) => {
            if (index < refereesArray.length) {
              refereesArray.at(index).patchValue(sponsor);
            }
          });
        }
        console.log('Form data loaded from localStorage');
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    }
  }

  /**
   * Clear saved form data
   */
  clearSavedFormData(): void {
    localStorage.removeItem('applicationFormData');
    console.log('Saved form data cleared');
  }

  /**
   * Clear all form fields by resetting controls
   */
  clearForms(): void {
    if (this.personalParticularsForm) {
      this.personalParticularsForm.reset();
    }
    if (this.educationForm) {
      this.educationForm.reset();
      // Keep at least one education entry
      const educationArray = this.educationForm.get('education') as FormArray;
      if (educationArray.length === 0) {
        educationArray.push(this.createEducationGroup());
      } else {
        educationArray.at(0).reset();
      }
    }
    if (this.experienceForm) {
      this.experienceForm.reset();
      // Keep at least one experience entry
      const experienceArray = this.experienceForm.get('experience') as FormArray;
      if (experienceArray.length === 0) {
        experienceArray.push(this.createExperienceGroup());
      } else {
        experienceArray.at(0).reset();
      }
    }
    if (this.gradeForm) {
      this.gradeForm.reset();
      this.selectedGradeRequirements = null;
      this.estimatedFee = 0;
    }
    if (this.refereesForm) {
      const refereesArray = this.refereesForm.get('referees') as FormArray;
      for (let i = 0; i < refereesArray.length; i++) {
        refereesArray.at(i).reset();
      }
    }
    this.uploadedFiles = { certificates: [] };
    this.uploadedFileNames = { certificates: [] };
    
    // Clear form data from persistence service
    this.formPersistenceService.clearFormData('m1-form');
    localStorage.removeItem('applicationFormData');
    
    console.log('✅ All form fields cleared and persistence data removed');
  }

  /**
   * Download form as PDF with all entered data
   */
  async downloadFormAsPDF(): Promise<void> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 15;
      const lineHeight = 8;
      const sectionGap = 10;

      // Helper function to add text with word wrapping
      const addWrappedText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * lineHeight + 2;
      };

      // Helper function to check if we need a new page
      const checkNewPage = () => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Title
      addWrappedText('ZIE MEMBERSHIP APPLICATION FORM - M1', 14, true);
      yPosition += sectionGap;

      // Personal Particulars Section
      addWrappedText('PERSONAL PARTICULARS', 12, true);
      const pp = this.personalParticularsForm.value;
      addWrappedText(`First Name: ${pp.firstName}`);
      addWrappedText(`Last Name: ${pp.lastName}`);
      addWrappedText(`Email: ${pp.email}`);
      addWrappedText(`Phone: ${pp.phone}`);
      addWrappedText(`National ID: ${pp.nationalId}`);
      addWrappedText(`Date of Birth: ${pp.dateOfBirth}`);
      addWrappedText(`Nationality: ${pp.nationality}`);
      if (pp.professionalNumber) {
        addWrappedText(`Professional Number: ${pp.professionalNumber}`);
      }
      yPosition += sectionGap;
      checkNewPage();

      // Education Section
      addWrappedText('EDUCATION', 12, true);
      const educationData = this.educationForm.get('education')?.value || [];
      educationData.forEach((edu: any, index: number) => {
        addWrappedText(`Education ${index + 1}:`, 11, true);
        addWrappedText(`  Institution: ${edu.institution}`);
        addWrappedText(`  Qualification: ${edu.qualification}`);
        addWrappedText(`  Year: ${edu.year}`);
        if (edu.major) addWrappedText(`  Major: ${edu.major}`);
      });
      yPosition += sectionGap;
      checkNewPage();

      // Experience Section
      addWrappedText('EXPERIENCE', 12, true);
      const experienceData = this.experienceForm.get('experience')?.value || [];
      experienceData.forEach((exp: any, index: number) => {
        addWrappedText(`Experience ${index + 1}:`, 11, true);
        addWrappedText(`  Company: ${exp.company}`);
        addWrappedText(`  Position: ${exp.position}`);
        addWrappedText(`  Start Year: ${exp.startYear}`);
        addWrappedText(`  End Year: ${exp.endYear}`);
        addWrappedText(`  Description: ${exp.description}`);
      });
      yPosition += sectionGap;
      checkNewPage();

      // Membership Grade Section
      addWrappedText('MEMBERSHIP GRADE', 12, true);
      const grade = this.gradeForm.value;
      const baseFee = this.getBaseFeeForGrade(grade.chosenGrade);
      addWrappedText(`Grade: ${grade.chosenGrade}`);
      addWrappedText(`Specialist Division: ${grade.chosenSpecialistDivision}`);
      addWrappedText(`Application Fee: ${baseFee} USD (≈ ${this.estimatedFee} ZWL)`);
      yPosition += sectionGap;
      checkNewPage();

      // Referees Section
      addWrappedText('REFEREES', 12, true);
      const referees = this.refereesForm.get('referees')?.value || [];
      referees.forEach((referee: any, index: number) => {
        addWrappedText(`Referee ${index + 1}:`, 11, true);
        addWrappedText(`  Name: ${referee.name}`);
        addWrappedText(`  Email: ${referee.email}`);
      });
      yPosition += sectionGap;
      checkNewPage();

      // Uploaded Files Section
      addWrappedText('UPLOADED DOCUMENTS', 12, true);
      if (this.uploadedFiles.nationalIdCopy) {
        addWrappedText(`✓ National ID Copy: ${this.uploadedFiles.nationalIdCopy.name}`);
      } else {
        addWrappedText(`✗ National ID Copy: Not uploaded`);
      }
      
      if (this.uploadedFiles.certificates && this.uploadedFiles.certificates.length > 0) {
        addWrappedText(`✓ Certificates: ${this.uploadedFiles.certificates.length} file(s)`);
        this.uploadedFiles.certificates.forEach((cert, index) => {
          addWrappedText(`  ${index + 1}. ${cert.name}`);
        });
      } else {
        addWrappedText(`✗ Certificates: Not uploaded`);
      }

      if (this.uploadedFiles.technicalReport) {
        addWrappedText(`✓ Technical Report: ${this.uploadedFiles.technicalReport.name}`);
      } else {
        addWrappedText(`✗ Technical Report: Not uploaded`);
      }

      // Footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on: ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 10
      );

      // Save the PDF
      const fileName = `ZIE_Application_${pp.firstName}_${pp.lastName}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      console.log('PDF downloaded successfully:', fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }

  initializeForms(): void {
    this.personalParticularsForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      nationalId: ['', [Validators.required, CustomValidators.nationalId]],
      dateOfBirth: ['', Validators.required],
      nationality: ['', Validators.required],
      professionalNumber: [''],
    });

    this.educationForm = this.fb.group({
      education: this.fb.array([this.createEducationGroup()]),
    });

    this.experienceForm = this.fb.group({
      experience: this.fb.array([this.createExperienceGroup()]),
    });

    this.gradeForm = this.fb.group({
      chosenGrade: ['', Validators.required],
      chosenSpecialistDivision: ['', Validators.required],
      agreeTerms: [false, Validators.requiredTrue],
    });

    this.refereesForm = this.fb.group({
      referees: this.fb.array([this.createRefereeGroup(), this.createRefereeGroup(), this.createRefereeGroup()]),
    });

    // Restore saved form data from persistence service
    this.restoreSavedFormData();
  }

  /**
   * Restore previously saved form data from FormPersistenceService
   */
  private restoreSavedFormData(): void {
    try {
      const savedFormData = this.formPersistenceService.getFormData('m1-form');
      
      if (savedFormData && Object.keys(savedFormData).length > 0) {
        console.log('📋 Restoring saved M1 form data:', savedFormData);
        
        // Restore personal particulars
        if (savedFormData['personalParticulars']) {
          this.personalParticularsForm.patchValue(savedFormData['personalParticulars']);
        }
        
        // Restore education
        if (savedFormData['education'] && Array.isArray(savedFormData['education'])) {
          const educationArray = this.educationArray;
          // Remove default education entry
          while (educationArray.length > 0) {
            educationArray.removeAt(0);
          }
          // Add saved education entries
          savedFormData['education'].forEach((edu: any) => {
            const group = this.createEducationGroup();
            group.patchValue(edu);
            educationArray.push(group);
          });
        }
        
        // Restore experience
        if (savedFormData['experience'] && Array.isArray(savedFormData['experience'])) {
          const experienceArray = this.experienceArray;
          // Remove default experience entries
          while (experienceArray.length > 0) {
            experienceArray.removeAt(0);
          }
          // Add saved experience entries
          savedFormData['experience'].forEach((exp: any) => {
            const group = this.createExperienceGroup();
            group.patchValue(exp);
            experienceArray.push(group);
          });
        }
        
        // Restore grade
        if (savedFormData['grade']) {
          this.gradeForm.patchValue(savedFormData['grade']);
        }
        
        // Restore referees
        if (savedFormData['referees'] && Array.isArray(savedFormData['referees'])) {
          const refereesArray = this.refereesArray;
          // Update existing referee entries
          savedFormData['referees'].forEach((ref: any, index: number) => {
            if (index < refereesArray.length) {
              refereesArray.at(index).patchValue(ref);
            }
          });
        }
        
        // Restore uploaded files references
        if (savedFormData['uploadedFileNames']) {
          this.uploadedFileNames = savedFormData['uploadedFileNames'];
        }
        
        console.log('✅ M1 form data restored successfully');
      }
    } catch (error) {
      console.warn('⚠️ Could not restore saved M1 form data:', error);
      // Continue with empty form if restoration fails
    }
  }

  /**
   * Apply country-specific validators to phone and national ID fields
   * This ensures validation rules match the user's country format requirements
   */
  applyCountrySpecificValidators(country: string): void {
    if (!country) return;

    const phoneControl = this.personalParticularsForm.get('phone');
    const nationalIdControl = this.personalParticularsForm.get('nationalId');

    if (phoneControl) {
      // Update phone validator based on country
      phoneControl.clearAsyncValidators();
      phoneControl.setValidators([
        Validators.required,
        (control) => {
          const result = this.docValidationService.validatePhoneNumber(control.value, country);
          if (!result.valid) {
            return { invalidPhone: result.error };
          }
          return null;
        }
      ]);
      phoneControl.updateValueAndValidity();
    }

    if (nationalIdControl) {
      // Update national ID validator based on country
      nationalIdControl.clearAsyncValidators();
      nationalIdControl.setValidators([
        Validators.required,
        (control) => {
          const result = this.docValidationService.validateNationalId(control.value, country);
          if (!result.valid) {
            return { invalidNationalId: result.error };
          }
          return null;
        }
      ]);
      nationalIdControl.updateValueAndValidity();
    }
  }

  createEducationGroup(): FormGroup {
    return this.fb.group({
      institution: ['', Validators.required],
      qualification: ['', Validators.required],
      year: ['', Validators.required],
      major: [''],
    });
  }

  createExperienceGroup(): FormGroup {
    return this.fb.group({
      company: ['', Validators.required],
      position: ['', Validators.required],
      startYear: ['', Validators.required],
      endYear: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  createRefereeGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get educationArray(): FormArray {
    return this.educationForm.get('education') as FormArray;
  }

  get experienceArray(): FormArray {
    return this.experienceForm.get('experience') as FormArray;
  }

  get refereesArray(): FormArray {
    return this.refereesForm.get('referees') as FormArray;
  }

  addEducation(): void {
    this.educationArray.push(this.createEducationGroup());
  }

  removeEducation(index: number): void {
    this.educationArray.removeAt(index);
  }

  addExperience(): void {
    this.experienceArray.push(this.createExperienceGroup());
  }

  removeExperience(index: number): void {
    this.experienceArray.removeAt(index);
  }

  addReferee(): void {
    if (this.refereesArray.length < 3) {
      this.refereesArray.push(this.createRefereeGroup());
    }
  }

  removeReferee(index: number): void {
    this.refereesArray.removeAt(index);
  }

  onGradeChange(): void {
    const grade = this.gradeForm.get('chosenGrade')?.value;
    const baseFeeUSD = this.getFeByGrade(grade);
    // Calculate ZWL equivalent using the same exchange rate as backend (0.015)
    const exchangeRate = 0.015;
    this.estimatedFee = Math.round(baseFeeUSD / exchangeRate);
    this.selectedGradeRequirements = this.getGradeRequirements(grade);
    
    // Fetch detailed fee breakdown for local applicants
    this.feeBreakdown = getFeeBreakdown(grade, 'local');
  }

  openVerificationModal(): void {
    const personalParticulars = this.personalParticularsForm.value;
    const yearsOfExperience = this.experienceForm.get('experience')?.value?.[0]?.yearsOfExperience;

    this.dialog.open(DynamicValidationModalComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: '🇿🇼 Zimbabwean Citizen Verification',
        country: 'Zimbabwe',
        yearsOfExperience: yearsOfExperience
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        console.log('✓ Verification successful:', result);
        
        // Update Personal Particulars
        this.personalParticularsForm.patchValue({
          nationalId: result.idNumber
        });
        
        // Update Experience - update the first entry
        const experienceArray = this.experienceForm.get('experience') as FormArray;
        if (experienceArray.length > 0) {
          experienceArray.at(0).patchValue({
            yearsOfExperience: result.yearsOfExperience
          });
        }

        // Show success message
        this.dialog.open(M1VerificationSuccessDialog, {
          width: '400px',
          disableClose: false,
          data: {
            yearsOfExperience: result.yearsOfExperience
          }
        });
      }
    });
  }

  /**
   * Calculate auto-grade based on education level and years of experience
   * This is called when the user navigates to the Membership Grade step
   */
  calculateAutoGrade(): void {
    const educationArray = this.educationForm.get('education') as FormArray;
    const experienceArray = this.experienceForm.get('experience') as FormArray;

    if (educationArray.length === 0 || experienceArray.length === 0) {
      return;
    }

    // Get highest education level
    const qualifications = educationArray.controls.map(edu => edu.get('qualification')?.value || '');
    const highestQualification = this.getHighestEducationLevel(qualifications);

    // Calculate years of experience
    const yearsOfExperience = this.calculateYearsOfExperience();

    // Determine grade based on education and experience (ZIE/ECZ guidelines)
    let grade = 'Student';

    if (highestQualification.includes('Honours') && yearsOfExperience >= 3) {
      grade = 'Member';
    } else if (highestQualification.includes('Diploma') && yearsOfExperience >= 3) {
      grade = 'Technician';
    } else if (highestQualification.includes('Degree') && yearsOfExperience >= 5) {
      grade = 'Technologist';
    } else if (yearsOfExperience >= 10) {
      grade = 'Fellow';
    } else if (yearsOfExperience >= 2) {
      grade = 'Graduate';
    } else if (highestQualification.includes('Degree') || highestQualification.includes('Diploma')) {
      grade = 'Graduate';
    }

    // Store suggested grade and auto-select if not already set
    this.suggestedGrade = grade;
    
    if (!this.gradeForm.get('chosenGrade')?.value) {
      this.gradeForm.patchValue({ chosenGrade: grade });
      this.onGradeChange();
    }

    console.log(`Auto-calculated grade: ${grade} (Education: ${highestQualification}, Experience: ${yearsOfExperience} years)`);
  }

  /**
   * Get the highest education level from qualifications
   */
  private getHighestEducationLevel(qualifications: string[]): string {
    const levels = {
      'Honours': 4,
      'Degree': 3,
      'Diploma': 2,
      'Certificate': 1,
    };

    let highest = 'Certificate';
    let highestScore = 0;

    qualifications.forEach(qual => {
      Object.entries(levels).forEach(([level, score]) => {
        if (qual.toLowerCase().includes(level.toLowerCase()) && score > highestScore) {
          highest = level;
          highestScore = score;
        }
      });
    });

    return highest;
  }

  /**
   * Calculate total years of experience
   */
  private calculateYearsOfExperience(): number {
    const experienceArray = this.experienceForm.get('experience') as FormArray;
    let totalYears = 0;

    experienceArray.controls.forEach(exp => {
      const startYear = parseInt(exp.get('startYear')?.value || '0', 10);
      const endYearStr = exp.get('endYear')?.value || new Date().getFullYear().toString();
      const endYear = endYearStr.toLowerCase() === 'present' ? new Date().getFullYear() : parseInt(endYearStr, 10);

      if (startYear > 0 && endYear >= startYear) {
        totalYears += endYear - startYear;
      }
    });

    return totalYears;
  }

  getFeByGrade(grade: string): number {
    const fees: { [key: string]: number } = {
      'Student': 45,
      'Graduate': 50,
      'Technician': 45,
      'Technologist': 50,
      'Member': 60,
      'Fellow': 60,
    };
    return fees[grade] || 45;
  }

  getGradeRequirements(grade: string): any {
    const requirements: { [key: string]: any } = {
      'Student': { minYearsExperience: 0, requiresDiploma: false, requiresTechnicalReport: false, baseFee: 45 },
      'Graduate': { minYearsExperience: 0, requiresDiploma: false, requiresTechnicalReport: false, baseFee: 50 },
      'Technician': { minYearsExperience: 3, requiresDiploma: true, requiresTechnicalReport: false, baseFee: 45 },
      'Technologist': { minYearsExperience: 3, requiresDiploma: true, requiresTechnicalReport: false, baseFee: 50 },
      'Member': { minYearsExperience: 5, requiresDiploma: false, requiresTechnicalReport: true, baseFee: 60 },
      'Fellow': { minYearsExperience: 10, requiresDiploma: false, requiresTechnicalReport: true, baseFee: 60 },
    };
    return requirements[grade];
  }

  /**
   * Get the base fee (in USD) for a given grade
   */
  getBaseFeeForGrade(grade: string): number {
    return this.getFeByGrade(grade);
  }

  /**
   * Calculate ZWL equivalent of USD amount using the default exchange rate
   */
  calculateZWLAmount(usdAmount: number): string {
    const exchangeRate = 0.015; // 1 USD = ~66.67 ZWL (1/0.015)
    const zwlAmount = Math.round(usdAmount / exchangeRate);
    return zwlAmount.toLocaleString();
  }

  onFileSelected(event: any, fieldName: string): void {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }

    // Validate PDF files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (file.type !== 'application/pdf') {
        this.errorMessage = `${file.name} is not a PDF file. Please upload PDF files only.`;
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = `${file.name} is larger than 5MB. Please upload smaller files.`;
        return;
      }
    }

    // Store files based on field name
    if (fieldName === 'nationalIdCopy') {
      this.uploadedFiles.nationalIdCopy = files[0];
      this.uploadedFileNames.nationalIdCopy = files[0].name;
    } else if (fieldName === 'certificates') {
      this.uploadedFiles.certificates = Array.from(files);
      this.uploadedFileNames.certificates = Array.from(files).map(f => (f as File).name);
    } else if (fieldName === 'technicalReport') {
      this.uploadedFiles.technicalReport = files[0];
      this.uploadedFileNames.technicalReport = files[0].name;
    }

    this.errorMessage = '';
  }

  /**
   * Trigger the hidden file input when clicking the upload zone
   */
  triggerFileInput(fieldName: string): void {
    let elementId = '';
    if (fieldName === 'nationalIdCopy') {
      elementId = 'nationalIdCopyInput';
    } else if (fieldName === 'certificates') {
      elementId = 'certificatesInput';
    } else if (fieldName === 'technicalReport') {
      elementId = 'technicalReportInput';
    }
    
    if (elementId) {
      const inputElement = document.getElementById(elementId) as HTMLInputElement;
      if (inputElement) {
        inputElement.click();
      }
    }
  }

  /**
   * Handle drag over event for file upload
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle drop event for file upload
   */
  onDrop(event: DragEvent, fieldName: string): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Create a synthetic event to reuse onFileSelected logic
      const mockEvent = {
        target: {
          files: files,
        },
      };
      this.onFileSelected(mockEvent, fieldName);
    }
  }

  submitApplication(): void {
    // Validate all forms
    const validationResult = this.formValidationService.validateForms({
      'Personal Particulars': this.personalParticularsForm,
      'Grade & Division': this.gradeForm,
      'Referees': this.refereesForm,
    });

    // Check for missing files
    const missingFiles: string[] = [];
    if (!this.uploadedFiles.nationalIdCopy) {
      missingFiles.push('National ID Copy (PDF)');
    }
    if (!this.uploadedFiles.certificates || this.uploadedFiles.certificates.length === 0) {
      missingFiles.push('At least one Certificate (PDF)');
    }
    if (this.selectedGradeRequirements?.requiresTechnicalReport && !this.uploadedFiles.technicalReport) {
      missingFiles.push('Technical Project Report (PDF)');
    }

    // Add file errors to validation result
    if (missingFiles.length > 0) {
      missingFiles.forEach(file => {
        validationResult.missingFields.push({
          fieldName: file.toLowerCase().replace(/\s+/g, ''),
          displayName: file,
          errors: ['This file is required'],
          step: 'Required Documents',
        });
      });
      validationResult.isValid = false;
    }

    // Show error dialog if validation fails
    if (!validationResult.isValid) {
      this.dialog.open(M1ValidationErrorDialog, {
        width: '600px',
        maxWidth: '90vw',
        disableClose: false,
        panelClass: 'centered-dialog',
        data: {
          errorFields: validationResult.missingFields,
          summary: validationResult.summary,
        },
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const applicationData = {
      personalParticulars: this.personalParticularsForm.value,
      education: this.educationForm.get('education')?.value,
      experience: this.experienceForm.get('experience')?.value,
      chosenGrade: this.gradeForm.get('chosenGrade')?.value,
      chosenSpecialistDivision: this.gradeForm.get('chosenSpecialistDivision')?.value,
      referees: this.refereesForm.get('referees')?.value,
    };

    console.log('=== Submitting Application ===');
    console.log('Personal Particulars:', applicationData.personalParticulars);
    console.log('Chosen Grade:', applicationData.chosenGrade);
    console.log('Chosen Specialist Division:', applicationData.chosenSpecialistDivision);

    // Create FormData for file upload
    const formData = new FormData();
    
    // Add individual form fields to FormData (multer processes files, fields are passed separately)
    formData.append('personalParticulars', JSON.stringify(applicationData.personalParticulars));
    formData.append('education', JSON.stringify(applicationData.education));
    formData.append('experience', JSON.stringify(applicationData.experience));
    formData.append('chosenGrade', applicationData.chosenGrade);
    formData.append('chosenSpecialistDivision', applicationData.chosenSpecialistDivision);
    formData.append('referees', JSON.stringify(applicationData.referees));
    
    // Add files
    if (this.uploadedFiles.nationalIdCopy) {
      formData.append('nationalIdCopy', this.uploadedFiles.nationalIdCopy);
    }
    
    if (this.uploadedFiles.certificates && this.uploadedFiles.certificates.length > 0) {
      this.uploadedFiles.certificates.forEach(cert => {
        formData.append('certificateFiles', cert);
      });
    }
    
    if (this.uploadedFiles.technicalReport) {
      formData.append('technicalReport', this.uploadedFiles.technicalReport);
    }

    this.applicationService.submitApplicationWithFiles(formData).subscribe({
      next: (response) => {
        console.log('✅ Application submitted successfully');
        this.successMessage =
          'Application submitted successfully! Redirecting to payment page...';
        
        // Clear saved form data on successful submission
        this.clearSavedFormData();
        
        // Hide loading spinner immediately - dialog will handle navigation
        this.isSubmitting = false;
        
        // Close any existing dialog
        if (this.submissionDialogRef) {
          this.submissionDialogRef.close();
        }

        // Show centered, self-dismissing notification
        this.submissionDialogRef = this.dialog.open(SubmissionSuccessDialog, {
          width: '100%',
          maxWidth: '500px',
          disableClose: true,
          backdropClass: 'centered-dialog-backdrop',
          panelClass: 'centered-dialog-panel',
          data: { 
            applicationId: response.application?.id || response._id || response.id,
            emailStatus: response.emailStatus
          }
        });
        
        // Log email status for debugging
        console.log('📧 Email Send Status:', response.emailStatus);
        
        // Dialog will handle its own navigation and auto-close
      },
      error: (error) => {
        // Allow retry on error - user can attempt submission again
        this.isSubmitting = false;
        // Extract error message with fallback
        let errorMsg = 'Failed to submit application. Please try again.';
        
        if (error?.error?.message) {
          errorMsg = error.error.message;
        } else if (error?.error?.error) {
          errorMsg = error.error.error;
        } else if (error?.message) {
          errorMsg = error.message;
        }
        
        console.error('❌ Submission error:', errorMsg);
        console.error('Full error object:', error);
        this.errorMessage = errorMsg;
      },
    });
  }
}

// Success Dialog Component
@Component({
  selector: 'app-submission-success-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-notification-overlay" *ngIf="isVisible">
      <div class="success-notification-center">
        <button class="notification-close-btn" (click)="onClose()" aria-label="Close notification">✕</button>
        <div class="notification-content">
          <div class="success-icon">✓</div>
          <h2>Application Submitted Successfully!</h2>
          
          <div class="success-details">
            <p class="message">
              Your membership application has been submitted and is now under review.
            </p>
            <p class="submessage">
              You will receive confirmation emails at your registered email address.
            </p>
            <div class="info-box">
              <p><strong>Application ID:</strong></p>
              <p class="app-id">{{ data?.applicationId }}</p>
              <p style="margin-top: 10px;"><strong>Sponsor Appraisals Sent:</strong></p>
              <p>{{ data?.emailStatus?.totalSent || 0 }}/3 ✓
                <span *ngIf="data?.emailStatus?.totalFailed > 0" style="color: #ff6b6b;"> ({{ data?.emailStatus?.totalFailed }} failed)</span>
              </p>
            </div>
            <p class="next-steps">
              Redirecting to payment in <strong>{{ countdownSeconds }}s</strong>...
            </p>
          </div>
          
          <div class="notification-footer">
            <button (click)="onClose()" class="btn-proceed">Proceed to Payment</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-notification-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.4s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .success-notification-center {
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      padding: 40px 30px 30px 30px;
      animation: slideDown 0.4s ease-out;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .notification-close-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      padding: 5px 10px;
      transition: color 0.2s;
    }

    .notification-close-btn:hover {
      color: #d32f2f;
    }

    .notification-content {
      text-align: center;
    }

    .success-icon {
      font-size: 48px;
      color: #4caf50;
      font-weight: bold;
      margin-bottom: 15px;
      display: block;
    }

    h2 {
      color: #004A59;
      margin: 0 0 20px 0;
      font-size: 22px;
      font-weight: 700;
    }

    .success-details {
      text-align: left;
      margin-bottom: 25px;
    }

    .message {
      color: #333;
      font-size: 15px;
      margin: 12px 0;
      line-height: 1.6;
    }

    .submessage {
      color: #666;
      font-size: 13px;
      margin: 10px 0;
    }

    .info-box {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #004A59;
    }

    .info-box p {
      margin: 8px 0;
      color: #004A59;
      font-size: 13px;
    }

    .app-id {
      background: white;
      padding: 8px;
      border-radius: 4px;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }

    .next-steps {
      color: #666;
      font-size: 13px;
      margin: 15px 0;
      font-weight: 500;
    }

    .notification-footer {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .btn-proceed {
      background-color: #004A59;
      color: white;
      padding: 12px 32px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      flex: 1;
      max-width: 200px;
    }

    .btn-proceed:hover {
      background-color: #003039;
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.3);
    }

    @media (max-width: 600px) {
      .success-notification-center {
        width: 95%;
        padding: 35px 20px 20px 20px;
      }

      h2 {
        font-size: 18px;
      }

      .success-icon {
        font-size: 40px;
      }

      .message {
        font-size: 14px;
      }
    }
  `]
})
export class SubmissionSuccessDialog implements OnInit, OnDestroy {
  isVisible = true;
  countdownSeconds = 5;
  private countdownInterval: any;
  private dismissTimeout: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private router: Router, private dialogRef: MatDialogRef<SubmissionSuccessDialog>) {}

  ngOnInit(): void {
    this.startAutoClose();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.isVisible = false;
  }

  private startAutoClose(): void {
    // Countdown timer
    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.dismiss();
      }
    }, 1000);

    // Auto-dismiss after 5 seconds
    this.dismissTimeout = setTimeout(() => {
      this.dismiss();
    }, 5000);
  }

  private clearTimers(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
    }
  }

  onClose(): void {
    this.dismiss();
  }

  private dismiss(): void {
    this.clearTimers();
    this.isVisible = false;
    // Close dialog and navigate
    this.dialogRef.close();
    this.router.navigate(['/payment']);
  }
}

@Component({
  selector: 'app-m1-validation-error-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-dialog-content">
      <div class="error-header">
        <div class="error-icon">⚠️</div>
        <h2>Please Complete All Required Fields</h2>
      </div>

      <div class="error-body">
        <div class="error-item" *ngFor="let field of data.errorFields">
          <div class="field-name">
            <span class="step-badge" *ngIf="field.step">{{ field.step }}</span>
            <strong>{{ field.displayName }}</strong>
          </div>
          <ul class="error-messages">
            <li *ngFor="let error of field.errors">{{ error }}</li>
          </ul>
        </div>
      </div>

      <div class="error-footer">
        <p class="total-errors">{{ data.errorFields.length }} field(s) need attention</p>
        <button (click)="onClose()" class="close-btn">
          Got it, let me fix these
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-dialog-content {
      padding: 20px;
      color: #333;
    }

    .error-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ff9800;
    }

    .error-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .error-header h2 {
      color: #d32f2f;
      margin: 0;
      font-size: 20px;
    }

    .error-body {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .error-item {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 4px;
    }

    .field-name {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .step-badge {
      background-color: #004A59;
      color: white;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 600;
    }

    .field-name strong {
      color: #004A59;
      font-size: 14px;
    }

    .error-messages {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 13px;
      color: #d32f2f;
    }

    .error-messages li {
      padding: 4px 0;
      margin-left: 20px;
      position: relative;
    }

    .error-messages li:before {
      content: '•';
      position: absolute;
      left: -15px;
    }

    .error-footer {
      border-top: 1px solid #ddd;
      padding-top: 15px;
      text-align: center;
    }

    .total-errors {
      font-size: 13px;
      color: #666;
      margin: 0 0 12px 0;
      font-weight: 500;
    }

    .close-btn {
      background-color: #004A59;
      color: white;
      padding: 10px 30px;
      border-radius: 4px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background-color: #003039;
    }
  `]
})
export class M1ValidationErrorDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onClose(): void {
    // Dialog will close when button is clicked
  }
}

@Component({
  selector: 'app-m1-verification-success-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-dialog">
      <div class="success-icon">✓</div>
      <h2>Identity Verified Successfully</h2>
      <div class="verification-details">
        <div class="detail-row">
          <span class="label">Country:</span>
          <span class="value">Zimbabwe</span>
        </div>
        <div class="detail-row">
          <span class="label">Years of Experience:</span>
          <span class="value">{{ data.yearsOfExperience }} years</span>
        </div>
      </div>
      <p class="message">
        Your information has been verified and automatically filled in your form.
      </p>
      <button (click)="onClose()" class="close-btn">Continue</button>
    </div>
  `,
  styles: [`
    .success-dialog {
      text-align: center;
      padding: 30px;
    }

    .success-icon {
      font-size: 48px;
      color: #388e3c;
      margin-bottom: 15px;
      font-weight: bold;
    }

    h2 {
      color: #004A59;
      margin-bottom: 20px;
      font-size: 20px;
    }

    .verification-details {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: left;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #004A59;
      flex: 1;
    }

    .value {
      color: #388e3c;
      font-weight: 600;
      flex: 1;
      text-align: right;
    }

    .message {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      margin: 15px 0;
    }

    .close-btn {
      background-color: #004A59;
      color: white;
      padding: 10px 30px;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background-color: #003039;
    }
  `]
})
export class M1VerificationSuccessDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onClose(): void {
    // Dialog will close when button is clicked
  }
}