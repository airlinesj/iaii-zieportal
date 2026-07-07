import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CpdService } from '../../services/cpd.service';

interface TrainingElementsReview {
  _id: string;
  cpdApplicationId: string;
  applicantName: string;
  company: string;
  email: string;
  trainingElements: { [key: string]: boolean };
  courseTitle: string;
  courseDuration: number;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_clarification';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  submittedAt: Date;
}

@Component({
  selector: 'app-training-elements-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './training-elements-review.component.html',
  styleUrls: ['./training-elements-review.component.scss']
})
export class TrainingElementsReviewComponent implements OnInit, OnDestroy {
  reviews: TrainingElementsReview[] = [];
  filteredReviews: TrainingElementsReview[] = [];
  loading = false;
  error = '';
  selectedReview: TrainingElementsReview | null = null;
  showDetailModal = false;
  actionForm!: FormGroup;
  selectedAction: 'approve' | 'reject' | 'clarify' | null = null;

  // Filters
  statusFilter = 'all';
  searchTerm = '';
  sortBy = 'submittedAt';

  // ZIE training elements
  trainingElementsOptions = [
    { code: 'PD01', label: 'Professional Development Activities', category: 'Professional Development' },
    { code: 'PD02', label: 'Continuing Education Courses', category: 'Professional Development' },
    { code: 'RD01', label: 'Research and Development', category: 'Research' },
    { code: 'TL01', label: 'Training and Leadership', category: 'Training' },
    { code: 'TL02', label: 'Mentoring Activities', category: 'Training' },
    { code: 'QA01', label: 'Quality Assurance Programs', category: 'Quality Assurance' },
    { code: 'CP01', label: 'Community Projects', category: 'Community' },
    { code: 'PS01', label: 'Publication and Speaking', category: 'Publications' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private cpdService: CpdService,
    private fb: FormBuilder
  ) {
    this.actionForm = this.fb.group({
      notes: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadTrainingElementsReviews();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTrainingElementsReviews() {
    this.loading = true;
    this.error = '';
    this.cpdService.getTrainingElementsReviews()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.reviews = response.data || response || [];
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load training elements reviews';
          this.loading = false;
        }
      });
  }

  applyFiltersAndSort() {
    let filtered = [...this.reviews];

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.reviewStatus === this.statusFilter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.applicantName.toLowerCase().includes(term) ||
        r.company.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.courseTitle.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string | null = null;
      let bValue: number | string | null = null;

      if (this.sortBy === 'submittedAt') {
        aValue = new Date(a.submittedAt).getTime();
        bValue = new Date(b.submittedAt).getTime();
      } else if (this.sortBy === 'applicantName') {
        aValue = a.applicantName || '';
        bValue = b.applicantName || '';
      } else if (this.sortBy === 'status') {
        aValue = a.reviewStatus || '';
        bValue = b.reviewStatus || '';
      }

      if (this.sortBy === 'submittedAt') {
        const an = Number(aValue) || 0;
        const bn = Number(bValue) || 0;
        return bn - an;
      }

      const as = (aValue ?? '').toString().toLowerCase();
      const bs = (bValue ?? '').toString().toLowerCase();
      if (as === bs) return 0;
      return as > bs ? 1 : -1;
    });

    this.filteredReviews = filtered;
  }

  openDetailModal(review: TrainingElementsReview) {
    this.selectedReview = review;
    this.showDetailModal = true;
    this.selectedAction = null;
    this.actionForm.reset();
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedReview = null;
    this.selectedAction = null;
  }

  selectAction(action: 'approve' | 'reject' | 'clarify') {
    if (action === 'approve') {
      this.approveReview();
    } else {
      this.selectedAction = action;
    }
  }

  approveReview() {
    if (!this.selectedReview) return;

    this.loading = true;
    this.cpdService.approveTrainingElementsReview(this.selectedReview._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedReview!.reviewStatus = 'approved';
          this.showSuccessMessage('Review approved successfully');
          setTimeout(() => this.closeDetailModal(), 1500);
          this.loadTrainingElementsReviews();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to approve review';
          this.loading = false;
        }
      });
  }

  rejectReview() {
    if (!this.selectedReview || !this.actionForm.valid) return;

    this.loading = true;
    const notes = this.actionForm.get('notes')?.value;
    this.cpdService.rejectTrainingElementsReview(this.selectedReview._id, notes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedReview!.reviewStatus = 'rejected';
          this.showSuccessMessage('Review rejected successfully');
          setTimeout(() => this.closeDetailModal(), 1500);
          this.loadTrainingElementsReviews();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to reject review';
          this.loading = false;
        }
      });
  }

  requestClarification() {
    if (!this.selectedReview || !this.actionForm.valid) return;

    this.loading = true;
    const notes = this.actionForm.get('notes')?.value;
    this.cpdService.requestClarificationTrainingElements(this.selectedReview._id, notes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedReview!.reviewStatus = 'needs_clarification';
          this.showSuccessMessage('Clarification requested successfully');
          setTimeout(() => this.closeDetailModal(), 1500);
          this.loadTrainingElementsReviews();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to request clarification';
          this.loading = false;
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'approved':
        return 'badge-approved';
      case 'rejected':
        return 'badge-rejected';
      case 'needs_clarification':
        return 'badge-clarify';
      default:
        return 'badge-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'needs_clarification':
        return 'Clarification Needed';
      default:
        return status;
    }
  }

  getTrainingElementLabel(code: string): string {
    return this.trainingElementsOptions.find(e => e.code === code)?.label || code;
  }

  getSelectedTrainingElements(trainingElements: { [key: string]: boolean }): string[] {
    return Object.entries(trainingElements)
      .filter(([, selected]) => selected)
      .map(([code]) => code);
  }

  showSuccessMessage(message: string) {
    // You can integrate with a toast service here
    console.log('✅', message);
  }

  onSearch() {
    this.applyFiltersAndSort();
  }

  onStatusFilterChange() {
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
