import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface AuditAdmin {
  _id: string;
  email: string;
  accountType: string;
  canAccessAuditTrail: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-audit-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-management-wrapper">
      <div class="management-header">
        <h2>Audit Trail Access Management</h2>
        <p>Manage which admins can access audit logs and analytics</p>
      </div>

      <div class="management-tabs">
        <button
          [class.active]="activeTab === 'admins'"
          (click)="activeTab = 'admins'"
          class="tab-button"
        >
          Manage Admins
        </button>
        <button
          [class.active]="activeTab === 'retention'"
          (click)="activeTab = 'retention'"
          class="tab-button"
        >
          Retention Policies
        </button>
        <button
          [class.active]="activeTab === 'create'"
          (click)="activeTab = 'create'"
          class="tab-button"
        >
          Create Audit Account
        </button>
        <button
          [class.active]="activeTab === 'export'"
          (click)="activeTab = 'export'"
          class="tab-button"
        >
          Export Audit Logs
        </button>
      </div>

      <!-- Manage Admins Tab -->
      <div *ngIf="activeTab === 'admins'" class="tab-content">
        <div *ngIf="loading" class="loading">Loading audit admins...</div>

        <div *ngIf="!loading && auditAdmins.length === 0" class="no-data">
          No audit capable admins found.
        </div>

        <div *ngIf="!loading && auditAdmins.length > 0" class="admins-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Account Type</th>
                <th>Access Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let admin of auditAdmins" [class.no-access]="!admin.canAccessAuditTrail">
                <td>{{ admin.email }}</td>
                <td><span class="badge" [class.audit]="admin.accountType === 'audit'">{{ admin.accountType }}</span></td>
                <td>
                  <span *ngIf="admin.canAccessAuditTrail" class="status granted">✓ Granted</span>
                  <span *ngIf="!admin.canAccessAuditTrail" class="status revoked">✗ Revoked</span>
                </td>
                <td>{{ admin.createdAt | date: 'short' }}</td>
                <td class="actions">
                  <button
                    *ngIf="!admin.canAccessAuditTrail"
                    (click)="grantAccess(admin._id)"
                    class="btn-grant"
                    [disabled]=\"processingAdminId === admin._id\"
                  >
                    <span *ngIf=\"processingAdminId !== admin._id\">✓ Grant</span>
                    <span *ngIf=\"processingAdminId === admin._id\" class=\"loading-text\">
                      <span class=\"spinner\"></span> Granting...
                    </span>
                  </button>
                  <button
                    *ngIf=\"admin.canAccessAuditTrail\"
                    (click)=\"revokeAccess(admin._id)\"
                    class=\"btn-revoke\"
                    [disabled]=\"processingAdminId === admin._id\"
                  >
                    <span *ngIf=\"processingAdminId !== admin._id\">✗ Revoke</span>
                    <span *ngIf=\"processingAdminId === admin._id\" class=\"loading-text\">
                      <span class=\"spinner\"></span> Revoking...
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Retention Policies Tab -->
      <div *ngIf="activeTab === 'retention'" class="tab-content">
        <div class="retention-info">
          <h3>Current Retention Policies</h3>
          <div *ngIf="retentionStats" class="stats-card">
            <div class="stat-item">
              <label>Total Audit Logs:</label>
              <span>{{ retentionStats.totalLogs }}</span>
            </div>
            <div class="stat-item">
              <label>Oldest Log:</label>
              <span>{{ (retentionStats.oldestLog | date: 'short') || 'N/A' }}</span>
            </div>
            <div class="stat-item">
              <label>Logs to be Deleted:</label>
              <span class="warning">{{ retentionStats.logsToDelete }}</span>
            </div>
          </div>

          <div class="policy-list">
            <div *ngFor="let policy of policies" class="policy-item">
              <h4>{{ policy.name }}</h4>
              <p>Retention: {{ policy.retentionDays }} days</p>
              <p>Schedule: {{ policy.cronSchedule }}</p>
              <p>Status: <span [class.enabled]="policy.enabled" [class.disabled]="!policy.enabled">
                {{ policy.enabled ? 'ENABLED' : 'DISABLED' }}
              </span></p>
            </div>
          </div>

          <div class="manual-retention">
            <h3>Manual Retention Enforcement</h3>
            <div class="input-group">
              <label>Retention Days:</label>
              <input
                type="number"
                [(ngModel)]="manualRetentionDays"
                min="1"
                max="3650"
                placeholder="Enter number of days"
              />
              <button (click)="applyRetention()" class="btn-apply">Apply Retention</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Audit Account Tab -->
      <div *ngIf="activeTab === 'create'" class="tab-content">
        <div class="create-form">
          <h3>Create Audit Account</h3>
          <p class="info">Audit accounts are special admin accounts for auditing purposes with &#64;admin.audit email domain.</p>

          <div class="form-group">
            <label>Email (must contain &#64;admin.audit):</label>
            <input
              type="email"
              [(ngModel)]="newAuditAccount.email"
              placeholder="auditor@admin.audit"
              class="form-input"
            />
            <small>Example: john.doe&#64;admin.audit</small>
          </div>

          <div class="form-group">
            <label>Password:</label>
            <input
              type="password"
              [(ngModel)]="newAuditAccount.password"
              placeholder="Enter secure password"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              [(ngModel)]="newAuditAccount.confirmPassword"
              placeholder="Confirm password"
              class="form-input"
            />
          </div>

          <button (click)="createAuditAccount()" class="btn-create" [disabled]="creatingAccount">
            {{ creatingAccount ? 'Creating...' : 'Create Audit Account' }}
          </button>

          <div *ngIf="createMessage" [class]="'message ' + (createSuccess ? 'success' : 'error')">
            {{ createMessage }}
          </div>
        </div>
      </div>

      <!-- Export Audit Logs Tab -->
      <div *ngIf="activeTab === 'export'" class="tab-content">
        <div class="export-section">
          <h3>Export Audit Trail Data</h3>
          <p class="info">Download audit logs in PDF or CSV format. Data is retained for 390 days non-negotiable.</p>

          <div *ngIf="exportInfo" class="export-info-card">
            <div class="info-item">
              <label>Total Audit Records:</label>
              <span>{{ exportInfo.totalLogs | number }}</span>
            </div>
            <div class="info-item">
              <label>Date Range:</label>
              <span>
                {{ (exportInfo.oldestLog | date: 'short') || 'N/A' }} to 
                {{ (exportInfo.newestLog | date: 'short') || 'N/A' }}
              </span>
            </div>
            <div class="info-item">
              <label>Retention Policy:</label>
              <span class="badge retention">{{ exportInfo.retentionDays }} Days (Non-Negotiable)</span>
            </div>
          </div>

          <div class="export-options">
            <div class="option-card">
              <h4>
                <span class="material-symbols-outlined">file_pdf</span>
                PDF Format
              </h4>
              <p>Comprehensive report with analysis, summary statistics, and detailed tables</p>
              <button 
                (click)="exportAuditLog('pdf')"
                class="btn-export pdf"
                [disabled]="isExporting"
              >
                <span class="material-symbols-outlined">download</span>
                {{ isExporting ? 'Generating PDF...' : 'Download PDF' }}
              </button>
            </div>

            <div class="option-card">
              <h4>
                <span class="material-symbols-outlined">table_chart</span>
                CSV Format
              </h4>
              <p>Spreadsheet-compatible data for analysis in Excel or Google Sheets</p>
              <button 
                (click)="exportAuditLog('csv')"
                class="btn-export csv"
                [disabled]="isExporting"
              >
                <span class="material-symbols-outlined">download</span>
                {{ isExporting ? 'Generating CSV...' : 'Download CSV' }}
              </button>
            </div>
          </div>

          <div *ngIf="exportMessage" [class]="'export-message ' + (exportSuccess ? 'success' : 'error')">
            <span class="material-symbols-outlined">{{ exportSuccess ? 'check_circle' : 'error' }}</span>
            {{ exportMessage }}
          </div>

          <div class="export-note">
            <span class="material-symbols-outlined">info</span>
            <div>
              <strong>Data Retention Policy:</strong>
              <p>
                Audit logs are retained for a mandatory 390-day cycle. After 390 days, 
                logs are automatically cleared from the system. Before deletion, all audit data 
                is exported and archived, with copies sent to audit administrators and superadmins via email.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Messages -->
      <div *ngIf=\"notificationMessage\" [class]=\"'notification ' + notificationMessage.type\">
        <span>{{ notificationMessage.text }}</span>
        <button (click)=\"notificationMessage = null\" class=\"close-notification\">×</button>
      </div>
    </div>
  `,
  styles: [`
    .audit-management-wrapper {
      padding: 32px;
      background: linear-gradient(180deg, #f8f9fa 0%, #f0f3f8 100%);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .management-header {
      margin-bottom: 40px;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.06);
      border: 1px solid #e5e7eb;
      background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
    }

    .management-header h2 {
      margin: 0;
      color: #004A59;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .management-header p {
      color: #6b7280;
      margin: 12px 0 0 0;
      font-size: 15px;
      font-weight: 500;
    }

    .management-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
      background: transparent;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      border-bottom: 2px solid #e5e7eb;
    }

    .tab-button {
      padding: 16px 28px;
      background: transparent;
      border: none;
      border-radius: 0;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-weight: 600;
      color: #6b7280;
      transition: all 0.3s ease;
      font-size: 14px;
      position: relative;
      overflow: visible;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 13px;
    }

    .tab-button:hover {
      color: #004A59;
      background: transparent;
    }

    .tab-button.active {
      color: #004A59;
      background: transparent;
      border-bottom-color: #004A59;
      box-shadow: none;
      transform: none;
    }

    .tab-content {
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.06);
      border: 1px solid #e5e7eb;
      animation: fadeInUp 0.3s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .loading {
      text-align: center;
      padding: 60px 40px;
      color: #9ca3af;
      font-size: 15px;
    }

    .no-data {
      text-align: center;
      padding: 60px 40px;
      color: #d1d5db;
      font-size: 15px;
    }

    .admins-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }

    th {
      padding: 16px 18px;
      text-align: left;
      font-weight: 700;
      color: #004A59;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    td {
      padding: 16px 18px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
      color: #374151;
    }

    tbody tr {
      transition: all 0.2s ease;
    }

    tbody tr:hover {
      background-color: #f9fafb;
    }

    tr.no-access {
      background-color: #fef3c7;
    }

    tr.no-access:hover {
      background-color: #fde68a;
    }

    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: #f3f4f6;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1px solid #e5e7eb;
    }

    .badge.audit {
      background: #fef3c7;
      color: #92400e;
      border-color: #fcd34d;
    }

    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1px solid transparent;
    }

    .status.granted {
      background: #d1fae5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .status.revoked {
      background: #fee2e2;
      color: #7f1d1d;
      border-color: #fecaca;
    }

    .actions {
      text-align: right;
    }

    .btn-grant,
    .btn-revoke,
    .btn-apply,
    .btn-create {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
    }

    .btn-grant {
      background: #dbeafe;
      color: #0c4a6e;
      border: 1px solid #7dd3fc;
    }

    .btn-grant:hover {
      background: #bfdbfe;
      box-shadow: 0 4px 8px rgba(0, 74, 89, 0.12);
      transform: translateY(-1px);
    }

    .btn-revoke {
      background: #fee2e2;
      color: #7f1d1d;
      border: 1px solid #fecaca;
    }

    .btn-revoke:hover {
      background: #fecaca;
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.12);
      transform: translateY(-1px);
    }

    .btn-apply,
    .btn-create {
      background: #fef3c7;
      color: #78350f;
      border: 1px solid #fcd34d;
    }

    .btn-apply:hover,
    .btn-create:hover {
      background: #fde68a;
      box-shadow: 0 4px 8px rgba(180, 83, 9, 0.12);
      transform: translateY(-1px);
    }

    .btn-apply:disabled,
    .btn-create:disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
      border-color: #d1d5db;
    }

    .stats-card {
      background: linear-gradient(135deg, #004A59 0%, #1a5f6b 100%);
      padding: 28px;
      border-radius: 12px;
      margin-bottom: 28px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      border: 1px solid rgba(0, 74, 89, 0.2);
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.12);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.1);
      padding: 18px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .stat-item label {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      font-size: 11px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .stat-item span {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
    }

    .stat-item span.warning {
      color: #fbbf24;
    }

    .policy-list {
      margin-bottom: 28px;
    }

    .policy-item {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .policy-item h4 {
      margin: 0 0 10px 0;
      color: #004A59;
      font-size: 16px;
      font-weight: 700;
    }

    .policy-item p {
      margin: 8px 0;
      color: #6b7280;
      font-size: 13px;
      font-weight: 500;
    }

    .policy-item span {
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: inline-block;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .policy-item span.enabled {
      background: #d1fae5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .policy-item span.disabled {
      background: #fee2e2;
      color: #7f1d1d;
      border-color: #fecaca;
    }

    .manual-retention {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      padding: 24px;
      border-radius: 8px;
      margin-top: 28px;
      box-shadow: 0 2px 8px rgba(180, 83, 9, 0.1);
    }

    .manual-retention h3 {
      color: #78350f;
      margin-top: 0;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .input-group {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .input-group label {
      font-weight: 700;
      color: #78350f;
      font-size: 13px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .input-group input {
      padding: 10px 12px;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      font-size: 13px;
      min-width: 140px;
      transition: all 0.2s ease;
      background: #ffffff;
      color: #374151;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .input-group input::placeholder {
      color: #d1d5db;
      font-weight: 500;
    }

    .input-group input:hover {
      border-color: #f59e0b;
      box-shadow: 0 4px 8px rgba(180, 83, 9, 0.1);
    }

    .input-group input:focus {
      outline: none;
      border-color: #d97706;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
    }

    .create-form {
      max-width: 100%;
    }

    .create-form h3 {
      color: #004A59;
      margin-top: 0;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .create-form .info {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      color: #0c4a6e;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
      border: 1px solid #bfdbfe;
      box-shadow: 0 2px 4px rgba(0, 74, 89, 0.05);
      line-height: 1.6;
    }

    .form-group {
      margin-bottom: 20px;
      position: relative;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      font-size: 13px;
      letter-spacing: 0.3px;
      text-transform: capitalize;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      transition: all 0.2s ease;
      font-weight: 500;
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .form-input::placeholder {
      color: #9ca3af;
      font-weight: 500;
    }

    .form-input:hover {
      border-color: #9ca3af;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
    }

    .form-input:focus {
      outline: none;
      border-color: #004A59;
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.1);
      background: #fafbfc;
    }

    .form-group small {
      display: block;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 6px;
      font-weight: 500;
    }

    .message {
      padding: 14px 16px;
      border-radius: 6px;
      margin-top: 16px;
      font-size: 13px;
      font-weight: 600;
      border-left: 4px solid;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .message.success {
      background: #d1fae5;
      color: #065f46;
      border-left-color: #10b981;
    }

    .message.error {
      background: #fee2e2;
      color: #7f1d1d;
      border-left-color: #ef4444;
    }

    .btn-grant:disabled,
    .btn-revoke:disabled,
    .btn-apply:disabled,
    .btn-create:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
      transform: none !important;
    }

    .loading-text {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fef3c7;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      animation: slideIn 0.3s ease;
      z-index: 1000;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification.success {
      background: #d1fae5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .notification.error {
      background: #fee2e2;
      color: #7f1d1d;
      border-color: #fecaca;
    }

    .notification.info {
      background: #f0f9ff;
      color: #0c4a6e;
      border-color: #bfdbfe;
    }

    .close-notification {
      background: transparent;
      border: none;
      color: currentColor;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      opacity: 0.7;
    }

    .close-notification:hover {
      opacity: 1;
    }

    /* Export Section Styles */
    .export-section h3 {
      color: #004A59;
      margin-bottom: 12px;
      font-weight: 700;
    }

    .export-section .info {
      color: #6b7280;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .export-info-card {
      background: #f3f4f6;
      border: 2.5px solid #004A59;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .info-item label {
      font-weight: 600;
      color: #004A59;
    }

    .info-item span {
      background: white;
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .info-item .badge.retention {
      background: #FFF3CD;
      color: #856404;
      border-color: #ffeaa7;
      font-weight: 700;
    }

    .export-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .option-card {
      background: white;
      border: 2.5px solid #ddd;
      border-radius: 8px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.3s ease;
    }

    .option-card:hover {
      border-color: #004A59;
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.1);
    }

    .option-card h4 {
      margin: 0;
      color: #004A59;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .option-card .material-symbols-outlined {
      font-size: 24px;
    }

    .option-card p {
      margin: 0;
      color: #666;
      font-size: 13px;
    }

    .btn-export {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
      margin-top: auto;
    }

    .btn-export.pdf {
      background: #dc2626;
      color: white;
    }

    .btn-export.pdf:hover:not(:disabled) {
      background: #b91c1c;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
    }

    .btn-export.csv {
      background: #16a34a;
      color: white;
    }

    .btn-export.csv:hover:not(:disabled) {
      background: #15803d;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(22, 163, 74, 0.2);
    }

    .btn-export:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .export-message {
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: 600;
    }

    .export-message.success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .export-message.error {
      background: #fee2e2;
      color: #7f1d1d;
      border: 1px solid #fecaca;
    }

    .export-note {
      background: #e8f4f8;
      border-left: 4px solid #3498db;
      border-radius: 4px;
      padding: 16px;
      display: flex;
      gap: 12px;
    }

    .export-note .material-symbols-outlined {
      color: #3498db;
      flex-shrink: 0;
    }

    .export-note div {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .export-note strong {
      color: #004A59;
    }

    .export-note p {
      margin: 0;
      color: #555;
      font-size: 13px;
      line-height: 1.6;
    }
  `]
})
export class AuditManagementComponent implements OnInit {
  activeTab: 'admins' | 'retention' | 'create' | 'export' = 'admins';
  auditAdmins: AuditAdmin[] = [];
  loading = false;
  processingAdminId: string | null = null;
  notificationMessage: { type: 'success' | 'error' | 'info'; text: string } | null = null;
  retentionStats: any = null;
  policies: any[] = [];
  manualRetentionDays = 90;
  creatingAccount = false;
  createMessage = '';
  createSuccess = false;

  // Export-related properties
  exportInfo: any = null;
  isExporting = false;
  exportMessage = '';
  exportSuccess = false;

  newAuditAccount = {
    email: '',
    password: '',
    confirmPassword: '',
  };

  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  ngOnInit(): void {
    this.loadAuditAdmins();
    this.loadRetentionStats();
    this.loadExportInfo();
  }

  loadAuditAdmins(): void {
    this.loading = true;
    this.http.get<{ success: boolean; data: AuditAdmin[] }>(`${this.apiUrl}/admin/audit-admins`, {
      headers: this.getHeaders()
    }).subscribe(
      (response) => {
        this.auditAdmins = response.data;
        this.loading = false;
      },
      (error) => {
        console.error('Error loading audit admins:', error);
        this.loading = false;
      }
    );
  }

  loadRetentionStats(): void {
    this.http.get<{ success: boolean; data: any; policies: any[] }>(`${this.apiUrl}/retention/stats`, {
      headers: this.getHeaders()
    }).subscribe(
      (response) => {
        this.retentionStats = response.data;
        this.policies = response.policies;
      },
      (error) => {
        console.error('Error loading retention stats:', error);
      }
    );
  }

  grantAccess(adminId: string): void {
    this.processingAdminId = adminId;
    this.http.post(`${this.apiUrl}/admin/grant-access/${adminId}`, {}, {
      headers: this.getHeaders()
    }).subscribe(
      (response: any) => {
        this.processingAdminId = null;
        this.loadAuditAdmins();
        this.showNotification('success', 'Access granted successfully!');
      },
      (error) => {
        this.processingAdminId = null;
        const errorMsg = error?.error?.message || 'Failed to grant access. Please try again.';
        this.showNotification('error', errorMsg);
        console.error('Error granting access:', error);
      }
    );
  }

  revokeAccess(adminId: string): void {
    if (!confirm('Are you sure you want to revoke audit access? This admin will no longer be able to view audit logs.')) {
      return;
    }
    
    this.processingAdminId = adminId;
    this.http.post(`${this.apiUrl}/admin/revoke-access/${adminId}`, {}, {
      headers: this.getHeaders()
    }).subscribe(
      (response: any) => {
        this.processingAdminId = null;
        this.loadAuditAdmins();
        this.showNotification('success', 'Access revoked successfully!');
      },
      (error) => {
        this.processingAdminId = null;
        const errorMsg = error?.error?.message || 'Failed to revoke access. Please try again.';
        this.showNotification('error', errorMsg);
        console.error('Error revoking access:', error);
      }
    );
  }

  private showNotification(type: 'success' | 'error' | 'info', text: string): void {
    this.notificationMessage = { type, text };
    setTimeout(() => {
      this.notificationMessage = null;
    }, 5000);
  }

  applyRetention(): void {
    if (!this.manualRetentionDays || this.manualRetentionDays < 1) {
      alert('Please enter a valid number of days');
      return;
    }

    this.http.post(`${this.apiUrl}/retention/apply`, { retentionDays: this.manualRetentionDays }, {
      headers: this.getHeaders()
    }).subscribe(
      (response: any) => {
        alert(response.message);
        this.loadRetentionStats();
      },
      (error) => {
        console.error('Error applying retention:', error);
        alert('Error applying retention policy');
      }
    );
  }

  createAuditAccount(): void {
    if (!this.newAuditAccount.email || !this.newAuditAccount.password) {
      this.createMessage = 'Please fill in all fields';
      this.createSuccess = false;
      return;
    }

    if (this.newAuditAccount.password !== this.newAuditAccount.confirmPassword) {
      this.createMessage = 'Passwords do not match';
      this.createSuccess = false;
      return;
    }

    if (!this.newAuditAccount.email.includes('@admin.audit')) {
      this.createMessage = 'Email must contain @admin.audit';
      this.createSuccess = false;
      return;
    }

    this.creatingAccount = true;
    this.http
      .post(`${environment.apiUrl}/auth/register`, {
        email: this.newAuditAccount.email,
        password: this.newAuditAccount.password,
        role: 'Audit',
      }, {
        headers: this.getHeaders()
      })
      .subscribe(
        (response: any) => {
          this.createMessage = `Audit account created successfully: ${this.newAuditAccount.email}`;
          this.createSuccess = true;
          this.newAuditAccount = { email: '', password: '', confirmPassword: '' };
          this.creatingAccount = false;
          this.loadAuditAdmins();
        },
        (error) => {
          this.createMessage = error.error?.message || 'Error creating audit account';
          this.createSuccess = false;
          this.creatingAccount = false;
        }
      );
  }

  loadExportInfo(): void {
    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/export/info`, {
      headers: this.getHeaders()
    }).subscribe(
      (response) => {
        this.exportInfo = response.data;
      },
      (error) => {
        console.error('Error loading export info:', error);
      }
    );
  }

  exportAuditLog(format: 'pdf' | 'csv'): void {
    this.isExporting = true;
    this.exportMessage = '';

    const endpoint = `${this.apiUrl}/export/${format}`;

    this.http.get(endpoint, {
      headers: this.getHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).subscribe(
      (response: any) => {
        // Get filename from response headers if available
        let filename = `audit-report.${format}`;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) {
            filename = match[1];
          }
        }

        // Create blob and download
        const blob = response.body;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        this.exportSuccess = true;
        this.exportMessage = `${format.toUpperCase()} export downloaded successfully!`;
        this.isExporting = false;

        setTimeout(() => {
          this.exportMessage = '';
        }, 5000);
      },
      (error) => {
        console.error('Error exporting audit log:', error);
        this.exportSuccess = false;
        this.exportMessage = error.error?.message || `Failed to export ${format.toUpperCase()}`;
        this.isExporting = false;
      }
    );
  }
}
