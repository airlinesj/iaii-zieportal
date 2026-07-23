import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing.component';
import { LoginComponent } from './pages/login.component';
import { LoginRedirectComponent } from './pages/login-redirect.component';
import { RegisterComponent } from './pages/register.component';
import { CpdApplicationComponent } from './pages/cpd-application.component';
import { ApplicantDashboardComponent } from './pages/applicant-dashboard.component';
import { MemberLandingComponent } from './pages/member-landing.component';
import { FormM1Component } from './pages/form-m1.component';
import { ExpatriateFormComponent } from './pages/expatriate-form.component';
import { RefereeReviewComponent } from './pages/sponsor-review.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { SuperAdminDashboardComponent } from './pages/super-admin-dashboard.component';
import { AdminApplicationDetailsComponent } from './pages/admin-application-details.component';
import { ApplicationDetailsComponent } from './pages/application-details.component';
import { PaymentComponent } from './pages/payment.component';
import { UpdatesComponent } from './pages/updates.component';
import { ApplicationsListComponent } from './pages/applications-list.component';
import { CertificateComponent } from './components/certificate.component';
import { AuditTrailComponent } from './components/audit-trail.component';
import { AnalyticsComponent } from './components/analytics.component';
import { AuditManagementComponent } from './components/audit-management.component';
import { RoleGuard } from './guards/role.guard';
import { ApplicationTypeGuard } from './guards/application-type.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'login-redirect', component: LoginRedirectComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'apply-cpd', component: CpdApplicationComponent },
  { path: 'dashboard', component: ApplicantDashboardComponent, canActivate: [RoleGuard], data: { roles: ['Applicant'] } },
  { path: 'member-landing', component: MemberLandingComponent, canActivate: [RoleGuard], data: { roles: ['Member'] } },
  { path: 'form-m1', component: FormM1Component, canActivate: [RoleGuard, ApplicationTypeGuard], data: { roles: ['Applicant'] } },
  { path: 'expatriate-form', component: ExpatriateFormComponent, canActivate: [RoleGuard, ApplicationTypeGuard], data: { roles: ['Applicant'] } },
  { path: 'payment', component: PaymentComponent, canActivate: [RoleGuard], data: { roles: ['Applicant'] } },
  { path: 'updates', component: UpdatesComponent, canActivate: [RoleGuard], data: { roles: ['Applicant', 'Member'] } },
  { path: 'certificate/:id', component: CertificateComponent, canActivate: [RoleGuard], data: { roles: ['Applicant', 'Member'] } },
  { path: 'sponsor-review/:token', component: RefereeReviewComponent },
  { path: 'referee-review/:token', component: RefereeReviewComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [RoleGuard], data: { roles: ['Admin', 'SuperAdmin'] } },
  { path: 'super-admin-dashboard', component: SuperAdminDashboardComponent, canActivate: [RoleGuard], data: { roles: ['SuperAdmin'] } },
  { path: 'applications-list', component: ApplicationsListComponent, canActivate: [RoleGuard], data: { roles: ['Admin', 'SuperAdmin'] } },
  { path: 'application/:id', component: AdminApplicationDetailsComponent, canActivate: [RoleGuard], data: { roles: ['Admin', 'SuperAdmin'] } },
  { path: 'audit-trail', component: AuditTrailComponent, canActivate: [RoleGuard], data: { roles: ['Admin'], accountType: 'audit' } },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [RoleGuard], data: { roles: ['Admin', 'SuperAdmin'] } },
  { path: 'audit-management', component: AuditManagementComponent, canActivate: [RoleGuard], data: { roles: ['Admin'], accountType: 'audit' } },
  { path: '**', redirectTo: '/' },
];

