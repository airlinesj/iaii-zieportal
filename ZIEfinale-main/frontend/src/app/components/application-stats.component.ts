import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MembershipGradeStats {
  name: string;
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
}

@Component({
  selector: 'app-application-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="application-stats-container">
      <h2 class="stats-title">Applications by Membership Grade</h2>
      
      <div class="bars-container">
        <div class="stat-row" *ngFor="let grade of membershipGrades">
          <!-- Label on the left -->
          <div class="grade-label">
            <span class="label-text">{{ grade.name }}</span>
          </div>

          <!-- Stacked Bar -->
          <div class="bar-wrapper">
            <div class="stacked-bar">
              <!-- Pending Section -->
              <div
                class="bar-segment bg-yellow-400"
                [style.width.%]="getPercentage(grade.pending, getTotalForGrade(grade))"
                [title]="'Pending: ' + grade.pending"
                (mouseenter)="hoveredSegment = grade.name + '-pending'"
                (mouseleave)="hoveredSegment = null"
              >
                <div
                  class="tooltip"
                  *ngIf="hoveredSegment === grade.name + '-pending'"
                >
                  <span class="tooltip-label">Pending</span>
                  <span class="tooltip-count">{{ grade.pending }}</span>
                </div>
              </div>

              <!-- In Review Section -->
              <div
                class="bar-segment bg-orange-400"
                [style.width.%]="getPercentage(grade.inReview, getTotalForGrade(grade))"
                [title]="'In Review: ' + grade.inReview"
                (mouseenter)="hoveredSegment = grade.name + '-inReview'"
                (mouseleave)="hoveredSegment = null"
              >
                <div
                  class="tooltip"
                  *ngIf="hoveredSegment === grade.name + '-inReview'"
                >
                  <span class="tooltip-label">In Review</span>
                  <span class="tooltip-count">{{ grade.inReview }}</span>
                </div>
              </div>

              <!-- Approved Section -->
              <div
                class="bar-segment bg-orange-600"
                [style.width.%]="getPercentage(grade.approved, getTotalForGrade(grade))"
                [title]="'Approved: ' + grade.approved"
                (mouseenter)="hoveredSegment = grade.name + '-approved'"
                (mouseleave)="hoveredSegment = null"
              >
                <div
                  class="tooltip"
                  *ngIf="hoveredSegment === grade.name + '-approved'"
                >
                  <span class="tooltip-label">Approved</span>
                  <span class="tooltip-count">{{ grade.approved }}</span>
                </div>
              </div>

              <!-- Rejected Section -->
              <div
                class="bar-segment bg-red-500"
                [style.width.%]="getPercentage(grade.rejected, getTotalForGrade(grade))"
                [title]="'Rejected: ' + grade.rejected"
                (mouseenter)="hoveredSegment = grade.name + '-rejected'"
                (mouseleave)="hoveredSegment = null"
              >
                <div
                  class="tooltip"
                  *ngIf="hoveredSegment === grade.name + '-rejected'"
                >
                  <span class="tooltip-label">Rejected</span>
                  <span class="tooltip-count">{{ grade.rejected }}</span>
                </div>
              </div>
            </div>

            <!-- Total Count on the right -->
            <div class="total-count">
              {{ getTotalForGrade(grade) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend-container">
        <div class="legend-item">
          <div class="legend-color bg-yellow-400"></div>
          <span>Pending</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-orange-400"></div>
          <span>In Review</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-orange-600"></div>
          <span>Approved</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-red-500"></div>
          <span>Rejected</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .application-stats-container {
      background-color: #FFFFFF;
      border: 2.5px solid #004A59;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
    }

    .stats-title {
      font-size: 24px;
      font-weight: 700;
      color: #004A59;
      margin-bottom: 30px;
      text-align: center;
    }

    .bars-container {
      display: flex;
      flex-direction: column;
      gap: 25px;
      margin-bottom: 30px;
    }

    .stat-row {
      display: flex;
      align-items: stretch;
      gap: 20px;
    }

    .grade-label {
      min-width: 150px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .label-text {
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stacked-bar {
      flex: 1;
      display: flex;
      height: 40px;
      border-radius: 4px;
      overflow: hidden;
      background-color: #f0f0f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .bar-segment {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s ease;
      min-width: 2px;
    }

    .bar-segment:hover {
      opacity: 0.85;
    }

    .tooltip {
      position: absolute;
      background-color: rgba(0, 74, 89, 0.95);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      display: flex;
      gap: 6px;
    }

    .tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid rgba(0, 74, 89, 0.95);
    }

    .tooltip-label {
      font-weight: 600;
    }

    .tooltip-count {
      font-weight: 700;
      color: #B99532;
    }

    .total-count {
      min-width: 50px;
      text-align: right;
      font-weight: 600;
      color: #004A59;
      font-size: 14px;
    }

    .legend-container {
      display: flex;
      gap: 30px;
      justify-content: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #004A59;
      font-weight: 500;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 2px;
    }

    /* Tailwind color utilities */
    .bg-yellow-400 {
      background-color: #fbbf24;
    }

    .bg-orange-400 {
      background-color: #fb923c;
    }

    .bg-orange-600 {
      background-color: #b45309;
    }

    .bg-red-500 {
      background-color: #ef4444;
    }

    @media (max-width: 768px) {
      .application-stats-container {
        padding: 20px;
      }

      .stats-title {
        font-size: 18px;
        margin-bottom: 20px;
      }

      .stat-row {
        flex-direction: column;
        gap: 10px;
      }

      .grade-label {
        margin-bottom: 5px;
      }

      .bar-wrapper {
        flex-direction: column;
        gap: 8px;
      }

      .stacked-bar {
        height: 30px;
      }

      .total-count {
        text-align: left;
      }

      .legend-container {
        gap: 15px;
      }
    }
  `],
})
export class ApplicationStatsComponent implements OnInit {
  @Input() membershipGrades: MembershipGradeStats[] = [];
  
  hoveredSegment: string | null = null;

  ngOnInit(): void {
    // Sample data if none provided
    if (!this.membershipGrades || this.membershipGrades.length === 0) {
      this.membershipGrades = [
        {
          name: 'Technician',
          pending: 12,
          inReview: 6,
          approved: 18,
          rejected: 2,
        },
        {
          name: 'Technologist',
          pending: 18,
          inReview: 9,
          approved: 24,
          rejected: 3,
        },
        {
          name: 'Professional Member',
          pending: 15,
          inReview: 8,
          approved: 22,
          rejected: 2,
        },
      ];
    }
  }

  getTotalForGrade(grade: MembershipGradeStats): number {
    return grade.pending + grade.inReview + grade.approved + grade.rejected;
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }
}
