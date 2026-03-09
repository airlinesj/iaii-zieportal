import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Get the current user - this should reflect the latest state
    const currentUser = this.authService.getCurrentUser();
    
    console.log('🔒 RoleGuard checking access');
    console.log('  - URL:', state.url);
    console.log('  - Current user:', currentUser?.email);
    console.log('  - Current user role:', currentUser?.role);
    console.log('  - Token exists:', !!this.authService.getToken());

    // If no user, redirect to login
    if (!currentUser) {
      console.warn('⚠ RoleGuard: No user found, redirecting to login');
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    // Check if token exists in localStorage (additional check)
    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠ RoleGuard: No token found, user session invalid');
      this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    const requiredAccountType = route.data['accountType'] as string;

    // If specific roles are required, check them
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(currentUser.role)) {
        console.warn('⚠ RoleGuard: User role not authorized');
        console.warn('  - Required roles:', requiredRoles);
        console.warn('  - User role:', currentUser.role);
        
        // Redirect based on user role and type to prevent infinite loops
        if (currentUser.role === 'SuperAdmin') {
          this.router.navigate(['/super-admin-dashboard'], { replaceUrl: true });
        } else if (currentUser.role === 'Admin') {
          // Check if it's an auditor (accountType === 'audit')
          if (currentUser.accountType === 'audit') {
            this.router.navigate(['/audit-trail'], { replaceUrl: true });
          } else {
            this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
          }
        } else if (currentUser.role === 'Applicant') {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/login'], { replaceUrl: true });
        }
        return false;
      }
    }

    // Check if specific account type is required for this route (e.g., audit-trail requires 'audit')
    if (requiredAccountType) {
      const isAuditPage = state.url.includes('/audit-trail') || state.url.includes('/audit-management');
      
      if (isAuditPage) {
        // Only 'audit' account type can access audit pages (not even SuperAdmin)
        const canAccessAuditPage = currentUser.role === 'Admin' && currentUser.accountType === 'audit';
        
        if (!canAccessAuditPage) {
          console.warn('⚠ RoleGuard: User account type not authorized for audit pages');
          console.warn('  - Required account type:', requiredAccountType);
          console.warn('  - User account type:', currentUser.accountType);
          
          // Redirect based on user type
          if (currentUser.role === 'SuperAdmin') {
            this.router.navigate(['/super-admin-dashboard'], { replaceUrl: true });
          } else if (currentUser.role === 'Admin') {
            this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
          } else {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }
          return false;
        }
      }
    }

    console.log('✓ RoleGuard: Access granted');
    return true;
  }
}
