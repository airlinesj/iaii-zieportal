import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface MockUser {
  id: string;
  email: string;
  password: string;
  role: 'Applicant' | 'Admin' | 'SuperAdmin';
  country?: string;
  applicationType?: 'local' | 'expatriate';
  accountType?: 'audit' | 'general';
}

interface MockApplication {
  _id: string;
  createdBy: string;
  applicationType: 'local' | 'expatriate';
  personalParticulars: any;
  chosenGrade: string;
  chosenSpecialistDivision: string;
  applicationFee: number;
  status: string;
  documents: any;
  uploadedFiles: any;
  adminChecklist: any;
  adminNotes: string;
  paymentProof: any;
  manualGrade: any;
  sponsors: any[];
  referees: any[];
  apprenticeReferee: any;
  suggestedGrade: string;
  suggestedDivision: string;
  memberSince?: string;
}

interface MockState {
  users: MockUser[];
  applications: MockApplication[];
  exchangeRate: number;
}

const DEFAULT_STATE: MockState = {
  users: [
    {
      id: '1',
      email: 'applicant@example.com',
      password: 'Password123',
      role: 'Applicant',
      country: 'Zimbabwe',
      applicationType: 'local',
    },
    {
      id: '2',
      email: 'expat@example.com',
      password: 'Password123',
      role: 'Applicant',
      country: 'South Africa',
      applicationType: 'expatriate',
    },
    {
      id: '3',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'Admin',
      accountType: 'general',
    },
    {
      id: '4',
      email: 'audit@example.com',
      password: 'Password123',
      role: 'Admin',
      accountType: 'audit',
    },
    {
      id: '5',
      email: 'superadmin@example.com',
      password: 'Password123',
      role: 'SuperAdmin',
    },
  ],
  applications: [],
  exchangeRate: 0.015,
};

const STORAGE_KEY = 'zieMockBackendState';

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!environment.useMockApi) {
      return next.handle(request);
    }

    const url = this.stripOrigin(request.url);
    const method = request.method;
    const body = request.body;
    const state = this.getState();
    const user = this.getCurrentUser(request);

    return of(null).pipe(delay(250), mergeMap(() => {
      if (url.endsWith('/auth/login') && method === 'POST') {
        return this.handleLogin(body, state);
      }

      if (url.endsWith('/auth/register') && method === 'POST') {
        return this.handleRegister(body, state);
      }

      if (url.endsWith('/auth/me') && method === 'GET') {
        return this.handleMe(user);
      }

      if (url.startsWith('/applications') && method === 'GET') {
        return this.handleGetApplications(url, user, state);
      }

      if ((url.endsWith('/applications') || url.endsWith('/applications/expatriate')) && method === 'POST') {
        return this.handleCreateApplication(url, body, user, state);
      }

      if (url.match(/^\/applications\/[0-9a-zA-Z-]+$/) && method === 'GET') {
        return this.handleGetApplication(url, user, state);
      }

      if (url.startsWith('/membership') && method === 'GET') {
        return this.handleMembershipGet(url, state, user);
      }

      if (url.startsWith('/membership/admin/set-exchange-rate') && method === 'POST') {
        return this.handleSetExchangeRate(body, state);
      }

      if (url.startsWith('/referees/') && method === 'GET') {
        return this.handleRefereeInfo(url);
      }

      if (url.startsWith('/referees/') && url.endsWith('/submit') && method === 'POST') {
        return this.handleRefereeSubmit(url);
      }

      if (url.startsWith('/settings') && method === 'GET') {
        return this.handleSettings(url, state);
      }

      if (url.startsWith('/analytics') && method === 'GET') {
        return of(new HttpResponse({ status: 200, body: { success: true, data: { totals: [], charts: [] } } }));
      }

      if (url.startsWith('/api/cpd') && method === 'GET') {
        return of(new HttpResponse({ status: 200, body: { success: true, data: [] } }));
      }

      return next.handle(request);
    }));
  }

  private stripOrigin(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  }

  private getState(): MockState {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as MockState;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const state = { ...DEFAULT_STATE, applications: [this.createSampleApplication(DEFAULT_STATE.users[0])] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  private saveState(state: MockState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private getCurrentUser(request: HttpRequest<any>): MockUser | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return null;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return null;
    }
    const state = this.getState();
    const email = token.replace('token-', '');
    return state.users.find((u) => u.email === email) || null;
  }

  private handleLogin(body: any, state: MockState): Observable<HttpEvent<any>> {
    const user = state.users.find((u) => u.email === body.email && u.password === body.password);
    if (!user) {
      return throwError(() => ({ status: 401, error: { message: 'Invalid email or password' } }));
    }

    const response = this.buildAuthResponse(user, state);
    return of(new HttpResponse({ status: 200, body: response }));
  }

  private handleRegister(body: any, state: MockState): Observable<HttpEvent<any>> {
    const existing = state.users.find((u) => u.email === body.email);
    if (existing) {
      return throwError(() => ({ status: 409, error: { message: 'Email already registered' } }));
    }

    const newUser: MockUser = {
      id: `${Date.now()}`,
      email: body.email,
      password: body.password,
      role: body.role || 'Applicant',
      country: body.country || 'Zimbabwe',
      applicationType: body.country === 'Zimbabwe' ? 'local' : 'expatriate',
    };
    state.users.push(newUser);
    this.saveState(state);

    const response = this.buildAuthResponse(newUser, state);
    return of(new HttpResponse({ status: 200, body: response }));
  }

  private handleMe(user: MockUser | null): Observable<HttpEvent<any>> {
    if (!user) {
      return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }));
    }

    const responseUser = { ...user };
    delete responseUser.password;
    return of(new HttpResponse({ status: 200, body: responseUser }));
  }

  private handleGetApplications(url: string, user: MockUser | null, state: MockState): Observable<HttpEvent<any>> {
    if (!user) {
      return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }));
    }

    const applications = user.role === 'Applicant'
      ? state.applications.filter((app) => app.createdBy === user.email)
      : state.applications;

    return of(new HttpResponse({ status: 200, body: applications }));
  }

  private handleGetApplication(url: string, user: MockUser | null, state: MockState): Observable<HttpEvent<any>> {
    if (!user) {
      return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }));
    }

    const id = url.split('/')[2];
    const application = state.applications.find((app) => app._id === id);
    if (!application) {
      return throwError(() => ({ status: 404, error: { message: 'Application not found' } }));
    }

    return of(new HttpResponse({ status: 200, body: application }));
  }

  private handleCreateApplication(url: string, body: any, user: MockUser | null, state: MockState): Observable<HttpEvent<any>> {
    if (!user) {
      return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }));
    }

    const id = `APP-${Date.now()}`;
    const application = this.createApplication(user, body, id);
    state.applications.push(application);
    this.saveState(state);

    return of(new HttpResponse({ status: 200, body: application }));
  }

  private handleMembershipGet(url: string, state: MockState, user: MockUser | null): Observable<HttpEvent<any>> {
    if (url.endsWith('/membership/available-grades')) {
      return of(new HttpResponse({ status: 200, body: {
        success: true,
        data: [
          { grade: 'Technician', gradeName: 'Technician', amountUSD: 45, amountZWG: 3000 },
          { grade: 'Technologist', gradeName: 'Technologist', amountUSD: 55, amountZWG: 3650 },
          { grade: 'Member', gradeName: 'Member', amountUSD: 60, amountZWG: 4000 },
        ],
      } }));
    }

    if (url.endsWith('/membership/annual-fee-status')) {
      const response = {
        hasMembership: !!user && user.role === 'Member',
        message: user?.role === 'Member' ? 'Renewal due soon' : 'No membership found',
        feeStatus: {
          isRenewalDue: user?.role === 'Member',
          daysUntilDue: 12,
          daysOverdue: 0,
          nextDueDate: new Date().toISOString(),
          amountUSD: 60,
          amountZWG: 4000,
          exchangeRate: state.exchangeRate,
          grade: 'Member',
          gradeName: 'Member',
          message: 'Annual fee status retrieved',
        },
        exchangeRate: state.exchangeRate,
        userInfo: user ? { email: user.email, role: user.role } : null,
      };
      return of(new HttpResponse({ status: 200, body: response }));
    }

    if (url.includes('/membership/fee-amount/')) {
      const grade = url.split('/').pop() || 'Member';
      return of(new HttpResponse({ status: 200, body: {
        grade,
        gradeName: grade,
        amountUSD: grade === 'Technician' ? 45 : grade === 'Technologist' ? 55 : 60,
        amountZWG: (grade === 'Technician' ? 45 : grade === 'Technologist' ? 55 : 60) * 72,
        exchangeRate: state.exchangeRate,
        renewalFrequencyDays: 365,
      } }));
    }

    if (url.endsWith('/membership/all-fees')) {
      return of(new HttpResponse({ status: 200, body: {
        fees: [
          { grade: 'Technician', gradeName: 'Technician', amountUSD: 45, amountZWG: 3240, exchangeRate: state.exchangeRate, renewalFrequencyDays: 365 },
          { grade: 'Technologist', gradeName: 'Technologist', amountUSD: 55, amountZWG: 3960, exchangeRate: state.exchangeRate, renewalFrequencyDays: 365 },
          { grade: 'Member', gradeName: 'Member', amountUSD: 60, amountZWG: 4320, exchangeRate: state.exchangeRate, renewalFrequencyDays: 365 },
        ],
        exchangeRate: state.exchangeRate,
        roundedExchangeRate: state.exchangeRate.toFixed(3),
        renewalCycleDays: 365,
        remindersStartAfterDays: 30,
      } }));
    }

    if (url.endsWith('/membership/exchange-rate')) {
      return of(new HttpResponse({ status: 200, body: {
        exchangeRate: state.exchangeRate,
        display: state.exchangeRate.toFixed(3),
        source: 'mock',
        isManual: true,
        lastUpdated: new Date().toISOString(),
      } }));
    }

    if (url.endsWith('/membership/admin/exchange-rate-info')) {
      return of(new HttpResponse({ status: 200, body: {
        message: 'Exchange rate info loaded',
        exchangeRate: state.exchangeRate,
        display: state.exchangeRate.toFixed(3),
        isManual: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'MockAdmin',
      } }));
    }

    return of(new HttpResponse({ status: 200, body: {} }));
  }

  private handleSetExchangeRate(body: any, state: MockState): Observable<HttpEvent<any>> {
    state.exchangeRate = Number(body.rate) || state.exchangeRate;
    this.saveState(state);

    return of(new HttpResponse({ status: 200, body: {
      message: 'Exchange rate updated',
      exchangeRate: state.exchangeRate,
      display: state.exchangeRate.toFixed(3),
      isManual: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'MockAdmin',
    } }));
  }

  private handleRefereeInfo(url: string): Observable<HttpEvent<any>> {
    return of(new HttpResponse({ status: 200, body: {
      applicantName: 'John Doe',
      grade: 'Member',
      division: 'Civil Engineering',
      sponsorEmail: 'sponsor@example.com',
      hasResponded: false,
      applicationId: 'APP-0001',
      applicantInfo: {
        applicantName: 'John Doe',
        grade: 'Member',
        company: 'Mock Engineering Co.',
      },
    } }));
  }

  private handleRefereeSubmit(url: string): Observable<HttpEvent<any>> {
    return of(new HttpResponse({ status: 200, body: {
      success: true,
      message: 'Mock referee responses saved',
    } }));
  }

  private handleSettings(url: string, state: MockState): Observable<HttpEvent<any>> {
    if (url.endsWith('/settings/exchange-rate')) {
      return of(new HttpResponse({ status: 200, body: { exchangeRate: state.exchangeRate } }));
    }

    return of(new HttpResponse({ status: 200, body: {} }));
  }

  private buildAuthResponse(user: MockUser, state: MockState): any {
    const classification = this.buildClassification(user);
    const dashboardInfo = this.buildDashboardInfo(user);

    return {
      token: `token-${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        country: user.country,
        applicationType: user.applicationType,
        userClassification: classification.classification,
      },
      classification,
      dashboard: classification.dashboard,
      dashboardInfo,
      message: 'Login successful',
    };
  }

  private buildClassification(user: MockUser) {
    if (user.role === 'SuperAdmin') {
      return {
        classification: 'superadmin',
        dashboard: '/super-admin-dashboard',
        role: 'SuperAdmin',
        displayName: 'Super Administrator',
        permissions: ['certificate_approval', 'signature_management', 'all_admin_access'],
      };
    }

    if (user.role === 'Admin') {
      return {
        classification: user.accountType === 'audit' ? 'audit' : 'admin',
        dashboard: user.accountType === 'audit' ? '/audit-trail' : '/admin-dashboard',
        role: 'Admin',
        displayName: user.accountType === 'audit' ? 'Audit Administrator' : 'Administrator',
        permissions: user.accountType === 'audit'
          ? ['view_audit_trail', 'view_reports', 'view_analytics']
          : ['application_review', 'interview_management'],
      };
    }

    if (user.role === 'Applicant') {
      const classification = user.applicationType === 'expatriate' ? 'expatriate_applicant' : 'local_applicant';
      return {
        classification,
        dashboard: '/dashboard',
        role: 'Applicant',
        displayName: 'Applicant',
        permissions: ['submit_application', 'view_status'],
      };
    }

    return {
      classification: 'member',
      dashboard: '/member-landing',
      role: user.role,
      displayName: 'Member',
      permissions: ['view_membership'],
    };
  }

  private buildDashboardInfo(user: MockUser) {
    return {
      title: `Welcome ${user.role === 'Applicant' ? 'Applicant' : user.role}`,
      description: `Mock dashboard data for ${user.email}`,
      cards: [
        { id: '1', title: 'Sample task', icon: 'check_circle', description: 'This is a placeholder card.', action: 'View tasks', route: '/dashboard' },
      ],
    };
  }

  private createSampleApplication(user: MockUser): MockApplication {
    return {
      _id: 'APP-1000',
      createdBy: user.email,
      applicationType: user.applicationType === 'expatriate' ? 'expatriate' : 'local',
      personalParticulars: {
        firstName: 'John',
        lastName: 'Doe',
        email: user.email,
        phone: '+263 77 123 4567',
        nationalId: '1234567890',
        dateOfBirth: '1990-05-15',
      },
      chosenGrade: 'Member',
      chosenSpecialistDivision: 'Civil Engineering',
      applicationFee: 60,
      status: 'Pending',
      documents: {},
      uploadedFiles: {
        nationalIdPath: 'mock-national-id.pdf',
        technicalReportPath: 'mock-technical-report.pdf',
        certificatePaths: ['mock-certificate1.pdf', 'mock-certificate2.pdf'],
        companyRecommendationLetterPath: 'mock-recommendation-letter.pdf',
      },
      adminChecklist: {
        certificates: true,
        photo: true,
        m1Form: true,
        signature: true,
        trainingReport: false,
        projectReport: false,
        organogram: false,
        referees: true,
        sponsorships: true,
      },
      adminNotes: 'Mock application notes.',
      paymentProof: {
        filePath: 'mock-payment-proof.pdf',
        verificationStatus: 'approved',
        uploadedAt: new Date().toISOString(),
      },
      manualGrade: {
        grade: 'Member',
        division: 'Civil Engineering',
        setByName: 'Mock Officer',
        setAt: new Date().toISOString(),
      },
      sponsors: [
        { name: 'Sponsor One', email: 'sponsor1@example.com', status: 'Pending' },
        { name: 'Sponsor Two', email: 'sponsor2@example.com', status: 'Pending' },
        { name: 'Sponsor Three', email: 'sponsor3@example.com', status: 'Pending' },
      ],
      referees: [
        { name: 'Referee One', email: 'referee1@example.com', relationship: 'Manager', responded: true },
      ],
      apprenticeReferee: {
        refereeName: 'Apprentice Referee',
        refereeEmail: 'apprentice@example.com',
        refereeRelationship: 'Supervisor',
        responses: null,
      },
      suggestedGrade: 'Member',
      suggestedDivision: 'Civil Engineering',
      memberSince: '2024-04-01',
    };
  }

  private createApplication(user: MockUser, body: any, id: string): MockApplication {
    return {
      _id: id,
      createdBy: user.email,
      applicationType: body.applicationType || user.applicationType || 'local',
      personalParticulars: {
        firstName: body.personalParticulars?.firstName || 'Jane',
        lastName: body.personalParticulars?.lastName || 'Doe',
        email: body.personalParticulars?.email || user.email,
        phone: body.personalParticulars?.phone || '+263 77 000 0000',
        nationalId: body.personalParticulars?.nationalId || '0000000000',
        dateOfBirth: body.personalParticulars?.dateOfBirth || '1992-01-01',
      },
      chosenGrade: body.chosenGrade || 'Technician',
      chosenSpecialistDivision: body.chosenSpecialistDivision || 'Electrical Engineering',
      applicationFee: 45,
      status: 'Submitted',
      documents: {},
      uploadedFiles: {
        nationalIdPath: null,
        technicalReportPath: null,
        certificatePaths: [],
        companyRecommendationLetterPath: null,
      },
      adminChecklist: {
        certificates: false,
        photo: false,
        m1Form: false,
        signature: false,
        trainingReport: false,
        projectReport: false,
        organogram: false,
        referees: false,
        sponsorships: false,
      },
      adminNotes: '',
      paymentProof: null,
      manualGrade: {
        grade: '',
        division: '',
        setByName: '',
        setAt: '',
      },
      sponsors: [
        { name: 'Sponsor A', email: 'sponsorA@example.com', status: 'Pending' },
        { name: 'Sponsor B', email: 'sponsorB@example.com', status: 'Pending' },
        { name: 'Sponsor C', email: 'sponsorC@example.com', status: 'Pending' },
      ],
      referees: [],
      apprenticeReferee: {
        refereeName: '',
        refereeEmail: '',
        refereeRelationship: '',
        responses: null,
      },
      suggestedGrade: body.chosenGrade || 'Technician',
      suggestedDivision: body.chosenSpecialistDivision || 'Electrical Engineering',
    };
  }
}
