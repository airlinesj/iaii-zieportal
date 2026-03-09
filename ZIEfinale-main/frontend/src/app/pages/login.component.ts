import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loader"></div>
        <p class="loading-text">Authenticating...</p>
      </div>

      <div class="login-card card">
        <div class="tab-content">
          <h2>Log-in</h2>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder="Enter your email"
                class="form-input"
              />
              <div class="error-message" *ngIf="loginForm.get('email')?.errors && (loginForm.get('email')?.touched || loginForm.get('email')?.dirty)">
                Please enter a valid email
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                placeholder="Enter your password"
                class="form-input"
              />
              <div class="error-message" *ngIf="loginForm.get('password')?.errors && (loginForm.get('password')?.touched || loginForm.get('password')?.dirty)">
                Please enter a valid password
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="!loginForm.valid || isLoading">
              {{ isLoading ? 'Loading...' : 'Login' }}
            </button>

            <p class="signup-link">
              Don't have an account? <a (click)="goToRegister()">Sign Up Here</a>
            </p>

            <p class="back-to-home">
              <a (click)="goToHome()">← Back to Home</a>
            </p>

            <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #FFFFFF;
      padding: 20px;
      margin-top: 80px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      border: 2.5px solid #004A59 !important;
      border-radius: 8px;
      padding: 30px;
    }

    h2 {
      color: #004A59;
      margin-bottom: 20px;
      text-align: center;
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

    .signup-link {
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

    @media (max-width: 768px) {
      .login-container {
        min-height: calc(100vh - 70px);
        margin-top: 70px;
        padding: 15px;
      }

      .login-card {
        max-width: 100%;
        padding: 25px;
      }

      h2 {
        font-size: 1.5rem;
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

      .signup-link {
        font-size: 13px;
        margin-top: 12px;
      }
    }

    @media (max-width: 480px) {
      .login-container {
        min-height: calc(100vh - 60px);
        margin-top: 60px;
        padding: 10px;
      }

      .login-card {
        max-width: 100%;
        padding: 20px;
        border-radius: 6px;
      }

      h2 {
        font-size: 1.3rem;
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

      .signup-link {
        font-size: 12px;
        margin-top: 10px;
      }

      .error-message {
        font-size: 11px;
      }
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 74, 89, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 9999;
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
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isApplicant = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('\n=== LOGIN COMPONENT: Initializing ===');
    
    // Ensure complete cleanup for account switching
    // Clear any residual authentication state
    console.log('Clearing any residual auth state...');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userClassification');
    localStorage.removeItem('dashboardInfo');
    localStorage.removeItem('applicationFormData');
    sessionStorage.clear();
    
    // Force clear the auth service's BehaviorSubjects
    this.authService.logout();
    
    console.log('✓ All state cleared - login form ready');
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    
    // Auto-focus email field for better UX
    setTimeout(() => {
      const emailInput = document.querySelector('input#email') as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
      }
    }, 100);
  }


  goBack(): void {
    this.router.navigate(['/']);
  }

  onSubmit(): void {
    if (!this.loginForm.valid) return;

    this.isLoading = true;
    this.errorMessage = '';

    console.log('\n=== LOGIN COMPONENT: Submit ===');
    console.log('Form value being sent:', this.loginForm.value);
    console.log('Attempting login with email:', this.loginForm.value.email);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('\n=== LOGIN COMPONENT: Response Received ===');
        console.log('Full response:', response);
        console.log('User object:', response.user);
        console.log('User role:', response.user?.role);
        console.log('applicationType in response:', response.user?.applicationType);
        console.log('classification:', response.classification);
        
        this.isLoading = false;
        
        // Verify login was successful before navigating
        if (response.token && response.user) {
          console.log('✓ Login successful for:', response.user.email);
          console.log('🔄 Redirecting to /login-redirect');
          // Redirect to login redirect component which will handle smart routing
          this.router.navigate(['/login-redirect'], { replaceUrl: true });
        } else {
          console.error('❌ Invalid login response - missing token or user');
          this.errorMessage = 'Login response invalid. Please try again.';
        }
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        this.isLoading = false;
        console.error('Error details:', error.error);
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials and try again.';
        
        // Reset form for retry
        this.loginForm.patchValue({ password: '' });
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
