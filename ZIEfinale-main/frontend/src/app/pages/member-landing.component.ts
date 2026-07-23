import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-member-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Top Navigation Bar -->
    <div class="top-nav">
      <div class="nav-content">
        <h1 class="nav-title">ZIE Member Portal</h1>
        <button (click)="logout()" class="logout-button">
          <span class="material-symbols-outlined">logout</span>
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </div>

    <div class="member-container">
      <div class="member-header">
        <div class="header-content">
          <h1>Welcome, {{ memberName }}!</h1>
          <p class="member-status">You are a <strong>{{ currentMembershipGrade }}</strong> member</p>
          <p class="member-welcome">Welcome to The Zimbabwe Institution of Engineers member portal. Here you can access your member information and explore advancement opportunities.</p>
        </div>
        <div class="header-badge">
          <div class="badge-icon">👤</div>
          <p class="badge-grade">{{ currentMembershipGrade }}</p>
        </div>
      </div>

      <div class="member-cards">
        <!-- View Updates Card -->
        <div class="card updates-card">
          <div class="card-icon">📢</div>
          <h2>Member Updates</h2>
          <p>View your membership details, upcoming events, and important announcements from ZIE</p>
          <button (click)="goToUpdates()" class="card-button primary">
            View Updates
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <!-- Grade Upgrade Card -->
        <div class="card upgrade-card" [class.disabled]="isFullMember">
          <div class="card-icon">📈</div>
          <h2>Upgrade Your Grade</h2>
          <p *ngIf="!isFullMember">
            Advance your professional standing by applying for a higher membership grade
          </p>
          <p *ngIf="isFullMember" class="max-grade-message">
            You have reached the highest membership grade (Full Member). You are already recognized at the top level of professional standing in ZIE.
          </p>
          <button 
            *ngIf="!isFullMember"
            (click)="goToGradeUpgrade()" 
            class="card-button primary"
          >
            Apply for Higher Grade
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
          <button 
            *ngIf="isFullMember"
            disabled 
            class="card-button disabled"
            title="You are already at the highest membership grade"
          >
            Already at Highest Grade
          </button>
        </div>

        <!-- Certificate Card -->
        <div class="card certificate-card">
          <div class="card-icon">📜</div>
          <h2>View Certificate</h2>
          <p>Access and download your ZIE membership certificate</p>
          <button (click)="viewCertificate()" class="card-button secondary">
            View Certificate
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      <!-- Member Info Section -->
      <div class="member-info-section">
        <h3>Your Member Profile</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Email</label>
            <p>{{ memberEmail }}</p>
          </div>
          <div class="info-item">
            <label>Current Grade</label>
            <p>{{ currentMembershipGrade }}</p>
          </div>
          <div class="info-item">
            <label>Status</label>
            <p class="status-active">Active Member</p>
          </div>
          <div class="info-item">
            <label>Registration Number</label>
            <p>{{ registrationNumber || 'Pending' }}</p>
          </div>
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
      background: none;
      border: 2px solid white;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .logout-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .logout-text {
      font-size: 14px;
    }

    .member-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .member-header {
      background: linear-gradient(135deg, #004A59 0%, #003347 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .header-content {
      flex: 1;
    }

    .member-header h1 {
      font-size: 2.5em;
      margin: 0 0 10px 0;
      font-weight: 700;
    }

    .member-status {
      font-size: 1.2em;
      margin: 0 0 15px 0;
      color: #B99532;
    }

    .member-welcome {
      font-size: 1em;
      margin: 0;
      opacity: 0.9;
      line-height: 1.6;
      max-width: 600px;
    }

    .header-badge {
      text-align: center;
      padding: 20px;
      background-color: rgba(185, 149, 50, 0.2);
      border-radius: 12px;
      margin-left: 30px;
    }

    .badge-icon {
      font-size: 3em;
      margin-bottom: 10px;
    }

    .badge-grade {
      font-size: 1.2em;
      font-weight: 700;
      margin: 0;
    }

    .member-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .card:hover:not(.disabled) {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .card.disabled {
      opacity: 0.7;
      background-color: #f5f5f5;
    }

    .card-icon {
      font-size: 2.5em;
      margin-bottom: 15px;
    }

    .card h2 {
      font-size: 1.4em;
      color: #004A59;
      margin: 0 0 10px 0;
      font-weight: 700;
    }

    .card p {
      color: #666;
      margin: 0 0 20px 0;
      flex: 1;
      line-height: 1.6;
    }

    .max-grade-message {
      color: #27ae60;
      font-weight: 600;
      font-size: 0.95em;
    }

    .card-button {
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 1em;
    }

    .card-button.primary {
      background-color: #004A59;
      color: white;
    }

    .card-button.primary:hover {
      background-color: #003347;
      transform: translateX(4px);
    }

    .card-button.secondary {
      background-color: #B99532;
      color: white;
    }

    .card-button.secondary:hover {
      background-color: #a0863a;
      transform: translateX(4px);
    }

    .card-button.disabled {
      background-color: #ccc;
      color: #666;
      cursor: not-allowed;
    }

    .material-symbols-outlined {
      font-size: 1.2em;
    }

    .member-info-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .member-info-section h3 {
      font-size: 1.4em;
      color: #004A59;
      margin: 0 0 25px 0;
      font-weight: 700;
      border-bottom: 2px solid #B99532;
      padding-bottom: 15px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .info-item {
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
      border-left: 3px solid #B99532;
    }

    .info-item label {
      display: block;
      font-size: 0.85em;
      color: #666;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item p {
      margin: 0;
      color: #004A59;
      font-weight: 600;
      font-size: 1.05em;
    }

    .status-active {
      color: #27ae60 !important;
    }

    @media (max-width: 768px) {
      .member-header {
        flex-direction: column;
        text-align: center;
      }

      .header-content {
        margin-bottom: 20px;
      }

      .header-badge {
        margin-left: 0;
      }

      .member-header h1 {
        font-size: 1.8em;
      }

      .nav-title {
        font-size: 18px;
      }

      .member-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MemberLandingComponent implements OnInit {
  memberName: string = '';
  memberEmail: string = '';
  currentMembershipGrade: string = '';
  registrationNumber: string = '';
  isFullMember: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMemberData();
  }

  loadMemberData(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      console.error('No user found');
      this.router.navigate(['/login']);
      return;
    }

    this.memberName = currentUser.firstName && currentUser.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;
    this.memberEmail = currentUser.email;
    this.currentMembershipGrade = currentUser.currentMembershipGrade || 'Member';
    this.registrationNumber = currentUser.registrationNumber || '';

    // Check if user is Full Member
    this.isFullMember = this.currentMembershipGrade === 'Full Member' || 
                        this.currentMembershipGrade === 'Fellow';

    console.log('✓ Member data loaded:', {
      name: this.memberName,
      email: this.memberEmail,
      grade: this.currentMembershipGrade,
      isFullMember: this.isFullMember
    });
  }

  goToUpdates(): void {
    this.router.navigate(['/updates']);
  }

  goToGradeUpgrade(): void {
    // Navigate to a grade upgrade/application page
    // For now, redirect to CPD application as an example
    this.router.navigate(['/apply-cpd']);
  }

  viewCertificate(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.router.navigate(['/certificate', currentUser._id]);
    }
  }

  logout(): void {
    this.authService.logoutAndNavigate();
  }
}
