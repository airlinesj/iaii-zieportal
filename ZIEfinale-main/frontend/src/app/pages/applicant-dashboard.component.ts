import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-applicant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Top Navigation Bar -->
    <div class="top-nav">
      <div class="nav-content">
        <h1 class="nav-title">Welcome to the ZIE Application Portal</h1>
        <button (click)="logout()" class="logout-button">
          <span class="material-symbols-outlined">logout</span>
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </div>

    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Welcome, {{ userName }}!</h1>
        <p class="dashboard-subtitle">Manage your membership application journey</p>
        <div class="status-info">
          <p class="status-text">📋 You are currently applying as a <strong>{{ currentApplicationType === 'local' ? 'Local' : 'Expatriate' }} Applicant</strong></p>
          <p class="member-info">Upon approval, you will be recognized as a member of the Zimbabwe Institution of Engineers</p>
        </div>
      </div>

      <div class="dashboard-cards">
        <!-- Local Applicant Card -->
        <div class="card application-card" *ngIf="currentApplicationType === 'local'">
          <div class="card-icon">📋</div>
          <h2>Zimbabwe Institution of Engineers Application Form</h2>
          <p>Complete or continue your Form M1 membership application</p>
          <button (click)="goToApplicationForm()" class="card-button">
            Go to Application
          </button>
        </div>

        <!-- Expatriate Applicant Card -->
        <div class="card application-card" *ngIf="currentApplicationType === 'expatriate'">
          <div class="card-icon">🌍</div>
          <h2>Expatriate Membership Application</h2>
          <p>Complete your expatriate application form with company recommendation letter</p>
          <button (click)="goToApplicationForm()" class="card-button">
            Go to Expatriate Form
          </button>
        </div>

        <!-- Payment Card -->
        <div class="card payment-card">
          <div class="card-icon">💳</div>
          <h2>Application Payment</h2>
          <p>Process your membership application fee payment</p>
          <button (click)="goToPayment()" class="card-button">
            Go to Payment
          </button>
        </div>

        <!-- Updates Card -->
        <div class="card updates-card">
          <div class="card-icon">📢</div>
          <h2>Application Updates</h2>
          <p>View your application status, grades, and interview notifications</p>
          <button (click)="goToUpdates()" class="card-button">
            View Updates
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .top-nav {
      background-color: #004A59;
      padding: 15px 20px;
      border-bottom: 3px solid #B99532;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-title {
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
    }

    .logout-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #B99532;
      color: #004A59;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .logout-button:hover {
      background-color: #a58628;
      transform: translateY(-2px);
    }

    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      display: inline-block;
      line-height: 1;
      text-transform: none;
      letter-spacing: normal;
      word-wrap: normal;
      white-space: nowrap;
      direction: ltr;
      font-size: 20px;
    }

    .logout-text {
      font-size: 14px;
    }

    .dashboard-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .dashboard-header h1 {
      font-size: 42px;
      font-weight: 700;
      color: #004A59;
      margin-bottom: 10px;
    }

    .dashboard-subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 20px;
    }

    .status-info {
      background-color: #f5f5f5;
      padding: 15px 20px;
      border-left: 4px solid #B99532;
      border-radius: 4px;
      margin: 0 auto;
      max-width: 600px;
    }

    .status-text {
      font-size: 14px;
      color: #004A59;
      margin: 5px 0;
      font-weight: 500;
    }

    .member-info {
      font-size: 13px;
      color: #B99532;
      font-weight: 600;
      margin: 8px 0 0 0;
      padding-top: 8px;
      border-top: 1px solid #ddd;
    }

    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }

    .card {
      background-color: #FFFFFF;
      border: 2.5px solid #004A59;
      border-radius: 8px;
      padding: 40px 30px;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-5px);
      border-color: #B99532;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .card-icon {
      font-size: 60px;
      margin-bottom: 20px;
    }

    .card h2 {
      font-size: 24px;
      font-weight: 700;
      color: #004A59;
      margin: 0 0 15px 0;
    }

    .card p {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 30px;
      min-height: 40px;
    }

    .card-button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #004A59;
      color: #FFFFFF;
      border: 2.5px solid #004A59;
      border-radius: 8px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
    }

    .card-button:hover {
      background-color: #003A47;
      border-color: #B99532;
    }

    .application-card:hover {
      border-color: #004A59;
    }

    .payment-card {
      border-color: #4CAF50;
    }

    .payment-card:hover {
      border-color: #45a049;
      background-color: #f1f8f4;
    }

    .updates-card {
      border-color: #2196F3;
    }

    .updates-card:hover {
      border-color: #1976D2;
      background-color: #f0f7ff;
    }

    @media (max-width: 768px) {
      .nav-content {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .nav-title {
        font-size: 18px;
      }

      .logout-button {
        width: 100%;
        justify-content: center;
      }

      .dashboard-container {
        padding: 30px 15px;
      }

      .dashboard-header {
        margin-bottom: 40px;
      }

      .dashboard-header h1 {
        font-size: 1.8rem;
        margin-bottom: 8px;
      }

      .dashboard-subtitle {
        font-size: 14px;
      }

      .dashboard-cards {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .card {
        padding: 25px 20px;
        border-radius: 6px;
      }

      .card-icon {
        font-size: 48px;
        margin-bottom: 15px;
      }

      .card h2 {
        font-size: 18px;
        margin-bottom: 12px;
      }

      .card p {
        font-size: 13px;
        margin-bottom: 20px;
      }

      .card-button {
        padding: 10px 20px;
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .top-nav {
        padding: 12px 15px;
      }

      .nav-title {
        font-size: 16px;
      }

      .logout-button {
        padding: 8px 16px;
        font-size: 12px;
      }

      .dashboard-container {
        padding: 20px 10px;
      }

      .dashboard-header {
        margin-bottom: 30px;
      }

      .dashboard-header h1 {
        font-size: 1.5rem;
        margin-bottom: 6px;
      }

      .dashboard-subtitle {
        font-size: 12px;
      }

      .dashboard-cards {
        gap: 15px;
      }

      .card {
        padding: 20px 15px;
        border-radius: 6px;
      }

      .card-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }

      .card h2 {
        font-size: 16px;
        margin-bottom: 10px;
      }

      .card p {
        font-size: 12px;
        margin-bottom: 18px;
        min-height: auto;
      }

      .card-button {
        padding: 10px 16px;
        font-size: 12px;
        width: 100%;
      }
    }
  `]
})
export class ApplicantDashboardComponent implements OnInit {
  userName = '';
  currentApplicationType: 'local' | 'expatriate' = 'local';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    console.log('📊 Applicant Dashboard initializing');
    
    // Check if user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.warn('⚠ Dashboard - No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('✓ Dashboard - User loaded:');
    console.log('  - Email:', currentUser.email);
    console.log('  - applicationType:', currentUser.applicationType);
    
    this.userName = currentUser.email?.split('@')[0] || 'User';
    this.currentApplicationType = currentUser.applicationType || '';
    
    // Validate applicationType is set
    if (!this.currentApplicationType && currentUser.role === 'Applicant') {
      console.error('⚠ WARNING: Dashboard - Applicant has no applicationType!');
      console.error('  - Email:', currentUser.email);
      console.error('  - This indicates a data integrity issue');
    }
    
    // Subscribe to user changes for userName and appType updates
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('✓ Dashboard - User data updated');
        this.userName = user.email?.split('@')[0] || 'User';
        this.currentApplicationType = user.applicationType || '';
        
        if (!this.currentApplicationType && user.role === 'Applicant') {
          console.error('⚠ WARNING: Dashboard - Applicant has no applicationType!');
          console.error('  - Email:', user.email);
        }
        
        console.log('  - Current applicationType:', user.applicationType);
      } else {
        console.log('⚠ Dashboard - User logged out');
        this.router.navigate(['/login']);
      }
    });
  }

  goToApplicationForm(): void {
    console.log('=== Dashboard.goToApplicationForm called ===');
    console.log('Current applicationType:', this.currentApplicationType);
    
    if (this.currentApplicationType === 'expatriate') {
      console.log('✓ Routing to /expatriate-form');
      this.router.navigate(['/expatriate-form']);
    } else {
      console.log('✓ Routing to /form-m1');
      this.router.navigate(['/form-m1']);
    }
  }

  goToPayment(): void {
    console.log('🔄 Dashboard - Navigating to payment');
    this.router.navigate(['/payment']);
  }

  goToUpdates(): void {
    console.log('🔄 Dashboard - Navigating to updates');
    this.router.navigate(['/updates']);
  }

  logout(): void {
    console.log('🚪 Dashboard - User logging out');
    // Use logoutAndNavigate to ensure complete state cleanup
    this.authService.logoutAndNavigate();
  }
}
