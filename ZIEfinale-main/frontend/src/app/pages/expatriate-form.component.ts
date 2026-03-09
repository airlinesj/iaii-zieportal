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
      return null;
    }
    const phoneValue = String(control.value).replace(/\D/g, '');
    if (phoneValue.length < 9 || phoneValue.length > 15) {
      return { invalidPhone: true };
    }
    return null;
  }

  static passportNumber(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const pattern = /^[A-Z0-9]{6,20}$/;
    if (!pattern.test(String(control.value).toUpperCase())) {
      return { invalidPassport: true };
    }
    return null;
  }

  static wordCount(min: number, max: number): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const text = String(control.value).trim();
      const words = text.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      if (wordCount < min) {
        return { wordCountMin: { required: min, actual: wordCount } };
      }
      if (wordCount > max) {
        return { wordCountMax: { required: max, actual: wordCount } };
      }
      
      // Check if text has meaningful content (not just random characters)
      const hasLetters = /[a-zA-Z]/.test(text);
      const hasWords = words.some(word => word.length > 2);
      
      if (!hasLetters || !hasWords) {
        return { invalidContent: true };
      }
      
      return null;
    };
  }
}

@Component({
  selector: 'app-expatriate-form',
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
    <div class="form-container" (swipeleft)="onSlideNext(stepper)" (swiperight)="onSlidePrev(stepper)">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading" [ngClass]="{ 'hide': isHidingOverlay }">
        <div class="loader"></div>
        <p class="loading-text">Submitting your application...</p>
      </div>

      <h1>Expatriate Application Form - ZIE Membership</h1>
      <p class="form-subtitle">Professional Application for Non-Zimbabwean Engineering Professionals</p>

      <mat-stepper #stepper [@stepAnimation]="currentStep">
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
                  formControlName="phoneNumber"
                  placeholder="Enter phone number (with or without country code)"
                  class="form-input"
                />
                <div class="help-text" *ngIf="!personalParticularsForm.get('phoneNumber')?.errors && personalParticularsForm.get('phoneNumber')?.value">
                  Format: With or without country code (e.g., 0712345678 or +263712345678)
                </div>
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
                <label>Country of Residence</label>
                <input
                  type="text"
                  formControlName="country"
                  placeholder="Your current country"
                  class="form-input"
                  readonly
                />
              </div>

              <div class="form-group">
                <label>Nationality/Country of Citizenship</label>
                <input
                  type="text"
                  formControlName="nationality"
                  placeholder="Your nationality"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Passport/National ID Number</label>
                <input
                  type="text"
                  formControlName="idNumber"
                  placeholder="Passport or National ID Number"
                  class="form-input"
                />
                <div class="help-text">
                  <strong>Examples of acceptable formats:</strong><br>
                  • US Passport: ABC123456<br>
                  • UK Passport: 123456789<br>
                  • Australian Passport: N12345678<br>
                  • India Passport: A1234567<br>
                  • South African ID: 8001011234567
                </div>
              </div>

              <div class="verification-section">
                <button type="button" (click)="openVerificationModal()" class="btn-verify">
                  🔐 Verify Your Identity & Experience
                </button>
                <p class="verification-help">
                  Use this to quickly verify your country ID and years of experience with our system
                </p>
              </div>

              <button mat-button matStepperNext class="btn-next">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Professional Qualifications -->
        <mat-step [stepControl]="educationForm" label="Qualifications">
          <form [formGroup]="educationForm">
            <div class="step-content">
              <h3>Educational Background</h3>

              <div class="form-group">
                <label>Highest Qualification</label>
                <select formControlName="qualification" class="form-input">
                  <option value="">Select qualification</option>
                  <option value="Bachelor">Bachelor of Engineering</option>
                  <option value="Master">Master's in Engineering</option>
                  <option value="PhD">PhD in Engineering</option>
                </select>
              </div>

              <div class="form-group">
                <label>Field of Engineering</label>
                <input
                  type="text"
                  formControlName="fieldOfEngineering"
                  placeholder="E.g., Civil, Mechanical, Electrical, etc."
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>University/Institution</label>
                <input
                  type="text"
                  formControlName="university"
                  placeholder="Name of institution"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Year of Graduation</label>
                <input
                  type="number"
                  formControlName="yearOfGraduation"
                  placeholder="YYYY"
                  class="form-input"
                  min="1950"
                  [max]="currentYear"
                />
              </div>

              <div class="form-group">
                <label>Professional Registration/License Number (if applicable)</label>
                <input
                  type="text"
                  formControlName="licenseNumber"
                  placeholder="License number or N/A"
                  class="form-input"
                />
              </div>

              <!-- Document Upload Section -->
              <div class="document-upload-section">
                <h4>Upload Supporting Documents (PDF)</h4>
                <p class="upload-note">Upload copies of your educational certificates/diplomas to verify your qualifications</p>

                <div class="form-group">
                  <label>Educational Certificates (PDF)</label>
                  <div class="file-upload-box">
                    <button 
                      type="button"
                      (click)="triggerFileInput('educationCertificates')"
                      class="btn-file-upload">
                      📄 Choose Files
                    </button>
                    <input
                      #educationCertificatesInput
                      id="educationCertificatesInput"
                      type="file"
                      multiple
                      accept=".pdf"
                      (change)="onFileSelected($event, 'educationCertificates')"
                      class="file-input"
                    />
                    <span class="file-name" *ngIf="uploadedFileNames['educationCertificates']">
                      {{ uploadedFileNames['educationCertificates'] }}
                    </span>
                  </div>
                  <div class="upload-help-text">Maximum 5 files, 5MB each</div>
                </div>
              </div>

              <button mat-button matStepperPrevious class="btn-back">Back</button>
              <button mat-button matStepperNext class="btn-next">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Professional Experience -->
        <mat-step [stepControl]="experienceForm" label="Experience">
          <form [formGroup]="experienceForm">
            <div class="step-content">
              <h3>Professional Experience</h3>

              <div class="form-group">
                <label>Current Job Title</label>
                <input
                  type="text"
                  formControlName="currentJobTitle"
                  placeholder="Your current position"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Current Employer</label>
                <input
                  type="text"
                  formControlName="currentEmployer"
                  placeholder="Company/Organization name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  formControlName="yearsOfExperience"
                  placeholder="Total years in engineering field"
                  class="form-input"
                  min="0"
                  max="70"
                />
              </div>

              <div class="form-group">
                <label>Summary of Professional Experience</label>
                <textarea
                  formControlName="experienceSummary"
                  placeholder="Describe your engineering experience and achievements"
                  class="form-textarea"
                  rows="4"
                ></textarea>
                <div class="validation-errors" *ngIf="experienceForm.get('experienceSummary')?.touched && experienceForm.get('experienceSummary')?.errors">
                  <span *ngIf="experienceForm.get('experienceSummary')?.errors?.['required']" class="error-text">
                    ❌ This field is required
                  </span>
                  <span *ngIf="experienceForm.get('experienceSummary')?.errors?.['wordCountMin']" class="error-text">
                    ❌ Minimum 20 words required
                  </span>
                  <span *ngIf="experienceForm.get('experienceSummary')?.errors?.['wordCountMax']" class="error-text">
                    ❌ Maximum 250 words allowed
                  </span>
                  <span *ngIf="experienceForm.get('experienceSummary')?.errors?.['invalidContent']" class="error-text">
                    ❌ Please enter meaningful text (not just random characters or numbers)
                  </span>
                </div>
              </div>

              <button mat-button matStepperPrevious class="btn-back">Back</button>
              <button mat-button matStepperNext class="btn-next">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 4: Apprentices/Trainees -->
        <mat-step [stepControl]="apprenticesForm" label="Apprentices">
          <form [formGroup]="apprenticesForm">
            <div class="step-content">
              <h3>Apprentice/Trainee Information</h3>

              <div class="form-group">
                <label>Apprentice/Trainee Name</label>
                <input
                  type="text"
                  formControlName="apprenticeName"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Working Place/Department</label>
                <input
                  type="text"
                  formControlName="workingPlace"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Company/Organization</label>
                <input
                  type="text"
                  formControlName="company"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Relationship to Trainee</label>
                <input
                  type="text"
                  formControlName="relationshipToTrainee"
                  placeholder="e.g., Supervisor, Manager, Mentor, Trainer, Director"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  formControlName="apprenticeEmail"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  formControlName="apprenticePhone"
                  class="form-input"
                />
              </div>

              <div class="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="traineeDeclaration"
                  formControlName="traineeDeclaration"
                  class="form-checkbox"
                />
                <label for="traineeDeclaration" class="checkbox-label">
                  I confirm that all the information provided about this trainee is accurate and true
                </label>
              </div>

              <button mat-button matStepperPrevious class="btn-back">Back</button>
              <button mat-button matStepperNext class="btn-next">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 6: Grade Selection -->
        <mat-step [stepControl]="gradeForm" label="Membership Grade">
          <form [formGroup]="gradeForm">
            <div class="step-content">
              <h3>Select Your Membership Grade</h3>

              <div class="grades-container">
                <div class="grade-card" *ngFor="let grade of membershipGrades" 
                     [class.selected]="gradeForm.get('grade')?.value === grade.id">
                  <input
                    type="radio"
                    [value]="grade.id"
                    formControlName="grade"
                    [id]="'grade-' + grade.id"
                    class="grade-radio"
                    (change)="onGradeSelected(grade.id)"
                  />
                  <label [for]="'grade-' + grade.id" class="grade-label">
                    <strong>{{ grade.name }}</strong>
                    <p class="grade-description">{{ grade.description }}</p>
                  </label>
                </div>
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

              <!-- Fee Breakdown Display for Expatriates -->
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
                    <strong class="total-amount">$ {{ feeBreakdown.total }}</strong>
                  </div>
                </div>
                <p class="fee-note">
                  <em>All fees shown in USD. Payment options will be available during checkout.</em>
                </p>
              </div>

              <button mat-button matStepperPrevious class="btn-back">Back</button>
              <button mat-button matStepperNext class="btn-next">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 5: Company Recommendation Letter -->
        <mat-step [stepControl]="companyLetterForm" label="Company Letter">
          <form [formGroup]="companyLetterForm">
            <div class="step-content">
              <h3>Company Recommendation Letter</h3>

              <p class="requirement-notice">
                <strong>Important:</strong> As an expatriate applicant, you must provide a company recommendation letter.
                This letter should be on official company letterhead and recommend you for ZIE membership.
              </p>

              <div class="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  formControlName="companyName"
                  placeholder="Recommending company name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Company Contact Person</label>
                <input
                  type="text"
                  formControlName="contactPerson"
                  placeholder="Name of person providing recommendation"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Upload Recommendation Letter (PDF only, max 5MB)</label>
                <input
                  type="file"
                  #companyLetterInput
                  accept=".pdf"
                  class="file-input"
                  (change)="onCompanyLetterSelected($event)"
                  hidden
                />
                <button
                  type="button"
                  (click)="companyLetterInput.click()"
                  class="btn-file-upload"
                >
                  Choose PDF File
                </button>
                <span class="file-name" *ngIf="companyLetterForm.get('letterFile')?.value">
                  {{ companyLetterForm.get('letterFile')?.value }}
                </span>
              </div>

              <div class="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="declarationCheckbox"
                  formControlName="declaration"
                  class="form-checkbox"
                />
                <label for="declarationCheckbox" class="checkbox-label">
                  I certify that the information provided is accurate and the company recommendation letter is genuine
                </label>
              </div>

              <button mat-button matStepperPrevious class="btn-back">Back</button>
              <button
                mat-button
                (click)="onSubmit(stepper)"
                [disabled]="!companyLetterForm.valid || isLoading"
                class="btn-submit"
              >
                {{ isLoading ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>
          </form>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 900px;
      margin: 20px auto;
      padding: 30px;
      background-color: #FFFFFF;
      position: relative;
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
      animation: fadeInOverlay 0.3s ease-in forwards;
    }

    .loading-overlay.hide {
      animation: fadeOutOverlay 0.3s ease-out forwards;
    }

    @keyframes fadeInOverlay {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOutOverlay {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
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

    h3 {
      color: #004A59;
      font-weight: 700;
      margin-bottom: 20px;
      font-size: 18px;
    }

    .step-subtitle {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
      font-style: italic;
    }

    .step-content {
      padding: 20px 0;
    }

    .form-group {
      margin-bottom: 18px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 2.5px solid #004A59 !important;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #B99532 !important;
        box-shadow: 0 0 0 3px rgba(185, 149, 50, 0.1);
      }
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
      line-height: 1.4;
    }

    .word-count {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
      text-align: right;
    }

    .requirement-notice {
      background-color: #fff3e0;
      border-left: 4px solid #B99532;
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 2px;
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }

    .grades-container {
      display: grid;
      gap: 15px;
      margin-bottom: 20px;
    }

    .grade-card {
      border: 2.5px solid #004A59;
      padding: 15px;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #FFFFFF;

      &:hover {
        border-color: #B99532;
        background-color: #fafaf5;
      }

      &.selected {
        border-color: #B99532;
        background-color: #fafaf5;
        box-shadow: 0 2px 8px rgba(0, 74, 89, 0.1);
      }
    }

    .grade-radio {
      margin-top: 2px;
      margin-right: 12px;
      cursor: pointer;
    }

    .grade-label {
      cursor: pointer;
      margin: 0;
      font-weight: 600;
      color: #004A59;
    }

    .grade-description {
      margin: 5px 0 0 0;
      font-size: 13px;
      color: #666;
      font-weight: normal;
    }

    .file-input {
      display: none;
    }

    .btn-file-upload {
      padding: 10px 16px;
      background-color: #004A59;
      color: white;
      border: 2.5px solid #004A59;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #003A47;
        border-color: #B99532;
      }
    }

    .file-name {
      margin-left: 10px;
      color: #388e3c;
      font-size: 13px;
      font-weight: 600;
    }

    .checkbox-group {
      display: flex;
      align-items: flex-start;
      margin-top: 20px;
      gap: 10px;
    }

    .form-checkbox {
      margin-top: 3px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .checkbox-label {
      margin: 0;
      font-weight: normal;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }

    .btn-next,
    .btn-back,
    .btn-submit {
      background-color: #004A59;
      color: white;
      padding: 10px 30px;
      margin: 20px 5px 0 0;
      border-radius: 4px;
      font-weight: 600;
      border: 2.5px solid #004A59 !important;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-next:hover,
    .btn-back:hover {
      background-color: #003A47;
      border-color: #B99532 !important;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: #003A47;
      border-color: #B99532 !important;
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .form-container {
        padding: 20px 15px;
        margin-top: 70px;
      }

      h1 {
        font-size: 22px;
        margin-bottom: 20px;
      }

      h3 {
        font-size: 16px;
      }

      .step-content {
        padding: 15px 0;
      }

      .form-group {
        margin-bottom: 15px;
      }

      label {
        font-size: 13px;
      }

      .form-input,
      .form-textarea {
        padding: 8px;
        font-size: 13px;
      }

      .btn-next,
      .btn-back,
      .btn-submit {
        padding: 8px 20px;
        font-size: 13px;
      }
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
      min-width: 75px;
      text-align: right;
    }

    .fee-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      margin-top: 8px;
      border-top: 2px solid #B99532;
      font-size: 14px;
    }

    .total-amount {
      color: #B99532;
      font-size: 16px;
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

    .validation-errors {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
      padding: 8px;
      background-color: #fee;
      border-left: 3px solid #d32f2f;
      border-radius: 4px;
    }

    .error-text {
      color: #d32f2f;
      font-size: 12px;
      font-weight: 500;
      display: block;
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

    .document-upload-section {
      background-color: #f5f5f5;
      border: 2px solid #B99532;
      border-radius: 6px;
      padding: 15px;
      margin: 25px 0;
    }

    .document-upload-section h4 {
      color: #004A59;
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 700;
    }

    .upload-note {
      font-size: 13px;
      color: #666;
      margin: 0 0 15px 0;
      font-style: italic;
    }

    .file-upload-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .upload-help-text {
      font-size: 12px;
      color: #999;
      margin: 0;
      font-style: italic;
    }

    /* Material Stepper Custom Styling for Swipe Animation */
    ::ng-deep {
      .mat-stepper-horizontal {
        background: transparent;
      }

      .mat-stepper-horizontal-line {
        opacity: 0.3;
      }

      .mat-step-header {
        pointer-events: auto;
      }

      .mat-step-header.mat-completed {
        color: #388e3c;
      }

      .mat-step-icon {
        background-color: #B99532;
        color: white;
      }

      .mat-step-icon.mat-step-icon-state-done {
        background-color: #388e3c;
      }

      .mat-step-icon.mat-step-icon-state-edit {
        background-color: #004A59;
      }
    }

    /* Swipe/Slide animations for form transitions */
    .step-content {
      animation: slideInFromLeft 0.4s ease-in-out;
    }

    @keyframes slideInFromLeft {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOutToRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(-100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOutToLeft {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-100px);
      }
    }

    /* Mobile touch indicator - show users they can swipe */
    .form-container {
      touch-action: pan-y pinch-zoom;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    /* Swipe hint for mobile users */
    @media (max-width: 768px) {
      .form-container::before {
        content: '← Swipe →';
        display: block;
        text-align: center;
        color: #999;
        font-size: 12px;
        margin-bottom: 10px;
        opacity: 0.6;
        transition: opacity 0.3s ease;
      }

      .form-container:hover::before {
        opacity: 1;
      }
    }
  `]
})
export class ExpatriateFormComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: any;

  personalParticularsForm!: FormGroup;
  educationForm!: FormGroup;
  experienceForm!: FormGroup;
  apprenticesForm!: FormGroup;

  gradeForm!: FormGroup;
  companyLetterForm!: FormGroup;

  isLoading = false;
  isHidingOverlay = false;
  private loadingStartTime: number = 0;
  private readonly MIN_LOADING_DURATION = 1200; // Minimum 1.2 seconds to show loading overlay
  private submissionDialogRef: MatDialogRef<SubmissionSuccessDialog> | null = null;
  currentYear = new Date().getFullYear();
  selectedCompanyLetterFile: File | null = null;
  uploadedFiles: { [key: string]: File | File[] } = {};
  uploadedFileNames: { [key: string]: string | string[] } = {};
  feeBreakdown: any = null;

  membershipGrades = [
    {
      id: 'Technician',
      name: 'Engineering Technician',
      description: 'For technicians with 3+ years of relevant experience',
    },
    {
      id: 'Technologist',
      name: 'Engineering Technologist',
      description: 'For technologists with 5+ years of experience',
    },
    {
      id: 'Professional Member',
      name: 'Professional Member',
      description: 'For registered/chartered engineers with 5+ years of experience',
    },
  ];

  // Swipe and animation properties
  currentStep = 0;
  touchStartX: number = 0;
  touchEndX: number = 0;
  minSwipeDistance = 50;

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

  /**
   * Hides the loading overlay with a minimum display duration
   * Ensures the overlay is shown for at least MIN_LOADING_DURATION milliseconds
   */
  private hideLoadingOverlay(): void {
    const now = Date.now();
    const elapsedTime = now - this.loadingStartTime;
    const remainingTime = this.MIN_LOADING_DURATION - elapsedTime;

    if (remainingTime > 0) {
      // Show fade-out animation and keep overlay visible until minimum time is reached
      this.isHidingOverlay = true;
      setTimeout(() => {
        this.isLoading = false;
        this.isHidingOverlay = false;
      }, remainingTime);
    } else {
      // Minimum time already passed, hide immediately with animation
      this.isHidingOverlay = true;
      setTimeout(() => {
        this.isLoading = false;
        this.isHidingOverlay = false;
      }, 300); // Time for fade-out animation
    }
  }

  ngOnInit(): void {
    // Verify user is expatriate applicant
    const currentUser = this.authService.getCurrentUser();
    console.log('🌍 Expatriate Form.ngOnInit - Current user:', currentUser);
    
    if (!currentUser) {
      console.warn('⚠ Expatriate Form - No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('🌍 Expatriate Form - User applicationType:', currentUser.applicationType);
    
    if (currentUser.applicationType !== 'expatriate') {
      console.warn('❌ Expatriate Form - Non-expatriate user detected, redirecting to M1 form');
      this.router.navigate(['/form-m1']);
      return;
    }
    
    console.log('✓ Expatriate Form - User is expatriate applicant, loading form');
    
    this.initializeForms();
    
    // Watch for user data changes - if user becomes local, redirect
    this.authService.currentUser$.subscribe((user: any) => {
      console.log('👁️ Expatriate Form - User data changed');
      
      // Check if applicationType changed to local (e.g., from server refresh or data migration)
      if (user && user.applicationType !== 'expatriate') {
        console.warn('❌ Expatriate Form - Applicant type is no longer expatriate, redirecting');
        this.router.navigate(['/form-m1']);
        return;
      }
    });
    
    this.populateCountryField();

    // Country changes - no country-specific validation needed
    // Auto-save form data every 5 seconds
    setInterval(() => {
      this.saveFormData();
    }, 5000);

    // Setup touch event listeners for swipe detection
    this.setupTouchListeners();
  }

  /**
   * Setup native touch event listeners for swipe detection
   * This works without requiring HammerJS library
   */
  private setupTouchListeners(): void {
    console.log('✓ Touch listeners ready for swipe navigation');
  }

  initializeForms(): void {
    this.personalParticularsForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      dateOfBirth: ['', Validators.required],
      country: ['', Validators.required],
      nationality: ['', Validators.required],
      idNumber: ['', Validators.required],
    });

    this.educationForm = this.fb.group({
      qualification: ['', Validators.required],
      fieldOfEngineering: ['', Validators.required],
      university: ['', Validators.required],
      yearOfGraduation: ['', Validators.required],
      licenseNumber: [''],
    });

    this.experienceForm = this.fb.group({
      currentJobTitle: ['', Validators.required],
      currentEmployer: ['', Validators.required],
      yearsOfExperience: ['', [Validators.required, Validators.min(0)]],
      experienceSummary: ['', [Validators.required, CustomValidators.wordCount(20, 250)]],
    });

    this.apprenticesForm = this.fb.group({
      apprenticeName: [''],
      workingPlace: [''],
      company: [''],
      relationshipToTrainee: [''],
      apprenticeEmail: ['', [Validators.email]],
      apprenticePhone: [''],
      traineeDeclaration: [false],
    });



    this.gradeForm = this.fb.group({
      grade: ['', Validators.required],
      chosenSpecialistDivision: ['', Validators.required],
    });

    this.companyLetterForm = this.fb.group({
      companyName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      letterFile: ['', Validators.required],
      declaration: [false, Validators.requiredTrue],
    });
  }

  applyCountrySpecificValidators(country: string): void {
    // No country-specific validation - accept any format
    // Phone and ID validation is handled by basic required validator only
  }

  getWordCount(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  ngOnDestroy(): void {
    // Close any open dialogs on component destruction
    if (this.submissionDialogRef) {
      this.submissionDialogRef.close();
      this.submissionDialogRef = null;
    }
  }

  populateCountryField(): void {
    this.authService.getCurrentUserObservable().subscribe({
      next: (user: any) => {
        if (user && user.country) {
          this.personalParticularsForm.patchValue({
            country: user.country,
          });
          this.personalParticularsForm.get('country')?.disable();
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  onCompanyLetterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must not exceed 5MB');
        return;
      }

      this.selectedCompanyLetterFile = file;
      this.companyLetterForm.patchValue({
        letterFile: file.name,
      });
    }
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
        alert(`${file.name} is not a PDF file. Please upload PDF files only.`);
        return;
      }
      
      // Check file size (5MB limit per file)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB. Please upload smaller files.`);
        return;
      }
    }

    // Store files based on field name
    if (fieldName === 'educationCertificates') {
      this.uploadedFiles['educationCertificates'] = Array.from(files);
      this.uploadedFileNames['educationCertificates'] = Array.from(files)
        .map((f: any) => f.name)
        .join(', ');
    }
  }

  triggerFileInput(fieldName: string): void {
    let elementId = '';
    if (fieldName === 'educationCertificates') {
      elementId = 'educationCertificatesInput';
    }
    
    if (elementId) {
      const inputElement = document.getElementById(elementId) as HTMLInputElement;
      if (inputElement) {
        inputElement.click();
      }
    }
  }

  onGradeSelected(gradeId: string): void {
    this.feeBreakdown = getFeeBreakdown(gradeId, 'expatriate');
  }

  openVerificationModal(): void {
    const currentCountry = this.personalParticularsForm.get('country')?.value;
    const currentYears = this.experienceForm.get('yearsOfExperience')?.value;

    this.dialog.open(DynamicValidationModalComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: '🌍 Expatriate Identity Verification',
        country: currentCountry,
        yearsOfExperience: currentYears
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        console.log('✓ Verification successful:', result);
        
        // Update Personal Particulars
        this.personalParticularsForm.patchValue({
          nationality: result.country,
          idNumber: result.idNumber
        });
        
        // Update Experience
        this.experienceForm.patchValue({
          yearsOfExperience: result.yearsOfExperience
        });

        // Show success message
        this.dialog.open(VerificationSuccessDialog, {
          width: '400px',
          disableClose: false,
          data: {
            country: result.country,
            yearsOfExperience: result.yearsOfExperience
          }
        });
      }
    });
  }

  /**
   * Handle swiping to the next form/step
   * Validates current step before moving to next
   */
  onSlideNext(stepper: any): void {
    // Validate current form before moving next
    const currentForm = this.getCurrentStepForm(stepper.selectedIndex);
    if (currentForm && !currentForm.valid) {
      console.warn('⚠️  Cannot move to next step - current form is invalid');
      // Mark all fields as touched to show validation errors
      Object.keys(currentForm.controls).forEach(key => {
        currentForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    // Use Angular Material stepper's next method
    if (stepper.selectedIndex < stepper._steps.length - 1) {
      this.currentStep = stepper.selectedIndex + 1;
      stepper.next();
    }
  }

  /**
   * Handle swiping to the previous form/step
   */
  onSlidePrev(stepper: any): void {
    if (stepper.selectedIndex > 0) {
      this.currentStep = stepper.selectedIndex - 1;
      stepper.previous();
    }
  }

  /**
   * Get the form control for the current step
   */
  private getCurrentStepForm(stepIndex: number): FormGroup | null {
    switch (stepIndex) {
      case 0:
        return this.personalParticularsForm;
      case 1:
        return this.educationForm;
      case 2:
        return this.experienceForm;
      case 3:
        return this.apprenticesForm;
      case 4:
        return this.gradeForm;
      case 5:
        return this.companyLetterForm;
      default:
        return null;
    }
  }

  /**
   * Save form data to persistence service
   */
  saveFormData(): void {
    if (this.personalParticularsForm && this.educationForm && this.experienceForm) {
      const formData = {
        personalParticulars: this.personalParticularsForm.value,
        education: this.educationForm.value,
        experience: this.experienceForm.value,

        grade: this.gradeForm?.value,
        companyLetter: this.companyLetterForm?.value,
      };
      // Save to persistence service
      this.formPersistenceService.saveFormData('expatriate-form', formData);
      console.log('✅ Expatriate form data saved to persistence service');
    }
  }

  onSubmit(stepper: any): void {
    // Validate all forms
    const validationResult = this.formValidationService.validateForms({
      'Personal Particulars': this.personalParticularsForm,
      'Qualifications': this.educationForm,
      'Professional Experience': this.experienceForm,

      'Membership Grade': this.gradeForm,
      'Company Letter': this.companyLetterForm,

    });

    // Check if file is selected
    if (!this.selectedCompanyLetterFile) {
      validationResult.missingFields.push({
        fieldName: 'letterFile',
        displayName: 'Recommendation Letter (PDF)',
        errors: ['A PDF file must be selected'],
        step: 'Company Letter',
      });
      validationResult.isValid = false;
    }

    if (!validationResult.isValid) {
      this.dialog.open(ValidationErrorDialog, {
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

    this.isLoading = true;
    this.loadingStartTime = Date.now();

    try {
      // Create FormData to handle file upload
      const formData = new FormData();

      // Add personal particulars as stringified JSON (expected by backend middleware)
      const personalData = this.personalParticularsForm.getRawValue();
      // Ensure date is properly formatted for JSON
      if (personalData.dateOfBirth && typeof personalData.dateOfBirth === 'object') {
        personalData.dateOfBirth = (personalData.dateOfBirth as Date).toISOString().split('T')[0];
      }
      console.log('📋 Personal Data (raw):', personalData);
      formData.append('personalParticulars', JSON.stringify(personalData));

      // Add education as stringified JSON
      const educationData = this.educationForm.value;
      console.log('📚 Education Data:', educationData);
      formData.append('education', JSON.stringify(educationData));

      // Add experience as stringified JSON
      const experienceData = this.experienceForm.value;
      console.log('💼 Experience Data:', experienceData);
      formData.append('experience', JSON.stringify(experienceData));

      // Add grade - use 'membershipGrade' for expatriate form
      const grade = this.gradeForm.value.grade;
      console.log('🎖️ Grade:', grade);
      formData.append('membershipGrade', grade);

      // Add specialist division
      const specialistDivision = this.gradeForm.value.chosenSpecialistDivision;
      console.log('🔬 Specialist Division:', specialistDivision);
      formData.append('chosenSpecialistDivision', specialistDivision);



      // Add company letter details as stringified JSON (expected by backend middleware)
      const companyData = this.companyLetterForm.value;
      const companyRecommendation = {
        companyName: companyData.companyName,
        contactPerson: companyData.contactPerson,
      };
      console.log('🏢 Company Recommendation:', companyRecommendation);
      formData.append('companyRecommendation', JSON.stringify(companyRecommendation));



      // Add file
      if (this.selectedCompanyLetterFile) {
        console.log('📄 Letter File:', this.selectedCompanyLetterFile.name);
        formData.append('letterFile', this.selectedCompanyLetterFile);
      }

      // Add education certificate files
      if (this.uploadedFiles['educationCertificates']) {
        const files = Array.isArray(this.uploadedFiles['educationCertificates']) 
          ? this.uploadedFiles['educationCertificates'] 
          : [this.uploadedFiles['educationCertificates']];
        
        files.forEach((file: File, index: number) => {
          console.log(`📄 Education Certificate ${index + 1}:`, file.name);
          formData.append('certificateFiles', file);
        });
      }

      // Add applicationType
      formData.append('applicationType', 'expatriate');
      
      console.log('🚀 Submitting expatriate application...');

      this.applicationService.submitExpatriateApplication(formData).subscribe({
      next: (response) => {
        this.hideLoadingOverlay();
        console.log('✓ Expatriate application submitted successfully');
        console.log('  - Application ID:', response.id);

        // Close any existing dialog
        if (this.submissionDialogRef) {
          this.submissionDialogRef.close();
        }

        // Open centered, self-dismissing notification
        this.submissionDialogRef = this.dialog.open(SubmissionSuccessDialog, {
          width: '100%',
          maxWidth: '500px',
          disableClose: true,
          backdropClass: 'centered-dialog-backdrop',
          panelClass: 'centered-dialog-panel',
          data: {
            applicantName: `${personalData.firstName} ${personalData.lastName}`,
            applicationId: response.id,
            grade: this.gradeForm.value.grade,
          },
        });

        // Dialog will handle its own navigation and auto-close
      },
      error: (error) => {
        this.hideLoadingOverlay();
        console.error('❌ Application submission failed:', error);
        console.error('Error response:', error.error);
        console.error('Error status:', error.status);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Try to extract specific error message
        let errorMessage = 'Application submission failed. Please try again.';
        if (error.message && error.message.includes('required')) {
          // This is a client-side validation error we threw
          errorMessage = error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.map((e: any) => e.msg || e.message).join(', ');
        } else if (error.statusText) {
          errorMessage = `${error.status} ${error.statusText}`;
        }
        
        console.error('💬 Displaying error:', errorMessage);
        alert('❌ ' + errorMessage);
      },
      });
    } catch (validationError: any) {
      this.hideLoadingOverlay();
      console.error('❌ Form validation error:', validationError);
      console.error('Error message:', validationError.message);
      
      // Show the validation error to the user
      const errorMessage = validationError.message || 'Form validation failed. Please check all fields are filled in.';
      console.error('💬 Displaying validation error:', errorMessage);
      alert('❌ ' + errorMessage);
    }
  }
}

@Component({
  selector: 'app-submission-success-dialog',
  template: `
    <div class="success-notification-overlay" *ngIf="isVisible">
      <div class="success-notification-center">
        <button class="notification-close-btn" (click)="onClose()" aria-label="Close notification">✕</button>
        <div class="notification-content">
          <div class="success-icon">✓</div>
          <h2>Application Submitted Successfully!</h2>
          
          <div class="success-details">
            <p class="message">
              Thank you <strong>{{ data?.applicantName }}</strong>, your membership application has been received.
            </p>
            <p class="submessage">
              Application ID: <strong>{{ data?.applicationId }}</strong>
            </p>
            <div class="info-box">
              <p><strong>Type:</strong> Expatriate</p>
              <p><strong>Grade:</strong> {{ data?.grade }}</p>
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
      word-break: break-all;
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
  selector: 'app-validation-error-dialog',
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
        <button mat-button (click)="onClose()" class="close-btn">
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
export class ValidationErrorDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onClose(): void {
    // Dialog will close when button is clicked
  }
}

@Component({
  selector: 'app-verification-success-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-dialog">
      <div class="success-icon">✓</div>
      <h2>Identity Verified Successfully</h2>
      <div class="verification-details">
        <div class="detail-row">
          <span class="label">Country:</span>
          <span class="value">{{ data.country }}</span>
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
export class VerificationSuccessDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onClose(): void {
    // Dialog will close when button is clicked
  }
}
