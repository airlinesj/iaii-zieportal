import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../services/application.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit, OnDestroy {
  applicant: any;
  loading: boolean = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCertificate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCertificate(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (!applicationId) {
      this.error = 'Application ID not found';
      return;
    }

    this.applicationService.getCertificate(applicationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.applicant = data;
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Failed to load certificate data. Please try again later.';
          this.loading = false;
          console.error('Error loading certificate:', err);
        }
      });
  }

  downloadPDF(): void {
    const element = document.getElementById('certificate');
    if (!element) {
      this.error = 'Certificate element not found';
      return;
    }

    // Scroll to top of the certificate wrapper to ensure full capture
    const wrapper = document.querySelector('.certificate-wrapper');
    if (wrapper) {
      wrapper.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Use html2canvas to capture the certificate
      html2canvas(element, {
        backgroundColor: '#fdfbf4',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })
        .then((canvas: HTMLCanvasElement) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          // Calculate aspect ratio to fit certificate on A4
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Use width-based scaling with padding
          const margin = 10; // 10mm margin
          const availableWidth = pdfWidth - (margin * 2);
          const availableHeight = pdfHeight - (margin * 2);
          
          const widthRatio = availableWidth / (imgWidth / 2); // divide by scale
          const heightRatio = availableHeight / (imgHeight / 2);
          const ratio = Math.min(widthRatio, heightRatio);
          
          const scaledWidth = (imgWidth / 2) * ratio;
          const scaledHeight = (imgHeight / 2) * ratio;
          
          // Center on page
          const xOffset = (pdfWidth - scaledWidth) / 2;
          const yOffset = (pdfHeight - scaledHeight) / 2;

          pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);

          const filename = `ZIE_Certificate_${this.applicant?.registrationNumber || 'Unknown'}.pdf`;
          pdf.save(filename);
        })
        .catch((err: any) => {
          console.error('Error generating PDF:', err);
          this.error = 'Failed to generate PDF. Please try again.';
        });
    }, 100);
  }

  backToUpdates(): void {
    this.router.navigate(['/updates']);
  }
}
