import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Desktop Sidebar -->
    <div class="sidebar d-none-mobile" *ngIf="isLoggedIn && !isAdmin" [ngClass]="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <button class="collapse-btn" (click)="toggleSidebar()" title="Toggle Sidebar">
          <span class="material-symbols-outlined">{{ isCollapsed ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </div>

      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <a [routerLink]="applicationFormRoute" class="nav-item" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="icon material-symbols-outlined">assignment</span>
            <span class="label" *ngIf="!isCollapsed">ZIE APPLICATION FORM</span>
          </a>

          <a routerLink="/payment" class="nav-item" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="icon material-symbols-outlined">payment</span>
            <span class="label" *ngIf="!isCollapsed">PAYMENT</span>
          </a>

          <a routerLink="/updates" class="nav-item" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="icon material-symbols-outlined">update</span>
            <span class="label" *ngIf="!isCollapsed">UPDATES</span>
          </a>
        </nav>

        <button (click)="logout()" class="logout-btn">
          <span class="icon material-symbols-outlined">logout</span>
          <span class="label" *ngIf="!isCollapsed">LOGOUT</span>
        </button>
      </div>
    </div>

    <!-- Mobile Sidebar Drawer -->
    <div class="mobile-sidebar-overlay" *ngIf="isLoggedIn && !isAdmin && mobileMenuOpen" (click)="toggleMobileMenu()"></div>
    <div class="mobile-sidebar" *ngIf="isLoggedIn && !isAdmin" [ngClass]="{ open: mobileMenuOpen }">
      <div class="mobile-sidebar-header">
        <h3>Menu</h3>
        <button class="close-btn" (click)="toggleMobileMenu()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="mobile-sidebar-nav">
        <a [routerLink]="applicationFormRoute" class="mobile-nav-item" routerLinkActive="active" (click)="toggleMobileMenu()">
          <span class="icon material-symbols-outlined">assignment</span>
          <span class="label">ZIE APPLICATION FORM</span>
        </a>

        <a routerLink="/payment" class="mobile-nav-item" routerLinkActive="active" (click)="toggleMobileMenu()">
          <span class="icon material-symbols-outlined">payment</span>
          <span class="label">PAYMENT</span>
        </a>

        <a routerLink="/updates" class="mobile-nav-item" routerLinkActive="active" (click)="toggleMobileMenu()">
          <span class="icon material-symbols-outlined">update</span>
          <span class="label">UPDATES</span>
        </a>

        <button (click)="logout()" class="mobile-nav-item logout-item">
          <span class="icon material-symbols-outlined">logout</span>
          <span class="label">LOGOUT</span>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 80px;
      width: 250px;
      height: calc(100vh - 80px);
      background-color: #004A59;
      border-right: 2.5px solid #B99532;
      display: flex;
      flex-direction: column;
      padding: 0;
      z-index: 10;
      transition: width 0.3s ease;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar-header {
      padding: 15px;
      border-bottom: 2.5px solid #B99532;
      display: flex;
      justify-content: flex-end;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: #B99532;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .collapse-btn:hover {
      color: #FFFFFF;
      transform: scale(1.1);
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
      font-size: 24px;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 20px 0;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 18px 20px;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-left: 3px solid transparent;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .sidebar.collapsed .nav-item {
      padding: 18px 8px;
      justify-content: center;
    }

    .nav-item:hover {
      background-color: rgba(185, 149, 50, 0.2);
      border-left-color: #B99532;
      padding-left: 17px;
    }

    .sidebar.collapsed .nav-item:hover {
      padding-left: 8px;
    }

    .nav-item.active {
      background-color: rgba(185, 149, 50, 0.3);
      border-left-color: #B99532;
      padding-left: 17px;
    }

    .sidebar.collapsed .nav-item.active {
      padding-left: 8px;
    }

    .icon {
      font-size: 24px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .label {
      flex: 1;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 18px 20px;
      background-color: rgba(185, 149, 50, 0.2);
      color: #FFFFFF;
      border: 2.5px solid #B99532;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      border-radius: 8px;
      margin: 0 15px 20px 15px;
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
      justify-content: center;
    }

    .sidebar.collapsed .logout-btn {
      padding: 18px 8px;
      margin: 0 8px 20px 8px;
      gap: 0;
    }

    .logout-btn:hover {
      background-color: #B99532;
      color: #004A59;
      transform: translateX(5px);
    }

    .sidebar.collapsed .logout-btn:hover {
      transform: scale(1.05);
    }

    .logout-btn .icon {
      font-size: 22px;
      width: 24px;
      text-align: center;
    }

    .logout-btn .label {
      flex: 1;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 200px;
      }

      .sidebar.collapsed {
        width: 70px;
      }

      .nav-item, .logout-btn {
        padding: 15px 15px;
        font-size: 13px;
      }

      .sidebar.collapsed .nav-item,
      .sidebar.collapsed .logout-btn {
        padding: 15px 8px;
      }

      .icon {
        font-size: 20px;
      }
    }

    /* Mobile Sidebar Drawer Styles */
    .mobile-sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 998;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .mobile-sidebar {
      position: fixed;
      left: 0;
      top: 60px;
      width: 80%;
      max-width: 300px;
      height: calc(100vh - 60px);
      background-color: #004A59;
      border-right: 2.5px solid #B99532;
      z-index: 999;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      overflow-y: auto;
      display: none;
    }

    .mobile-sidebar.open {
      transform: translateX(0);
    }

    .mobile-sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 2.5px solid #B99532;
      color: #FFFFFF;

      h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
      }
    }

    .close-btn {
      background: none;
      border: none;
      color: #B99532;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      font-size: 24px;
      transition: color 0.3s ease;

      &:hover {
        color: #FFFFFF;
      }
    }

    .mobile-sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 10px 0;
    }

    .mobile-nav-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 16px 20px;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      background: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;

      &:hover {
        background-color: rgba(185, 149, 50, 0.2);
        border-left-color: #B99532;
        padding-left: 17px;
      }

      &.active {
        background-color: rgba(185, 149, 50, 0.3);
        border-left-color: #B99532;
        padding-left: 17px;
      }
    }

    .mobile-nav-item.logout-item {
      margin-top: auto;
      background-color: rgba(185, 149, 50, 0.2);
      border-left: 3px solid transparent;

      &:hover {
        background-color: #B99532;
        color: #004A59;
        border-left-color: transparent;
      }
    }

    /* Show mobile sidebar on small screens */
    @media (max-width: 480px) {
      .mobile-sidebar {
        display: block;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  isCollapsed = false;
  mobileMenuOpen = false;
  applicationType: 'local' | 'expatriate' | '' = '';
  applicationFormRoute = '/form-m1';

  @Output() sidebarCollapseChange = new EventEmitter<boolean>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'Admin';
      
      // For Applicants, use their registered applicationType
      if (user?.role === 'Applicant') {
        this.applicationType = user?.applicationType || '';
        
        if (!user?.applicationType) {
          console.error('⚠ WARNING: Applicant user has no applicationType set!');
          console.error('  - User:', user?.email);
          console.error('  - This is a data integrity issue');
        }
      } else {
        this.applicationType = '';
      }
      
      // Set the correct form route based on applicationType
      if (this.applicationType === 'expatriate') {
        this.applicationFormRoute = '/expatriate-form';
      } else if (this.applicationType === 'local') {
        this.applicationFormRoute = '/form-m1';
      } else {
        // Default to m1 if not sure (though this shouldn't happen)
        this.applicationFormRoute = '/form-m1';
      }
      
      console.log('Sidebar updated - applicationType:', this.applicationType, 'form route:', this.applicationFormRoute);
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarCollapseChange.emit(this.isCollapsed);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.mobileMenuOpen = false;
    // Use logoutAndNavigate to properly clear browser history and navigate to landing page
    this.authService.logoutAndNavigate();
  }
}
