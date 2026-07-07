import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CpdService {
  private apiUrl = `${environment.apiUrl}/api/cpd`;

  constructor(private http: HttpClient) {}

  submitApplication(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications`, formData);
  }

  getApplications(filters?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications`, { params: filters });
  }

  getApplication(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications/${id}`);
  }

  updateApplication(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/applications/${id}`, data);
  }

  assessApplication(id: string, assessment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${id}/assess`, assessment);
  }

  // ===== PAYMENT & APPROVAL METHODS =====

  /**
   * Approve CPD application for payment
   */
  approveApplication(id: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${id}/approve`, { notes });
  }

  /**
   * Reject CPD application
   */
  rejectApplication(id: string, rejectionReason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${id}/reject`, { rejectionReason });
  }

  /**
   * Upload payment proof
   */
  uploadPaymentProof(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('paymentProof', file);
    return this.http.post(`${this.apiUrl}/applications/${id}/payment-proof`, formData);
  }

  /**
   * Initiate payment
   */
  initiatePayment(id: string, paymentMethod: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${id}/initiate-payment`, { paymentMethod });
  }

  /**
   * Complete payment
   */
  completePayment(id: string, transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${id}/complete-payment`, { transactionId });
  }

  /**
   * Verify payment (Admin only)
   */
  verifyPayment(id: string, verified: boolean, notes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/applications/${id}/verify-payment`, { verified, notes });
  }

  /**
   * Get pending approvals (Admin only)
   */
  getPendingApprovals(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/pending-approvals`, {
      params: { page, limit }
    });
  }

  /**
   * Get pending payments (Admin only)
   */
  getPendingPayments(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/pending-payments`, {
      params: { page, limit }
    });
  }

  /**
   * Get user's CPD applications
   */
  getUserApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-applications`);
  }

  /**
   * Delete application
   */
  deleteApplication(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/applications/${id}`);
  }

  // ===== TRAINING ELEMENTS REVIEW METHODS (Admin) =====

  getTrainingElementsReviews(params: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/training-elements-reviews`, { params });
  }

  getTrainingElementsReview(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/training-elements-reviews/${id}`);
  }

  approveTrainingElementsReview(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/training-elements-reviews/${id}/approve`, {});
  }

  rejectTrainingElementsReview(id: string, reviewNotes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/training-elements-reviews/${id}/reject`, { reviewNotes });
  }

  requestClarificationTrainingElements(id: string, reviewNotes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/training-elements-reviews/${id}/request-clarification`, { reviewNotes });
  }

  /**
   * Download file
   */
  downloadFile(id: string, fileType: string): void {
    const url = `${this.apiUrl}/applications/${id}/files/${fileType}`;
    window.open(url, '_blank');
  }
}

