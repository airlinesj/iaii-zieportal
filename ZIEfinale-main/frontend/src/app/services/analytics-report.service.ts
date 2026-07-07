import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentStats {
  totalPaymentsPending: number;
  totalPaymentsCompleted: number;
  totalPaymentsFailed: number;
  completionRate: number;
}

export interface AdminStats {
  adminId: string;
  adminEmail: string;
  adminName?: string;
  totalApprovals: number;
  totalRejections: number;
  approvalRate: number;
}

export interface SystemAnalytics {
  totalApplications: number;
  totalApproved: number;
  totalRejected: number;
  totalUnderReview: number;
  approvalRate: number;
  averageProcessingTime: number;
  paymentStats: PaymentStats;
  adminStats: AdminStats[];
  topPerformingAdmin?: AdminStats;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsReportService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  /**
   * Get current system analytics
   */
  getSystemAnalytics(startDate?: Date, endDate?: Date): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    return this.http.get<any>(`${this.apiUrl}/system-analytics`, { params });
  }

  /**
   * Download analytics report as CSV
   */
  downloadAnalyticsCSV(startDate?: Date, endDate?: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      if (!token) {
        reject(new Error('No authentication token found. Please log in.'));
        return;
      }

      let params = new HttpParams();
      if (startDate) {
        params = params.set('startDate', startDate.toISOString());
      }
      if (endDate) {
        params = params.set('endDate', endDate.toISOString());
      }

      this.http
        .get(`${this.apiUrl}/export/analytics-csv`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        })
        .subscribe({
          next: (blob: Blob) => {
            // Check if response is actually a blob with CSV content
            if (blob.type === 'application/json') {
              // Error response was returned as blob
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const error = JSON.parse(reader.result as string);
                  console.error('Server error:', error);
                  reject(new Error(error.message || 'Failed to generate analytics report'));
                } catch (e) {
                  console.error('Failed to parse error response:', e);
                  reject(new Error('Failed to download analytics report. Please try again.'));
                }
              };
              reader.readAsText(blob);
              return;
            }

            try {
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              resolve();
            } catch (error) {
              console.error('Error creating download link:', error);
              reject(error instanceof Error ? error : new Error('Failed to download file'));
            }
          },
          error: (error) => {
            console.error('Error downloading analytics CSV:', error);
            const errorMessage = error?.error?.message || error?.message || 'Failed to download analytics report';
            reject(new Error(errorMessage));
          },
        });
    });
  }

  /**
   * Get admin approval statistics
   */
  getAdminStats(startDate?: Date, endDate?: Date): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    return this.http.get<any>(`${this.apiUrl}/admin-stats`, { params });
  }

  /**
   * Get monthly report
   */
  getMonthlyReport(month: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/monthly-report/${month}/${year}`);
  }

  /**
   * Get current month report
   */
  getCurrentMonthReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/monthly-report/current`);
  }
}
