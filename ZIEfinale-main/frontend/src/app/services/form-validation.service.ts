import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

export interface FieldError {
  fieldName: string;
  displayName: string;
  errors: string[];
  step?: string;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: FieldError[];
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  private fieldDisplayNames: { [key: string]: string } = {
    // Personal Particulars
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phoneNumber: 'Phone Number',
    dateOfBirth: 'Date of Birth',
    country: 'Country of Residence',
    nationality: 'Nationality/Country of Citizenship',
    idNumber: 'Passport/National ID Number',
    nationalId: 'National ID Number',

    // Education
    qualification: 'Highest Qualification',
    fieldOfEngineering: 'Field of Engineering',
    university: 'University/Institution',
    yearOfGraduation: 'Year of Graduation',
    licenseNumber: 'Professional Registration/License Number',

    // Experience
    currentJobTitle: 'Current Job Title',
    currentEmployer: 'Current Employer',
    yearsOfExperience: 'Years of Experience',
    experienceSummary: 'Summary of Professional Experience',

    // Apprentices
    apprenticeName: 'Apprentice/Trainee Name',
    workingPlace: 'Working Place/Department',
    company: 'Company/Organization',
    apprenticeEmail: 'Apprentice Email Address',
    apprenticePhone: 'Apprentice Phone Number',

    // Grade
    grade: 'Membership Grade',

    // Company Letter
    companyName: 'Company Name',
    contactPerson: 'Company Contact Person',
    letterFile: 'Recommendation Letter (PDF)',
    declaration: 'Declaration/Agreement Checkbox',

    // M1 Specific - Sponsors
    sponsorFirstName: 'Sponsor First Name',
    sponsorLastName: 'Sponsor Last Name',
    sponsorEmail: 'Sponsor Email',
    sponsorPhone: 'Sponsor Phone',
    sponsorCompany: 'Sponsor Company',
    relationship: 'Relationship to Sponsor',

    // M1 Specific - Referee
    refereeFirstName: 'Referee First Name',
    refereeLastName: 'Referee Last Name',
    refereeEmail: 'Referee Email',
    refereePhone: 'Referee Phone',
    refereeTitle: 'Referee Job Title',
    refereeCompany: 'Referee Company',
  };

  constructor() {}

  /**
   * Validate multiple forms and return detailed error information
   */
  validateForms(forms: { [key: string]: FormGroup }): ValidationResult {
    const missingFields: FieldError[] = [];

    Object.keys(forms).forEach((stepName) => {
      const form = forms[stepName];
      const stepErrors = this.getFormErrors(form, stepName);
      missingFields.push(...stepErrors);
    });

    const isValid = missingFields.length === 0;
    const summary = this.generateSummary(missingFields);

    return {
      isValid,
      missingFields,
      summary,
    };
  }

  /**
   * Get errors for a single form
   */
  private getFormErrors(form: FormGroup, stepName: string): FieldError[] {
    const errors: FieldError[] = [];

    Object.keys(form.controls).forEach((fieldName) => {
      const control = form.get(fieldName);

      if (control && control.errors) {
        const errorMessages = this.getErrorMessages(fieldName, control.errors);
        errors.push({
          fieldName,
          displayName: this.fieldDisplayNames[fieldName] || this.toTitleCase(fieldName),
          errors: errorMessages,
          step: stepName,
        });
      }
    });

    return errors;
  }

  /**
   * Convert error object to readable messages
   */
  private getErrorMessages(fieldName: string, errors: any): string[] {
    const messages: string[] = [];

    if (errors['required']) {
      messages.push('This field is required');
    }
    if (errors['email']) {
      messages.push('Please enter a valid email address');
    }
    if (errors['invalidPhone']) {
      messages.push('Please enter a valid phone number');
    }
    if (errors['invalidNationalId']) {
      messages.push('Please enter a valid National ID (format: 63-2345678 D 48)');
    }
    if (errors['invalidPassport']) {
      messages.push('Please enter a valid passport number (6-20 alphanumeric characters)');
    }
    if (errors['minlength']) {
      messages.push(
        `Minimum ${errors['minlength'].requiredLength} characters required (current: ${errors['minlength'].actualLength})`
      );
    }
    if (errors['maxlength']) {
      messages.push(
        `Maximum ${errors['maxlength'].requiredLength} characters allowed`
      );
    }
    if (errors['min']) {
      messages.push(`Minimum value is ${errors['min'].min}`);
    }
    if (errors['max']) {
      messages.push(`Maximum value is ${errors['max'].max}`);
    }
    if (errors['requiredTrue']) {
      messages.push('This checkbox must be checked');
    }

    return messages.length > 0 ? messages : ['This field is invalid'];
  }

  /**
   * Generate a human-readable summary of validation errors
   */
  private generateSummary(missingFields: FieldError[]): string {
    if (missingFields.length === 0) {
      return 'All fields are valid!';
    }

    const stepGroups: { [key: string]: string[] } = {};

    missingFields.forEach((field) => {
      if (!stepGroups[field.step || 'Unknown']) {
        stepGroups[field.step || 'Unknown'] = [];
      }
      stepGroups[field.step || 'Unknown'].push(field.displayName);
    });

    let summary = `❌ ${missingFields.length} field(s) need attention:\n\n`;

    Object.keys(stepGroups).forEach((step) => {
      summary += `📋 ${step}\n`;
      stepGroups[step].forEach((field) => {
        summary += `  • ${field}\n`;
      });
      summary += '\n';
    });

    return summary;
  }

  /**
   * Format field name to title case
   */
  private toTitleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  /**
   * Check if a file is selected (for file upload fields)
   */
  isFileSelected(fileName: string | null | undefined): boolean {
    return !!fileName && fileName.trim() !== '';
  }
}
