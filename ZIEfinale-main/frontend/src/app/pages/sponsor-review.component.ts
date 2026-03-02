import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RefereeService } from '../services/sponsor.service';

@Component({
  selector: 'app-referee-review',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
  providers: [RefereeService],
  template: `
    <div class="referee-review-container">
      <div class="review-card card">
        <h1>Confidential Referee Appraisal</h1>

        <div class="applicant-info" *ngIf="applicantInfo">
          <p>
            <strong>Applicant:</strong> {{ applicantInfo.applicantName }}
          </p>
          <p>
            <strong>Membership Grade:</strong> {{ applicantInfo.grade }}
          </p>
          <p class="confidential-notice">
            <strong>⚠️ CONFIDENTIAL:</strong> Your responses in this form are confidential and will not be
            shared with the applicant.
          </p>
        </div>

        <form [formGroup]="appraisalForm" (ngSubmit)="submitAppraisal()" *ngIf="!applicantInfo?.hasResponded">
          <div class="form-section">
            <h3>Please answer the following appraisal questions:</h3>

            <div class="form-group">
              <label>1. How long have you known the applicant?</label>
              <textarea
                formControlName="question1"
                placeholder="Your response..."
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label>2. What is your professional relationship with the applicant?</label>
              <textarea
                formControlName="question2"
                placeholder="Your response..."
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label>3. Describe the applicant's professional competence and technical knowledge.</label>
              <textarea
                formControlName="question3"
                placeholder="Your response..."
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label>4. What are the applicant's key strengths in their engineering practice?</label>
              <textarea
                formControlName="question4"
                placeholder="Your response..."
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label>5. Does the applicant meet the ethical standards required by the engineering profession?</label>
              <textarea
                formControlName="question5"
                placeholder="Your response..."
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label>6. Can you recommend the applicant for membership at the {{ applicantInfo?.grade }} level?</label>
              <select formControlName="question6" class="form-input">
                <option value="">Select...</option>
                <option value="Yes">Yes, strongly recommended</option>
                <option value="Yes with conditions">Yes, with conditions</option>
                <option value="No">No, not recommended</option>
              </select>
            </div>

            <div class="form-group">
              <label>7. If "Yes with conditions" or "No", please explain:</label>
              <textarea
                formControlName="question7"
                placeholder="Your response (if applicable)..."
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label>8. Any additional comments about the applicant's professional suitability:</label>
              <textarea
                formControlName="question8"
                placeholder="Your response..."
                class="form-input"
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="!appraisalForm.valid || isSubmitting">
              {{ isSubmitting ? 'Submitting...' : 'Submit Appraisal' }}
            </button>
          </div>

          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
          <div class="success-message" *ngIf="successMessage">{{ successMessage }}</div>
        </form>

        <div class="already-responded" *ngIf="applicantInfo?.hasResponded">
          <p class="success-message">
            ✓ You have already submitted your appraisal for this applicant. Thank you for your response.
          </p>
        </div>

        <div class="error-message" *ngIf="!applicantInfo && !isLoading">
          Unable to load appraisal form. The link may have expired or is invalid.
        </div>

        <div class="loading" *ngIf="isLoading">Loading appraisal form...</div>
      </div>
    </div>
  `,
  styles: [`
    .referee-review-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #FFFFFF;
    }

    .review-card {
      width: 100%;
      max-width: 700px;
      border: 2.5px solid #004A59 !important;
      border-radius: 8px;
      padding: 30px;
    }

    h1 {
      color: #004A59;
      text-align: center;
      margin-bottom: 20px;
    }

    .applicant-info {
      border: 2.5px solid #B99532;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      background-color: #fafaf5;

      p {
        margin: 5px 0;
        color: #004A59;
      }

      .confidential-notice {
        color: #d32f2f;
        font-weight: 600;
        margin-top: 10px;
      }
    }

    .form-section {
      margin-bottom: 20px;

      h3 {
        color: #004A59;
        font-size: 18px;
        margin-bottom: 15px;
      }
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
      line-height: 1.4;
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 2.5px solid #004A59 !important;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #B99532 !important;
      }
    }

    textarea.form-input {
      min-height: 80px;
      resize: vertical;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;
    }

    .btn-primary {
      flex: 1;
      padding: 12px;
      background-color: #004A59;
      color: white;
      font-weight: 700;
      border-radius: 8px;
      border: 2.5px solid #004A59 !important;
      cursor: pointer;

      &:hover:not(:disabled) {
        background-color: darken(#004A59, 10%);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .error-message {
      color: #d32f2f;
      margin-top: 15px;
      padding: 10px;
      background-color: #ffebee;
      border: 1px solid #d32f2f;
      border-radius: 4px;
    }

    .success-message {
      color: #388e3c;
      margin-top: 15px;
      padding: 10px;
      background-color: #e8f5e9;
      border: 1px solid #388e3c;
      border-radius: 4px;
    }

    .already-responded {
      text-align: center;
      padding: 20px;
    }

    .loading {
      text-align: center;
      padding: 20px;
      color: #666;
    }
  `]
})
export class RefereeReviewComponent implements OnInit {
  appraisalForm!: FormGroup;
  applicantInfo: any = null;
  isSubmitting = false;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private refereeService: RefereeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'Invalid appraisal link';
      this.isLoading = false;
      return;
    }

    this.initializeForm();
    this.loadAppraisalInfo();
  }

  initializeForm(): void {
    this.appraisalForm = this.fb.group({
      question1: ['', Validators.required],
      question2: ['', Validators.required],
      question3: ['', Validators.required],
      question4: ['', Validators.required],
      question5: ['', Validators.required],
      question6: ['', Validators.required],
      question7: [''],
      question8: [''],
    });
  }

  loadAppraisalInfo(): void {
    this.refereeService.getRefereeAppraisal(this.token).subscribe({
      next: (response) => {
        this.applicantInfo = response;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load appraisal form. The link may have expired.';
      },
    });
  }

  submitAppraisal(): void {
    if (!this.appraisalForm.valid) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.refereeService.submitAppraisal(this.token, this.appraisalForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Thank you! Your appraisal has been submitted successfully.';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Failed to submit appraisal. Please try again.';
      },
    });
  }
}
