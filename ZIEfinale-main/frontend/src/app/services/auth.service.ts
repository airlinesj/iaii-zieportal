import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { RoleBasedDashboardService } from './role-based-dashboard.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: 'Applicant' | 'Admin';
  country?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    country?: string;
    applicationType?: 'local' | 'expatriate';
    userClassification?: string;
  };
  classification?: any;
  dashboard?: string;
  dashboardInfo?: any;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.currentUser$.pipe();

  constructor(
    private http: HttpClient,
    private roleBasedDashboardService: RoleBasedDashboardService,
    private router: Router
  ) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    console.log('\n=== AUTH.SERVICE.REGISTER CALLED ===');
    console.log('Sending data:', data);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        console.log('\n✓ AUTH.SERVICE - Registration response received');
        console.log('Response structure:');
        console.log('  - user.applicationType:', response.user?.applicationType);
        console.log('  - user.country:', response.user?.country);
        console.log('  - user.role:', response.user?.role);
        console.log('  - classification:', response.classification?.classification);
        console.log('  - Full user object:', response.user);
        
        // Detect superadmin and admin based on email
        if (response.user.email.includes('@superadmin')) {
          response.user.role = 'SuperAdmin';
          if (response.classification) {
            response.classification.classification = 'superadmin';
            response.classification.role = 'SuperAdmin';
            response.classification.dashboard = '/super-admin-dashboard';
            response.classification.displayName = 'Super Administrator';
            response.classification.permissions = ['certificate_approval', 'signature_management', 'all_admin_access'];
          }
        } else if (response.user.email.includes('@admin')) {
          response.user.role = 'Admin';
          if (response.classification) {
            response.classification.classification = 'admin';
            response.classification.role = 'Admin';
            response.classification.dashboard = '/admin-dashboard';
            response.classification.displayName = 'Administrator';
            response.classification.permissions = ['application_review', 'interview_management'];
          }
        }
        
        console.log('✓ Registration successful');
        console.log('  - User:', response.user.email);
        console.log('  - Classification:', response.classification?.classification);
        console.log('  - Dashboard:', response.dashboard);
        
        // Store authentication data
        this.setCurrentUser(response);
        
        // Store classification if available
        if (response.classification && response.dashboardInfo) {
          this.roleBasedDashboardService.setClassification(
            response.classification,
            response.dashboardInfo
          );
        }
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        console.log('✓ Login successful');
        console.log('  - User:', response.user.email);
        console.log('  - Role:', response.user.role);
        console.log('  - Classification:', response.classification?.classification);
        console.log('  - Dashboard:', response.dashboard);
        
        // Detect role based on email (check audit first since it contains @admin)
        if (response.user.email.includes('@superadmin')) {
          response.user.role = 'SuperAdmin';
          if (response.classification) {
            response.classification.classification = 'superadmin';
            response.classification.role = 'SuperAdmin';
            response.classification.dashboard = '/super-admin-dashboard';
            response.classification.displayName = 'Super Administrator';
            response.classification.permissions = ['certificate_approval', 'signature_management', 'all_admin_access'];
          }
        } else if (response.user.email.includes('@admin.audit')) {
          // Check for audit first before generic @admin
          response.user.role = 'Admin';
          if (response.classification) {
            response.classification.classification = 'audit';
            response.classification.role = 'Admin';
            response.classification.dashboard = '/audit-trail';
            response.classification.displayName = 'Audit User';
            response.classification.permissions = ['view_audit_trail', 'view_reports', 'view_analytics'];
          }
        } else if (response.user.email.includes('@admin')) {
          response.user.role = 'Admin';
          if (response.classification) {
            response.classification.classification = 'admin';
            response.classification.role = 'Admin';
            response.classification.dashboard = '/admin-dashboard';
            response.classification.displayName = 'Administrator';
            response.classification.permissions = ['application_review', 'interview_management'];
          }
        } else if (response.user.role === 'Member') {
          // Keep member classification as-is from backend
          if (response.classification) {
            response.classification.classification = 'member';
            response.classification.role = 'Member';
            response.classification.dashboard = '/member-landing';
          }
        }
        
        // Store authentication data
        this.setCurrentUser(response);
        
        // Store classification if available
        if (response.classification && response.dashboardInfo) {
          this.roleBasedDashboardService.setClassification(
            response.classification,
            response.dashboardInfo
          );
        }
      })
    );
  }

  logout(): void {
    console.log('🚪 Logging out user - Starting comprehensive cleanup');
    
    // Clear all auth-related localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('applicationFormData');
    localStorage.removeItem('userClassification');
    localStorage.removeItem('dashboardInfo');
    
    // Clear all possible session keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth') || key.includes('user') || key.includes('session') || key.includes('classification'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage completely
    sessionStorage.clear();
    
    // Clear all BehaviorSubjects to ensure clean state
    this.currentUserSubject.next(null);
    // Use forceResetAllState to ensure BehaviorSubject instances are fresh
    this.roleBasedDashboardService.forceResetAllState();
    
    console.log('✓ Logout complete - all state cleared');
  }

  logoutAndNavigate(): void {
    console.log('🚪 Logging out and navigating - Starting full cleanup');
    
    // Clear session data
    this.logout();
    
    // Additionally clear any Angular routing state
    try {
      // Reset router state
      this.router.resetConfig(this.router.config);
    } catch (e) {
      console.log('Router reset not needed');
    }
    
    // Clear browser history to prevent back navigation to app pages
    window.history.replaceState(null, '', window.location.origin + '/');
    
    console.log('🚪 Performing hard refresh to clear all client-side state');
    // Use hard refresh to ensure complete state cleanup
    // This is important for account switching between different user types
    window.location.href = '/login';
  }

  private setCurrentUser(response: AuthResponse): void {
    const user = response.user;
    
    console.log('\n=== AUTH.SERVICE.setCurrentUser ===');
    console.log('BEFORE: Clearing any previous user state');
    
    // Ensure we start fresh - clear any previous session completely
    // Use forceResetAllState to ensure old BehaviorSubject values don't persist
    localStorage.removeItem('userClassification');
    localStorage.removeItem('dashboardInfo');
    this.roleBasedDashboardService.forceResetAllState();
    
    console.log('Setting current user:');
    console.log('  - email:', user.email);
    console.log('  - applicationType:', user.applicationType);
    console.log('  - country:', user.country);
    console.log('  - role:', user.role);
    
    // Validate and fix applicationType for Applicants
    if (user.role === 'Applicant') {
      // If missing applicationType, derive from country
      if (!user.applicationType && user.country) {
        console.warn('⚠ Applicant missing applicationType, deriving from country:', user.country);
        user.applicationType = user.country === 'Zimbabwe' ? 'local' : 'expatriate';
      }
      // If still missing applicationType, default to local
      if (!user.applicationType) {
        console.warn('⚠ Applicant missing both applicationType and country, defaulting to local');
        user.applicationType = 'local';
      }
      // Ensure country is set
      if (!user.country) {
        console.warn('⚠ Applicant missing country, defaulting to Zimbabwe');
        user.country = 'Zimbabwe';
      }
    }
    
    console.log('✓ Validations passed, storing user');
    console.log('  - applicationType to store:', user.applicationType);
    console.log('  - country to store:', user.country);
    
    // Store token and user
    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    // NOW set the new classification with fresh data
    console.log('✓ Storing classification');
    if (response.classification && response.dashboardInfo) {
      this.roleBasedDashboardService.setClassification(
        response.classification,
        response.dashboardInfo
      );
    } else {
      console.warn('⚠ No classification in response, dashboard service will be empty');
    }
    
    console.log('✓ Emitted to currentUser$ BehaviorSubject');
    console.log('  - currentUser$.value applicationType:', this.currentUserSubject.value?.applicationType);
    console.log('  - currentUser$.value country:', this.currentUserSubject.value?.country);
    console.log('  - Classification stored:', response.classification?.classification, '\n');
  }

  private getUserFromStorage(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    const user = this.currentUserSubject.value;
    if (user && user.role === 'Applicant') {
      // Validate that critical applicant fields are present
      if (!user.applicationType) {
        console.error('❌ ERROR: Current user missing applicationType!');
        console.error('  - User:', user.email);
        console.error('  - This indicates a data integrity issue');
        // Log this issue but don't silently fix it
      }
      if (!user.country) {
        console.error('❌ ERROR: Current user missing country!');
        console.error('  - User:', user.email);
      }
    }
    return user;
  }

  getCurrentUserObservable(): Observable<any> {
    return this.currentUser$;
  }

  refreshUserFromServer(): Observable<any> {
    // Fetch current user data from server
    const token = this.getToken();
    if (!token) {
      console.warn('⚠ No token available for user refresh');
      return new Observable(observer => observer.complete());
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any>(`${this.apiUrl}/me`, { headers }).pipe(
      tap((response: any) => {
        console.log('✓ Server response received from /auth/me');
        console.log('  - Response structure:', Object.keys(response));
        
        // Handle both direct user object and wrapped response
        // If response has 'id' field, it's the direct user object
        // If not, check if there's a 'user' field wrapped in response
        const user = response.id ? response : response.user;
        
        if (!user) {
          console.warn('⚠ No user object found in response');
          return;
        }
        
        console.log('✓ User object extracted');
        console.log('  - Email:', user.email);
        console.log('  - applicationType:', user.applicationType);
        console.log('  - userClassification:', user.userClassification);
        console.log('  - Country:', user.country);
        console.log('  - Role:', user.role);
        
        // Validate that applicationType is set for applicants
        if (user.role === 'Applicant' && !user.applicationType) {
          console.error('❌ ERROR: Server returned applicant without applicationType!');
          console.error('  - User:', user.email);
          console.error('  - Country:', user.country);
          console.error('  - This indicates a backend data issue');
        }
        
        // Update localStorage and currentUser$ BehaviorSubject
        console.log('💾 Storing user to localStorage:');
        console.log('  - applicationType:', user.applicationType);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('📤 Emitting to currentUser$ BehaviorSubject');
        this.currentUserSubject.next(user);
        
        console.log('✓ CurrentUser updated in auth.service');
        console.log('  - applicationType stored:', user.applicationType);
        
        // Update classification if available in response
        if (response.classification && response.dashboardInfo) {
          console.log('📋 Classification available in response, updating dashboard service');
          this.roleBasedDashboardService.setClassification(
            response.classification,
            response.dashboardInfo
          );
        } else {
          console.warn('⚠ No classification/dashboardInfo in response');
        }
      })
    );
  }
}
