import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApplicationData {
  personalParticulars: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationalId: string;
    dateOfBirth: Date;
    nationality: string;
    professionalNumber?: string;
  };
  education: Array<{
    institution: string;
    qualification: string;
    year: number;
    major?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startYear: number;
    endYear: number;
    description: string;
  }>;
  chosenGrade: string;
  chosenSpecialistDivision: string;
  sponsors: Array<{
    name: string;
    email: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;
  
  // Public getter for uploads base URL (used in components)
  public get uploadsBaseUrl(): string {
    return `${environment.apiUrl}/uploads`;
  }
  private applicationUpdateSubject = new BehaviorSubject<any>(null);
  public applicationUpdate$ = this.applicationUpdateSubject.asObservable();
  
  private autoRefreshIntervalMs = 5000; // Auto-refresh every 5 seconds

  constructor(private http: HttpClient) {}

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  submitApplication(data: ApplicationData): Observable<any> {
    return this.http.post(this.apiUrl, data, { headers: this.getHeaders() });
  }

  submitApplicationWithFiles(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    // Note: Do NOT set Content-Type header when using FormData
    // The browser will set it automatically with the correct boundary
    return this.http.post(this.apiUrl, formData, { headers });
  }

  submitExpatriateApplication(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    // Note: Do NOT set Content-Type header when using FormData
    // The browser will set it automatically with the correct boundary
    return this.http.post(`${this.apiUrl}/expatriate`, formData, { headers });
  }

  getApplications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getApplicationByUser(): Observable<any[]> {
    return this.getApplications(); // Same endpoint - backend filters by userId
  }

  getApplicationById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Auto-refresh application data with real-time updates
  getApplicationByIdWithAutoRefresh(id: string): Observable<any> {
    return interval(this.autoRefreshIntervalMs).pipe(
      startWith(0),
      switchMap(() => this.getApplicationById(id))
    );
  }

  // Notify subscribers of application updates (for admin dashboard)
  notifyApplicationUpdate(applicationData: any): void {
    this.applicationUpdateSubject.next(applicationData);
  }

  updateApplicationStatus(id: string, statusData: string | any): Observable<any> {
    // Support both string (legacy) and object (with rejectionReason, etc.)
    const body = typeof statusData === 'string' ? { status: statusData } : statusData;
    return this.http.put(
      `${this.apiUrl}/${id}/status`,
      body,
      { headers: this.getHeaders() }
    );
  }

  getAllApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/all`, { headers: this.getHeaders() });
  }

  updateApplicationChecklist(id: string, checklistData: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/checklist`,
      checklistData,
      { headers: this.getHeaders() }
    );
  }

  getVerificationReport(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/verification-report`, { headers: this.getHeaders() });
  }

  uploadPaymentProof(applicationId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.apiUrl}/${applicationId}/payment-proof`, formData, { headers });
  }

  verifyPayment(applicationId: string, verified: boolean): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${applicationId}/verify-payment`,
      { verified },
      { headers: this.getHeaders() }
    );
  }

  processPayment(applicationId: string, paymentData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/process-payment`,
      paymentData,
      { headers: this.getHeaders() }
    );
  }

  setManualGrade(applicationId: string, gradeData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/manual-grade`,
      gradeData,
      { headers: this.getHeaders() }
    );
  }

  addAdminApproval(applicationId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/approve-interview`,
      {},
      { headers: this.getHeaders() }
    );
  }

  sendInterviewNotification(applicationId: string, message: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/send-interview-notification`,
      { message },
      { headers: this.getHeaders() }
    );
  }

  getCertificate(applicationId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${applicationId}/certificate`,
      { headers: this.getHeaders() }
    );
  }

  passInterview(applicationId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/pass-interview`,
      {},
      { headers: this.getHeaders() }
    );
  }

  verifyRefereeResponses(applicationId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${applicationId}/verify-referee-responses`,
      { refereeResponsesVerified: true, refereeResponsesVerifiedAt: new Date() },
      { headers: this.getHeaders() }
    );
  }

  updateApplication(applicationId: string, data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${applicationId}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  updateExpatriateAdmission(applicationId: string, admissionData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/expatriate-admission`,
      admissionData,
      { headers: this.getHeaders() }
    );
  }

  confirmExpatriateAdmission(applicationId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/expatriate-admission`,
      { status: 'admitted', message: 'Certificate approved by Super Admin' },
      { headers: this.getHeaders() }
    );
  }

  sendApprenticeAppraisalForm(applicationId: string, apprenticeData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${applicationId}/send-apprentice-appraisal`,
      apprenticeData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Fetch available membership grades from the backend
   * @returns Observable of grades array
   */
  getAvailableMembershipGrades(): Observable<any> {
    const membershipApiUrl = `${environment.apiUrl}/membership`;
    return this.http.get(`${membershipApiUrl}/available-grades`, { headers: this.getHeaders() });
  }
}