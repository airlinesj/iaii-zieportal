/**
 * MembershipFeeService
 * Handles membership fees, grade progression validation, and fee breakdowns
 */

// Membership grades hierarchy
export enum MembershipGrade {
  STUDENT = 'Student',
  TECHNICIAN = 'Technician',
  TECHNOLOGIST = 'Technologist',
  FULL_MEMBER = 'Full Member',
  FELLOW = 'Fellow',
  PROFESSIONAL = 'Professional Member',
}

// Track definitions - engineer vs technologist/technician
export enum ProfessionalTrack {
  ENGINEER = 'Engineer',           // Professional Member, Full Member, Fellow
  TECHNOLOGIST = 'Technologist',   // Technologist, Technician
}

/**
 * EXPATRIATE FEES - USD
 * Breakdown by membership grade
 * Note: Only Professional, Technologist, and Technician grades have expatriate fees
 */
export const EXPATRIATE_FEES: Record<string, { name: string; fees: { zieApplicationFee: number; zieSubscription: number; eczRegistration: number; eczLicense: number }; total: number }> = {
  [MembershipGrade.PROFESSIONAL]: {
    name: 'Professional Engineer',
    fees: {
      zieApplicationFee: 300,
      zieSubscription: 600,
      eczRegistration: 300,
      eczLicense: 250,
    },
    total: 1450,
  },
  [MembershipGrade.TECHNOLOGIST]: {
    name: 'Engineering Technologist',
    fees: {
      zieApplicationFee: 300,
      zieSubscription: 450,
      eczRegistration: 250,
      eczLicense: 200,
    },
    total: 1200,
  },
  [MembershipGrade.TECHNICIAN]: {
    name: 'Engineering Technician',
    fees: {
      zieApplicationFee: 300,
      zieSubscription: 450,
      eczRegistration: 250,
      eczLicense: 150,
    },
    total: 900,
  },
};

/**
 * Determine the professional track based on membership grade
 */
export function getTrack(grade: string): ProfessionalTrack | null {
  if (
    grade === MembershipGrade.PROFESSIONAL ||
    grade === MembershipGrade.FULL_MEMBER ||
    grade === MembershipGrade.FELLOW
  ) {
    return ProfessionalTrack.ENGINEER;
  }

  if (
    grade === MembershipGrade.TECHNOLOGIST ||
    grade === MembershipGrade.TECHNICIAN
  ) {
    return ProfessionalTrack.TECHNOLOGIST;
  }

  return null;
}

/**
 * Grade progression validation
 * Returns true if progression is valid, false otherwise
 *
 * Rules:
 * - Professional Members cannot apply for Full Member or Fellow
 * - Technologists cannot apply for Engineer track (Full Member/Fellow)
 * - Technicians cannot apply for Technologist (must go through proper progression)
 */
export function validateGradeProgression(
  currentGrade: string | null,
  targetGrade: string
): { valid: boolean; reason?: string } {
  // If no current grade, it's a new applicant (valid)
  if (!currentGrade) {
    console.log(
      `✓ validateGradeProgression - New applicant applying for: ${targetGrade}`
    );
    return { valid: true };
  }

  console.log(`\n=== validateGradeProgression ===`);
  console.log(`Current Grade: ${currentGrade}`);
  console.log(`Target Grade: ${targetGrade}`);

  // Rule 1: Professional Members cannot downgrade or laterally move
  if (currentGrade === MembershipGrade.PROFESSIONAL) {
    if (
      targetGrade === MembershipGrade.FULL_MEMBER ||
      targetGrade === MembershipGrade.FELLOW
    ) {
      const reason =
        'Professional Members cannot apply for Full Member or Fellow. You retain your Professional Member status.';
      console.warn(`❌ INVALID: ${reason}`);
      return { valid: false, reason };
    }
  }

  // Rule 2: Enforce track separation
  const currentTrack = getTrack(currentGrade);
  const targetTrack = getTrack(targetGrade);

  if (
    currentTrack === ProfessionalTrack.TECHNOLOGIST &&
    targetTrack === ProfessionalTrack.ENGINEER
  ) {
    const reason =
      'Technologists cannot apply for Engineer track (Full Member/Fellow). These are separate professional paths.';
    console.warn(`❌ INVALID: ${reason}`);
    return { valid: false, reason };
  }

  // Rule 3: Technicians cannot jump to Technologist
  // (they would need to reapply or follow proper progression)
  if (
    currentGrade === MembershipGrade.TECHNICIAN &&
    targetGrade === MembershipGrade.TECHNOLOGIST
  ) {
    const reason =
      'Technicians must follow the proper progression pathway. Please contact admin for guidance.';
    console.warn(`❌ INVALID: ${reason}`);
    return { valid: false, reason };
  }

  // Rule 4: Cannot apply for same grade
  if (currentGrade === targetGrade) {
    const reason = `You are already a ${currentGrade}.`;
    console.warn(`❌ INVALID: ${reason}`);
    return { valid: false, reason };
  }

  console.log(`✓ VALID: Grade progression allowed`);
  return { valid: true };
}

/**
 * Get detailed fee breakdown for expatriate applicants
 *
 * @param selectedGrade The membership grade being applied for
 * @param applicationType Should be 'expatriate'
 * @returns Fee breakdown object or null if not applicable
 */
export function getFeeBreakdown(
  selectedGrade: string,
  applicationType: string
): {
  isExpatriate: boolean;
  grade: string;
  gradeName: string;
  fees: {
    zieApplicationFee: number;
    zieSubscription: number;
    eczRegistration: number;
    eczLicense: number;
  };
  total: number;
  currency: string;
} | null {
  // Only expatriates have these fees
  if (applicationType !== 'expatriate') {
    console.log(
      `✓ getFeeBreakdown - Not an expatriate application, local fees apply`
    );
    return null;
  }

  if (!EXPATRIATE_FEES[selectedGrade]) {
    console.warn(
      `⚠ getFeeBreakdown - Unknown grade for expatriate fees: ${selectedGrade}`
    );
    return null;
  }

  const feeData = EXPATRIATE_FEES[selectedGrade];

  const breakdown = {
    isExpatriate: true,
    grade: selectedGrade,
    gradeName: feeData.name,
    fees: feeData.fees,
    total: feeData.total,
    currency: 'USD',
  };

  console.log(`✓ getFeeBreakdown - Expatriate fees for ${selectedGrade}:`, breakdown);
  return breakdown;
}

/**
 * Get all available grades for dropdown/selection
 */
export function getAvailableGrades(): string[] {
  return Object.values(MembershipGrade);
}

/**
 * Get professional track description
 */
export function getTrackDescription(track: ProfessionalTrack): string {
  const descriptions: Record<ProfessionalTrack, string> = {
    [ProfessionalTrack.ENGINEER]:
      'Engineer Track: Professional Member, Full Member, Fellow',
    [ProfessionalTrack.TECHNOLOGIST]:
      'Technologist Track: Technologist, Technician',
  };
  return descriptions[track] || 'Unknown Track';
}

/**
 * Validate if a gradeChange is possible for a user
 * More comprehensive check including current membership status
 */
export function canApplyForGrade(
  currentGrade: string | null,
  targetGrade: string,
  applicationType: string
): { canApply: boolean; message: string } {
  // First validate grade progression
  const progressionCheck = validateGradeProgression(currentGrade, targetGrade);
  if (!progressionCheck.valid) {
    return {
      canApply: false,
      message: progressionCheck.reason || 'Grade progression invalid',
    };
  }

  // For expatriates, ensure fees are defined
  if (applicationType === 'expatriate') {
    if (!EXPATRIATE_FEES[targetGrade as MembershipGrade]) {
      return {
        canApply: false,
        message: `Expatriate fees not defined for ${targetGrade}`,
      };
    }
  }

  return {
    canApply: true,
    message: `You can apply for ${targetGrade}`,
  };
}

export default {
  MembershipGrade,
  ProfessionalTrack,
  EXPATRIATE_FEES,
  getTrack,
  validateGradeProgression,
  getFeeBreakdown,
  getAvailableGrades,
  getTrackDescription,
  canApplyForGrade,
};
