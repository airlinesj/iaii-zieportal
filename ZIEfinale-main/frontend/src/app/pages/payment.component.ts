import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationService } from '../services/application.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  applicantInfo: any = null;
  membershipGrade: string = '';
  applicationFee: number = 0;
  selectedPaymentMethod: string = 'card';
  isProcessing = false;
  successMessage = '';
  errorMessage = '';
  mobileTransactionId = '';
  applicationId: string = '';
  paymentCompleted = false;

  // Payment proof upload properties
  selectedPaymentFile: File | null = null;
  isDragOver = false;
  isUploading = false;
  paymentVerificationStatus: any = null;
  paymentCompletedRequiresProof = false; // Track if payment completed but proof not yet uploaded

  cardDetails = {
    holderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  };

  constructor(
    private applicationService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplicationData();
  }

  loadApplicationData(): void {
    this.applicationService.getApplications().subscribe({
      next: (applications) => {
        if (applications && applications.length > 0) {
          const latestApp = applications[applications.length - 1];
          this.applicantInfo = latestApp.personalParticulars;
          this.membershipGrade = latestApp.chosenGrade;
          this.applicationFee = latestApp.applicationFee;
          this.applicationId = latestApp._id;
          
          // Check if payment already completed
          if (latestApp.paymentStatus === 'completed') {
            this.paymentCompleted = true;
            this.successMessage = 'Payment already completed! Your application is now under review.';
          }
          
          // Load payment verification status
          if (latestApp.paymentProof?.verificationStatus) {
            this.paymentVerificationStatus = {
              status: latestApp.paymentProof.verificationStatus,
              message: this.getVerificationStatusMessage(latestApp.paymentProof.verificationStatus),
              verifiedAt: latestApp.paymentProof.verifiedAt
            };
          }
        } else {
          this.errorMessage = 'No application found. Please submit an application first before making a payment.';
          console.warn('Payment page - No applications found for user');
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load application data. Please try again.';
        console.error('Error loading application:', error);
      },
    });
  }

  processPayment(): void {
    if (!this.validateCardDetails()) {
      this.errorMessage = 'Please enter valid card details.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    console.log('Processing dummy card payment:', this.cardDetails);
    
    // Call backend to process dummy payment
    this.applicationService.processPayment(this.applicationId, { paymentMethod: 'card' }).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.paymentCompleted = true;
        this.paymentCompletedRequiresProof = true;
        this.successMessage = `Payment of $${this.applicationFee.toFixed(2)} processed successfully! Please now upload proof of payment.`;
        this.clearCardDetails();
        
        // Scroll to proof upload section
        setTimeout(() => {
          const proofSection = document.querySelector('.proof-of-payment-section');
          proofSection?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      },
      error: (error: any) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Payment processing failed. Please try again.';
        console.error('Payment error:', error);
      }
    });
  }

  confirmBankTransfer(): void {
    this.isProcessing = true;
    this.errorMessage = '';

    // Call backend to process dummy payment
    this.applicationService.processPayment(this.applicationId, { paymentMethod: 'bank' }).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.paymentCompleted = true;
        this.paymentCompletedRequiresProof = true;
        this.successMessage = `Bank transfer of $${this.applicationFee.toFixed(2)} recorded successfully! Please now upload proof of payment.`;
        
        // Scroll to proof upload section
        setTimeout(() => {
          const proofSection = document.querySelector('.proof-of-payment-section');
          proofSection?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      },
      error: (error: any) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Payment processing failed. Please try again.';
      }
    });
  }

  confirmMobilePayment(): void {
    if (!this.mobileTransactionId.trim()) {
      this.errorMessage = 'Please enter a transaction ID.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    // Call backend to process dummy payment
    this.applicationService.processPayment(this.applicationId, { paymentMethod: 'mobile', transactionId: this.mobileTransactionId }).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.paymentCompleted = true;
        this.paymentCompletedRequiresProof = true;
        this.successMessage = `Mobile payment confirmed with ID: ${this.mobileTransactionId}. Please now upload proof of payment.`;
        this.mobileTransactionId = '';
        
        // Scroll to proof upload section
        setTimeout(() => {
          const proofSection = document.querySelector('.proof-of-payment-section');
          proofSection?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      },
      error: (error: any) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Payment processing failed. Please try again.';
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Please upload a PDF, JPG, or PNG file.';
      return;
    }

    if (file.size > maxSize) {
      this.errorMessage = 'File size must not exceed 5MB.';
      return;
    }

    this.selectedPaymentFile = file;
    this.errorMessage = '';
  }

  removePaymentFile(): void {
    this.selectedPaymentFile = null;
  }

  uploadPaymentProof(): void {
    if (!this.selectedPaymentFile || !this.applicationId) {
      this.errorMessage = 'Please select a file and ensure application is loaded.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('paymentProof', this.selectedPaymentFile);

    this.applicationService.uploadPaymentProof(this.applicationId, formData).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        this.selectedPaymentFile = null;
        this.successMessage = 'Payment proof uploaded successfully! Admin will verify within 1-2 business days. Redirecting to dashboard...';
        this.paymentVerificationStatus = {
          status: 'pending',
          message: 'Payment verification pending - awaiting admin approval'
        };
        this.paymentCompletedRequiresProof = false;
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error: any) => {
        this.isUploading = false;
        this.errorMessage = error.error?.message || 'Failed to upload payment proof. Please try again.';
        console.error('Upload error:', error);
      }
    });
  }

  private getVerificationStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      'pending': 'Payment verification pending - awaiting admin approval',
      'verified': 'Payment verified successfully!',
      'rejected': 'Payment verification rejected - please contact admin'
    };
    return messages[status] || 'Unknown status';
  }

  private validateCardDetails(): boolean {
    const { holderName, cardNumber, expiryDate, cvv } = this.cardDetails;
    
    if (!holderName.trim()) return false;
    if (cardNumber.replace(/\s/g, '').length < 13) return false;
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;
    if (cvv.length < 3) return false;

    return true;
  }

  private clearCardDetails(): void {
    this.cardDetails = {
      holderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    };
  }
}
