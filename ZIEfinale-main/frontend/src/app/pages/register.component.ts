import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <div class="register-card card">
        <h2>Create Account</h2>
        <p class="subtitle">Join The ZImbabwe Institution of Engineers</p>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
              class="form-input"
            />
            <div class="error-message" *ngIf="registerForm.get('email')?.errors">
              Please enter a valid email
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              (input)="updatePasswordRequirements(registerForm.get('password')?.value)"
              placeholder="Create a strong password"
              class="form-input"
            />
            <div class="password-requirements">
              <div class="requirement" [class.met]="passwordChecks.minLength">
                <span class="check-icon">{{ passwordChecks.minLength ? '✓' : '○' }}</span>
                At least 12 characters
              </div>
              <div class="requirement" [class.met]="passwordChecks.hasUppercase">
                <span class="check-icon">{{ passwordChecks.hasUppercase ? '✓' : '○' }}</span>
                Contains uppercase letter (A-Z)
              </div>
              <div class="requirement" [class.met]="passwordChecks.hasLowercase">
                <span class="check-icon">{{ passwordChecks.hasLowercase ? '✓' : '○' }}</span>
                Contains lowercase letter (a-z)
              </div>
              <div class="requirement" [class.met]="passwordChecks.hasNumber">
                <span class="check-icon">{{ passwordChecks.hasNumber ? '✓' : '○' }}</span>
                Contains number (0-9)
              </div>
              <div class="requirement" [class.met]="passwordChecks.hasSpecial">
                <span class="check-icon">{{ passwordChecks.hasSpecial ? '✓' : '○' }}</span>
                Contains special character (&#64;$!%*?&)
              </div>
            </div>
            <div class="error-message" *ngIf="registerForm.get('password')?.errors && registerForm.get('password')?.touched">
              Password requirements not met
            </div>
          </div>

          <!-- Country Field - Only for Applicants -->
          <div class="form-group" *ngIf="!isAdminModeActive || registerForm.get('role')?.value === 'Applicant'">
            <label for="country">Country of Origin</label>
            <select id="country" formControlName="country" class="form-input">
              <option value="" disabled>Select your country</option>
              <option *ngFor="let country of countries" [value]="country">{{ country }}</option>
            </select>
            <div class="error-message" *ngIf="registerForm.get('country')?.errors">
              Country is required for applicants
            </div>
            <p class="country-note" *ngIf="registerForm.get('country')?.value === 'Zimbabwe'">
              <strong>Local Applicant:</strong> You will apply using the M1 form and need 3 professional referees
            </p>
            <p class="country-note expatriate" *ngIf="registerForm.get('country')?.value && registerForm.get('country')?.value !== 'Zimbabwe'">
              <strong>Expatriate Applicant:</strong> You will apply using the Expatriate form and require a company recommendation letter
            </p>
          </div>

          <div class="form-group" *ngIf="!isAdminModeActive">
            <p class="account-type-note">
              You are registering as an <strong>Applicant</strong> to apply for ZIE membership.
            </p>
          </div>

          <div class="form-group" *ngIf="isAdminModeActive">
            <label for="role">Account Type</label>
            <select id="role" formControlName="role" (change)="onRoleChange()" class="form-input">
              <option value="Applicant">Applicant (Membership Seeker)</option>
              <option value="Admin">Admin (Staff Only)</option>
              <option value="SuperAdmin">Super Admin (Leadership Only)</option>
            </select>
            <p class="admin-note" *ngIf="registerForm.get('role')?.value === 'Admin'">
              <strong>Admin accounts require an email address containing &#64;admin</strong> (e.g., admin&#64;admin.com)
            </p>
            <p class="admin-note" *ngIf="registerForm.get('role')?.value === 'SuperAdmin'">
              <strong>Super Admin accounts require an email address containing &#64;superadmin</strong> (e.g., superadmin&#64;superadmin.com)
            </p>
          </div>

          <button type="submit" class="btn-primary" [disabled]="!registerForm.valid || isLoading">
            {{ isLoading ? 'Creating Account...' : 'Register' }}
          </button>

          <p class="login-link">
            Already have an account? <a (click)="goToLogin()">Login Here</a>
          </p>

          <p class="back-to-home">
            <a (click)="goToHome()">← Back to Home</a>
          </p>

          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
          <div class="success-message" *ngIf="successMessage">{{ successMessage }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #FFFFFF;
      padding: 20px;
      margin-top: 80px;
      position: relative;
      z-index: 10;
    }

    .register-card {
      width: 100%;
      max-width: 450px;
      border: 2.5px solid #004A59 !important;
      border-radius: 8px;
      padding: 30px;
    }

    h2 {
      color: #004A59;
      margin-bottom: 10px;
      text-align: center;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
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

    .btn-primary {
      width: 100%;
      padding: 12px;
      background-color: #004A59;
      color: white;
      font-weight: 700;
      border-radius: 8px;
      border: 2.5px solid #004A59 !important;
      cursor: pointer;
      margin-top: 20px;

      &:hover {
        background-color: darken(#004A59, 10%);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .login-link {
      text-align: center;
      margin-top: 15px;
      font-size: 14px;

      a {
        color: #B99532;
        cursor: pointer;
        text-decoration: underline;
      }
    }

    .back-to-home {
      text-align: center;
      margin-top: 12px;
      font-size: 13px;

      a {
        color: #666;
        cursor: pointer;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: #004A59;
        }
      }
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 5px;
    }

    .password-requirements {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 12px;
      margin-top: 8px;
      font-size: 13px;
    }

    .requirement {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      color: #666;

      &:last-child {
        margin-bottom: 0;
      }

      &.met {
        color: #388e3c;
        font-weight: 500;
      }
    }

    .check-icon {
      display: inline-block;
      width: 20px;
      margin-right: 8px;
      text-align: center;
      font-weight: bold;
    }

    .requirement.met .check-icon {
      color: #388e3c;
    }

    .success-message {
      color: #388e3c;
      font-size: 12px;
      margin-top: 5px;
    }

    .admin-note {
      color: #B99532;
      font-size: 12px;
      margin-top: 8px;
      padding: 8px;
      background-color: #f5f5f5;
      border-left: 3px solid #B99532;
    }

    .account-type-note {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .country-note {
      color: #004A59;
      font-size: 12px;
      margin-top: 8px;
      padding: 8px;
      background-color: #e3f2fd;
      border-left: 3px solid #004A59;
      border-radius: 3px;
    }

    .country-note.expatriate {
      background-color: #fff3e0;
      border-left-color: #B99532;
      color: #B99532;
    }

    @media (max-width: 768px) {
      .register-container {
        min-height: calc(100vh - 70px);
        margin-top: 70px;
        padding: 15px;
      }

      .register-card {
        max-width: 100%;
        padding: 25px;
      }

      h2 {
        font-size: 1.5rem;
        margin-bottom: 8px;
      }

      .subtitle {
        font-size: 13px;
        margin-bottom: 18px;
      }

      .form-group {
        margin-bottom: 13px;
      }

      label {
        font-size: 13px;
        margin-bottom: 5px;
      }

      .form-input {
        padding: 10px;
        font-size: 16px;
        min-height: 44px;
      }

      .btn-primary {
        padding: 11px;
        margin-top: 18px;
        font-size: 14px;
      }

      .login-link {
        font-size: 13px;
        margin-top: 12px;
      }

      .error-message,
      .success-message {
        font-size: 12px;
      }

      .admin-note {
        font-size: 12px;
        padding: 6px;
        margin-top: 6px;
      }

      .account-type-note {
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .register-container {
        min-height: calc(100vh - 60px);
        margin-top: 60px;
        padding: 10px;
      }

      .register-card {
        max-width: 100%;
        padding: 20px;
        border-radius: 6px;
      }

      h2 {
        font-size: 1.3rem;
        margin-bottom: 8px;
      }

      .subtitle {
        font-size: 12px;
        margin-bottom: 15px;
      }

      .form-group {
        margin-bottom: 12px;
      }

      label {
        font-size: 12px;
        margin-bottom: 4px;
      }

      .form-input {
        padding: 10px;
        font-size: 16px;
        min-height: 44px;
        margin-bottom: 0;
      }

      .btn-primary {
        padding: 10px;
        margin-top: 15px;
        font-size: 13px;
        width: 100%;
      }

      .login-link {
        font-size: 12px;
        margin-top: 10px;
      }

      .error-message,
      .success-message {
        font-size: 11px;
      }

      .admin-note {
        font-size: 11px;
        padding: 6px;
        margin-top: 6px;
      }

      .account-type-note {
        font-size: 12px;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isAdminModeActive = false;
  private keySequence: string[] = [];
  private adminKeySequence = ['shift', 'a', 'd', 'm', 'i', 'n']; // Ctrl+Shift+A then d,m,i,n
  
  // Password requirement tracking
  passwordChecks = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  };
  
  countries = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Andorra',
    'Angola',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cameroon',
    'Canada',
    'Cape Verde',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo',
    'Costa Rica',
    'Côte d\'Ivoire',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'East Timor',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Kosovo',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'North Korea',
    'North Macedonia',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Palestine',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Korea',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Sweden',
    'Switzerland',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Vatican City',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Zambia',
    'Zimbabwe',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.strongPasswordValidator.bind(this)]],
      country: ['', Validators.required],
      role: ['Applicant'],
    });
  }

  updatePasswordRequirements(password: string): void {
    if (!password) {
      this.passwordChecks = {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
      };
      return;
    }

    this.passwordChecks = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password)
    };
  }

  strongPasswordValidator(control: any): { [key: string]: boolean } | null {
    const password = control.value;
    if (!password) {
      return null;
    }

    const checks = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password)
    };

    const allChecksPassed = Object.values(checks).every(check => check === true);
    return allChecksPassed ? null : { weakPassword: true };
  }

  onRoleChange(): void {
    const role = this.registerForm.get('role')?.value;
    const countryControl = this.registerForm.get('country');
    
    if (role === 'Admin' || role === 'SuperAdmin' || role === 'Audit') {
      // Make country optional for admin, super admin, and audit roles
      countryControl?.clearValidators();
      countryControl?.setValue('');
      countryControl?.markAsPristine();
      countryControl?.markAsUntouched();
      countryControl?.updateValueAndValidity();
    } else {
      // Make country required for applicants
      countryControl?.setValidators(Validators.required);
      countryControl?.updateValueAndValidity();
    }
    
    // Update the overall form validity
    this.registerForm.updateValueAndValidity();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Secret keyboard shortcut: Ctrl+Shift+A to toggle admin mode
    if (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === 'A') {
      event.preventDefault();
      this.isAdminModeActive = !this.isAdminModeActive;
      if (!this.isAdminModeActive) {
        // Reset to Applicant when exiting admin mode
        this.registerForm.get('role')?.setValue('Applicant');
      }
      // Update validators when toggling admin mode
      this.updateCountryValidators();
    }
  }

  private updateCountryValidators(): void {
    const role = this.registerForm.get('role')?.value;
    const countryControl = this.registerForm.get('country');
    
    if (!this.isAdminModeActive || role === 'Applicant') {
      // Make country required for applicants
      countryControl?.setValidators(Validators.required);
      countryControl?.updateValueAndValidity();
    } else {
      // Make country optional for admin and super admin
      countryControl?.clearValidators();
      countryControl?.setValue('');
      countryControl?.markAsPristine();
      countryControl?.markAsUntouched();
      countryControl?.updateValueAndValidity();
    }
    
    // Update the overall form validity
    this.registerForm.updateValueAndValidity();
  }

  onSubmit(): void {
    if (!this.registerForm.valid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('\n=== REGISTER COMPONENT: Submit ===');
    console.log('Form value being sent:', this.registerForm.value);

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        console.log('\n=== REGISTER COMPONENT: Response Received ===');
        console.log('Full response:', response);
        console.log('User object:', response.user);
        console.log('applicationType in response:', response.user?.applicationType);
        console.log('classification:', response.classification);
        
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Setting up your dashboard...';
        
        console.log('🔄 Redirecting to /login-redirect');
        // Redirect to login-redirect for smart routing based on classification
        setTimeout(() => {
          console.log('✓ Executing redirect');
          this.router.navigate(['/login-redirect']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Registration error:', error);
        console.error('Full error object:', JSON.stringify(error.error, null, 2));
        console.error('Error message:', error.error?.message);
        console.error('Form value:', this.registerForm.value);
        this.isLoading = false;
        
        // Handle validation errors from server
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          const validationErrors = error.error.errors;
          const messages = validationErrors.map((e: any) => e.msg).join('; ');
          this.errorMessage = `❌ ${messages}`;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = '❌ Registration failed. Please try again.';
        }
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
