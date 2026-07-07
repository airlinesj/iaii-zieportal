import { Application } from '../models/Application';

/**
 * Service to generate ZIE Professional Registration Numbers
 * Format: ZIE + YYYY + 4-digit increment (e.g., ZIE20260001, ZIE20260002)
 */
class RegistrationNumberService {
  /**
   * Generate a unique ZIE Registration Number
   * @returns Promise<string> - Registration number in format ZIE+YYYY+4digit
   */
  async generateZIERegistrationNumber(): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    const registrationPrefix = `^ZIE${currentYear}`;

    try {
      // Find the last entry with current year's registration number
      const lastEntry = await Application.findOne({
        registrationNumber: new RegExp(registrationPrefix),
      })
        .sort({ registrationNumber: -1 })
        .lean();

      let newSequence = '0001';

      if (lastEntry && lastEntry.registrationNumber) {
        // Extract the 4-digit sequence from the last entry (skip 'ZIE' prefix and year)
        const lastSequence = parseInt(lastEntry.registrationNumber.substring(7));
        newSequence = (lastSequence + 1).toString().padStart(4, '0');
      }

      const newRegistrationNumber = 'ZIE' + currentYear + newSequence;
      return newRegistrationNumber;
    } catch (error) {
      console.error('Error generating registration number:', error);
      throw new Error('Failed to generate registration number');
    }
  }

  /**
   * Validate if a registration number exists and belongs to an applicant
   * @param registrationNumber - The registration number to validate
   * @returns Promise<boolean> - True if valid and exists
   */
  async validateRegistrationNumber(registrationNumber: string): Promise<boolean> {
    try {
      const entry = await Application.findOne({ registrationNumber }).lean();
      return !!entry;
    } catch (error) {
      console.error('Error validating registration number:', error);
      return false;
    }
  }

  /**
   * Get certificate data for a passed interview applicant
   * @param applicationId - The application ID
   * @returns Promise - Certificate data or null
   */
  async getCertificateData(applicationId: string): Promise<any> {
    try {
      const application = await Application.findById(applicationId).lean();

      if (!application) {
        return null;
      }

      // Only return certificate data if status is "Passed"
      if (application.status !== 'Passed' || !application.registrationNumber) {
        return null;
      }

      return {
        applicantName: `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        registrationNumber: application.registrationNumber,
        grade: application.chosenGrade,
        division: application.chosenSpecialistDivision,
        interviewPassedDate: application.interviewPassedDate,
        issuedDate: application.interviewPassedDate,
      };
    } catch (error) {
      console.error('Error getting certificate data:', error);
      return null;
    }
  }
}

export default new RegistrationNumberService();
