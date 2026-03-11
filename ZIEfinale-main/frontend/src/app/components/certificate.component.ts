import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../services/application.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CertificateComponent implements OnInit, OnDestroy {
  // Certificate Data Properties
  @ViewChild('certificateSvg', { static: false }) certificateSvg!: ElementRef<SVGSVGElement>;
  
  applicantName: string = '';
  membershipGrade: string = '';
  dateAdmitted: string = '';
  certId: string = '';
  
  loading: boolean = true;
  error: string | null = null;
  currentYear: number = new Date().getFullYear();
  
  private destroy$ = new Subject<void>();

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCertificateData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load certificate data from the API based on application ID
   */
  loadCertificateData(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (!applicationId) {
      this.error = 'Application ID not found';
      this.loading = false;
      return;
    }

    this.applicationService.getCertificate(applicationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.mapApplicationDataToCertificate(data);
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Failed to load certificate data. Please try again later.';
          this.loading = false;
          console.error('Error loading certificate:', err);
        }
      });
  }

  /**
   * Maps application data from API to certificate display properties
   */
  private mapApplicationDataToCertificate(data: any): void {
    try {
      this.applicantName = data?.name || '[Applicant Name]';
      this.membershipGrade = data?.grade?.toUpperCase() || '[Membership Grade]';
      this.dateAdmitted = data?.interviewPassedDate 
        ? this.formatDate(new Date(data.interviewPassedDate))
        : '[Date of Admission]';
      this.certId = data?.registrationNumber || '000001';
    } catch (err) {
      console.error('Error mapping certificate data:', err);
      this.error = 'Error processing certificate data';
    }
  }

  /**
   * Format date to readable format (DD Month YYYY)
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Open browser print dialog for the certificate
   */
  printCertificate(): void {
    window.print();
  }

  /**
   * Generate and download certificate as PDF using jsPDF
   * Converts SVG directly to PDF maintaining high quality
   */
  async generatePDF(): Promise<void> {
    try {
      const certificateElement = document.getElementById('certificate-page');
      if (!certificateElement) {
        this.error = 'Certificate element not found';
        return;
      }

      this.error = null;
      
      // Wait for images to load before converting to canvas
      const images = certificateElement.querySelectorAll('img, image');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          const imgElement = img as any;
          if (imgElement.complete) {
            resolve(true);
          } else {
            imgElement.onload = () => resolve(true);
            imgElement.onerror = () => resolve(true);
          }
        });
      });
      await Promise.all(imagePromises);

      // Add a small delay to ensure all styles are rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Convert SVG/HTML to canvas with optimized settings for print
      const canvas = await html2canvas(certificateElement, {
        backgroundColor: '#fdfaf3',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: false,
        windowWidth: 794,
        windowHeight: 1123,
        imageTimeout: 5000,
        ignoreElements: (element) => {
          if (element.classList?.contains('print:hidden')) return true;
          if (element.tagName === 'BUTTON') return true;
          return false;
        },
        onclone: (clonedDocument) => {
          // Ensure images are visible in the cloned document
          const clonedImages = clonedDocument.querySelectorAll('image');
          clonedImages.forEach(img => {
            (img as any).style.visibility = 'visible';
            (img as any).style.opacity = '1';
          });
        }
      });

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = 210;
      const pageHeight = 297;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      
      const filename = `ZIE_Certificate_${this.certId}_${this.currentYear}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      this.error = 'Failed to generate PDF. Please try again.';
    }
  }

  /**
   * Download certificate as PDF (alias for generatePDF)
   */
  downloadPDF(): void {
    this.generatePDF();
  }
}
