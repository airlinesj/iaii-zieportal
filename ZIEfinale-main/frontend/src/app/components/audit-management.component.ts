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
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .management-header {
      margin-bottom: 40px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 36px;
      border-radius: 16px;
      box-shadow: 0 10px 32px rgba(0, 74, 89, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(185, 149, 50, 0.1);
    }

    .management-header h2 {
      margin: 0;
      color: #1a202c;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.8px;
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .management-header p {
      color: #718096;
      margin: 12px 0 0 0;
      font-size: 16px;
      font-weight: 500;
    }

    .management-tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 28px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 10px;
      border-radius: 14px;
      box-shadow: 0 6px 20px rgba(0, 74, 89, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(185, 149, 50, 0.1);
    }

    .tab-button {
      padding: 14px 32px;
      background: transparent;
      border: 2px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      color: #718096;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-size: 15px;
      position: relative;
      overflow: hidden;
    }

    .tab-button::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .tab-button:hover::after {
      opacity: 1;
    }

    .tab-button.active {
      color: #ffffff;
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      box-shadow: 0 8px 24px rgba(0, 74, 89, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border-color: rgba(185, 149, 50, 0.3);
      transform: scale(1.02);
    }

    .tab-button:hover:not(.active) {
      color: #004A59;
      background: rgba(0, 74, 89, 0.08);
      border-color: rgba(0, 74, 89, 0.2);
      transform: translateY(-2px);
    }

    .tab-content {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 36px;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 74, 89, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(185, 149, 50, 0.1);
      animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .loading {
      text-align: center;
      padding: 60px 40px;
      color: #718096;
      font-size: 16px;
    }

    .no-data {
      text-align: center;
      padding: 60px 40px;
      color: #a0aec0;
      font-size: 16px;
    }

    .admins-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      border-bottom: none;
    }

    th {
      padding: 18px 20px;
      text-align: left;
      font-weight: 700;
      color: white;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 18px 20px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      color: #2d3748;
    }

    tbody tr {
      transition: all 0.3s ease;
    }

    tbody tr:hover {
      background-color: #f8fafc;
    }

    tr.no-access {
      background-color: #f0f9ff;
    }

    tr.no-access:hover {
      background-color: #e0f2fe;
    }

    .badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: linear-gradient(135deg, #e6fffa 0%, #e0f2fe 100%);
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1.5px solid rgba(3, 105, 161, 0.3);
      box-shadow: 0 4px 12px rgba(3, 105, 161, 0.15);
      backdrop-filter: blur(4px);
    }

    .badge.audit {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #b45309;
      border-color: rgba(180, 83, 9, 0.3);
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
    }

    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1.5px solid transparent;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(4px);
    }

    .status.granted {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #166534;
      border-color: rgba(22, 101, 52, 0.3);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }

    .status.revoked {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
      border-color: rgba(153, 27, 27, 0.3);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }

    .actions {
      text-align: right;
    }

    .btn-grant,
    .btn-revoke,
    .btn-apply,
    .btn-create {
      padding: 14px 28px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      text-transform: uppercase;
      letter-spacing: 0.7px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      position: relative;
      overflow: hidden;
      border: 2px solid transparent;
    }

    .btn-grant,
    .btn-revoke,
    .btn-apply,
    .btn-create {
      background-clip: padding-box;
    }

    .btn-grant,
    .btn-revoke,
    .btn-apply,
    .btn-create::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
      pointer-events: none;
    }

    .btn-grant {
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
      color: white;
      border: 2px solid rgba(16, 185, 129, 0.4);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .btn-grant:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
      box-shadow: 0 12px 32px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transform: translateY(-3px) scale(1.02);
      border-color: rgba(16, 185, 129, 0.6);
    }

    .btn-grant:active {
      transform: translateY(-1px) scale(0.98);
    }

    .btn-revoke {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
      color: white;
      border: 2px solid rgba(239, 68, 68, 0.4);
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .btn-revoke:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
      box-shadow: 0 12px 32px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transform: translateY(-3px) scale(1.02);
      border-color: rgba(239, 68, 68, 0.6);
    }

    .btn-revoke:active {
      transform: translateY(-1px) scale(0.98);
    }

    .btn-apply,
    .btn-create {
      background: linear-gradient(135deg, #004A59 0%, #B99532 50%, #9d7a2d 100%);
      color: white;
      border: 2px solid rgba(185, 149, 50, 0.4);
      box-shadow: 0 8px 24px rgba(0, 74, 89, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .btn-apply:hover,
    .btn-create:hover {
      background: linear-gradient(135deg, #B99532 0%, #9d7a2d 50%, #8b6a1f 100%);
      box-shadow: 0 12px 32px rgba(0, 74, 89, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transform: translateY(-3px) scale(1.02);
      border-color: rgba(185, 149, 50, 0.6);
    }

    .btn-apply:active,
    .btn-create:active {
      transform: translateY(-1px) scale(0.98);
    }

    .btn-apply:disabled,
    .btn-create:disabled {
      background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
      cursor: not-allowed;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: none;
      opacity: 0.6;
      border-color: rgba(148, 163, 184, 0.4);
    }

    .stats-card {
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      padding: 28px;
      border-radius: 16px;
      margin-bottom: 28px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      border: none;
      box-shadow: 0 8px 32px rgba(0, 74, 89, 0.25);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.12);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }

    .stat-item label {
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-item span {
      font-size: 32px;
      font-weight: 800;
      color: white;
    }

    .stat-item span.warning {
      color: #fbbf24;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .policy-list {
      margin-bottom: 28px;
    }

    .policy-item {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 24px;
      border-radius: 14px;
      margin-bottom: 16px;
      border: none;
      box-shadow: 0 8px 24px rgba(5, 150, 105, 0.3);
      position: relative;
      overflow: hidden;
    }

    .policy-item::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .policy-item h4 {
      margin: 0 0 12px 0;
      color: white;
      font-size: 18px;
      font-weight: 700;
      position: relative;
      z-index: 1;
    }

    .policy-item p {
      margin: 10px 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .policy-item span {
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: inline-block;
      background: rgba(255, 255, 255, 0.25);
      color: white;
      backdrop-filter: blur(10px);
    }

    .policy-item span.enabled {
      background: rgba(34, 197, 94, 0.4);
      color: #bbf7d0;
      border: 1px solid rgba(34, 197, 94, 0.6);
    }

    .policy-item span.disabled {
      background: rgba(239, 68, 68, 0.4);
      color: #fecaca;
      border: 1px solid rgba(239, 68, 68, 0.6);
    }

    .manual-retention {
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      border: none;
      padding: 28px;
      border-radius: 16px;
      margin-top: 28px;
      box-shadow: 0 8px 32px rgba(0, 74, 89, 0.25);
    }

    .manual-retention h3 {
      color: white;
      margin-top: 0;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 24px;
    }

    .input-group {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .input-group label {
      font-weight: 700;
      color: white;
      font-size: 14px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      opacity: 0.95;
    }

    .input-group input {
      padding: 14px 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      font-size: 14px;
      min-width: 160px;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
      color: white;
      font-weight: 500;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      letter-spacing: 0.3px;
    }

    .input-group input::placeholder {
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    .input-group input:hover {
      border-color: rgba(255, 255, 255, 0.5);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 100%);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    .input-group input:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.8);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
      box-shadow: 0 8px 24px rgba(185, 149, 50, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }

    .create-form {
      max-width: 100%;
    }

    .create-form h3 {
      color: #1e293b;
      margin-top: 0;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
    }

    .create-form .info {
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      padding: 24px;
      border-radius: 14px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 32px;
      border: 2px solid rgba(185, 149, 50, 0.3);
      box-shadow: 0 10px 32px rgba(0, 74, 89, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      letter-spacing: 0.3px;
      line-height: 1.6;
    }

    .create-form .info::before {
      content: '';\n      position: absolute;
      top: -20px;
      right: -40px;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 4s ease-in-out infinite;
    }

    .create-form .info::after {
      content: '';
      position: absolute;
      bottom: -40px;
      left: -30px;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 5s ease-in-out 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .form-group {
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .form-group label {
      display: block;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      font-size: 14px;
      letter-spacing: 0.3px;
      text-transform: capitalize;
      opacity: 0.95;
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 14px;
      box-sizing: border-box;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-weight: 500;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      box-shadow: 0 4px 12px rgba(0, 74, 89, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      letter-spacing: 0.2px;
    }

    .form-input::placeholder {
      color: #a0aec0;
      font-weight: 500;
    }

    .form-input:hover {
      border-color: rgba(0, 74, 89, 0.2);
      box-shadow: 0 6px 16px rgba(0, 74, 89, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .form-input:focus {
      outline: none;
      border-color: #004A59;
      box-shadow: 0 8px 24px rgba(0, 74, 89, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
      background: linear-gradient(135deg, #ffffff 0%, rgba(0, 74, 89, 0.02) 100%);
      transform: translateY(-2px);
    }

    .form-group small {
      display: block;
      color: #94a3b8;
      font-size: 13px;
      margin-top: 10px;
      font-weight: 500;
      letter-spacing: 0.2px;
    }

    .message {
      padding: 18px 24px;
      border-radius: 12px;
      margin-top: 24px;
      font-size: 14px;
      font-weight: 600;
      border-left: 5px solid;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      letter-spacing: 0.2px;
    }

    .message.success {
      background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
      color: #166534;
      border-left-color: #10b981;
    }

    .message.error {
      background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
      color: #991b1b;
      border-left-color: #ef4444;
    }

    /* Loading States */
    .btn-grant:disabled,
    .btn-revoke:disabled,
    .btn-apply:disabled,
    .btn-create:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transform: none !important;
      border-opacity: 0.5;
    }

    .loading-text {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      border-top-color: white;
      border-right-color: rgba(255, 255, 255, 0.8);
      animation: spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Toast Notifications */
    .notification {
      position: fixed;
      bottom: 32px;
      right: 32px;
      padding: 20px 28px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 1000;
      letter-spacing: 0.3px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(8px);
    }

    @keyframes slideIn {
      from {
        transform: translateX(440px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification.success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .notification.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .notification.info {
      background: linear-gradient(135deg, #004A59 0%, #B99532 100%);
      color: white;
    }

    .close-notification {
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .close-notification:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: scale(1.1);
    }

    .close-notification:active {
      transform: scale(0.95);
    }
  `]
})
export class AuditManagementComponent implements OnInit {
  activeTab: 'admins' | 'retention' | 'create' = 'admins';
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
}
