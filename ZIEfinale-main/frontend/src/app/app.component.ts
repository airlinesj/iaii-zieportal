import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './components/sidebar.component';
import { AuthService } from './services/auth.service';
import { RoleBasedDashboardService } from './services/role-based-dashboard.service';
import { CommonModule } from '@angular/common';
import { filter, skip, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
  template: `
    <app-header *ngIf="!isLandingPage && !isAuthPage && !isFullscreenPage"></app-header>
    <app-sidebar *ngIf="!isLandingPage && !isAuthPage && !isFullscreenPage && !isSuperAdmin" (sidebarCollapseChange)="onSidebarCollapse($event)"></app-sidebar>
    <div class="main-content" [ngClass]="{ 'with-sidebar': !isAdmin && isLoggedIn && !isLandingPage && !isAuthPage && !isFullscreenPage && !sidebarCollapsed, 'sidebar-collapsed': !isAdmin && isLoggedIn && !isLandingPage && !isAuthPage && !isFullscreenPage && sidebarCollapsed, 'landing': isLandingPage, 'fullscreen': isFullscreenPage }">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .main-content {
      margin-top: 80px;
      transition: margin-left 0.3s ease;
      min-height: calc(100vh - 80px);
    }

    .main-content.landing {
      margin-top: 0;
      height: 100vh;
    }

    .main-content.fullscreen {
      margin-top: 0;
      margin-left: 0 !important;
      min-height: 100vh;
    }

    .main-content.with-sidebar {
      margin-left: 250px;
    }

    .main-content.sidebar-collapsed {
      margin-left: 80px;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-top: 70px;
        min-height: calc(100vh - 70px);
      }

      .main-content.with-sidebar {
        margin-left: 200px;
      }

      .main-content.sidebar-collapsed {
        margin-left: 70px;
      }
    }

    @media (max-width: 480px) {
      .main-content {
        margin-top: 60px;
        min-height: calc(100vh - 60px);
        margin-left: 0 !important;
      }

      .main-content.landing {
        margin-top: 0;
        min-height: 100vh;
      }
    }

    /* Dialog Panel Styles - Ensure dialogs appear above everything */
    :host ::ng-deep .success-dialog-panel {
      z-index: 9999 !important;
    }

    :host ::ng-deep .success-dialog-panel .mat-mdc-dialog-container {
      z-index: 9999 !important;
    }

    :host ::ng-deep .success-dialog-panel ~ .cdk-overlay-backdrop {
      z-index: 9998 !important;
    }

    :host ::ng-deep .centered-dialog {
      z-index: 9999 !important;
    }

    :host ::ng-deep .centered-dialog .mat-mdc-dialog-container {
      z-index: 9999 !important;
    }

    :host ::ng-deep .centered-dialog ~ .cdk-overlay-backdrop {
      z-index: 9998 !important;
    }

    :host ::ng-deep .submission-dialog-panel {
      z-index: 9999 !important;
    }

    :host ::ng-deep .submission-dialog-panel .mat-mdc-dialog-container {
      z-index: 9999 !important;
    }

    :host ::ng-deep .submission-dialog-panel ~ .cdk-overlay-backdrop {
      z-index: 9998 !important;
    }

    /* Generic dialog backdrop fix */
    :host ::ng-deep .cdk-overlay-pane {
      z-index: 9999 !important;
    }

    :host ::ng-deep .cdk-overlay-backdrop {
      z-index: 9998 !important;
    }
  `],
})
export class AppComponent implements OnInit {
  title = 'zie-frontend';
  isLoggedIn = false;
  isAdmin = false;
  isSuperAdmin = false;
  isLandingPage = false;
  isAuthPage = false;
  isFullscreenPage = false;
  sidebarCollapsed = false;

  constructor(private authService: AuthService, private router: Router, private roleBasedDashboardService: RoleBasedDashboardService) {}

  ngOnInit(): void {
    console.log('🚀 App component initializing');
    
    // Check if we have a valid current user before restoring classification
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.authService.isLoggedIn()) {
      // Only restore classification if we have a valid logged-in user
      this.roleBasedDashboardService.restoreFromLocalStorage();
    } else {
      // Clear any stale classification data if user is not logged in
      localStorage.removeItem('userClassification');
      localStorage.removeItem('dashboardInfo');
      this.roleBasedDashboardService.clearClassification();
    }
    
    // Check current route on init
    this.updatePageStatus();

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageStatus();
      });

    // On login, refresh user data from server (handles migration of old accounts)
    this.authService.currentUser$.pipe(
      skip(1), // Skip initial undefined
      tap(user => {
        this.isLoggedIn = !!user;
        this.isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
        this.isSuperAdmin = user?.role === 'SuperAdmin';
        
        if (user && user.email) {
          console.log('👤 User detected in app.component');
          console.log('  - Email:', user.email);
          console.log('  - Role:', user.role);
          console.log('  - applicationType:', user.applicationType);
          console.log('  - userClassification:', user.userClassification);
          
          // Delay refresh to ensure auth token is properly set
          setTimeout(() => {
            console.log('🔄 App.component calling refreshUserFromServer()...');
            this.authService.refreshUserFromServer().subscribe({
              next: (refreshedData) => {
                console.log('✓ App.component - User data refreshed from server');
                console.log('  - Refreshed applicationType:', refreshedData.applicationType);
                console.log('  - Refreshed userClassification:', refreshedData.userClassification);
                // The service already updated currentUser$ via tap in refreshUserFromServer
              },
              error: (err) => {
                console.warn('⚠ App.component - Could not refresh user data', err);
                // Continue with current user data - it was already set in login response
              }
            });
          }, 100); // 100ms delay ensures token is set
        }
      })
    ).subscribe();
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  private updatePageStatus(): void {
    this.isLandingPage = this.router.url === '/';
    const authPages = ['/login', '/register'];
    this.isAuthPage = authPages.includes(this.router.url);
    // Fullscreen pages: certificate, sponsor review, dashboard, and super admin dashboard (no sidebar)
    this.isFullscreenPage = this.router.url.startsWith('/certificate') || this.router.url.startsWith('/sponsor-review') || this.router.url === '/dashboard' || this.router.url === '/super-admin-dashboard';
  }
}
