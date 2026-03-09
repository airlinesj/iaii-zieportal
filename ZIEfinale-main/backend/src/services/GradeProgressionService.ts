import { User, IUser } from '../models/User';
import { Application } from '../models/Application';
import mongoose from 'mongoose';

/**
 * Service to manage and validate membership grade progression
 * Enforces rules like:
 * - Can't apply for a lower grade than currently assigned
 * - Must progress through grades (e.g., Technician -> Technologist -> Member)
 * - First admission must be as Technician
 */
class GradeProgressionService {
  /**
   * Grade hierarchy for progression validation
   * Lower index = lower tier, can only progress upward
   */
  private static readonly GRADE_HIERARCHY: Record<string, number> = {
    'Technician': 1,
    'Technologist': 2,
    'Member': 3,
    'Fellow': 4,
  };

  /**
   * Validate if a user can apply for a specific grade
   * @param user - The user applying
   * @param requestedGrade - The grade they are applying for
   * @returns Object with validation result and error message if invalid
   */
  static validateGradeApplication(user: IUser, requestedGrade: string): { isValid: boolean; error?: string } {
    // If user has no current grade, they can only apply for Technician (entry level)
    if (!user.currentMembershipGrade) {
      if (requestedGrade !== 'Technician') {
        return {
          isValid: false,
          error: `First membership application must be for 'Technician' grade. You cannot apply directly for '${requestedGrade}'.`,
        };
      }
      return { isValid: true };
    }

    // If user already has a grade, validate progression
    const currentGradeLevel = this.GRADE_HIERARCHY[user.currentMembershipGrade];
    const requestedGradeLevel = this.GRADE_HIERARCHY[requestedGrade];

    if (!currentGradeLevel || !requestedGradeLevel) {
      return {
        isValid: false,
        error: 'Invalid grade specified',
      };
    }

    // Can't apply for same or lower grade
    if (requestedGradeLevel <= currentGradeLevel) {
      return {
        isValid: false,
        error: `You currently hold '${user.currentMembershipGrade}' grade and cannot apply for '${requestedGrade}'. You can only progress to higher grades.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Assign a grade to a user after successful application approval
   * @param userId - User ID to assign grade to
   * @param grade - Grade to assign
   * @param division - Division/specialty (optional)
   * @param applicationId - The application that resulted in this grade
   * @param adminId - Admin ID who confirmed the admission
   * @param adminEmail - Admin email for audit trail
   * @param registrationNumber - ZIE registration number
   * @returns Updated user document
   */
  static async assignGradeToUser(
    userId: string | mongoose.Types.ObjectId,
    grade: 'Technician' | 'Technologist' | 'Member' | 'Fellow',
    division: string,
    applicationId: string | mongoose.Types.ObjectId,
    adminId: string | mongoose.Types.ObjectId,
    adminEmail: string,
    registrationNumber?: string
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update current membership info
    user.currentMembershipGrade = grade;
    user.currentMembershipDivision = division;
    user.membershipStatus = 'member';
    
    // Update role and classification to reflect member status
    user.role = 'Member';
    user.accountType = 'member';
    user.userClassification = user.applicationType === 'expatriate' 
      ? ('member' as any) 
      : ('member' as any);

    // Add to progression history
    user.gradeProgressionHistory.push({
      grade,
      division,
      assignedAt: new Date(),
      assignedBy: adminId as mongoose.Types.ObjectId,
      assignedByEmail: adminEmail,
      applicationId: applicationId as mongoose.Types.ObjectId,
      registrationNumber,
    });

    await user.save();
    return user;
  }

  /**
   * Get the grade progression history for a user
   * @param userId - User ID
   * @returns Array of grade progression records
   */
  static async getGradeProgressionHistory(userId: string | mongoose.Types.ObjectId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.gradeProgressionHistory;
  }

  /**
   * Check if user has been through a specific grade before
   * @param userId - User ID
   * @param grade - Grade to check
   * @returns True if user has been assigned this grade in the past
   */
  static async hasBeenGrade(userId: string | mongoose.Types.ObjectId, grade: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    return user.gradeProgressionHistory.some(record => record.grade === grade);
  }

  /**
   * Get the current membership status of a user
   * @param userId - User ID
   * @returns Object with current grade, division, and status
   */
  static async getCurrentMembershipStatus(userId: string | mongoose.Types.ObjectId) {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    return {
      membershipStatus: user.membershipStatus,
      currentGrade: user.currentMembershipGrade,
      currentDivision: user.currentMembershipDivision,
      progressionHistory: user.gradeProgressionHistory,
      isActiveMember: user.membershipStatus === 'member',
    };
  }

  /**
   * Validate grade progression from application data
   * Uses the existing application's chosenGrade field to validate
   */
  static validateApplicationGradeProgression(
    user: IUser,
    chosenGrade: string
  ): { isValid: boolean; error?: string } {
    return this.validateGradeApplication(user, chosenGrade);
  }
}

export default GradeProgressionService;
