import { IApplication, AdminChecklist } from '../models/Application';

/**
 * Admin Verification Service
 * Manages the 8-point checklist verification workflow
 * Ensures all required documents and information are verified before approval
 */
class AdminVerificationService {
  /**
   * Check if an application can be approved
   * Requires ALL 8 checklist items to be verified
   */
  canApprove(application: IApplication): boolean {
    const checklist = application.adminChecklist;
    
    return !!(
      checklist.photo &&
      checklist.m1Form &&
      checklist.signature &&
      checklist.trainingReport &&
      checklist.projectReport &&
      checklist.organogram &&
      checklist.sponsorships &&
      checklist.certificates
    );
  }

  /**
   * Get the count of verified items in the checklist
   */
  getVerificationProgress(application: IApplication): { verified: number; total: number; percentage: number } {
    const checklist = application.adminChecklist;
    const items = [
      checklist.photo,
      checklist.m1Form,
      checklist.signature,
      checklist.trainingReport,
      checklist.projectReport,
      checklist.organogram,
      checklist.sponsorships,
      checklist.certificates,
    ];

    const verified = items.filter(item => item === true).length;
    const total = items.length;
    const percentage = Math.round((verified / total) * 100);

    return { verified, total, percentage };
  }

  /**
   * Get a detailed checklist status with descriptions
   */
  getChecklistDetails(application: IApplication): Array<{
    field: string;
    label: string;
    verified: boolean;
    description: string;
  }> {
    const checklist = application.adminChecklist;

    return [
      {
        field: 'photo',
        label: 'Photo',
        verified: checklist.photo,
        description: 'Professional photograph verified and attached',
      },
      {
        field: 'm1Form',
        label: 'M1 Form',
        verified: checklist.m1Form,
        description: 'Form M1 (Membership Application Form) completed and signed',
      },
      {
        field: 'signature',
        label: 'Signature',
        verified: checklist.signature,
        description: 'Applicant signature verified on application',
      },
      {
        field: 'trainingReport',
        label: 'Training Report',
        verified: checklist.trainingReport,
        description: 'Professional training and development report submitted',
      },
      {
        field: 'projectReport',
        label: 'Project Report',
        verified: checklist.projectReport,
        description: 'Technical project report demonstrating competence',
      },
      {
        field: 'organogram',
        label: 'Organogram',
        verified: checklist.organogram,
        description: 'Organizational structure showing applicant role',
      },
      {
        field: 'sponsorships',
        label: 'Sponsorships',
        verified: checklist.sponsorships,
        description: 'Required sponsor appraisals received and verified',
      },
      {
        field: 'certificates',
        label: 'Certificates',
        verified: checklist.certificates,
        description: 'Educational and professional certificates verified',
      },
    ];
  }

  /**
   * Update a single checklist item
   */
  updateChecklistItem(
    application: IApplication,
    field: keyof AdminChecklist,
    verified: boolean
  ): IApplication {
    application.adminChecklist[field] = verified;
    return application;
  }

  /**
   * Determine the appropriate status based on checklist state
   */
  suggestStatus(application: IApplication): string {
    const allVerified = this.canApprove(application);
    const { verified, total } = this.getVerificationProgress(application);

    if (allVerified) {
      return 'Approved';
    }

    if (verified === 0 && application.status === 'Pending') {
      return 'Pending';
    }

    if (verified > 0 && verified < total) {
      return 'Under Review';
    }

    if (verified === total) {
      return 'Approved';
    }

    return 'Pending';
  }

  /**
   * Validate status transition
   * Ensures only valid state transitions
   * Allows rejected applications to be re-submitted within 24 hours
   */
  isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
    application: IApplication
  ): boolean {
    // Cannot transition to Approved if checklist not complete
    if (newStatus === 'Approved' && !this.canApprove(application)) {
      return false;
    }

    // Expatriate applicants cannot have Interview Required status
    if (application.applicationType === 'expatriate' && newStatus === 'Interview Required') {
      return false;
    }

    // Check if transitioning from Rejected
    if (currentStatus === 'Rejected' && newStatus === 'Submitted') {
      // Allow re-submission only if within 24 hours of rejection
      if (application.rejectionInfo?.allowEditUntil) {
        return new Date() < application.rejectionInfo.allowEditUntil;
      }
      return false;
    }

    // Valid status transitions
    const validTransitions: { [key: string]: string[] } = {
      'Draft': ['Submitted', 'Rejected'],
      'Submitted': ['Under Review', 'Rejected'],
      'Pending': ['Under Review', 'Interview Required', 'Rejected'],
      'Under Review': ['Approved', 'Rejected', 'Approved with Conditions', 'Interview Required'],
      'Interview Required': ['Approved', 'Rejected', 'Approved with Conditions', 'Passed'],
      'Approved': ['Passed'],
      'Rejected': ['Submitted'],  // Allow re-submission within 24 hours
      'Approved with Conditions': ['Approved', 'Rejected', 'Passed'],
      'Passed': [],
    };

    return (validTransitions[currentStatus] || []).includes(newStatus);
  }

  /**
   * Generate a verification report for the admin dashboard
   */
  generateVerificationReport(application: IApplication): {
    applicantName: string;
    applicationId: string;
    currentStatus: string;
    checklist: any;
    progress: any;
    adminNotes: string;
    isConfidential: boolean;
    suggestedGrade: string;
    suggestedDivision: string;
  } {
    const { firstName, lastName } = application.personalParticulars;

    return {
      applicantName: `${firstName} ${lastName}`,
      applicationId: application._id?.toString() || '',
      currentStatus: application.status,
      checklist: this.getChecklistDetails(application),
      progress: this.getVerificationProgress(application),
      adminNotes: application.adminNotes,
      isConfidential: application.confidentialFlag,
      suggestedGrade: application.suggestedGrade,
      suggestedDivision: application.suggestedDivision,
    };
  }
}

export default new AdminVerificationService();
