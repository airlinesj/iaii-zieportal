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
   * Convert image to base64 data URL
   */
  private async imageToDataUrl(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imagePath}`));
      };
      img.src = imagePath.startsWith('http') ? imagePath : `${window.location.origin}/${imagePath.replace(/^\//, '')}`;
    });
  }

  /**
   * Generate and download certificate as PDF using jsPDF
   * Uses compression to keep file size under 7MB
   */
  async generatePDF(): Promise<void> {
    this.loading = true;
    this.error = null;
    
    try {
      const certificateElement = document.getElementById('certificate-page');
      if (!certificateElement) {
        this.error = 'Certificate element not found';
        this.loading = false;
        return;
      }
      
      // Convert image elements to data URLs (base64) for reliable PDF generation
      const images = certificateElement.querySelectorAll('img, image') as NodeListOf<any>;
      const imageMap: Map<Element, string> = new Map();
      
      for (const img of Array.from(images)) {
        try {
          const href = img.getAttribute('href') || img.getAttribute('src');
          if (href) {
            console.log('Converting image to data URL:', href);
            const dataUrl = await this.imageToDataUrl(href);
            imageMap.set(img, dataUrl);
            // Replace with data URL
            if (img.tagName.toLowerCase() === 'image') {
              img.setAttribute('href', dataUrl);
            } else {
              img.setAttribute('src', dataUrl);
            }
          }
        } catch (err) {
          console.warn('Failed to convert image to data URL:', err);
        }
      }
      
      // Add a delay to ensure images are updated in DOM
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Convert SVG/HTML to canvas with optimized settings for compression
      const canvas = await html2canvas(certificateElement, {
        backgroundColor: '#fdfaf3',
        scale: 2, // Reduced from 3 for smaller file size while maintaining quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 794,
        windowHeight: 1123,
        ignoreElements: (element) => {
          // Ignore UI elements not needed in PDF
          if (element.classList?.contains('print:hidden')) return true;
          if (element.tagName === 'BUTTON') return true;
          if (element.classList?.contains('fixed')) return true;
          return false;
        },
        onclone: (clonedDocument) => {
          // Ensure images are visible in the cloned document and fix paths
          const clonedImages = clonedDocument.querySelectorAll('image, img') as NodeListOf<any>;
          clonedImages.forEach(img => {
            // Make visible
            img.style.visibility = 'visible';
            img.style.opacity = '1';
            img.style.display = 'block';
            
            // Ensure absolute paths for cloned images
            let href = img.getAttribute('href') || img.getAttribute('src');
            if (href && !href.startsWith('http')) {
              href = `${window.location.origin}/${href.replace(/^\//, '')}`;
              if (img.tagName.toLowerCase() === 'image') {
                img.setAttribute('href', href);
              } else {
                img.setAttribute('src', href);
              }
            }
          });
        }
      });

      // Create PDF with A4 dimensions and compression
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable compression
      });

      // Convert canvas to JPEG (better compression than PNG) with quality 85
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pageWidth = 210;
      const pageHeight = 297;

      // Add image to PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      
      // Save with compressed output
      const filename = `ZIE_Certificate_${this.certId}_${this.currentYear}.pdf`;
      pdf.save(filename);
      
      this.loading = false;
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.error = `Failed to generate PDF: ${errorMsg}. Please try again.`;
      this.loading = false;
    }
  }

  /**
   * Download certificate as PDF (alias for generatePDF)
   */
  downloadPDF(): void {
    this.generatePDF();
  }
}
