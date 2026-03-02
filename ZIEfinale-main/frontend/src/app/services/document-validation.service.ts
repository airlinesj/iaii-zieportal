import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ValidationRule {
  pattern: RegExp;
  errorMessage: string;
  hint: string;
}

export interface CountryValidation {
  idFormats: ValidationRule[];
  phoneFormat: ValidationRule;
  country: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentValidationService {
  
  private countryValidationRules: { [key: string]: CountryValidation } = {
    // African Countries
    'Zimbabwe': {
      country: 'Zimbabwe',
      idFormats: [
        {
          pattern: /^\d{9}[A-Z]{1}$/i,
          errorMessage: 'Invalid National ID format',
          hint: 'Zimbabwe ID: 9 digits followed by 1 letter (e.g., 123456789A)'
        },
        {
          pattern: /^[A-Z]{2}\d{6,7}$/i,
          errorMessage: 'Invalid Passport format',
          hint: 'Zimbabwe Passport: 2 letters followed by 6-7 digits (e.g., ZW123456)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?263|0)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for Zimbabwe',
        hint: 'Zimbabwe Phone: +263 or 0 followed by 9 digits (e.g., 0712345678)'
      }
    },
    'South Africa': {
      country: 'South Africa',
      idFormats: [
        {
          pattern: /^\d{13}$/,
          errorMessage: 'Invalid South African ID format',
          hint: 'South Africa ID: 13 digits (e.g., 9301015800081)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?27|0)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for South Africa',
        hint: 'South Africa Phone: +27 or 0 followed by 9 digits (e.g., 0712345678)'
      }
    },
    'Botswana': {
      country: 'Botswana',
      idFormats: [
        {
          pattern: /^\d{9}$/,
          errorMessage: 'Invalid Botswana ID format',
          hint: 'Botswana ID: 9 digits (e.g., 123456789)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?267)[0-9]{7,8}$/,
        errorMessage: 'Invalid phone format for Botswana',
        hint: 'Botswana Phone: +267 followed by 7-8 digits (e.g., +2671234567)'
      }
    },
    'Zambia': {
      country: 'Zambia',
      idFormats: [
        {
          pattern: /^\d{9,10}[A-Z]{1}$/i,
          errorMessage: 'Invalid Zambia ID format',
          hint: 'Zambia ID: 9-10 digits followed by 1 letter (e.g., 1234567890A)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?260)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for Zambia',
        hint: 'Zambia Phone: +260 followed by 9 digits (e.g., +260969123456)'
      }
    },
    'Mozambique': {
      country: 'Mozambique',
      idFormats: [
        {
          pattern: /^\d{7}[A-Z]{1}\d{2}$/i,
          errorMessage: 'Invalid Mozambique ID format',
          hint: 'Mozambique ID: 7 digits, 1 letter, 2 digits (e.g., 1234567A89)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?258)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Mozambique',
        hint: 'Mozambique Phone: +258 followed by 8-9 digits (e.g., +258821234567)'
      }
    },
    'Malawi': {
      country: 'Malawi',
      idFormats: [
        {
          pattern: /^\d{7,10}$/,
          errorMessage: 'Invalid Malawi ID format',
          hint: 'Malawi ID: 7-10 digits (e.g., 1234567)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?265)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Malawi',
        hint: 'Malawi Phone: +265 followed by 8-9 digits (e.g., +265991234567)'
      }
    },
    'Tanzania': {
      country: 'Tanzania',
      idFormats: [
        {
          pattern: /^\d{8,20}$/,
          errorMessage: 'Invalid Tanzania ID format',
          hint: 'Tanzania ID: 8-20 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?255)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for Tanzania',
        hint: 'Tanzania Phone: +255 followed by 9 digits (e.g., +255658123456)'
      }
    },
    'Kenya': {
      country: 'Kenya',
      idFormats: [
        {
          pattern: /^\d{5,10}$/,
          errorMessage: 'Invalid Kenya National ID format',
          hint: 'Kenya ID: 5-10 digits (e.g., 12345678)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?254)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for Kenya',
        hint: 'Kenya Phone: +254 followed by 9 digits (e.g., +254712123456)'
      }
    },
    'Uganda': {
      country: 'Uganda',
      idFormats: [
        {
          pattern: /^\d{5,14}$/,
          errorMessage: 'Invalid Uganda ID format',
          hint: 'Uganda ID: 5-14 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?256)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for Uganda',
        hint: 'Uganda Phone: +256 followed by 9 digits'
      }
    },
    'Ethiopia': {
      country: 'Ethiopia',
      idFormats: [
        {
          pattern: /^\d{7,9}$/,
          errorMessage: 'Invalid Ethiopia ID format',
          hint: 'Ethiopia ID: 7-9 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?251)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Ethiopia',
        hint: 'Ethiopia Phone: +251 followed by 8-9 digits'
      }
    },
    'Nigeria': {
      country: 'Nigeria',
      idFormats: [
        {
          pattern: /^\d{11}$/,
          errorMessage: 'Invalid Nigeria ID format',
          hint: 'Nigeria ID: 11 digits (National ID)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?234)[0-9]{10}$/,
        errorMessage: 'Invalid phone format for Nigeria',
        hint: 'Nigeria Phone: +234 followed by 10 digits'
      }
    },
    'Ghana': {
      country: 'Ghana',
      idFormats: [
        {
          pattern: /^\d{10}[A-Z]{1}$/i,
          errorMessage: 'Invalid Ghana ID format',
          hint: 'Ghana ID: 10 digits followed by 1 letter'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?233)[0-9]{9}$/,
        errorMessage: 'Invalid phone format for Ghana',
        hint: 'Ghana Phone: +233 followed by 9 digits'
      }
    },
    'Cameroon': {
      country: 'Cameroon',
      idFormats: [
        {
          pattern: /^\d{9}$/,
          errorMessage: 'Invalid Cameroon ID format',
          hint: 'Cameroon ID: 9 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?237)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Cameroon',
        hint: 'Cameroon Phone: +237 followed by 8-9 digits'
      }
    },
    'Rwanda': {
      country: 'Rwanda',
      idFormats: [
        {
          pattern: /^\d{1}[A-Z]{1}\d{6}$/i,
          errorMessage: 'Invalid Rwanda ID format',
          hint: 'Rwanda ID: Digit, Letter, 6 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?250)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Rwanda',
        hint: 'Rwanda Phone: +250 followed by 8-9 digits'
      }
    },
    'Angola': {
      country: 'Angola',
      idFormats: [
        {
          pattern: /^\d{2}[A-Z]{1}\d{6}$/i,
          errorMessage: 'Invalid Angola ID format',
          hint: 'Angola BI: 2 digits, 1 letter, 6 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?244)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Angola',
        hint: 'Angola Phone: +244 followed by 8-9 digits'
      }
    },
    'Namibia': {
      country: 'Namibia',
      idFormats: [
        {
          pattern: /^\d{8}[A-Z]{1}\d{2}$/i,
          errorMessage: 'Invalid Namibia ID format',
          hint: 'Namibia ID: 8 digits, 1 letter, 2 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?264)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Namibia',
        hint: 'Namibia Phone: +264 followed by 8-9 digits'
      }
    },
    // Americas
    'USA': {
      country: 'USA',
      idFormats: [
        {
          pattern: /^\d{3}-\d{2}-\d{4}$/,
          errorMessage: 'Invalid US Social Security Number format',
          hint: 'US SSN: XXX-XX-XXXX (e.g., 123-45-6789)'
        },
        {
          pattern: /^[A-Z]{1}\d{5,8}$/i,
          errorMessage: 'Invalid US State ID format',
          hint: 'US License: Letter followed by 5-8 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
        errorMessage: 'Invalid US phone format',
        hint: 'US Phone: (123) 456-7890 or 123-456-7890 or +1-123-456-7890'
      }
    },
    'Canada': {
      country: 'Canada',
      idFormats: [
        {
          pattern: /^\d{9}$/,
          errorMessage: 'Invalid Canadian Social Insurance Number',
          hint: 'Canadian SIN: 9 digits (e.g., 123456789)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
        errorMessage: 'Invalid Canadian phone format',
        hint: 'Canada Phone: (123) 456-7890 or +1-123-456-7890'
      }
    },
    // Europe
    'United Kingdom': {
      country: 'United Kingdom',
      idFormats: [
        {
          pattern: /^[A-Z]{2}\d{6}\s[A-Z]{3}$/i,
          errorMessage: 'Invalid UK National Insurance format',
          hint: 'UK NI: AB123456 XXX (e.g., AB123456 ABC)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?44|0)[0-9]{10}$/,
        errorMessage: 'Invalid UK phone format',
        hint: 'UK Phone: +44 or 0 followed by 10 digits'
      }
    },
    'Ireland': {
      country: 'Ireland',
      idFormats: [
        {
          pattern: /^\d{7}[A-Z]{1}[A-Z]{1}$/i,
          errorMessage: 'Invalid Irish PPS Number format',
          hint: 'Irish PPS: 7 digits followed by 2 letters (e.g., 1234567AA)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?353|0)[0-9]{9,10}$/,
        errorMessage: 'Invalid Irish phone format',
        hint: 'Ireland Phone: +353 or 0 followed by 9-10 digits'
      }
    },
    'Germany': {
      country: 'Germany',
      idFormats: [
        {
          pattern: /^\d{1,2}\s\d{6,7}\s[A-Z]{1}\s\d{10}$/i,
          errorMessage: 'Invalid German ID format',
          hint: 'German ID: Complex format'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?49|0)[0-9]{9,11}$/,
        errorMessage: 'Invalid German phone format',
        hint: 'Germany Phone: +49 or 0 followed by 9-11 digits'
      }
    },
    'France': {
      country: 'France',
      idFormats: [
        {
          pattern: /^\d{13}$/,
          errorMessage: 'Invalid French ID format',
          hint: 'France ID: 13 digits (INSEE)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?33|0)[0-9]{8,9}$/,
        errorMessage: 'Invalid French phone format',
        hint: 'France Phone: +33 or 0 followed by 8-9 digits'
      }
    },
    'Netherlands': {
      country: 'Netherlands',
      idFormats: [
        {
          pattern: /^[A-Z]{2}\d{6}$/i,
          errorMessage: 'Invalid Dutch ID format',
          hint: 'Netherlands ID: 2 letters followed by 6 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?31|0)[0-9]{8,9}$/,
        errorMessage: 'Invalid Dutch phone format',
        hint: 'Netherlands Phone: +31 or 0 followed by 8-9 digits'
      }
    },
    'Belgium': {
      country: 'Belgium',
      idFormats: [
        {
          pattern: /^\d{11}$/,
          errorMessage: 'Invalid Belgian ID format',
          hint: 'Belgium ID: 11 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?32|0)[0-9]{8,9}$/,
        errorMessage: 'Invalid Belgian phone format',
        hint: 'Belgium Phone: +32 or 0 followed by 8-9 digits'
      }
    },
    'Switzerland': {
      country: 'Switzerland',
      idFormats: [
        {
          pattern: /^\d{5}\.\d{4}\.\d{4}\.\d{2}$/,
          errorMessage: 'Invalid Swiss ID format',
          hint: 'Switzerland AHV: XXXXX.XXXX.XXXX.XX'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?41|0)[0-9]{8,9}$/,
        errorMessage: 'Invalid Swiss phone format',
        hint: 'Switzerland Phone: +41 or 0 followed by 8-9 digits'
      }
    },
    // Asia-Pacific
    'Australia': {
      country: 'Australia',
      idFormats: [
        {
          pattern: /^\d{8}$/,
          errorMessage: 'Invalid Australian ID format',
          hint: 'Australia ID: 8 digits (Medicare or Tax File Number)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?61|0)[0-9]{8,9}$/,
        errorMessage: 'Invalid Australian phone format',
        hint: 'Australia Phone: +61 or 0 followed by 8-9 digits'
      }
    },
    'New Zealand': {
      country: 'New Zealand',
      idFormats: [
        {
          pattern: /^\d{3}\s\d{3}\s\d{3}$/,
          errorMessage: 'Invalid NZ ID format',
          hint: 'New Zealand IRD: XXX XXX XXX (e.g., 123 456 789)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?64|0)[0-9]{8,9}$/,
        errorMessage: 'Invalid NZ phone format',
        hint: 'New Zealand Phone: +64 or 0 followed by 8-9 digits'
      }
    },
    'Singapore': {
      country: 'Singapore',
      idFormats: [
        {
          pattern: /^[STFG]\d{7}[A-Z]{1}$/i,
          errorMessage: 'Invalid Singapore NRIC format',
          hint: 'Singapore NRIC: Letter, 7 digits, letter (e.g., S1234567A)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?65)[0-9]{8}$/,
        errorMessage: 'Invalid Singapore phone format',
        hint: 'Singapore Phone: +65 followed by 8 digits'
      }
    },
    'Malaysia': {
      country: 'Malaysia',
      idFormats: [
        {
          pattern: /^\d{6}-\d{2}-\d{4}$/,
          errorMessage: 'Invalid Malaysian ID format',
          hint: 'Malaysia NRIC: XXXXXX-XX-XXXX (6 digits - 2 digits - 4 digits)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?60|0)[0-9]{9,10}$/,
        errorMessage: 'Invalid Malaysian phone format',
        hint: 'Malaysia Phone: +60 or 0 followed by 9-10 digits'
      }
    },
    'India': {
      country: 'India',
      idFormats: [
        {
          pattern: /^\d{12}$/,
          errorMessage: 'Invalid Indian ID format',
          hint: 'India Aadhaar: 12 digits (e.g., 123456789012)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?91|0)[0-9]{10}$/,
        errorMessage: 'Invalid Indian phone format',
        hint: 'India Phone: +91 or 0 followed by 10 digits'
      }
    },
    'China': {
      country: 'China',
      idFormats: [
        {
          pattern: /^\d{18}$/,
          errorMessage: 'Invalid Chinese ID format',
          hint: 'China ID: 18 digits'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?86|0)[0-9]{10,11}$/,
        errorMessage: 'Invalid Chinese phone format',
        hint: 'China Phone: +86 or 0 followed by 10-11 digits'
      }
    },
    'Japan': {
      country: 'Japan',
      idFormats: [
        {
          pattern: /^\d{4}-\d{4}-\d{4}$/,
          errorMessage: 'Invalid Japanese ID format',
          hint: 'Japan ID: XXXX-XXXX-XXXX (12 digits)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?81|0)[0-9]{9,10}$/,
        errorMessage: 'Invalid Japanese phone format',
        hint: 'Japan Phone: +81 or 0 followed by 9-10 digits'
      }
    },
    'South Korea': {
      country: 'South Korea',
      idFormats: [
        {
          pattern: /^\d{6}-\d{7}$/,
          errorMessage: 'Invalid South Korean ID format',
          hint: 'South Korea ID: XXXXXX-XXXXXXX (6 digits - 7 digits)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?82|0)[0-9]{9,10}$/,
        errorMessage: 'Invalid South Korean phone format',
        hint: 'South Korea Phone: +82 or 0 followed by 9-10 digits'
      }
    },
    // Middle East
    'UAE': {
      country: 'UAE',
      idFormats: [
        {
          pattern: /^\d{15}$/,
          errorMessage: 'Invalid UAE ID format',
          hint: 'UAE ID: 15 digits (emirate ID number)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?971)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for UAE',
        hint: 'UAE Phone: +971 followed by 8-9 digits (e.g., +971501234567)'
      }
    },
    'Saudi Arabia': {
      country: 'Saudi Arabia',
      idFormats: [
        {
          pattern: /^\d{10}$/,
          errorMessage: 'Invalid Saudi national ID format',
          hint: 'Saudi ID: 10 digits (e.g., 1234567890)'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?966)[0-9]{8,9}$/,
        errorMessage: 'Invalid phone format for Saudi Arabia',
        hint: 'Saudi Phone: +966 followed by 8-9 digits (e.g., +966501234567)'
      }
    },
    // Additional Countries (Generic Validation)
    'Afghanistan': { country: 'Afghanistan', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?93)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +93 followed by 9 digits' } },
    'Albania': { country: 'Albania', idFormats: [{ pattern: /^[A-Z]{1}\d{8}$|^\d{10}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 1 letter + 8 digits or 10 digits' }], phoneFormat: { pattern: /^(\+?355|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +355 or 0 followed by 8-9 digits' } },
    'Algeria': { country: 'Algeria', idFormats: [{ pattern: /^[0-9]{18}$/, errorMessage: 'Invalid ID format', hint: 'ID: 18 digits' }], phoneFormat: { pattern: /^(\+?213|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +213 or 0 followed by 9 digits' } },
    'Andorra': { country: 'Andorra', idFormats: [{ pattern: /^[A-Z]{1}\d{6}$|^\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 6 digits or 6 digits' }], phoneFormat: { pattern: /^(\+?376)[0-9]{6}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +376 followed by 6 digits' } },
    'Antigua and Barbuda': { country: 'Antigua and Barbuda', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1268)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1268 followed by 7 digits' } },
    'Argentina': { country: 'Argentina', idFormats: [{ pattern: /^\d{8}$|^\d{7,8}$/, errorMessage: 'Invalid ID format', hint: 'ID: 7-8 digits' }], phoneFormat: { pattern: /^(\+?54|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +54 or 0 followed by 9-10 digits' } },
    'Armenia': { country: 'Armenia', idFormats: [{ pattern: /^[A-Z]{1}\d{8}$|^\d{10}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 8 digits or 10 digits' }], phoneFormat: { pattern: /^(\+?374|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +374 or 0 followed by 8 digits' } },
    'Austria': { country: 'Austria', idFormats: [{ pattern: /^[0-9]{6}[A-Z]{1}[0-9]{3}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 6 digits + letter + 3 digits' }], phoneFormat: { pattern: /^(\+?43|0)[0-9]{9,13}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +43 or 0 followed by 9-13 digits' } },
    'Azerbaijan': { country: 'Azerbaijan', idFormats: [{ pattern: /^[A-Z]{2}\d{7}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 7 digits' }], phoneFormat: { pattern: /^(\+?994|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +994 or 0 followed by 9 digits' } },
    'Bahamas': { country: 'Bahamas', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1242)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1242 followed by 7 digits' } },
    'Bahrain': { country: 'Bahrain', idFormats: [{ pattern: /^[0-9]{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?973)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +973 followed by 8 digits' } },
    'Bangladesh': { country: 'Bangladesh', idFormats: [{ pattern: /^[0-9]{10}$|^[0-9]{13}$|^[0-9]{17}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10, 13, or 17 digits' }], phoneFormat: { pattern: /^(\+?880|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +880 or 0 followed by 9 digits' } },
    'Barbados': { country: 'Barbados', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1246)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1246 followed by 7 digits' } },
    'Belarus': { country: 'Belarus', idFormats: [{ pattern: /^[0-9]{9}[A-Z]{2}[0-9]{2}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits + 2 letters + 2 digits' }], phoneFormat: { pattern: /^(\+?375|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +375 or 0 followed by 9 digits' } },
    'Belize': { country: 'Belize', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?501)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +501 followed by 7 digits' } },
    'Benin': { country: 'Benin', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?229)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +229 followed by 8 digits' } },
    'Bhutan': { country: 'Bhutan', idFormats: [{ pattern: /^[0-9]{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?975)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +975 followed by 8 digits' } },
    'Bolivia': { country: 'Bolivia', idFormats: [{ pattern: /^[0-9]{7}[A-Z]{1}[0-9]{1}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 7 digits + letter + digit' }], phoneFormat: { pattern: /^(\+?591|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +591 or 0 followed by 8 digits' } },
    'Bosnia and Herzegovina': { country: 'Bosnia and Herzegovina', idFormats: [{ pattern: /^\d{13}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 13 digits' }], phoneFormat: { pattern: /^(\+?387|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +387 or 0 followed by 8-9 digits' } },
    'Brazil': { country: 'Brazil', idFormats: [{ pattern: /^\d{11}$|^\d{8}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 11 digits' }], phoneFormat: { pattern: /^(\+?55|0)[0-9]{10,11}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +55 or 0 followed by 10-11 digits' } },
    'Brunei': { country: 'Brunei', idFormats: [{ pattern: /^[0-9]{6}\-[0-9]{4}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 6 digits - 4 digits or 10 digits' }], phoneFormat: { pattern: /^(\+?673)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +673 followed by 7 digits' } },
    'Bulgaria': { country: 'Bulgaria', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?359|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +359 or 0 followed by 8-9 digits' } },
    'Burkina Faso': { country: 'Burkina Faso', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?226)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +226 followed by 8 digits' } },
    'Burundi': { country: 'Burundi', idFormats: [{ pattern: /^\d{1}\d{2}\d{7}\d{3}[A-Z]{1}[0-9]{3}[A-Z]{1}$/i, errorMessage: 'Invalid ID format', hint: 'ID: National format' }], phoneFormat: { pattern: /^(\+?257)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +257 followed by 8 digits' } },
    'Cape Verde': { country: 'Cape Verde', idFormats: [{ pattern: /^[A-Z]{3}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 3 letters + 6 digits' }], phoneFormat: { pattern: /^(\+?238)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +238 followed by 7 digits' } },
    'Central African Republic': { country: 'Central African Republic', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?236)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +236 followed by 8 digits' } },
    'Chad': { country: 'Chad', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?235)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +235 followed by 8 digits' } },
    'Chile': { country: 'Chile', idFormats: [{ pattern: /^\d{1,2}\.\d{3}\.\d{3}\-[0-9K]$|^\d{6,8}$/, errorMessage: 'Invalid ID format', hint: 'ID: 6-8 digits or formatted' }], phoneFormat: { pattern: /^(\+?56|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +56 or 0 followed by 8-9 digits' } },
    'Colombia': { country: 'Colombia', idFormats: [{ pattern: /^\d{8,10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8-10 digits' }], phoneFormat: { pattern: /^(\+?57|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +57 or 0 followed by 9 digits' } },
    'Comoros': { country: 'Comoros', idFormats: [{ pattern: /^\d{7}$/, errorMessage: 'Invalid ID format', hint: 'ID: 7 digits' }], phoneFormat: { pattern: /^(\+?269)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +269 followed by 7 digits' } },
    'Congo': { country: 'Congo', idFormats: [{ pattern: /^\d{9}$|^[A-Z]{2}\d{7}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits or 2 letters + 7 digits' }], phoneFormat: { pattern: /^(\+?242)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +242 followed by 8 digits' } },
    'Costa Rica': { country: 'Costa Rica', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?506)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +506 followed by 8 digits' } },
    'Côte d\'Ivoire': { country: 'Côte d\'Ivoire', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?225)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +225 followed by 8 digits' } },
    'Croatia': { country: 'Croatia', idFormats: [{ pattern: /^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits' }], phoneFormat: { pattern: /^(\+?385|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +385 or 0 followed by 8-9 digits' } },
    'Cuba': { country: 'Cuba', idFormats: [{ pattern: /^\d{11}[A-Z]{1}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits + letter' }], phoneFormat: { pattern: /^(\+?53|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +53 or 0 followed by 8 digits' } },
    'Cyprus': { country: 'Cyprus', idFormats: [{ pattern: /^[A-Z]{1}\d{8}[A-Z]{1}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 8 digits + letter' }], phoneFormat: { pattern: /^(\+?357)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +357 followed by 8 digits' } },
    'Czech Republic': { country: 'Czech Republic', idFormats: [{ pattern: /^\d{9,10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9-10 digits' }], phoneFormat: { pattern: /^(\+?420|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +420 or 0 followed by 8-9 digits' } },
    'Denmark': { country: 'Denmark', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?45|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +45 or 0 followed by 8 digits' } },
    'Djibouti': { country: 'Djibouti', idFormats: [{ pattern: /^\d{7}$/, errorMessage: 'Invalid ID format', hint: 'ID: 7 digits' }], phoneFormat: { pattern: /^(\+?253)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +253 followed by 8 digits' } },
    'Dominica': { country: 'Dominica', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1767)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1767 followed by 7 digits' } },
    'Dominican Republic': { country: 'Dominican Republic', idFormats: [{ pattern: /^\d{11}$|^\d{3}\-\d{7}\-\d{1}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits or formatted' }], phoneFormat: { pattern: /^(\+?1809|\+?1829|\+?1849|0)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: country code followed by 7 digits' } },
    'East Timor': { country: 'East Timor', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?670)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +670 followed by 7 digits' } },
    'Ecuador': { country: 'Ecuador', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?593|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +593 or 0 followed by 9 digits' } },
    'Egypt': { country: 'Egypt', idFormats: [{ pattern: /^[0-9]{14}$|^[0-9]{8}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 14 digits' }], phoneFormat: { pattern: /^(\+?20|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +20 or 0 followed by 9-10 digits' } },
    'El Salvador': { country: 'El Salvador', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?503)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +503 followed by 8 digits' } },
    'Equatorial Guinea': { country: 'Equatorial Guinea', idFormats: [{ pattern: /^\d{9}$|^[A-Z]{2}\d{7}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits or 2 letters + 7 digits' }], phoneFormat: { pattern: /^(\+?240)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +240 followed by 8 digits' } },
    'Eritrea': { country: 'Eritrea', idFormats: [{ pattern: /^[A-Z]{2}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 6 digits' }], phoneFormat: { pattern: /^(\+?291)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +291 followed by 7 digits' } },
    'Estonia': { country: 'Estonia', idFormats: [{ pattern: /^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits' }], phoneFormat: { pattern: /^(\+?372|0)[0-9]{7,8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +372 or 0 followed by 7-8 digits' } },
    'Fiji': { country: 'Fiji', idFormats: [{ pattern: /^\d{9}$|^[A-Z]{2}\d{7}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits or 2 letters + 7 digits' }], phoneFormat: { pattern: /^(\+?679)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +679 followed by 7 digits' } },
    'Finland': { country: 'Finland', idFormats: [{ pattern: /^\d{6}[A-Z+\-*]\d{3}[A-Z0-9]{1}$|^\d{6}\+\d{3}[A-Z0-9]{1}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 6 digits + century mark + 3 digits + letter' }], phoneFormat: { pattern: /^(\+?358|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +358 or 0 followed by 8-9 digits' } },
    'Gabon': { country: 'Gabon', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?241)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +241 followed by 7 digits' } },
    'Gambia': { country: 'Gambia', idFormats: [{ pattern: /^[A-Z]{2}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 6 digits' }], phoneFormat: { pattern: /^(\+?220)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +220 followed by 7 digits' } },
    'Georgia': { country: 'Georgia', idFormats: [{ pattern: /^[0-9]{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits' }], phoneFormat: { pattern: /^(\+?995|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +995 or 0 followed by 8-9 digits' } },
    'Greece': { country: 'Greece', idFormats: [{ pattern: /^[A-Z]{2}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 6 digits' }], phoneFormat: { pattern: /^(\+?30|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +30 or 0 followed by 9-10 digits' } },
    'Grenada': { country: 'Grenada', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1473)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1473 followed by 7 digits' } },
    'Guatemala': { country: 'Guatemala', idFormats: [{ pattern: /^\d{8}$|^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 13 digits' }], phoneFormat: { pattern: /^(\+?502)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +502 followed by 8 digits' } },
    'Guinea': { country: 'Guinea', idFormats: [{ pattern: /^\d{10}$|^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9-10 digits' }], phoneFormat: { pattern: /^(\+?224)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +224 followed by 8 digits' } },
    'Guinea-Bissau': { country: 'Guinea-Bissau', idFormats: [{ pattern: /^\d{9}$|^[A-Z]{2}\d{7}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits or 2 letters + 7 digits' }], phoneFormat: { pattern: /^(\+?245)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +245 followed by 7 digits' } },
    'Guyana': { country: 'Guyana', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?592)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +592 followed by 7 digits' } },
    'Haiti': { country: 'Haiti', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?509)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +509 followed by 8 digits' } },
    'Honduras': { country: 'Honduras', idFormats: [{ pattern: /^\d{13}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 13 digits' }], phoneFormat: { pattern: /^(\+?504)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +504 followed by 8 digits' } },
    'Hungary': { country: 'Hungary', idFormats: [{ pattern: /^[0-9]{6}[A-Z]{1}[0-9]{2}[0-9]{2}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 6 digits + letter + 4 digits' }], phoneFormat: { pattern: /^(\+?36|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +36 or 0 followed by 8-9 digits' } },
    'Iceland': { country: 'Iceland', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?354)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +354 followed by 7 digits' } },
    'Indonesia': { country: 'Indonesia', idFormats: [{ pattern: /^\d{16}$|^\d{6}\d{7}$/, errorMessage: 'Invalid ID format', hint: 'ID: 16 digits' }], phoneFormat: { pattern: /^(\+?62|0)[0-9]{9,12}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +62 or 0 followed by 9-12 digits' } },
    'Iran': { country: 'Iran', idFormats: [{ pattern: /^\d{10}$|^\d{6}[A-Z]{1}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits or formatted' }], phoneFormat: { pattern: /^(\+?98|0)[0-9]{10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +98 or 0 followed by 10 digits' } },
    'Iraq': { country: 'Iraq', idFormats: [{ pattern: /^\d{10,12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10-12 digits' }], phoneFormat: { pattern: /^(\+?964|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +964 or 0 followed by 9-10 digits' } },
    'Israel': { country: 'Israel', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?972|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +972 or 0 followed by 8-9 digits' } },
    'Italy': { country: 'Italy', idFormats: [{ pattern: /^[A-Z]{6}\d{2}\d{2}\d{2}[A-Z]\d{3}[A-Z]$/i, errorMessage: 'Invalid ID format', hint: 'ID: Tax code format' }], phoneFormat: { pattern: /^(\+?39)[0-9]{9,10}$|0[0-9]{9,10}/, errorMessage: 'Invalid phone format', hint: 'Phone: +39 or 0 followed by 9-10 digits' } },
    'Jamaica': { country: 'Jamaica', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1876)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1876 followed by 7 digits' } },
    'Jordan': { country: 'Jordan', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?962|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +962 or 0 followed by 8-9 digits' } },
    'Kazakhstan': { country: 'Kazakhstan', idFormats: [{ pattern: /^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 12 digits' }], phoneFormat: { pattern: /^(\+?7)[0-9]{10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +7 followed by 10 digits' } },
    'Kiribati': { country: 'Kiribati', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?686)[0-9]{5}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +686 followed by 5 digits' } },
    'Kosovo': { country: 'Kosovo', idFormats: [{ pattern: /^\d{10}$|^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 13 digits' }], phoneFormat: { pattern: /^(\+?383)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +383 followed by 8 digits' } },
    'Kuwait': { country: 'Kuwait', idFormats: [{ pattern: /^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 12 digits' }], phoneFormat: { pattern: /^(\+?965)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +965 followed by 8 digits' } },
    'Kyrgyzstan': { country: 'Kyrgyzstan', idFormats: [{ pattern: /^\d{9}$|^\d{14}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 or 14 digits' }], phoneFormat: { pattern: /^(\+?996|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +996 or 0 followed by 9 digits' } },
    'Laos': { country: 'Laos', idFormats: [{ pattern: /^[0-9]{10}$|^\d{8}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8-10 digits' }], phoneFormat: { pattern: /^(\+?856|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +856 or 0 followed by 8-9 digits' } },
    'Latvia': { country: 'Latvia', idFormats: [{ pattern: /^\d{6}\-\d{5}$|^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 6 digits - 5 digits or 11 digits' }], phoneFormat: { pattern: /^(\+?371)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +371 followed by 8 digits' } },
    'Lebanon': { country: 'Lebanon', idFormats: [{ pattern: /^\d{7}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 7 or 10 digits' }], phoneFormat: { pattern: /^(\+?961|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +961 or 0 followed by 8-9 digits' } },
    'Lesotho': { country: 'Lesotho', idFormats: [{ pattern: /^\d{9}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9-10 digits' }], phoneFormat: { pattern: /^(\+?266)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +266 followed by 8 digits' } },
    'Liberia': { country: 'Liberia', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?231|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +231 or 0 followed by 8 digits' } },
    'Libya': { country: 'Libya', idFormats: [{ pattern: /^\d{9}$|^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 or 12 digits' }], phoneFormat: { pattern: /^(\+?218|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +218 or 0 followed by 9 digits' } },
    'Liechtenstein': { country: 'Liechtenstein', idFormats: [{ pattern: /^[A-Z]{1}\d{5}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 5 digits' }], phoneFormat: { pattern: /^(\+?423)[0-9]{7,8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +423 followed by 7-8 digits' } },
    'Lithuania': { country: 'Lithuania', idFormats: [{ pattern: /^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits' }], phoneFormat: { pattern: /^(\+?370|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +370 or 0 followed by 8 digits' } },
    'Luxembourg': { country: 'Luxembourg', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?352)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +352 followed by 8-9 digits' } },
    'Madagascar': { country: 'Madagascar', idFormats: [{ pattern: /^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 12 digits' }], phoneFormat: { pattern: /^(\+?261|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +261 or 0 followed by 8-9 digits' } },
    'Maldives': { country: 'Maldives', idFormats: [{ pattern: /^[A-Z]{1}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 6 digits' }], phoneFormat: { pattern: /^(\+?960)[0-9]{7,8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +960 followed by 7-8 digits' } },
    'Mali': { country: 'Mali', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?223)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +223 followed by 8 digits' } },
    'Malta': { country: 'Malta', idFormats: [{ pattern: /^[A-Z]{3}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 3 letters + 6 digits' }], phoneFormat: { pattern: /^(\+?356)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +356 followed by 8 digits' } },
    'Marshall Islands': { country: 'Marshall Islands', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?692)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +692 followed by 7 digits' } },
    'Mauritania': { country: 'Mauritania', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?222)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +222 followed by 8 digits' } },
    'Mauritius': { country: 'Mauritius', idFormats: [{ pattern: /^\d{8}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 10 digits' }], phoneFormat: { pattern: /^(\+?230)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +230 followed by 8 digits' } },
    'Mexico': { country: 'Mexico', idFormats: [{ pattern: /^[A-Z]{6}\d{8}[A-Z]{1}\d{3}[A-Z0-9]{1}$/i, errorMessage: 'Invalid ID format', hint: 'ID: RFC format' }], phoneFormat: { pattern: /^(\+?52|0)[0-9]{10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +52 or 0 followed by 10 digits' } },
    'Micronesia': { country: 'Micronesia', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?691)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +691 followed by 7 digits' } },
    'Moldova': { country: 'Moldova', idFormats: [{ pattern: /^\d{8}$|^\d{14}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 14 digits' }], phoneFormat: { pattern: /^(\+?373|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +373 or 0 followed by 8 digits' } },
    'Monaco': { country: 'Monaco', idFormats: [{ pattern: /^[A-Z]{1}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 8 digits' }], phoneFormat: { pattern: /^(\+?377)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +377 followed by 8 digits' } },
    'Mongolia': { country: 'Mongolia', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?976|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +976 or 0 followed by 8 digits' } },
    'Montenegro': { country: 'Montenegro', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?382|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +382 or 0 followed by 8 digits' } },
    'Morocco': { country: 'Morocco', idFormats: [{ pattern: /^[A-Z]{1}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 8 digits' }], phoneFormat: { pattern: /^(\+?212|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +212 or 0 followed by 9 digits' } },
    'Myanmar': { country: 'Myanmar', idFormats: [{ pattern: /^[0-9]{9}$|^[0-9]{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 or 12 digits' }], phoneFormat: { pattern: /^(\+?95|0)[0-9]{7,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +95 or 0 followed by 7-9 digits' } },
    'Nauru': { country: 'Nauru', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?674)[0-9]{5}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +674 followed by 5 digits' } },
    'Nepal': { country: 'Nepal', idFormats: [{ pattern: /^[0-9]{8}$|^[0-9]{9}$|^[0-9]{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8-10 digits' }], phoneFormat: { pattern: /^(\+?977|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +977 or 0 followed by 9-10 digits' } },
    'Nicaragua': { country: 'Nicaragua', idFormats: [{ pattern: /^\d{14}$/, errorMessage: 'Invalid ID format', hint: 'ID: 14 digits' }], phoneFormat: { pattern: /^(\+?505)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +505 followed by 8 digits' } },
    'Niger': { country: 'Niger', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?227)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +227 followed by 8 digits' } },
    'North Korea': { country: 'North Korea', idFormats: [{ pattern: /^\d{13}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 13 digits' }], phoneFormat: { pattern: /^(\+?850)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +850 followed by 8 digits' } },
    'North Macedonia': { country: 'North Macedonia', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?389|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +389 or 0 followed by 8 digits' } },
    'Norway': { country: 'Norway', idFormats: [{ pattern: /^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits' }], phoneFormat: { pattern: /^(\+?47)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +47 followed by 8 digits' } },
    'Oman': { country: 'Oman', idFormats: [{ pattern: /^\d{9}$|^\d{8}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8-9 digits' }], phoneFormat: { pattern: /^(\+?968)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +968 followed by 8 digits' } },
    'Pakistan': { country: 'Pakistan', idFormats: [{ pattern: /^\d{13}$|^\d{5}\-$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?92|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +92 or 0 followed by 9-10 digits' } },
    'Palau': { country: 'Palau', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?680)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +680 followed by 7 digits' } },
    'Palestine': { country: 'Palestine', idFormats: [{ pattern: /^\d{9}$|^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 or 13 digits' }], phoneFormat: { pattern: /^(\+?970|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +970 or 0 followed by 8-9 digits' } },
    'Panama': { country: 'Panama', idFormats: [{ pattern: /^\d{4}\-\d{4}\-\d{4}$|^\d{8,10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 4-4-4 format or 8-10 digits' }], phoneFormat: { pattern: /^(\+?507)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +507 followed by 8 digits' } },
    'Papua New Guinea': { country: 'Papua New Guinea', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?675)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +675 followed by 7 digits' } },
    'Paraguay': { country: 'Paraguay', idFormats: [{ pattern: /^\d{1,8}$/,errorMessage: 'Invalid ID format', hint: 'ID: 1-8 digits' }], phoneFormat: { pattern: /^(\+?595|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +595 or 0 followed by 9 digits' } },
    'Peru': { country: 'Peru', idFormats: [{ pattern: /^\d{8}$|^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 12 digits' }], phoneFormat: { pattern: /^(\+?51|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +51 or 0 followed by 9 digits' } },
    'Philippines': { country: 'Philippines', idFormats: [{ pattern: /^\d{12}$|^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 12-13 digits' }], phoneFormat: { pattern: /^(\+?63|0)[0-9]{9,10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +63 or 0 followed by 9-10 digits' } },
    'Poland': { country: 'Poland', idFormats: [{ pattern: /^\d{11}$|^\d{3}\s\d{3}\s\d{5}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits or formatted' }], phoneFormat: { pattern: /^(\+?48|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +48 or 0 followed by 9 digits' } },
    'Portugal': { country: 'Portugal', idFormats: [{ pattern: /^[0-9]{8}[A-Z]{1}$|^\d{9}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 8 digits + letter or 9 digits' }], phoneFormat: { pattern: /^(\+?351|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +351 or 0 followed by 8-9 digits' } },
    'Qatar': { country: 'Qatar', idFormats: [{ pattern: /^\d{10}$|^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 12 digits' }], phoneFormat: { pattern: /^(\+?974)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +974 followed by 8 digits' } },
    'Romania': { country: 'Romania', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?40|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +40 or 0 followed by 9 digits' } },
    'Russia': { country: 'Russia', idFormats: [{ pattern: /^\d{10}$|^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10-11 digits' }], phoneFormat: { pattern: /^(\+?7)[0-9]{10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +7 followed by 10 digits' } },
    'Saint Kitts and Nevis': { country: 'Saint Kitts and Nevis', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1869)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1869 followed by 7 digits' } },
    'Saint Lucia': { country: 'Saint Lucia', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1758)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1758 followed by 7 digits' } },
    'Saint Vincent and the Grenadines': { country: 'Saint Vincent and the Grenadines', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1784)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1784 followed by 7 digits' } },
    'Samoa': { country: 'Samoa', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?685)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +685 followed by 7 digits' } },
    'San Marino': { country: 'San Marino', idFormats: [{ pattern: /^\d{10}$|^\d{5}\s\d{5}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits or formatted' }], phoneFormat: { pattern: /^(\+?378)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +378 followed by 8 digits' } },
    'Sao Tome and Principe': { country: 'Sao Tome and Principe', idFormats: [{ pattern: /^\d{7}$|^[A-Z]{2}\d{5}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 7 digits or 2 letters + 5 digits' }], phoneFormat: { pattern: /^(\+?239)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +239 followed by 7 digits' } },
    'Senegal': { country: 'Senegal', idFormats: [{ pattern: /^[A-Z]{4}\d{6}$/, errorMessage: 'Invalid ID format', hint: 'ID: 4 letters + 6 digits' }], phoneFormat: { pattern: /^(\+?221)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +221 followed by 8 digits' } },
    'Serbia': { country: 'Serbia', idFormats: [{ pattern: /^\d{13}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 13 digits' }], phoneFormat: { pattern: /^(\+?381|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +381 or 0 followed by 8-9 digits' } },
    'Seychelles': { country: 'Seychelles', idFormats: [{ pattern: /^\d{7}$|^[A-Z]{1}\d{6}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 7 digits or letter + 6 digits' }], phoneFormat: { pattern: /^(\+?248)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +248 followed by 7 digits' } },
    'Sierra Leone': { country: 'Sierra Leone', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?232|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +232 or 0 followed by 8 digits' } },
    'Slovakia': { country: 'Slovakia', idFormats: [{ pattern: /^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits' }], phoneFormat: { pattern: /^(\+?421|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +421 or 0 followed by 8-9 digits' } },
    'Slovenia': { country: 'Slovenia', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?386|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +386 or 0 followed by 8 digits' } },
    'Solomon Islands': { country: 'Solomon Islands', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?677)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +677 followed by 7 digits' } },
    'Somalia': { country: 'Somalia', idFormats: [{ pattern: /^\d{7}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 7 or 10 digits' }], phoneFormat: { pattern: /^(\+?252)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +252 followed by 8 digits' } },
    'South Sudan': { country: 'South Sudan', idFormats: [{ pattern: /^\d{9}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9-10 digits' }], phoneFormat: { pattern: /^(\+?211)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +211 followed by 8-9 digits' } },
    'Spain': { country: 'Spain', idFormats: [{ pattern: /^[0-9]{8}[A-Z]$|^[KLM][0-9]{7}[A-Z]$/i, errorMessage: 'Invalid ID format', hint: 'ID: 8 digits + letter' }], phoneFormat: { pattern: /^(\+?34|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +34 or 0 followed by 9 digits' } },
    'Sri Lanka': { country: 'Sri Lanka', idFormats: [{ pattern: /^\d{10}$|^\d{9}[A-Z]$/i, errorMessage: 'Invalid ID format', hint: 'ID: 10 digits or 9 digits + letter' }], phoneFormat: { pattern: /^(\+?94|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +94 or 0 followed by 9 digits' } },
    'Sudan': { country: 'Sudan', idFormats: [{ pattern: /^\d{9}$|^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 or 13 digits' }], phoneFormat: { pattern: /^(\+?249|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +249 or 0 followed by 8-9 digits' } },
    'Suriname': { country: 'Suriname', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?597)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +597 followed by 7 digits' } },
    'Sweden': { country: 'Sweden', idFormats: [{ pattern: /^\d{12}$|^\d{10}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 12 digits' }], phoneFormat: { pattern: /^(\+?46|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +46 or 0 followed by 8-9 digits' } },
    'Syria': { country: 'Syria', idFormats: [{ pattern: /^\d{10}$|^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10-11 digits' }], phoneFormat: { pattern: /^(\+?963|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +963 or 0 followed by 9 digits' } },
    'Taiwan': { country: 'Taiwan', idFormats: [{ pattern: /^[A-Z][0-9]{9}$/i, errorMessage: 'Invalid Taiwan ID format', hint: 'Taiwan ID: 1 letter followed by 9 digits (e.g., A123456789)' }], phoneFormat: { pattern: /^(\+?886|0)[0-9]{9}$/, errorMessage: 'Invalid phone format for Taiwan', hint: 'Taiwan Phone: +886 or 0 followed by 9 digits' } },
    'Tajikistan': { country: 'Tajikistan', idFormats: [{ pattern: /^\d{10}$|^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 12 digits' }], phoneFormat: { pattern: /^(\+?992|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +992 or 0 followed by 8-9 digits' } },
    'Thailand': { country: 'Thailand', idFormats: [{ pattern: /^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 13 digits' }], phoneFormat: { pattern: /^(\+?66|0)[0-9]{8,9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +66 or 0 followed by 8-9 digits' } },
    'Timor-Leste': { country: 'Timor-Leste', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?670)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +670 followed by 7 digits' } },
    'Togo': { country: 'Togo', idFormats: [{ pattern: /^[A-Z]{2}\d{8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: 2 letters + 8 digits' }], phoneFormat: { pattern: /^(\+?228)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +228 followed by 8 digits' } },
    'Tonga': { country: 'Tonga', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?676)[0-9]{5,7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +676 followed by 5-7 digits' } },
    'Trinidad and Tobago': { country: 'Trinidad and Tobago', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?1868)[0-9]{7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +1868 followed by 7 digits' } },
    'Tunisia': { country: 'Tunisia', idFormats: [{ pattern: /^\d{8}$|^\d{13}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 13 digits' }], phoneFormat: { pattern: /^(\+?216)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +216 followed by 8 digits' } },
    'Turkey': { country: 'Turkey', idFormats: [{ pattern: /^\d{11}$/, errorMessage: 'Invalid ID format', hint: 'ID: 11 digits' }], phoneFormat: { pattern: /^(\+?90|0)[0-9]{10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +90 or 0 followed by 10 digits' } },
    'Turkmenistan': { country: 'Turkmenistan', idFormats: [{ pattern: /^\d{8}$|^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 8 or 12 digits' }], phoneFormat: { pattern: /^(\+?993|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +993 or 0 followed by 8 digits' } },
    'Tuvalu': { country: 'Tuvalu', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?688)[0-9]{5}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +688 followed by 5 digits' } },
    'Ukraine': { country: 'Ukraine', idFormats: [{ pattern: /^\d{10}$|^\d{12}$/, errorMessage: 'Invalid ID format', hint: 'ID: 10 or 12 digits' }], phoneFormat: { pattern: /^(\+?380|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +380 or 0 followed by 9 digits' } },
    'Uruguay': { country: 'Uruguay', idFormats: [{ pattern: /^\d{6,8}$/,errorMessage: 'Invalid ID format', hint: 'ID: 6-8 digits' }], phoneFormat: { pattern: /^(\+?598|0)[0-9]{8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +598 or 0 followed by 8 digits' } },
    'Uzbekistan': { country: 'Uzbekistan', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?998|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +998 or 0 followed by 9 digits' } },
    'Vanuatu': { country: 'Vanuatu', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?678)[0-9]{5,7}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +678 followed by 5-7 digits' } },
    'Vatican City': { country: 'Vatican City', idFormats: [{ pattern: /^.{5,20}$/, errorMessage: 'Invalid ID format', hint: 'ID: 5-20 characters' }], phoneFormat: { pattern: /^(\+?379)[0-9]{6,8}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +379 followed by 6-8 digits' } },
    'Venezuela': { country: 'Venezuela', idFormats: [{ pattern: /^[A-Z]{1}\d{8}$|^[EV]\-\d{6,8}$/i, errorMessage: 'Invalid ID format', hint: 'ID: Letter + 8 digits or formatted' }], phoneFormat: { pattern: /^(\+?58|0)[0-9]{10}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +58 or 0 followed by 10 digits' } },
    'Vietnam': { country: 'Vietnam', idFormats: [{ pattern: /^\d{9}$|^\d{12}$|^\d{15}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9, 12, or 15 digits' }], phoneFormat: { pattern: /^(\+?84|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +84 or 0 followed by 9 digits' } },
    'Yemen': { country: 'Yemen', idFormats: [{ pattern: /^\d{9}$/, errorMessage: 'Invalid ID format', hint: 'ID: 9 digits' }], phoneFormat: { pattern: /^(\+?967|0)[0-9]{9}$/, errorMessage: 'Invalid phone format', hint: 'Phone: +967 or 0 followed by 9 digits' } },
    // Other
    'Other': {
      country: 'Other',
      idFormats: [
        {
          pattern: /^.{5,20}$/,
          errorMessage: 'Invalid ID format',
          hint: 'ID: 5-20 characters'
        }
      ],
      phoneFormat: {
        pattern: /^(\+?)[0-9]{6,15}$/,
        errorMessage: 'Invalid phone format',
        hint: 'Phone: Country code (optional) followed by 6-15 digits'
      }
    }
  };

  constructor() { }

  /**
   * Get validation rules for a specific country
   */
  getCountryValidation(country: string): CountryValidation | null {
    return this.countryValidationRules[country] || null;
  }

  /**
   * Validate national ID based on country
   */
  validateNationalId(idNumber: string, country: string): { valid: boolean; error?: string; hint?: string } {
    const validation = this.getCountryValidation(country);
    
    if (!validation) {
      return { valid: true }; // No validation rules for this country
    }

    if (!idNumber || idNumber.trim() === '') {
      return { valid: false, error: 'ID number is required' };
    }

    // Check against all accepted formats
    for (const format of validation.idFormats) {
      if (format.pattern.test(idNumber)) {
        return { valid: true };
      }
    }

    // If no format matches, return error with hint
    return {
      valid: false,
      error: validation.idFormats[0].errorMessage,
      hint: validation.idFormats[0].hint
    };
  }

  /**
   * Validate phone number based on country
   */
  validatePhoneNumber(phoneNumber: string, country: string): { valid: boolean; error?: string; hint?: string } {
    const validation = this.getCountryValidation(country);
    
    if (!validation) {
      return { valid: true }; // No validation rules for this country
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      return { valid: false, error: 'Phone number is required' };
    }

    const cleanPhone = String(phoneNumber).trim();
    
    if (validation.phoneFormat.pattern.test(cleanPhone)) {
      return { valid: true };
    }

    return {
      valid: false,
      error: validation.phoneFormat.errorMessage,
      hint: validation.phoneFormat.hint
    };
  }

  /**
   * Create a validator function for national ID based on country
   */
  nationalIdValidator(countryControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const country = countryControl?.value;
      if (!country) {
        return null;
      }

      const result = this.validateNationalId(control.value, country);
      
      if (!result.valid) {
        return { invalidNationalId: { message: result.error, hint: result.hint } };
      }
      
      return null;
    };
  }

  /**
   * Create a validator function for phone number based on country
   */
  phoneValidator(countryControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const country = countryControl?.value;
      if (!country) {
        return null;
      }

      const result = this.validatePhoneNumber(control.value, country);
      
      if (!result.valid) {
        return { invalidPhone: { message: result.error, hint: result.hint } };
      }
      
      return null;
    };
  }

  /**
   * Get all supported countries
   */
  getSupportedCountries(): string[] {
    return Object.keys(this.countryValidationRules);
  }

  /**
   * Get hint text for a country's ID format
   */
  getIdFormatHint(country: string): string {
    const validation = this.getCountryValidation(country);
    if (!validation || validation.idFormats.length === 0) {
      return '';
    }
    return validation.idFormats.map(f => f.hint).join(' or ');
  }

  /**
   * Get hint text for a country's phone format
   */
  getPhoneFormatHint(country: string): string {
    const validation = this.getCountryValidation(country);
    return validation?.phoneFormat.hint || '';
  }
}
