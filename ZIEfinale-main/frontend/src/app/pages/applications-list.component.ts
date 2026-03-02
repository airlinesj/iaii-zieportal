import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="applications-wrapper">
      <div class="header-section">
        <button (click)="goBackToDashboard()" class="btn-back">← Back to Dashboard</button>
        <h1>All Applications</h1>
        <button (click)="logout()" class="btn-logout">Logout</button>
      </div>

      <div class="applications-container">
        <div class="filter-section">
          <input
            type="text"
            placeholder="Search by name or email..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterApplications()"
            class="search-input"
          />
          <select [(ngModel)]="statusFilter" (ngModelChange)="filterApplications()" class="filter-select">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Interview Required">Interview Required</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div class="table-container" *ngIf="filteredApplications.length > 0">
          <table class="applications-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Division</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of filteredApplications" [class.app-row]="true">
                <td>{{ app.personalParticulars.firstName }} {{ app.personalParticulars.lastName }}</td>
                <td>{{ app.personalParticulars.email }}</td>
                <td>{{ app.chosenGrade }}</td>
                <td>{{ app.chosenSpecialistDivision }}</td>
                <td>
                  <span class="status-badge" [ngClass]="'status-' + app.status.toLowerCase().replace(' ', '-')">
                    {{ app.status }}
                  </span>
                </td>
                <td>{{ app.createdAt | date: 'short' }}</td>
                <td>
                  <button (click)="openApplicationDetails(app._id)" class="btn-view">View Details</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="no-results" *ngIf="filteredApplications.length === 0">
          <p>No applications found matching your criteria.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .applications-wrapper {
      min-height: 100vh;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
    }

    .header-section {
      background-color: #004A59;
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;

      .btn-back {
        background-color: #B99532;
        color: #004A59;
        border: 2px solid #B99532;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        white-space: nowrap;
        font-size: 13px;

        &:hover {
          background-color: #a58628;
        }
      }

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        flex: 1;
        text-align: center;
      }

      .btn-logout {
        background-color: white;
        color: #004A59;
        border: 2px solid white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        white-space: nowrap;
        font-size: 13px;

        &:hover {
          background-color: #f0f0f0;
        }
      }
    }

    .applications-container {
      margin-top: 80px;
      padding: 30px 20px;
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
    }

    .filter-section {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .search-input,
      .filter-select {
        padding: 10px;
        border: 2px solid #004A59;
        border-radius: 4px;
        font-size: 14px;

        &:focus {
          outline: none;
          border-color: #B99532;
        }
      }

      .search-input {
        flex: 1;
      }

      .filter-select {
        flex: 0 1 200px;
      }
    }

    .table-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;

      .applications-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;

        thead {
          background-color: #004A59;
          color: white;
          position: sticky;
          top: 0;

          th {
            padding: 15px;
            text-align: left;
            font-weight: 700;
            border-bottom: 2px solid #003347;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #e0e0e0;
            transition: all 0.3s ease;

            &:hover {
              background-color: #f9f9f9;
            }

            td {
              padding: 15px;
            }

            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;

              &.status-submitted {
                background-color: #e3f2fd;
                color: #1976d2;
              }

              &.status-under-review {
                background-color: #fff3e0;
                color: #f57c00;
              }

              &.status-approved {
                background-color: #e8f5e9;
                color: #388e3c;
              }

              &.status-pending {
                background-color: #f3e5f5;
                color: #7b1fa2;
              }

              &.status-interview-required {
                background-color: #fff9c4;
                color: #f57f17;
              }

              &.status-rejected {
                background-color: #ffebee;
                color: #c62828;
              }

              &.status-draft {
                background-color: #f5f5f5;
                color: #666;
              }
            }

            .btn-view {
              background-color: #004A59;
              color: white;
              border: 2px solid #004A59;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 600;
              font-size: 12px;
              transition: all 0.3s ease;

              &:hover {
                background-color: #B99532;
                border-color: #B99532;
              }
            }
          }
        }
      }
    }

    .no-results {
      background-color: white;
      padding: 40px;
      text-align: center;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      color: #999;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        padding: 12px;
        height: auto;
        gap: 10px;
        position: relative;
        top: auto;
        left: auto;
        right: auto;
      }

      .header-section h1 {
        font-size: 20px;
      }

      .header-section .btn-back,
      .header-section .btn-logout {
        padding: 8px 12px;
        font-size: 12px;
        flex: 1;
        min-width: 100px;
      }

      .applications-container {
        margin-top: 0;
        padding: 15px 10px;
      }

      .filter-section {
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        margin-bottom: 20px;
      }

      .filter-section .search-input,
      .filter-section .filter-select {
        flex: 1;
        width: 100%;
        padding: 8px;
        font-size: 13px;
      }

      .table-container {
        overflow-x: auto;
      }

      .applications-table {
        font-size: 12px;
        min-width: 600px;
      }

      .applications-table thead th {
        padding: 10px 8px;
      }

      .applications-table tbody td {
        padding: 10px 8px;
      }

      .btn-view {
        padding: 6px 10px;
        font-size: 11px;
      }
    }

    @media (max-width: 480px) {
      .header-section {
        flex-direction: column;
        padding: 10px;
        gap: 10px;

        h1 {
          font-size: 18px;
        }

        .btn-back,
        .btn-logout {
          padding: 6px 12px;
          font-size: 12px;
        }
      }

      .applications-container {
        margin-top: 120px;
        padding: 15px;
      }

      .filter-section {
        flex-direction: column;
        gap: 10px;

        .search-input,
        .filter-select {
          flex: 1;
        }
      }

      .table-container {
        overflow-x: auto;

        table {
          min-width: 100%;

          thead th {
            padding: 10px;
            font-size: 12px;
          }

          tbody td {
            padding: 10px;
            font-size: 12px;
          }
        }
      }
    }
  `]
})
export class ApplicationsListComponent implements OnInit {
  applications: any[] = [];
  filteredApplications: any[] = [];
  searchTerm = '';
  statusFilter = '';

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.applicationService.getAllApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.filteredApplications = applications;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
      },
    });
  }

  filterApplications(): void {
    this.filteredApplications = this.applications.filter((app) => {
      const nameMatch =
        `${app.personalParticulars.firstName} ${app.personalParticulars.lastName}`
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        app.personalParticulars.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const statusMatch = !this.statusFilter || app.status === this.statusFilter;

      return nameMatch && statusMatch;
    });
  }

  openApplicationDetails(appId: string): void {
    this.router.navigate(['/application', appId]);
  }

  getDashboardRoute(): string {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'SuperAdmin') {
      return '/super-admin-dashboard';
    } else if (user?.role === 'Admin' && user?.accountType === 'audit') {
      return '/audit-trail'; // Auditors go back to audit trail
    } else if (user?.role === 'Admin') {
      return '/admin-dashboard'; // Regular admins go to admin dashboard
    }
    return '/dashboard'; // Applicants
  }

  goBackToDashboard(): void {
    this.router.navigate([this.getDashboardRoute()]);
  }

  logout(): void {
    console.log('🚪 Applications List: Logging out');
    // Use logoutAndNavigate to properly clear browser history and navigate to landing page
    this.authService.logoutAndNavigate();
  }
}
