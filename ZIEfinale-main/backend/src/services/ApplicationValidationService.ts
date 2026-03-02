import { Application } from '../models/Application';

/**
 * Service to handle application duplicate submission validation
 * Prevents users from submitting multiple applications for the same or similar grades
 */
export class ApplicationValidationService {
  /**
   * Check if user already has an active application
   * Returns existing applications that would conflict with a new submission
   */
  static async checkForDuplicateSubmission(
    userId: string,
    chosenGrade: string,
    applicationType: string
  ): Promise<{ hasDuplicate: boolean; existingApplication?: any; message?: string }> {
    try {
      // Find all non-rejected applications for this user
      const existingApps = await Application.find({
        userId: userId,
        status: { $ne: 'Rejected' }
      });

      if (existingApps.length === 0) {
        return { hasDuplicate: false };
      }

      // Check if any existing application has the same grade and application type
      const exactMatch = existingApps.find(
        app => app.chosenGrade === chosenGrade && app.applicationType === applicationType
      );

      if (exactMatch) {
        return {
          hasDuplicate: true,
          existingApplication: {
            id: exactMatch._id,
            status: exactMatch.status,
            grade: exactMatch.chosenGrade,
            applicationType: exactMatch.applicationType,
            submittedAt: exactMatch.createdAt
          },
          message: `You have already submitted an application for ${chosenGrade} as a ${applicationType} applicant. Your current application status is "${exactMatch.status}". Please update your existing application instead of submitting a new one.`
        };
      }

      // Check if user has any other active applications (for different grades)
      if (existingApps.length > 0 && existingApps[0].status !== 'Rejected') {
        return {
          hasDuplicate: true,
          existingApplication: {
            id: existingApps[0]._id,
            status: existingApps[0].status,
            grade: existingApps[0].chosenGrade,
            applicationType: existingApps[0].applicationType
          },
          message: `You have an active application for ${existingApps[0].chosenGrade} grade. Would you like to apply for a different grade? If so, your current application will be temporarily closed.`
        };
      }

      return { hasDuplicate: false };
    } catch (error) {
      console.error('Error checking for duplicate submissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has a rejected application they can resubmit
   */
  static async checkForRejectedApplication(userId: string): Promise<{ hasRejected: boolean; rejectedApplication?: any }> {
    try {
      const rejectedApps = await Application.find({
        userId: userId,
        status: 'Rejected'
      }).sort({ updatedAt: -1 });

      if (rejectedApps.length === 0) {
        return { hasRejected: false };
      }

      const mostRecentRejected = rejectedApps[0];
      const allowEditUntil = mostRecentRejected.rejectionInfo?.allowEditUntil;
      const now = new Date();

      if (allowEditUntil && now <= allowEditUntil) {
        return {
          hasRejected: true,
          rejectedApplication: {
            id: mostRecentRejected._id,
            grade: mostRecentRejected.chosenGrade,
            rejectionReason: mostRecentRejected.rejectionInfo?.rejectionReason,
            allowEditUntil: allowEditUntil,
            hoursRemaining: Math.ceil((allowEditUntil.getTime() - now.getTime()) / (1000 * 60 * 60))
          }
        };
      }

      return { hasRejected: false };
    } catch (error) {
      console.error('Error checking for rejected applications:', error);
      throw error;
    }
  }

  /**
   * Get all user's application history with statuses
   */
  static async getUserApplicationHistory(userId: string): Promise<any[]> {
    try {
      const apps = await Application.find({ userId: userId })
        .select('_id status chosenGrade applicationType createdAt updatedAt personalParticulars.email')
        .sort({ createdAt: -1 });

      return apps.map(app => ({
        id: app._id,
        status: app.status,
        grade: app.chosenGrade,
        applicationType: app.applicationType,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }));
    } catch (error) {
      console.error('Error getting application history:', error);
      throw error;
    }
  }
}
