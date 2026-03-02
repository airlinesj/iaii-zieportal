import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApplicationTypeGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    // If user has no applicationType, log error and deny access
    if (!currentUser?.applicationType) {
      console.error('❌ ApplicationTypeGuard: User has no applicationType!');
      console.error('  - User:', currentUser?.email);
      console.error('  - This is a data integrity issue');
      this.router.navigate(['/dashboard']);
      return false;
    }
    
    const applicationType = currentUser.applicationType;
    const requestedPath = state.url;

    console.log('ApplicationTypeGuard - User type:', applicationType, 'Requested path:', requestedPath);

    // Check if the requested path matches the user's application type
    if (requestedPath.includes('/form-m1') && applicationType === 'expatriate') {
      console.warn('Expatriate user tried to access M1 form - redirecting to expatriate form');
      this.router.navigate(['/expatriate-form']);
      return false;
    }

    if (requestedPath.includes('/expatriate-form') && applicationType === 'local') {
      console.warn('Local user tried to access expatriate form - redirecting to M1 form');
      this.router.navigate(['/form-m1']);
      return false;
    }

    console.log('ApplicationTypeGuard - Access allowed');
    return true;
  }
}
