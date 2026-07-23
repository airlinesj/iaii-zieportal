import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CpdService } from '../services/cpd.service';
import { calculateCpdDurationFeeUsd, convertUsdToLocalCurrency, calculateCpdDurationFeeWithConversion } from '../services/cpd-fee.service';

@Component({
  selector: 'app-cpd-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  template: `
    <div class="cpd-container">
      <div class="cpd-header">
        <h1>CPD Training Programme Assessment Application</h1>
        <p class="subtitle">Form ET&M/A1 - The ZImbabwe Institution of Engineers</p>
      </div>

      <form [formGroup]="cpdForm" (ngSubmit)="onSubmit()" class="cpd-form">
        
        <!-- SECTION A: ORGANIZATION & SUPERVISOR DETAILS -->
        <div class="form-section">
          <h2 class="section-title">Section A: Organization & Supervisor Details</h2>
          
          <div class="subsection">
            <h3>Organization Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="companyName">Company Name *</label>
                <input type="text" id="companyName" formControlName="companyName" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('companyName')">Company name is required</span>
              </div>
              <div class="form-group">
                <label for="email">Organization Email *</label>
                <input type="email" id="email" formControlName="email" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('email')">Valid email is required</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="physicalAddress">Physical Address *</label>
                <input type="text" id="physicalAddress" formControlName="physicalAddress" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('physicalAddress')">Physical address is required</span>
              </div>
              <div class="form-group">
                <label for="phoneNumber">Tel/Cell *</label>
                <input type="tel" id="phoneNumber" formControlName="phoneNumber" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('phoneNumber')">Phone number is required</span>
              </div>
            </div>

            <div class="form-group full-width">
              <label for="natureOfBusiness">Nature of Business *</label>
              <textarea id="natureOfBusiness" formControlName="natureOfBusiness" class="form-control" rows="3" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('natureOfBusiness')">Nature of business is required</span>
            </div>
          </div>

          <div class="subsection">
            <h3>CPD Supervisor Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="supervisorName">CPD Supervisor Name *</label>
                <input type="text" id="supervisorName" formControlName="supervisorName" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('supervisorName')">Supervisor name is required</span>
              </div>
              <div class="form-group">
                <label for="supervisorEmail">Supervisor Email *</label>
                <input type="email" id="supervisorEmail" formControlName="supervisorEmail" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('supervisorEmail')">Valid email is required</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="supervisorCell">Supervisor Cell *</label>
                <input type="tel" id="supervisorCell" formControlName="supervisorCell" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('supervisorCell')">Cell number is required</span>
              </div>
              <div class="form-group">
                <label for="supervisorJobTitle">Job Title *</label>
                <input type="text" id="supervisorJobTitle" formControlName="supervisorJobTitle" class="form-control" required />
                <span class="error" *ngIf="isFieldInvalid('supervisorJobTitle')">Job title is required</span>
              </div>
            </div>

            <div class="form-group full-width">
              <label for="supervisorQualifications">Qualifications *</label>
              <textarea id="supervisorQualifications" formControlName="supervisorQualifications" class="form-control" rows="2" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('supervisorQualifications')">Qualifications are required</span>
            </div>
          </div>
        </div>

        <!-- SECTION B: COURSE INFORMATION -->
        <div class="form-section">
          <h2 class="section-title">Section B: Course Information</h2>

          <div class="subsection">
            <h3>Basic Course Details</h3>
            <div class="form-group full-width">
              <label for="courseTitle">Course Title *</label>
              <input type="text" id="courseTitle" formControlName="courseTitle" class="form-control" required />
              <span class="error" *ngIf="isFieldInvalid('courseTitle')">Course title is required</span>
            </div>

            <div class="form-group full-width">
              <label for="courseOverview">Course Overview *</label>
              <textarea id="courseOverview" formControlName="courseOverview" class="form-control" rows="3" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('courseOverview')">Course overview is required</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="targetedParticipantsCount">Targeted Participants (Count) *</label>
                <input type="number" id="targetedParticipantsCount" formControlName="targetedParticipantsCount" class="form-control" min="1" required />
                <span class="error" *ngIf="isFieldInvalid('targetedParticipantsCount')">Participant count is required</span>
              </div>
              <div class="form-group">
                <label for="courseDuration">Course Duration (days) *</label>
                <input type="number" id="courseDuration" formControlName="courseDuration" class="form-control" min="0.5" step="0.5" required (change)="calculateEstimatedFee()" />
                <span class="error" *ngIf="isFieldInvalid('courseDuration')">Duration is required</span>
              </div>
            </div>

            <div class="form-group full-width">
              <label for="targetedParticipantsDescription">Targeted Participants Description *</label>
              <textarea id="targetedParticipantsDescription" formControlName="targetedParticipantsDescription" class="form-control" rows="3" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('targetedParticipantsDescription')">Description is required</span>
            </div>

            <div class="form-group full-width">
              <label for="careerPlan">Career Plan *</label>
              <textarea id="careerPlan" formControlName="careerPlan" class="form-control" rows="3" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('careerPlan')">Career plan is required</span>
            </div>
          </div>

          <div class="subsection">
            <h3>Assessment & Feedback</h3>
            <div class="form-group full-width">
              <label for="internalAssessmentMethods">Internal Assessment Methods *</label>
              <textarea id="internalAssessmentMethods" formControlName="internalAssessmentMethods" class="form-control" rows="3" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('internalAssessmentMethods')">Assessment methods are required</span>
            </div>

            <div class="form-group full-width">
              <label for="feedbackMechanisms">Feedback Mechanisms *</label>
              <textarea id="feedbackMechanisms" formControlName="feedbackMechanisms" class="form-control" rows="3" required></textarea>
              <span class="error" *ngIf="isFieldInvalid('feedbackMechanisms')">Feedback mechanisms are required</span>
            </div>
          </div>

          <div class="subsection">
            <h3>Training Facilitators</h3>
            <div class="tutors-list">
              <div *ngFor="let tutor of trainers.controls; let i = index" class="facilitator-card">
                <div class="card-header">
                  <h4>Facilitator {{ i + 1 }}</h4>
                  <button type="button" class="btn-remove" (click)="removeTrainer(i)">Remove</button>
                </div>
                <div [formGroup]="$any(tutor)">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Name *</label>
                      <input type="text" formControlName="name" class="form-control" required />
                    </div>
                    <div class="form-group">
                      <label>Position *</label>
                      <input type="text" formControlName="position" class="form-control" required />
                    </div>
                  </div>
                  <div class="form-group full-width">
                    <label>Qualifications *</label>
                    <textarea formControlName="qualifications" class="form-control" rows="2" required></textarea>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" class="btn-add" (click)="addTrainer()">+ Add Facilitator</button>
          </div>
        </div>

        <!-- SECTION C: MODE & TRAINING ELEMENTS -->
        <div class="form-section">
          <h2 class="section-title">Section C: Course Duration Fee & Training Elements</h2>

          <div class="subsection">
            <h3>📋 Course Duration</h3>
            <div class="course-duration-display">
              <div class="duration-input-group">
                <label for="courseDurationC">Enter or confirm course duration (days) *</label>
                <div class="duration-input-row">
                  <input type="number" id="courseDurationC" [value]="cpdForm.get('courseDuration')?.value" (input)="updateDurationFromSection($event)" class="form-control duration-input" min="0.5" step="0.5" />
                  <span class="duration-unit">days</span>
                </div>
              </div>
            </div>
          </div>

          <div class="subsection">
            <h3>💰 CPD Fee Schedule</h3>
            <p class="subsection-note">Select your course duration to see the applicable fee.</p>
            
            <div class="fee-schedule-table">
              <table class="price-table">
                <thead>
                  <tr>
                    <th>Duration</th>
                    <th>Description</th>
                    <th>USD Price</th>
                    <th>ZWL Price (&#64; 26.5 rate)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr [class.selected]="getCurrentFeeCategory() === 'halfDay'">
                    <td class="duration-col">< 1 day</td>
                    <td>Half day course</td>
                    <td class="price-usd">$40.00</td>
                    <td class="price-zwl">ZWL 1,060.00</td>
                  </tr>
                  <tr [class.selected]="getCurrentFeeCategory() === 'fullDay'">
                    <td class="duration-col">1 day</td>
                    <td>Full day course</td>
                    <td class="price-usd">$75.00</td>
                    <td class="price-zwl">ZWL 1,987.50</td>
                  </tr>
                  <tr [class.selected]="getCurrentFeeCategory() === 'twoDay'">
                    <td class="duration-col">2 days</td>
                    <td>Two-day course</td>
                    <td class="price-usd">$100.00</td>
                    <td class="price-zwl">ZWL 2,650.00</td>
                  </tr>
                  <tr [class.selected]="getCurrentFeeCategory() === 'threeSeven'">
                    <td class="duration-col">3-7 days</td>
                    <td>Three to seven-day course</td>
                    <td class="price-usd">$125.00</td>
                    <td class="price-zwl">ZWL 3,312.50</td>
                  </tr>
                  <tr [class.selected]="getCurrentFeeCategory() === 'moreSeven'">
                    <td class="duration-col">> 7 days</td>
                    <td>More than seven days</td>
                    <td class="price-usd">$200.00</td>
                    <td class="price-zwl">ZWL 5,300.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="estimated-fee-box">
              <h4>Your Estimated Course Fee:</h4>
              <div class="fee-display-large">
                <div class="fee-item" [class.usd-fee]="paymentCurrency === 'USD'" [class.zwl-fee]="paymentCurrency === 'ZWL'">
                  <span class="fee-label">{{ paymentCurrency }}:</span>
                  <span class="fee-amount">
                    {{ estimatedFee > 0 ? (estimatedFee | number: '1.2-2') : '—' }}
                  </span>
                </div>
              </div>
              <p class="fee-note" *ngIf="courseDurationText">{{ courseDurationText }}</p>
              <p class="fee-note empty" *ngIf="!courseDurationText">Enter course duration to calculate fee</p>
            </div>
          </div>

          <div class="subsection">
            <h3>Preferred Payment Currency *</h3>
            <p class="subsection-note">Select how you prefer to pay for the course.</p>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="paymentCurrency" value="ZWL" formControlName="paymentCurrency" (change)="calculateEstimatedFee()" />
                <span class="radio-text">
                  <span class="radio-title">Zimbabwe Dollar</span>
                  <span class="radio-desc">ZWL</span>
                </span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentCurrency" value="USD" formControlName="paymentCurrency" (change)="calculateEstimatedFee()" />
                <span class="radio-text">
                  <span class="radio-title">US Dollar</span>
                  <span class="radio-desc">USD</span>
                </span>
              </label>
            </div>
            <span class="error" *ngIf="isFieldInvalid('paymentCurrency')">Please select a payment currency</span>
          </div>

          <div class="subsection">
            <h3>Training Mode *</h3>
            <div class="checkbox-group" formGroupName="trainingMode">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="sandwich" (change)="calculateEstimatedFee()" />
                Sandwich
              </label>
              <label class="checkbox-label">
                <input type="checkbox" formControlName="undergraduate" (change)="calculateEstimatedFee()" />
                Undergraduate
              </label>
              <label class="checkbox-label">
                <input type="checkbox" formControlName="postgraduate" (change)="calculateEstimatedFee()" />
                Postgraduate
              </label>
            </div>
            <span class="error" *ngIf="cpdForm.get('trainingMode')?.hasError('atLeastOneTrainingMode') && cpdForm.get('trainingMode')?.touched">Please select at least one training mode</span>
          </div>

          <div class="subsection">
            <h3>Training Elements (Select applicable ZIE Codes) *</h3>
            <div class="elements-grid" formGroupName="trainingElements">
              <label class="element-checkbox">
                <input type="checkbox" formControlName="A" (change)="calculateEstimatedFee()" />
                <span class="element-code">A</span>
                <span class="element-label">Induction</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="B" (change)="calculateEstimatedFee()" />
                <span class="element-code">B</span>
                <span class="element-label">Practical</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C1" (change)="calculateEstimatedFee()" />
                <span class="element-code">C1</span>
                <span class="element-label">Engineering Specifications</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C2" (change)="calculateEstimatedFee()" />
                <span class="element-code">C2</span>
                <span class="element-label">Design - Hydraulic</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C3" (change)="calculateEstimatedFee()" />
                <span class="element-code">C3</span>
                <span class="element-label">Design - Mechanical</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C4" (change)="calculateEstimatedFee()" />
                <span class="element-code">C4</span>
                <span class="element-label">Design - Electrical</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C5" (change)="calculateEstimatedFee()" />
                <span class="element-code">C5</span>
                <span class="element-label">Design - Structural</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C6" (change)="calculateEstimatedFee()" />
                <span class="element-code">C6</span>
                <span class="element-label">Design - Civil</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C7" (change)="calculateEstimatedFee()" />
                <span class="element-code">C7</span>
                <span class="element-label">Process Engineering</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="C8" (change)="calculateEstimatedFee()" />
                <span class="element-code">C8</span>
                <span class="element-label">Project Management</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="HS" (change)="calculateEstimatedFee()" />
                <span class="element-code">HS</span>
                <span class="element-label">Health & Safety</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="CS" (change)="calculateEstimatedFee()" />
                <span class="element-code">CS</span>
                <span class="element-label">Communication Skills</span>
              </label>
              <label class="element-checkbox">
                <input type="checkbox" formControlName="IAM" (change)="calculateEstimatedFee()" />
                <span class="element-code">IAM</span>
                <span class="element-label">Infrastructure Asset Mgmt</span>
              </label>
            </div>
          </div>
        </div>

        <!-- FILE UPLOADS -->
        <div class="form-section">
          <h2 class="section-title">File Uploads</h2>

          <div class="subsection">
            <h3>Required Documents</h3>
            
            <div class="file-upload-group">
              <label class="file-upload-label">
                <span class="label-text">Detailed Course Curriculum (Synopsis/Objectives) *</span>
                <span class="file-hint">(PDF or DOC, max 5MB)</span>
                <div class="file-input-wrapper" #curriculumWrapper>
                  <input type="file" #curriculumInput (change)="onFileSelected($event, 'curriculum')" accept=".pdf,.doc,.docx" hidden />
                  <div class="file-drop-zone" (click)="curriculumInput.click()" (drop)="onFileDrop($event, 'curriculum')" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)">
                    <span class="material-symbols-outlined">cloud_upload</span>
                    <p *ngIf="!uploadedFiles['curriculum']">Drag and drop or click to select</p>
                    <p *ngIf="uploadedFiles['curriculum']" class="file-selected">✓ {{ uploadedFiles['curriculum'].name }}</p>
                  </div>
                </div>
              </label>
            </div>

            <div class="file-upload-group">
              <label class="file-upload-label">
                <span class="label-text">CPD Facilitator Profiles (max 250 words each) *</span>
                <span class="file-hint">(PDF or DOC, max 5MB)</span>
                <div class="file-input-wrapper" #profileWrapper>
                  <input type="file" #profileInput (change)="onFileSelected($event, 'profiles')" accept=".pdf,.doc,.docx" hidden />
                  <div class="file-drop-zone" (click)="profileInput.click()" (drop)="onFileDrop($event, 'profiles')" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)">
                    <span class="material-symbols-outlined">cloud_upload</span>
                    <p *ngIf="!uploadedFiles['profiles']">Drag and drop or click to select</p>
                    <p *ngIf="uploadedFiles['profiles']" class="file-selected">✓ {{ uploadedFiles['profiles'].name }}</p>
                  </div>
                </div>
              </label>
            </div>

            <div class="file-upload-group">
              <label class="file-upload-label">
                <span class="label-text">Proof of Payment (Assessment Fees) *</span>
                <span class="file-hint">(PDF or JPG, max 5MB)</span>
                <div class="file-input-wrapper" #paymentWrapper>
                  <input type="file" #paymentInput (change)="onFileSelected($event, 'payment')" accept=".pdf,.jpg,.jpeg,.png" hidden />
                  <div class="file-drop-zone" (click)="paymentInput.click()" (drop)="onFileDrop($event, 'payment')" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)">
                    <span class="material-symbols-outlined">cloud_upload</span>
                    <p *ngIf="!uploadedFiles['payment']">Drag and drop or click to select</p>
                    <p *ngIf="uploadedFiles['payment']" class="file-selected">✓ {{ uploadedFiles['payment'].name }}</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- SUBMIT BUTTON -->
        <div class="form-section">
          <div class="form-actions">
            <button type="submit" class="btn-submit" [disabled]="!cpdForm.valid || isSubmitting">
              <span *ngIf="!isSubmitting">Submit Application</span>
              <span *ngIf="isSubmitting">Submitting...</span>
            </button>
          </div>
        </div>
      </form>

      <!-- Success Message -->
      <div *ngIf="submitSuccess" class="success-message">
        <p>Your CPD application has been submitted successfully!</p>
        <p class="reference">Application ID: {{ applicationId }}</p>
      </div>

      <!-- Error Message -->
      <div *ngIf="submitError" class="error-message">
        <p>{{ submitError }}</p>
      </div>
    </div>
  `,
  styles: [`
    .cpd-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    .cpd-header {
      text-align: center;
      margin-bottom: 40px;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-left: 5px solid #B99532;
    }

    .cpd-header h1 {
      color: #004A59;
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: 900;
    }

    .cpd-header .subtitle {
      color: #B99532;
      font-size: 16px;
      font-weight: 600;
    }

    .cpd-form {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .form-section {
      padding: 30px;
      border-bottom: 2px solid #f0f0f0;
    }

    .form-section:last-child {
      border-bottom: none;
    }

    .section-title {
      color: #004A59;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #B99532;
    }

    .subsection {
      margin-bottom: 30px;
    }

    .subsection:last-child {
      margin-bottom: 0;
    }

    .subsection h3 {
      color: #003F82;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .subsection-note {
      color: #7f8c8d;
      font-size: 13px;
      margin-bottom: 15px;
      font-style: italic;
    }

    .radio-group, .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }

    .radio-label, .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .radio-label:hover, .checkbox-label:hover {
      border-color: #B99532;
      background-color: #fafafa;
    }

    .radio-label input[type="radio"],
    .checkbox-label input[type="checkbox"] {
      margin-top: 2px;
      cursor: pointer;
      accent-color: #B99532;
    }

    .radio-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .radio-title {
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
    }

    .radio-desc {
      font-size: 12px;
      color: #7f8c8d;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 600;
      color: #004A59;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .form-control {
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #B99532;
      box-shadow: 0 0 0 3px rgba(185, 149, 50, 0.1);
    }

    .form-control.ng-invalid.ng-touched {
      border-color: #dc3545;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }

    /* Facilitators List */
    .tutors-list {
      margin-bottom: 20px;
    }

    .facilitator-card {
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 15px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .card-header h4 {
      margin: 0;
      color: #004A59;
      font-size: 14px;
    }

    .btn-remove {
      background: #dc3545;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s;
    }

    .btn-remove:hover {
      background: #c82333;
    }

    .btn-add {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }

    .btn-add:hover {
      background: #218838;
    }

    /* Checkboxes */
    .checkbox-group, .elements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
    }

    .checkbox-label input[type="checkbox"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
      accent-color: #B99532;
    }

    .element-checkbox {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      background: white;
    }

    .element-checkbox:hover {
      border-color: #B99532;
      background: #fafafa;
    }

    .element-checkbox input[type="checkbox"]:checked {
      accent-color: #B99532;
    }

    .element-checkbox input[type="checkbox"]:checked ~ .element-code,
    .element-checkbox input[type="checkbox"]:checked ~ .element-label {
      color: #B99532;
      font-weight: 600;
    }

    .element-code {
      font-weight: 700;
      color: #004A59;
      font-size: 13px;
    }

    .element-label {
      font-size: 13px;
      color: #666;
    }

    /* Course Duration Input */
    .course-duration-display {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 2px solid #e0e0e0;
    }

    .course-duration-display label {
      font-weight: 600;
      color: #004A59;
      margin-bottom: 10px;
      display: block;
    }

    .duration-input-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .duration-input {
      flex: 0 0 150px;
      padding: 10px;
      border: 2px solid #B99532;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
    }

    .duration-unit {
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
    }

    /* Fee Schedule Table */
    .fee-schedule-table {
      overflow-x: auto;
      margin-bottom: 30px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .price-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .price-table thead {
      background: linear-gradient(135deg, #003F82 0%, #004A59 100%);
      color: white;
    }

    .price-table th {
      padding: 15px;
      text-align: left;
      font-weight: 700;
      font-size: 14px;
      border: 1px solid #ddd;
    }

    .price-table td {
      padding: 15px;
      border: 1px solid #ddd;
      font-size: 13px;
    }

    .price-table tbody tr {
      transition: all 0.3s ease;
    }

    .price-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .price-table tbody tr.selected {
      background-color: #E8F4F8;
      border-left: 5px solid #B99532;
    }

    .duration-col {
      font-weight: 600;
      color: #003F82;
      white-space: nowrap;
    }

    .price-usd {
      font-weight: 700;
      color: #2E7D32;
      font-size: 14px;
    }

    .price-zwl {
      font-weight: 700;
      color: #D32F2F;
      font-size: 14px;
    }

    /* Estimated Fee Box */
    .estimated-fee-box {
      background: linear-gradient(135deg, #003F82 0%, #004A59 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }

    .estimated-fee-box h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 700;
    }

    .fee-display-large {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 15px;
    }

    .fee-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .fee-label {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.9;
    }

    .fee-amount {
      font-size: 36px;
      font-weight: 900;
      color: #B99532;
    }

    .fee-divider {
      font-size: 32px;
      color: #B99532;
      opacity: 0.6;
    }

    .fee-note {
      font-size: 13px;
      margin: 10px 0 0 0;
      opacity: 0.9;
    }

    .fee-note.empty {
      font-style: italic;
      opacity: 0.7;
    }

    /* Fee Display */
    .fee-display {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #B99532;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .fee-label {
      font-weight: 600;
      color: #004A59;
      font-size: 15px;
    }

    .fee-amount {
      font-size: 28px;
      font-weight: 700;
      color: #B99532;
    }

    .fee-note {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    /* File Uploads */
    .file-upload-group {
      margin-bottom: 25px;
    }

    .file-upload-label {
      display: block;
      margin-bottom: 10px;
    }

    .label-text {
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
      display: block;
      margin-bottom: 5px;
    }

    .file-hint {
      font-size: 12px;
      color: #999;
      display: block;
      margin-bottom: 10px;
    }

    .file-drop-zone {
      border: 3px dashed #B99532;
      border-radius: 6px;
      padding: 30px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: #fafafa;
    }

    .file-drop-zone:hover {
      background: #f5f5f5;
      border-color: #a58628;
    }

    .file-drop-zone.dragging {
      background: #fffacd;
      border-color: #004A59;
    }

    .file-drop-zone span {
      font-size: 48px;
      color: #B99532;
      display: block;
      margin-bottom: 10px;
    }

    .file-drop-zone p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .file-selected {
      color: #28a745;
      font-weight: 600;
    }

    /* Submit Button */
    .form-actions {
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .btn-submit {
      background: #004A59;
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      min-width: 200px;
    }

    .btn-submit:hover:not(:disabled) {
      background: #003340;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.3);
    }

    .btn-submit:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* Success/Error Messages */
    .success-message {
      background: #d4edda;
      border: 2px solid #28a745;
      color: #155724;
      padding: 20px;
      border-radius: 6px;
      margin-top: 20px;
      text-align: center;
    }

    .success-message p {
      margin: 5px 0;
      font-weight: 600;
    }

    .reference {
      font-size: 14px;
      margin-top: 10px !important;
    }

    .error-message {
      background: #f8d7da;
      border: 2px solid #dc3545;
      color: #721c24;
      padding: 20px;
      border-radius: 6px;
      margin-top: 20px;
    }

    .error-message p {
      margin: 0;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .cpd-container {
        padding: 20px 10px;
      }

      .cpd-header {
        padding: 20px;
      }

      .cpd-header h1 {
        font-size: 24px;
      }

      .form-section {
        padding: 20px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .section-title {
        font-size: 18px;
      }

      .checkbox-group, .elements-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      }

      .fee-display {
        flex-direction: column;
        align-items: flex-start;
      }

      .btn-submit {
        min-width: 100%;
      }
    }
  `]
})
export class CpdApplicationComponent implements OnInit {
  cpdForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  applicationId = '';
  uploadedFiles: { [key: string]: File | null } = {
    curriculum: null,
    profiles: null,
    payment: null
  };
  estimatedFee = 0;
  courseDurationText = '';
  paymentCurrency = 'ZWL';

  get trainers(): FormArray {
    return this.cpdForm.get('trainers') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private cpdService: CpdService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.cpdForm = this.fb.group({
      // Section A: Organization & Supervisor
      companyName: ['', Validators.required],
      physicalAddress: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      natureOfBusiness: ['', Validators.required],
      supervisorName: ['', Validators.required],
      supervisorEmail: ['', [Validators.required, Validators.email]],
      supervisorCell: ['', Validators.required],
      supervisorJobTitle: ['', Validators.required],
      supervisorQualifications: ['', Validators.required],

      // Section B: Course Information
      courseTitle: ['', Validators.required],
      courseOverview: ['', Validators.required],
      courseDuration: ['', Validators.required],
      targetedParticipantsCount: ['', [Validators.required, Validators.min(1)]],
      targetedParticipantsDescription: ['', Validators.required],
      careerPlan: ['', Validators.required],
      internalAssessmentMethods: ['', Validators.required],
      feedbackMechanisms: ['', Validators.required],

      // Training Facilitators (FormArray)
      trainers: this.fb.array([this.createTrainerGroup()]),

      // Section C: Payment Currency, Mode & Elements
      paymentCurrency: ['ZWL', Validators.required],
      trainingMode: this.fb.group({
        sandwich: [false],
        undergraduate: [false],
        postgraduate: [false]
      }, { validators: this.atLeastOneTrainingModeValidator }),
      trainingElements: this.fb.group({
        A: [false],
        B: [false],
        C1: [false],
        C2: [false],
        C3: [false],
        C4: [false],
        C5: [false],
        C6: [false],
        C7: [false],
        C8: [false],
        HS: [false],
        CS: [false],
        IAM: [false]
      })
    });
    
    // Initialize fee calculation
    this.calculateEstimatedFee();
  }

  private atLeastOneTrainingModeValidator(group: AbstractControl): { [key: string]: any } | null {
    const sandwich = group.get('sandwich')?.value;
    const undergraduate = group.get('undergraduate')?.value;
    const postgraduate = group.get('postgraduate')?.value;
    
    if (!sandwich && !undergraduate && !postgraduate) {
      return { 'atLeastOneTrainingMode': true };
    }
    return null;
  }

  private createTrainerGroup(): FormGroup {
    return this.fb.group({
      name: [''],
      qualifications: [''],
      position: ['']
    });
  }

  addTrainer(): void {
    this.trainers.push(this.createTrainerGroup());
  }

  removeTrainer(index: number): void {
    this.trainers.removeAt(index);
  }

  calculateEstimatedFee(): void {
    const courseDuration = this.cpdForm.get('courseDuration')?.value;
    this.paymentCurrency = this.cpdForm.get('paymentCurrency')?.value || 'ZWL';

    if (!courseDuration || courseDuration <= 0) {
      this.estimatedFee = 0;
      this.courseDurationText = '';
      return;
    }

    try {
      const durationDays = parseFloat(courseDuration.toString());
      
      // Calculate USD fee based on duration
      const { category, label, usdFee } = calculateCpdDurationFeeUsd(durationDays);
      
      // For now, use a default interbank rate (in production, this would be fetched from the backend)
      const interbankRate = 26.5; // Default ZWL per USD
      
      if (this.paymentCurrency === 'USD') {
        // Display in USD
        this.estimatedFee = usdFee;
      } else {
        // Display in ZWL
        this.estimatedFee = convertUsdToLocalCurrency(usdFee, interbankRate);
      }
      
      // Update the duration text to show the category label
      this.courseDurationText = `Based on ${durationDays} day(s) - ${label}`;
    } catch (error: any) {
      this.estimatedFee = 0;
      this.courseDurationText = '';
      console.error('Error calculating fee:', error.message);
    }
  }

  getCurrentFeeCategory(): string {
    const courseDuration = this.cpdForm.get('courseDuration')?.value;
    if (!courseDuration || courseDuration <= 0) {
      return '';
    }

    try {
      const durationDays = parseFloat(courseDuration.toString());
      const { category } = calculateCpdDurationFeeUsd(durationDays);
      return category;
    } catch (error) {
      return '';
    }
  }

  updateDurationFromSection(event: any): void {
    const value = event.target.value;
    if (value) {
      this.cpdForm.patchValue({ courseDuration: value });
      this.calculateEstimatedFee();
    }
  }

  onFileSelected(event: any, fileType: string): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.validateFile(file)) {
        this.uploadedFiles[fileType] = file;
      }
    }
  }

  onFileDrop(event: DragEvent, fileType: string): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.validateFile(file)) {
        this.uploadedFiles[fileType] = file;
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('dragging');
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('dragging');
  }

  private validateFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.submitError = 'File size exceeds 5MB limit';
      return false;
    }
    return true;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.cpdForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  async onSubmit(): Promise<void> {
    if (!this.cpdForm.valid) {
      this.submitError = 'Please fill all required fields';
      return;
    }

    if (!this.uploadedFiles['curriculum'] || !this.uploadedFiles['profiles'] || !this.uploadedFiles['payment']) {
      this.submitError = 'Please upload all required files';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    try {
      const formData = new FormData();
      
      // Add form data
      Object.keys(this.cpdForm.value).forEach(key => {
        if (key !== 'trainers' && key !== 'trainingMode' && key !== 'trainingElements' && key !== 'paymentCurrency') {
          formData.append(key, this.cpdForm.value[key]);
        }
      });

      // Add paymentCurrency and set applicationType to 'local' (all applications are locals)
      formData.append('paymentCurrency', this.cpdForm.value.paymentCurrency);
      formData.append('applicationType', 'local');

      // Add nested objects as JSON
      formData.append('trainers', JSON.stringify(this.cpdForm.value.trainers));
      formData.append('trainingMode', JSON.stringify(this.cpdForm.value.trainingMode));
      formData.append('trainingElements', JSON.stringify(this.cpdForm.value.trainingElements));
      formData.append('estimatedFee', this.estimatedFee.toString());

      // Add files
      formData.append('curriculum', this.uploadedFiles['curriculum']!);
      formData.append('profiles', this.uploadedFiles['profiles']!);
      formData.append('payment', this.uploadedFiles['payment']!);

      const response = await this.cpdService.submitApplication(formData).toPromise();
      this.submitSuccess = true;
      this.applicationId = response?.applicationId || '';
      this.cpdForm.reset();
      this.uploadedFiles = { curriculum: null, profiles: null, payment: null };
    } catch (error: any) {
      this.submitError = error?.error?.message || 'Failed to submit application. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
