import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

interface AuditLog {
  _id: string;
  adminEmail: string;
  adminName?: string;
  action: string;
  resourceType: string;
  description: string;
  createdAt: Date;
}

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="audit-trail-wrapper">
      <div class="audit-header">
        <div class="header-top">
          <div class="header-text">
            <h2>Audit Trail</h2>
            <p>View all system activities and admin actions</p>
          </div>
          <div class="header-buttons">
            <a routerLink="/applications-list" class="btn-applications">
              <span class="material-symbols-outlined">description</span>
              Applications
            </a>
            <a routerLink="/audit-management" class="btn-management">
              <span class="material-symbols-outlined">admin_panel_settings</span>
              Manage Audit
            </a>
          </div>
        </div>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label>Filter by Action</label>
          <select [(ngModel)]="selectedAction" (change)="applyFilters()">
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="APPROVE_APPLICATION">Approve Application</option>
            <option value="REJECT_APPLICATION">Reject Application</option>
            <option value="ASSIGN_GRADE">Assign Grade</option>
            <option value="UPDATE_APPLICATION">Update Application</option>
            <option value="VIEW_APPLICANT">View Applicant</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Start Date</label>
          <input type="date" [(ngModel)]="startDate" (change)="applyFilters()" />
        </div>

        <div class="filter-group">
          <label>End Date</label>
          <input type="date" [(ngModel)]="endDate" (change)="applyFilters()" />
        </div>

        <button (click)="clearFilters()" class="btn-clear">Clear Filters</button>
      </div>

      <div *ngIf="loading" class="loading">Loading audit logs...</div>

      <div *ngIf="!loading && logs.length === 0" class="no-data">
        No audit logs found.
      </div>

      <div *ngIf="!loading && logs.length > 0" class="logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin Email</th>
              <th>Action</th>
              <th>Resource Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs" class="log-row">
              <td>{{ log.createdAt | date: 'short' }}</td>
              <td>{{ log.adminEmail }}</td>
              <td><span class="action-badge" [attr.data-action]="log.action">{{ log.action }}</span></td>
              <td>{{ log.resourceType }}</td>
              <td>{{ log.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!loading && total > 0" class="pagination">
        <p>Showing {{ skip + 1 }} - {{ skip + logs.length }} of {{ total }} records</p>
        <button [disabled]="skip === 0" (click)="previousPage()" class="btn-pagination">Previous</button>
        <button [disabled]="skip + limit >= total" (click)="nextPage()" class="btn-pagination">Next</button>
      </div>

      <div class="export-buttons">
        <button (click)="exportCSV()" class="btn-export-csv">
          <span class="material-symbols-outlined">download</span>
          Export as CSV
        </button>
        <button (click)="exportPDF()" class="btn-export-pdf">
          <span class="material-symbols-outlined">description</span>
          Export as PDF
        </button>
      </div>
    </div>
  `,
  styles: [`
    .audit-trail-wrapper {
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .audit-header {
      margin-bottom: 20px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

    .header-text h2 {
      margin: 0;
      color: #333;
    }

    .header-text p {
      color: #666;
      margin: 5px 0 0 0;
    }

    .header-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-management {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background-color: #004A59;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background-color 0.3s ease;
      cursor: pointer;
      border: none;
    }

    .btn-management:hover {
      background-color: #003A47;
    }

    .btn-applications {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background-color: #004A59;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background-color 0.3s ease;
      cursor: pointer;
      border: none;
    }

    .btn-applications:hover {
      background-color: #003A47;
    }

    .btn-management .material-symbols-outlined,
    .btn-applications .material-symbols-outlined {
      font-size: 20px;
    }

    .filters-section {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-group label {
      font-weight: 600;
      margin-bottom: 5px;
      color: #333;
      font-size: 14px;
    }

    .filter-group select,
    .filter-group input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .btn-clear {
      padding: 8px 16px;
      background-color: #999;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-clear:hover {
      background-color: #777;
    }

    .loading {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    .no-data {
      text-align: center;
      padding: 20px;
      color: #999;
      background-color: white;
      border-radius: 4px;
    }

    .logs-table {
      background-color: white;
      border-radius: 4px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background-color: #f9f9f9;
      border-bottom: 2px solid #ddd;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    .log-row:hover {
      background-color: #f9f9f9;
    }

    .action-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .action-badge[data-action="LOGIN"] {
      background-color: #d4edda;
      color: #155724;
    }

    .action-badge[data-action="LOGOUT"] {
      background-color: #f8d7da;
      color: #721c24;
    }

    .action-badge[data-action="APPROVE_APPLICATION"] {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .action-badge[data-action="REJECT_APPLICATION"] {
      background-color: #f8d7da;
      color: #721c24;
    }

    .action-badge[data-action="ASSIGN_GRADE"] {
      background-color: #cce5ff;
      color: #004085;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding: 15px;
      background-color: white;
      border-radius: 4px;
    }

    .btn-pagination {
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-pagination:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .btn-pagination:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .export-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
    }

    .btn-export-csv,
    .btn-export-pdf {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
      font-size: 14px;
      white-space: nowrap;
    }

    .btn-export-csv .material-symbols-outlined,
    .btn-export-pdf .material-symbols-outlined {
      font-size: 18px;
    }

    .btn-export-csv {
      background-color: #28a745;
      color: white;
      border-color: #28a745;
    }

    .btn-export-csv:hover {
      background-color: #218838;
    }

    .btn-export-pdf {
      background-color: #dc3545;
      color: white;
      border-color: #dc3545;
    }

    .btn-export-pdf:hover {
      background-color: #c82333;
    }

    @media (max-width: 768px) {
      .audit-trail-wrapper {
        padding: 15px;
      }

      .header-top {
        flex-direction: column;
        gap: 15px;
      }

      .header-buttons {
        flex-direction: column;
        width: 100%;
      }

      .btn-applications,
      .btn-management {
        width: 100%;
        justify-content: center;
      }

      .filters-section {
        flex-wrap: wrap;
        gap: 10px;
      }

      .filter-group {
        flex: 1;
        min-width: 200px;
      }

      .btn-clear {
        width: 100%;
      }

      .logs-table {
        overflow-x: auto;
      }

      table {
        min-width: 700px;
        font-size: 12px;
      }

      th, td {
        padding: 8px !important;
      }

      .pagination {
        flex-direction: column;
        gap: 10px;
      }

      .btn-pagination {
        width: auto;
      }

      .export-buttons {
        flex-direction: column;
      }

      .btn-export-csv,
      .btn-export-pdf {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .audit-trail-wrapper {
        padding: 12px;
      }

      .audit-header {
        margin-bottom: 15px;
      }

      .header-text h2 {
        font-size: 18px;
      }

      .header-text p {
        font-size: 12px;
      }

      .header-buttons {
        gap: 8px;
      }

      .btn-applications,
      .btn-management {
        padding: 8px 12px;
        font-size: 11px;
        gap: 4px;
      }

      .filters-section {
        flex-direction: column;
        gap: 8px;
      }

      .filter-group {
        min-width: auto;
      }

      .filter-group label {
        font-size: 12px;
      }

      .filter-group select,
      .filter-group input {
        padding: 6px 8px;
        font-size: 12px;
      }

      .btn-clear {
        padding: 8px 12px;
        font-size: 12px;
      }

      .logs-table {
        border-radius: 0;
      }

      table {
        min-width: 600px;
        font-size: 11px;
      }

      th {
        padding: 6px 4px !important;
      }

      td {
        padding: 6px 4px !important;
      }

      .action-badge {
        padding: 2px 4px;
        font-size: 9px;
      }

      .pagination {
        padding: 12px;
        flex-direction: column;
      }

      .pagination p {
        font-size: 12px;
        margin: 0 0 8px 0;
      }

      .btn-pagination {
        padding: 6px 10px;
        font-size: 12px;
      }

      .export-buttons {
        gap: 8px;
        margin-top: 15px;
        padding-top: 12px;
      }

      .btn-export-csv,
      .btn-export-pdf {
        padding: 8px 12px;
        font-size: 12px;
      }
    }
  `]
})
export class AuditTrailComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  total = 0;
  limit = 50;
  skip = 0;
  selectedAction = '';
  startDate = '';
  endDate = '';

  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAuditLogs();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  loadAuditLogs() {
    this.loading = true;
    const params: any = { limit: this.limit, skip: this.skip };
    
    if (this.selectedAction) params.action = this.selectedAction;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.http.get<{ success: boolean; data: AuditLog[]; total: number }>(`${this.apiUrl}/logs`, { 
      params,
      headers: this.getHeaders()
    })
      .subscribe(
        (response) => {
          this.logs = response.data;
          this.total = response.total;
          this.loading = false;
        },
        (error) => {
          console.error('Error loading audit logs:', error);
          this.loading = false;
        }
      );
  }

  exportCSV(): void {
    const query = new URLSearchParams();
    if (this.selectedAction) query.append('action', this.selectedAction);
    if (this.startDate) query.append('startDate', this.startDate);
    if (this.endDate) query.append('endDate', this.endDate);

    const url = `${this.apiUrl}/export/csv?${query.toString()}`;
    this.downloadFile(url, `audit-logs-${new Date().toISOString()}.csv`);
  }

  exportPDF(): void {
    const query = new URLSearchParams();
    query.append('type', 'audit-trail');
    if (this.selectedAction) query.append('action', this.selectedAction);
    if (this.startDate) query.append('startDate', this.startDate);
    if (this.endDate) query.append('endDate', this.endDate);

    const url = `${this.apiUrl}/export/pdf?${query.toString()}`;
    this.downloadFile(url, `audit-trail-${new Date().toISOString()}.pdf`);
  }

  private downloadFile(url: string, filename: string): void {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    const token = localStorage.getItem('token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        // Check if response is actually a PDF/CSV and not an error JSON
        const contentType = xhr.getResponseHeader('content-type');
        if (contentType && (contentType.includes('application/pdf') || contentType.includes('text/csv'))) {
          const blob = xhr.response;
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(link.href);
        } else {
          // Response is likely an error JSON
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const error = JSON.parse(reader.result as string);
              alert(`Export failed: ${error.message || 'Unknown error'}`);
            } catch (e) {
              alert('Export failed: Unable to process response');
            }
          };
          reader.readAsText(xhr.response);
        }
      } else {
        alert(`Export failed with status ${xhr.status}`);
      }
    };
    
    xhr.onerror = () => {
      console.error('Error downloading file');
      alert('Network error while downloading file. Please try again.');
    };
    
    xhr.ontimeout = () => {
      alert('Request timeout. The file is taking too long to generate. Please try again or try exporting with fewer filters.');
    };
    
    xhr.timeout = 120000; // 2 minute timeout - increased for large PDF generation
    xhr.send();
  }

  applyFilters() {
    this.skip = 0;
    this.loadAuditLogs();
  }

  clearFilters() {
    this.selectedAction = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  nextPage() {
    this.skip += this.limit;
    this.loadAuditLogs();
  }

  previousPage() {
    this.skip = Math.max(0, this.skip - this.limit);
    this.loadAuditLogs();
  }
}
