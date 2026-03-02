import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface UserClassification {
  classification: 'local_applicant' | 'expatriate_applicant' | 'admin' | 'superadmin' | 'audit';
  dashboard: string;
  role: string;
  displayName: string;
  permissions: string[];
}

export interface DashboardCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  action: string;
  route?: string;
}

export interface DashboardInfo {
  title: string;
  description: string;
  cards: DashboardCard[];
}

@Injectable({
  providedIn: 'root',
})
export class RoleBasedDashboardService {
  private classification$ = new BehaviorSubject<UserClassification | null>(null);
  private dashboardInfo$ = new BehaviorSubject<DashboardInfo | null>(null);

  constructor() {}

  /**
   * Set the user classification from server response
   */
  setClassification(classification: UserClassification, dashboardInfo: DashboardInfo): void {
    console.log('📊 Classification set:', classification.classification);
    console.log('   Dashboard:', classification.dashboard);
    console.log('   Role:', classification.role);
    console.log('   Display Name:', classification.displayName);
    
    this.classification$.next(classification);
    this.dashboardInfo$.next(dashboardInfo);
    
    // Persist to localStorage
    localStorage.setItem('userClassification', JSON.stringify(classification));
    localStorage.setItem('dashboardInfo', JSON.stringify(dashboardInfo));
  }

  /**
   * Get the current classification
   */
  getClassification(): UserClassification | null {
    return this.classification$.value;
  }

  /**
   * Get classification as observable
   */
  getClassification$(): Observable<UserClassification | null> {
    return this.classification$.asObservable();
  }

  /**
   * Get the dashboard info
   */
  getDashboardInfo(): DashboardInfo | null {
    return this.dashboardInfo$.value;
  }

  /**
   * Get dashboard info as observable
   */
  getDashboardInfo$(): Observable<DashboardInfo | null> {
    return this.dashboardInfo$.asObservable();
  }

  /**
   * Clear classification (on logout)
   */
  clearClassification(): void {
    console.log('🚪 Classification cleared - cleaning all state');
    this.classification$.next(null);
    this.dashboardInfo$.next(null);
    localStorage.removeItem('userClassification');
    localStorage.removeItem('dashboardInfo');
    console.log('✓ All classification state cleared');
  }

  /**
   * Force clear classification from memory and storage
   */
  forceResetAllState(): void {
    console.log('🔄 Force resetting all classification state');
    this.classification$ = new BehaviorSubject<UserClassification | null>(null);
    this.dashboardInfo$ = new BehaviorSubject<DashboardInfo | null>(null);
    localStorage.removeItem('userClassification');
    localStorage.removeItem('dashboardInfo');
    console.log('✓ All state forcefully reset');
  }

  /**
   * Get dashboard path for user type
   */
  getDashboardPath(): string {
    const classification = this.classification$.value;
    return classification ? classification.dashboard : '/dashboard';
  }

  /**
   * Check if user is applicant (local or expatriate)
   */
  isApplicant(): boolean {
    const classification = this.classification$.value;
    return classification?.classification === 'local_applicant' || classification?.classification === 'expatriate_applicant';
  }

  /**
   * Check if user is admin or superadmin
   */
  isAdmin(): boolean {
    const classification = this.classification$.value;
    return classification?.classification === 'admin' || classification?.classification === 'superadmin';
  }

  /**
   * Check if user is superadmin
   */
  isSuperAdmin(): boolean {
    const classification = this.classification$.value;
    return classification?.classification === 'superadmin';
  }

  /**
   * Check if user is expatriate
   */
  isExpatriate(): boolean {
    const classification = this.classification$.value;
    return classification?.classification === 'expatriate_applicant';
  }

  /**
   * Check if user is local
   */
  isLocal(): boolean {
    const classification = this.classification$.value;
    return classification?.classification === 'local_applicant';
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const classification = this.classification$.value;
    return classification ? classification.permissions.includes(permission) : false;
  }

  /**
   * Get greeting message
   */
  getGreetingMessage(): string {
    const classification = this.classification$.value;
    return classification ? `Welcome, ${classification.displayName}!` : 'Welcome!';
  }

  /**
   * Get dashboard cards
   */
  getDashboardCards(): DashboardCard[] {
    const dashboardInfo = this.dashboardInfo$.value;
    return dashboardInfo ? dashboardInfo.cards : [];
  }

  /**
   * Restore classification from localStorage
   */
  restoreFromLocalStorage(): boolean {
    try {
      const classificationStr = localStorage.getItem('userClassification');
      const dashboardInfoStr = localStorage.getItem('dashboardInfo');
      
      if (classificationStr && dashboardInfoStr) {
        const classification = JSON.parse(classificationStr) as UserClassification;
        const dashboardInfo = JSON.parse(dashboardInfoStr) as DashboardInfo;
        
        this.classification$.next(classification);
        this.dashboardInfo$.next(dashboardInfo);
        
        console.log('✓ Classification restored from localStorage:', classification.classification);
        return true;
      }
    } catch (error) {
      console.error('Error restoring classification from localStorage:', error);
    }
    return false;
  }
}
