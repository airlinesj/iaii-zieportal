import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleBasedDashboardService } from '../services/role-based-dashboard.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="redirect-container">
      <div class="redirect-card">
        <div *ngIf="!errorMessage" class="loader"></div>
        <h2>{{ statusMessage }}</h2>
        <p *ngIf="!errorMessage">Redirecting to {{ destination }}...</p>
        <p class="classification-info" *ngIf="!errorMessage">Classification: {{ userClassification }}</p>
        <div *ngIf="errorMessage" class="error-box">
          <h3>Authentication Error</h3>
          <p>{{ errorMessage }}</p>
          <p style="font-size: 12px; margin-top: 15px;">Please <a (click)="goToLogin()" style="cursor: pointer; color: #004A59; text-decoration: underline;">return to login</a> and try again.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .redirect-card {
      text-align: center;
      background: white;
      padding: 60px 40px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
    }

    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 30px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    h2 {
      color: #004A59;
      font-size: 24px;
      margin: 20px 0 10px;
    }

    p {
      color: #666;
      font-size: 16px;
      margin: 10px 0;
    }

    .classification-info {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      font-style: italic;
    }

    .error-box {
      background-color: #ffebee;
      border: 2px solid #c62828;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
    }

    .error-box h3 {
      color: #c62828;
      margin-top: 0;
      margin-bottom: 10px;
    }

    .error-box p {
      color: #721c24;
      margin: 10px 0;
    }
  `],
})
export class LoginRedirectComponent implements OnInit, OnDestroy {
  statusMessage = 'Processing login...';
  destination = 'your dashboard';
  userClassification = 'loading...';
  errorMessage = '';
  private navigationTimeout: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private roleBasedDashboardService: RoleBasedDashboardService
  ) {}

  ngOnInit(): void {
    console.log('\n=== LOGIN REDIRECT COMPONENT ===');
    console.log('Component initialized');
    
    try {
    
    // Get the current user to verify we have fresh login data
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user from auth service:', currentUser?.email);
    console.log('Current user role:', currentUser?.role);
    console.log('Current user account type:', currentUser?.accountType);
    
    // Verify we actually have a logged-in user
    if (!currentUser || !currentUser.email) {
      console.error('❌ No user found after login - authentication may have failed');
      this.errorMessage = 'Authentication failed. No user data found. Please try logging in again.';
      this.statusMessage = 'Authentication Error';
      return;
    }
    
    // Set a hard timeout - if we haven't navigated within 5 seconds, force navigation
    this.navigationTimeout = setTimeout(() => {
      console.warn('⚠ Timeout: Navigation taking too long, forcing fallback redirect');
      this.forceFallbackNavigation(currentUser);
    }, 5000);
    
    // Get the classification that should have been set by auth.service
    const classification = this.roleBasedDashboardService.getClassification();
    
    console.log('Classification from service:', classification);
    console.log('  - classification:', classification?.classification);
    console.log('  - dashboard:', classification?.dashboard);
    console.log('  - displayName:', classification?.displayName);
    
    if (classification && classification.classification) {
      console.log('✅ Classification found:', classification.classification);
      this.userClassification = classification.classification;
      this.destination = this.getDashboardName(classification.classification);
      this.statusMessage = classification.displayName + ' - Redirecting...';
      
      // Map classification to correct dashboard paths
      const dashboardMap: { [key: string]: string } = {
        'audit': '/audit-trail',
        'expatriate_applicant': '/dashboard',
        'local_applicant': '/dashboard',
        'member': '/member-landing',
        'superadmin': '/super-admin-dashboard',
        'admin': '/admin-dashboard'
      };
      
      let dashboardPath = dashboardMap[classification.classification] || '/dashboard';
      console.log('Will navigate to:', dashboardPath);
      
      // Clear the hard timeout since we found classification
      if (this.navigationTimeout) {
        clearTimeout(this.navigationTimeout);
      }
      
      // Redirect after a short delay for visual feedback
      this.navigationTimeout = setTimeout(() => {
        console.log('🚀 Navigating to:', dashboardPath);
        this.router.navigate([dashboardPath], { replaceUrl: true }).catch(err => {
          console.error('Navigation error:', err);
          // Fallback navigation
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        });
      }, 500);
    } else {
      console.warn('⚠ No classification found, using user role fallback');
      this.userClassification = currentUser?.role || 'unknown';
      
      // Fallback: use user role to determine dashboard
      if (currentUser) {
        this.navigateByUserRole(currentUser);
      }
    }
    } catch (error: any) {
      console.error('❌ Error in login redirect:', error);
      this.statusMessage = 'Error Processing Login';
      this.errorMessage = error?.message || 'An unexpected error occurred during authentication. Please try logging in again.';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  ngOnDestroy(): void {
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
    }
  }

  /**
   * Navigate user based on their role when classification is not available
   */
  private navigateByUserRole(currentUser: any): void {
    let dashboardPath = '/dashboard';
    
    if (currentUser.role === 'SuperAdmin') {
      dashboardPath = '/super-admin-dashboard';
      this.destination = 'Super Admin Dashboard';
      this.statusMessage = 'Super Administrator - Redirecting...';
    } else if (currentUser.role === 'Admin') {
      dashboardPath = '/admin-dashboard';
      this.destination = 'Admin Dashboard';
      this.statusMessage = 'Administrator - Redirecting...';
    } else if (currentUser.role === 'Member') {
      dashboardPath = '/member-landing';
      this.destination = 'Member Portal';
      this.statusMessage = 'Member - Redirecting...';
    } else {
      this.destination = 'Dashboard';
      this.statusMessage = 'Applicant - Redirecting...';
    }
    
    console.log('Using role-based fallback dashboard:', dashboardPath);
    
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
    }
    
    this.navigationTimeout = setTimeout(() => {
      console.log('🚀 Navigating (role-based) to:', dashboardPath);
      this.router.navigate([dashboardPath], { replaceUrl: true }).catch(err => {
        console.error('Navigation error (role-based fallback):', err);
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      });
    }, 500);
  }

  /**
   * Force fallback navigation when timeout occurs
   */
  private forceFallbackNavigation(currentUser: any): void {
    console.log('⚠️ Forcing fallback navigation due to timeout');
    
    if (currentUser.role === 'SuperAdmin') {
      this.router.navigate(['/super-admin-dashboard'], { replaceUrl: true }).catch(() => {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      });
    } else if (currentUser.role === 'Admin') {
      this.router.navigate(['/admin-dashboard'], { replaceUrl: true }).catch(() => {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      });
    } else if (currentUser.role === 'Member') {
      this.router.navigate(['/member-landing'], { replaceUrl: true }).catch(() => {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  private getDashboardName(classification: string): string {
    switch (classification) {
      case 'audit':
        return 'Audit Trail';
      case 'superadmin':
        return 'Super Admin Dashboard';
      case 'admin':
        return 'Admin Dashboard';
      case 'member':
        return 'Member Portal';
      case 'expatriate_applicant':
        return 'Dashboard';
      case 'local_applicant':
        return 'Dashboard';
      default:
        return 'Dashboard';
    }
  }
}
