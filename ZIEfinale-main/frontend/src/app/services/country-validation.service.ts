import { Injectable } from '@angular/core';

export interface CountryIdPattern {
  country: string;
  pattern: RegExp;
  placeholder: string;
  description: string;
  example: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryValidationService {
  private idPatterns: { [key: string]: CountryIdPattern } = {
    zimbabwe: {
      country: 'Zimbabwe',
      pattern: /^\d{2}-\d{6}-[A-Z]-\d{2}$/,
      placeholder: '00-000000-X-00',
      description: 'Format: 00-000000-X-00 (2 digits-6 digits-letter-2 digits)',
      example: '63-234567-D-48'
    },
    southafrica: {
      country: 'South Africa',
      pattern: /^\d{13}$/,
      placeholder: '1234567890123',
      description: '13 digits (no spaces or dashes)',
      example: '8801015800088'
    },
    botswana: {
      country: 'Botswana',
      pattern: /^[A-Z]{2}\d{6}\/\d{1,3}$/,
      placeholder: 'XX000000/00',
      description: 'Format: XX000000/00 (2 letters-6 digits/serial)',
      example: 'AX123456/15'
    },
    lesotho: {
      country: 'Lesotho',
      pattern: /^\d{9}[A-Z]{1}[0-9]{2}$/,
      placeholder: '000000000X00',
      description: 'Format: 9 digits-letter-2 digits',
      example: '690101234P23'
    },
    namibia: {
      country: 'Namibia',
      pattern: /^\d{6}\d{5}$/,
      placeholder: '000000 00000',
      description: '11 digits total (6 digits-5 digits)',
      example: '870101 00001'
    }
  };

  constructor() {}

  /**
   * Get ID pattern for a country
   */
  getCountryPattern(country: string): CountryIdPattern | null {
    const normalizedCountry = country.toLowerCase().replace(/\s+/g, '');
    return this.idPatterns[normalizedCountry] || null;
  }

  /**
   * Get all country patterns
   */
  getAllCountries(): CountryIdPattern[] {
    return Object.values(this.idPatterns);
  }

  /**
   * Validate ID against country pattern
   */
  validateId(id: string, country: string): { valid: boolean; error?: string } {
    const pattern = this.getCountryPattern(country);
    
    if (!pattern) {
      return { valid: false, error: 'Country not found in validation list' };
    }

    if (!id || id.trim() === '') {
      return { valid: false, error: 'ID number is required' };
    }

    if (!pattern.pattern.test(id)) {
      return { 
        valid: false, 
        error: `Invalid ${pattern.country} ID format. ${pattern.description}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validate years of experience
   */
  validateYearsOfExperience(years: number | string): { valid: boolean; error?: string } {
    const numYears = typeof years === 'string' ? parseInt(years, 10) : years;

    if (isNaN(numYears)) {
      return { valid: false, error: 'Years of experience must be a number' };
    }

    if (numYears < 0) {
      return { valid: false, error: 'Years of experience cannot be negative' };
    }

    if (numYears > 70) {
      return { valid: false, error: 'Years of experience cannot exceed 70' };
    }

    return { valid: true };
  }
}
