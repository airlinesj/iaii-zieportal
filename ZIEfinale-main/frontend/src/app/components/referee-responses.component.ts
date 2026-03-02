import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../services/application.service';
import { Router } from '@angular/router';

interface SponsorResponse {
  sponsorName: string;
  sponsorEmail: string;
  submittedAt: string;
  responses?: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
    question8: string;
  };
  isConfidential: boolean;
}

interface ApplicationWithReferees {
  _id: string;
  personalParticulars: {
    firstName: string;
    lastName: string;
    email: string;
  };
  chosenGrade: string;
  sponsors: SponsorResponse[];
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-referee-responses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="referee-responses-section">
      <div class="section-header">
        <h2>Referee Responses Pending Verification</h2>
        <span class="badge">{{ applicationsWithResponses.length }} Pending</span>
      </div>

      <div class="responses-container">
        <div *ngIf="applicationsWithResponses.length === 0" class="no-data">
          <p>No pending referee responses to verify</p>
        </div>

        <div *ngFor="let app of applicationsWithResponses" class="application-card">
          <div class="card-header">
            <div class="applicant-info">
              <h3>{{ app.personalParticulars.firstName }} {{ app.personalParticulars.lastName }}</h3>
              <p class="grade">Grade: {{ app.chosenGrade }}</p>
            </div>
            <span class="response-count">{{ app.sponsors.length }} Response(s)</span>
          </div>

          <div class="sponsors-list">
            <div *ngFor="let sponsor of app.sponsors; let i = index" class="sponsor-item">
              <div class="sponsor-header">
                <span class="sponsor-name">{{ sponsor.sponsorName }} ({{ sponsor.sponsorEmail }})</span>
                <span class="submitted-date">{{ formatDate(sponsor.submittedAt) }}</span>
                <span *ngIf="sponsor.isConfidential" class="confidential-badge">Confidential</span>
              </div>

              <div class="sponsor-responses" *ngIf="sponsor.responses">
                <div class="response-item">
                  <label>Question 1:</label>
                  <p>{{ sponsor.responses.question1 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 2:</label>
                  <p>{{ sponsor.responses.question2 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 3:</label>
                  <p>{{ sponsor.responses.question3 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 4:</label>
                  <p>{{ sponsor.responses.question4 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 5:</label>
                  <p>{{ sponsor.responses.question5 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 6:</label>
                  <p>{{ sponsor.responses.question6 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 7:</label>
                  <p>{{ sponsor.responses.question7 }}</p>
                </div>
                <div class="response-item">
                  <label>Question 8:</label>
                  <p>{{ sponsor.responses.question8 }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button (click)="viewApplicationDetails(app._id)" class="btn-view">
              View Full Application
            </button>
            <button (click)="verifyResponses(app._id)" class="btn-verify">
              Mark Verified
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .referee-responses-section {
      margin-top: 40px;
      padding: 20px;
      background-color: white;
      border: 2px solid #004A59;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #B99532;
      padding-bottom: 15px;
    }

    .section-header h2 {
      margin: 0;
      color: #004A59;
      font-size: 20px;
      font-weight: 700;
    }

    .badge {
      background-color: #B99532;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
    }

    .responses-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: #999;
      font-size: 16px;
    }

    .application-card {
      border: 2px solid #E0E0E0;
      border-radius: 6px;
      overflow: hidden;
    }

    .card-header {
      background-color: #f9f9f9;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #E0E0E0;
    }

    .applicant-info {
      flex: 1;
    }

    .applicant-info h3 {
      margin: 0;
      color: #004A59;
      font-size: 16px;
      font-weight: 700;
    }

    .grade {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 13px;
    }

    .response-count {
      background-color: #B99532;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
    }

    .sponsors-list {
      padding: 15px;
    }

    .sponsor-item {
      margin-bottom: 15px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #B99532;
    }

    .sponsor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .sponsor-name {
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
    }

    .submitted-date {
      color: #999;
      font-size: 12px;
    }

    .confidential-badge {
      background-color: #EF4444;
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      font-weight: 600;
      font-size: 11px;
    }

    .sponsor-responses {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }

    .response-item {
      background-color: white;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #E0E0E0;
    }

    .response-item label {
      display: block;
      font-weight: 600;
      color: #004A59;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .response-item p {
      margin: 0;
      color: #333;
      font-size: 13px;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .card-actions {
      padding: 15px;
      border-top: 2px solid #E0E0E0;
      display: flex;
      gap: 10px;
    }

    .btn-view,
    .btn-verify {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-view {
      background-color: #0088cc;
      color: white;
    }

    .btn-view:hover {
      background-color: #0066aa;
      transform: translateY(-2px);
    }

    .btn-verify {
      background-color: #B99532;
      color: white;
    }

    .btn-verify:hover {
      background-color: #D4A844;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .sponsor-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .sponsor-responses {
        grid-template-columns: 1fr;
      }

      .card-actions {
        flex-direction: column;
      }

      .btn-view,
      .btn-verify {
        width: 100%;
      }
    }
  `]
})
export class RefereeResponsesComponent implements OnInit {
  applicationsWithResponses: ApplicationWithReferees[] = [];
  isLoading = false;

  constructor(
    private applicationService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplicationsWithRefereeResponses();
  }

  loadApplicationsWithRefereeResponses(): void {
    this.isLoading = true;
    this.applicationService.getAllApplications().subscribe({
      next: (applications: any[]) => {
        // Filter applications that have sponsor responses awaiting verification
        this.applicationsWithResponses = applications
          .filter(app => app.sponsors && app.sponsors.some((s: any) => s.responses))
          .map(app => ({
            _id: app._id,
            personalParticulars: app.personalParticulars,
            chosenGrade: app.chosenGrade,
            sponsors: app.sponsors.filter((s: any) => s.responses),
            status: app.status,
            createdAt: app.createdAt
          }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.isLoading = false;
      }
    });
  }

  verifyResponses(applicationId: string): void {
    if (confirm('Mark these referee responses as verified?')) {
      // Call backend to mark responses as verified
      // This would update the application with a verification flag
      this.applicationService.updateApplication(applicationId, {
        refereeResponsesVerified: true,
        refereeResponsesVerifiedAt: new Date(),
      }).subscribe({
        next: () => {
          alert('Referee responses marked as verified');
          this.loadApplicationsWithRefereeResponses();
        },
        error: (error) => {
          console.error('Error verifying responses:', error);
          alert('Failed to verify responses');
        }
      });
    }
  }

  viewApplicationDetails(applicationId: string): void {
    this.router.navigate(['/application', applicationId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }
}
