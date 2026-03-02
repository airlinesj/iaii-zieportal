import { IUser } from '../models/User';

export interface UserClassification {
  classification: 'local_applicant' | 'expatriate_applicant' | 'admin' | 'superadmin' | 'audit';
  dashboard: string;
  role: string;
  displayName: string;
  permissions: string[];
}

export class UserClassificationService {
  /**
   * Classify user and return their dashboard routing information
   */
  static classifyUser(user: IUser): UserClassification {
    let classification: 'local_applicant' | 'expatriate_applicant' | 'admin' | 'superadmin' | 'audit';
    let dashboard: string;
    let displayName: string;
    let permissions: string[];

    if (user.role === 'SuperAdmin') {
      classification = 'superadmin';
      dashboard = '/superadmin-dashboard';
      displayName = 'Super Administrator';
      permissions = [
        'view_all_applications',
        'manage_admins',
        'manage_users',
        'system_settings',
        'view_reports',
      ];
    } else if (user.accountType === 'audit') {
      classification = 'audit';
      dashboard = '/audit-trail';
      displayName = 'Audit User';
      permissions = [
        'view_audit_trail',
        'view_reports',
        'view_analytics',
      ];
    } else if (user.role === 'Admin') {
      classification = 'admin';
      dashboard = '/admin-dashboard';
      displayName = 'Administrator';
      permissions = [
        'review_applications',
        'manage_interviews',
        'generate_reports',
        'view_applicants',
      ];
    } else if (user.applicationType === 'expatriate') {
      classification = 'expatriate_applicant';
      dashboard = '/dashboard';
      displayName = 'Expatriate Applicant';
      permissions = ['complete_expatriate_form', 'view_status', 'submit_application'];
    } else {
      classification = 'local_applicant';
      dashboard = '/dashboard';
      displayName = 'Local Applicant';
      permissions = ['complete_m1_form', 'view_status', 'submit_application'];
    }

    return {
      classification,
      dashboard,
      role: user.role,
      displayName,
      permissions,
    };
  }

  /**
   * Get dashboard path for user
   */
  static getDashboardPath(user: IUser): string {
    const classification = this.classifyUser(user);
    return classification.dashboard;
  }

  /**
   * Check if user has permission
   */
  static hasPermission(classification: UserClassification, permission: string): boolean {
    return classification.permissions.includes(permission);
  }

  /**
   * Get appropriate greeting message
   */
  static getGreetingMessage(classification: UserClassification): string {
    return `Welcome, ${classification.displayName}!`;
  }

  /**
   * Determine if user needs to complete profile
   */
  static needsProfileCompletion(user: IUser): boolean {
    if (user.role !== 'Applicant') return false;

    // Check for required applicant fields
    return !user.country || !user.applicationType;
  }

  /**
   * Get dashboard information including cards to display
   */
  static getDashboardInfo(
    classification: UserClassification,
    user: IUser
  ): {
    cards: any[];
    title: string;
    description: string;
  } {
    if (classification.classification === 'superadmin') {
      return {
        title: 'Super Admin Dashboard',
        description: 'System management and oversight',
        cards: [
          {
            id: 'users',
            title: 'User Management',
            icon: '👥',
            description: 'Manage all system users and administrators',
            action: 'Manage Users',
          },
          {
            id: 'admins',
            title: 'Administrator Management',
            icon: '🔧',
            description: 'Create and manage admin accounts',
            action: 'Manage Admins',
          },
          {
            id: 'applications',
            title: 'All Applications',
            icon: '📊',
            description: 'View all applications across system',
            action: 'View All',
          },
          {
            id: 'reports',
            title: 'System Reports',
            icon: '📈',
            description: 'Generate system statistics and reports',
            action: 'View Reports',
          },
          {
            id: 'settings',
            title: 'System Settings',
            icon: '⚙️',
            description: 'Configure system-wide settings',
            action: 'Settings',
          },
        ],
      };
    } else if (classification.classification === 'admin') {
      return {
        title: 'Admin Dashboard',
        description: 'Application review and management',
        cards: [
          {
            id: 'pending',
            title: 'Pending Applications',
            icon: '⏳',
            description: 'Review applications awaiting verification',
            action: 'Review Now',
          },
          {
            id: 'interviews',
            title: 'Interviews',
            icon: '🎤',
            description: 'Schedule and manage interviews',
            action: 'Manage Interviews',
          },
          {
            id: 'approved',
            title: 'Approved Applications',
            icon: '✅',
            description: 'View approved applicants',
            action: 'View Approved',
          },
          {
            id: 'reports',
            title: 'Reports',
            icon: '📊',
            description: 'View application statistics',
            action: 'View Reports',
          },
        ],
      };
    } else if (classification.classification === 'audit') {
      return {
        title: 'Audit Dashboard',
        description: 'System audit and analytics',
        cards: [
          {
            id: 'audit-trail',
            title: 'Audit Trail',
            icon: '📋',
            description: 'View system audit trail and logs',
            action: 'View Audit Trail',
            route: '/audit-trail',
          },
          {
            id: 'analytics',
            title: 'System Analytics',
            icon: '📊',
            description: 'View system analytics and reports',
            action: 'View Analytics',
            route: '/analytics',
          },
        ],
      };
    } else if (classification.classification === 'expatriate_applicant') {
      return {
        title: 'Expatriate Application Dashboard',
        description: 'Complete your membership application',
        cards: [
          {
            id: 'form',
            title: 'Expatriate Application',
            icon: '🌍',
            description: 'Complete your expatriate membership form',
            action: 'Fill Form',
            route: '/expatriate-form',
          },
          {
            id: 'status',
            title: 'Application Status',
            icon: '📋',
            description: 'Track your application progress',
            action: 'Check Status',
            route: '/application-status',
          },
        ],
      };
    } else {
      // local_applicant
      return {
        title: 'Local Application Dashboard',
        description: 'Complete your membership application',
        cards: [
          {
            id: 'form',
            title: 'ZIE Membership Form M1',
            icon: '📋',
            description: 'Complete your Form M1 application',
            action: 'Fill Form',
            route: '/form-m1',
          },
          {
            id: 'status',
            title: 'Application Status',
            icon: '📊',
            description: 'Track your application progress',
            action: 'Check Status',
            route: '/application-status',
          },
        ],
      };
    }
  }
}
