import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CountryValidationService } from '../services/country-validation.service';

@Component({
  selector: 'app-dynamic-validation-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="close-btn" (click)="onCancel()">✕</button>
        </div>

        <form [formGroup]="validationForm" (ngSubmit)="onSubmit()">
          <div class="modal-body">
            <!-- Country Selection -->
            <div class="form-group">
              <label>Country/Region *</label>
              <select formControlName="country" (change)="onCountryChange()" class="form-input">
                <option value="">Select a country</option>
                <option *ngFor="let country of availableCountries" [value]="country.country">
                  {{ country.country }}
                </option>
              </select>
              <div class="error-message" *ngIf="getFieldError('country')">
                {{ getFieldError('country') }}
              </div>
            </div>

            <!-- Dynamic ID Field -->
            <div class="form-group" *ngIf="selectedCountry">
              <label>{{ selectedCountry.country }} ID/Passport Number *</label>
              <input
                type="text"
                formControlName="idNumber"
                [placeholder]="selectedCountry.placeholder"
                class="form-input"
                (blur)="validateIdField()"
              />
              <div class="help-text">
                <strong>Format:</strong> {{ selectedCountry.description }}<br>
                <strong>Example:</strong> {{ selectedCountry.example }}
              </div>
              <div class="error-message" *ngIf="getFieldError('idNumber')">
                {{ getFieldError('idNumber') }}
              </div>
              <div class="success-message" *ngIf="validationForm.get('idNumber')?.valid && validationForm.get('idNumber')?.touched">
                ✓ Valid ID format
              </div>
            </div>

            <!-- Years of Experience -->
            <div class="form-group">
              <label>Years of Professional Experience *</label>
              <input
                type="number"
                formControlName="yearsOfExperience"
                placeholder="Enter number of years"
                class="form-input"
                min="0"
                max="70"
                (blur)="validateYearsField()"
              />
              <div class="help-text">
                Must be between 0 and 70 years
              </div>
              <div class="error-message" *ngIf="getFieldError('yearsOfExperience')">
                {{ getFieldError('yearsOfExperience') }}
              </div>
              <div class="success-message" *ngIf="validationForm.get('yearsOfExperience')?.valid && validationForm.get('yearsOfExperience')?.touched">
                ✓ Valid experience
              </div>
            </div>

            <!-- Additional Notes -->
            <div class="form-group" *ngIf="additionalField">
              <label>{{ additionalField.label }} {{ additionalField.required ? '*' : '' }}</label>
              <textarea
                *ngIf="additionalField.type === 'textarea'"
                formControlName="additionalInfo"
                [placeholder]="additionalField.placeholder"
                class="form-textarea"
                rows="4"
              ></textarea>
              <input
                *ngIf="additionalField.type !== 'textarea'"
                [type]="additionalField.type"
                formControlName="additionalInfo"
                [placeholder]="additionalField.placeholder"
                class="form-input"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" (click)="onCancel()" class="btn-cancel">Cancel</button>
            <button type="submit" [disabled]="!validationForm.valid" class="btn-submit">
              Verify & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 74, 89, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 2px solid #004A59;
      background-color: #f5f5f5;
    }

    .modal-header h2 {
      margin: 0;
      color: #004A59;
      font-size: 20px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #004A59;
    }

    .modal-body {
      padding: 25px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #004A59;
      font-weight: 600;
      font-size: 14px;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #004A59;
      box-shadow: 0 0 0 3px rgba(0, 74, 89, 0.1);
    }

    .form-input[type="number"] {
      max-width: 150px;
    }

    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 6px;
      padding: 8px;
      background-color: #f9f9f9;
      border-left: 3px solid #B99532;
      border-radius: 2px;
      line-height: 1.5;
    }

    .error-message {
      font-size: 13px;
      color: #d32f2f;
      margin-top: 6px;
      padding: 8px;
      background-color: #ffebee;
      border-left: 3px solid #d32f2f;
      border-radius: 2px;
      display: block;
    }

    .success-message {
      font-size: 13px;
      color: #388e3c;
      margin-top: 6px;
      padding: 8px;
      background-color: #e8f5e9;
      border-left: 3px solid #388e3c;
      border-radius: 2px;
      display: block;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      background-color: #f5f5f5;
    }

    .btn-cancel,
    .btn-submit {
      padding: 10px 24px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background-color: #e0e0e0;
      color: #333;
    }

    .btn-cancel:hover {
      background-color: #bdbdbd;
    }

    .btn-submit {
      background-color: #004A59;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: #003039;
      box-shadow: 0 2px 8px rgba(0, 74, 89, 0.3);
    }

    .btn-submit:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    @media (max-width: 600px) {
      .modal-container {
        width: 95%;
        max-height: 95vh;
      }

      .modal-header h2 {
        font-size: 18px;
      }

      .modal-body {
        padding: 16px;
      }

      .modal-footer {
        flex-direction: column-reverse;
      }

      .btn-cancel,
      .btn-submit {
        width: 100%;
      }
    }
  `]
})
export class DynamicValidationModalComponent {
  validationForm: FormGroup;
  selectedCountry: any = null;
  availableCountries: any[] = [];
  title = 'Verify Your Information';
  additionalField: any = null;
  customErrors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private countryValidationService: CountryValidationService,
    public dialogRef: MatDialogRef<DynamicValidationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.availableCountries = this.countryValidationService.getAllCountries();
    
    this.validationForm = this.fb.group({
      country: ['', Validators.required],
      idNumber: ['', Validators.required],
      yearsOfExperience: ['', [Validators.required, Validators.min(0), Validators.max(70)]],
      additionalInfo: [''],
    });

    // Set data if provided
    if (data?.country) {
      this.validationForm.patchValue({ country: data.country });
      this.onCountryChange();
    }
    if (data?.title) {
      this.title = data.title;
    }
    if (data?.additionalField) {
      this.additionalField = data.additionalField;
      if (data.additionalField.required) {
        this.validationForm.get('additionalInfo')?.setValidators([Validators.required]);
      }
    }
    if (data?.yearsOfExperience) {
      this.validationForm.patchValue({ yearsOfExperience: data.yearsOfExperience });
    }
  }

  onCountryChange(): void {
    const country = this.validationForm.get('country')?.value;
    this.selectedCountry = this.countryValidationService.getCountryPattern(country);
    
    // Reset ID field when country changes
    this.validationForm.patchValue({ idNumber: '' });
    this.validationForm.get('idNumber')?.markAsUntouched();
    this.customErrors['idNumber'] = '';
  }

  validateIdField(): void {
    const idControl = this.validationForm.get('idNumber');
    const countryControl = this.validationForm.get('country');
    
    if (!idControl?.value || !countryControl?.value) {
      return;
    }

    // Validate ID format for user information only, don't reject the form
    const result = this.countryValidationService.validateId(
      idControl.value,
      countryControl.value
    );

    // Show validation result as feedback but allow any input
    if (!result.valid) {
      this.customErrors['idNumber'] = result.error || 'Note: Check format'; 
      // Don't set errors - allow user to continue with any ID format
      // idControl.setErrors(null);
    } else {
      this.customErrors['idNumber'] = '';
    }
  }

  validateYearsField(): void {
    const yearsControl = this.validationForm.get('yearsOfExperience');
    
    if (!yearsControl?.value && yearsControl?.value !== 0) {
      return;
    }

    const result = this.countryValidationService.validateYearsOfExperience(yearsControl.value);

    if (!result.valid) {
      this.customErrors['yearsOfExperience'] = result.error || 'Invalid input';
      yearsControl.setErrors({ 'customError': true });
    } else {
      this.customErrors['yearsOfExperience'] = '';
      yearsControl.setErrors(null);
    }
  }

  getFieldError(fieldName: string): string | null {
    return this.customErrors[fieldName] || null;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.validationForm.valid) {
      this.dialogRef.close(this.validationForm.value);
    }
  }
}
