import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="header">
      <button class="menu-toggle d-none-mobile" (click)="toggleMobileMenu()" *ngIf="isLoggedIn && !isAdmin">
        <span class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
      </button>
      <img src="assets/zielogo.png" alt="Zimbabwe Institution of Engineers Logo" class="logo" onerror="this.style.display='none'" />
      <div class="title">ZIMBABWE INSTITUTION OF ENGINEERS</div>
      <div class="nav-right">
        <a [routerLink]="getDashboardRoute()" class="nav-link d-none-mobile" *ngIf="isLoggedIn">Dashboard</a>
        <button (click)="logout()" class="nav-button d-none-mobile" *ngIf="isLoggedIn">Logout</button>
        <button class="mobile-menu-toggle" (click)="toggleMobileMenu()" *ngIf="isLoggedIn && !isAdmin">
          <span class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Mobile Menu Drawer -->
    <div class="mobile-menu" *ngIf="mobileMenuOpen && isLoggedIn && !isAdmin">
      <a [routerLink]="getDashboardRoute()" class="mobile-nav-item" (click)="mobileMenuOpen = false">
        <span class="material-symbols-outlined">dashboard</span>
        Dashboard
      </a>
      <button (click)="logout()" class="mobile-nav-item logout-item">
        <span class="material-symbols-outlined">logout</span>
        Logout
      </button>
    </div>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 80px;
      background-color: #FFFFFF;
      border-bottom: 2.5px solid #B99532;
      display: flex;
      align-items: center;
      padding: 0 20px;
      z-index: 1000;
      gap: 10px;
    }

    .logo {
      height: 60px;
      width: auto;
      object-fit: contain;
      cursor: pointer;
    }

    .logo:hover {
      opacity: 0.9;
    }

    .title {
      margin-left: 20px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #004A59;
      letter-spacing: 1px;
      flex: 1;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-left: auto;
    }

    .nav-link, .nav-button {
      text-decoration: none;
      color: #004A59;
      font-weight: 600;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 1rem;
      transition: color 0.3s ease;
      min-height: 44px;
      display: flex;
      align-items: center;
    }

    .nav-button:hover,
    .nav-link:hover {
      color: #B99532;
    }

    .menu-toggle {
      background: none;
      border: none;
      color: #004A59;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      font-size: 24px;
    }

    .mobile-menu-toggle {
      background: none;
      border: none;
      color: #004A59;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      font-size: 24px;
      display: none;
    }

    /* Mobile Menu Drawer */
    .mobile-menu {
      position: fixed;
      top: 80px;
      left: 0;
      right: 0;
      background-color: #FFFFFF;
      border-bottom: 2.5px solid #B99532;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 999;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .mobile-nav-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 16px 20px;
      color: #004A59;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      background: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: rgba(185, 149, 50, 0.1);
      }
    }

    .mobile-nav-item.logout-item:hover {
      background-color: rgba(211, 47, 47, 0.1);
      color: #d32f2f;
    }

    /* Tablet & Desktop Media Queries */
    @media (max-width: 768px) {
      .header {
        height: 70px;
        padding: 0 15px;
      }

      .logo {
        height: 50px;
      }

      .title {
        margin-left: 10px;
        font-size: 1.1rem;
      }

      .nav-right {
        gap: 10px;
      }

      .nav-link, .nav-button {
        font-size: 0.95rem;
      }
    }

    /* Mobile Media Queries */
    @media (max-width: 480px) {
      .header {
        height: 60px;
        padding: 0 10px;
        gap: 5px;
      }

      .logo {
        height: 40px;
      }

      .title {
        margin-left: 5px;
        font-size: 0.95rem;
        letter-spacing: 0px;
      }

      .mobile-menu-toggle {
        display: flex;
      }

      .nav-right {
        gap: 0;
      }

      .mobile-menu {
        top: 60px;
      }

      .mobile-nav-item {
        padding: 14px 15px;
        font-size: 0.95rem;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin = false;
  mobileMenuOpen = false;
  private destroy$ = new Subject<void>();

  @Output() mobileMenuToggle = new EventEmitter<boolean>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to login status
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
      });
  }

  getDashboardRoute(): string {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'SuperAdmin') {
      return '/super-admin-dashboard';
    } else if (user?.role === 'Admin' && user?.accountType === 'audit') {
      return '/audit-trail'; // Auditors go to audit trail portal
    } else if (user?.role === 'Admin') {
      return '/admin-dashboard'; // Regular admins go to admin dashboard
    }
    return '/dashboard'; // Applicants go to applicant dashboard
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.mobileMenuToggle.emit(this.mobileMenuOpen);
  }

  logout(): void {
    console.log('🚪 Header: Initiating logout');
    // Use the comprehensive logoutAndNavigate method that performs hard refresh
    // This ensures complete state cleanup for account switching
    this.authService.logoutAndNavigate();
  }
}
