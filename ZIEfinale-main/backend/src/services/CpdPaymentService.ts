/**
 * CPD Payment Service
 * Handles CPD application payment calculations and fee breakdowns
 * Supports both local (ZWL) and expatriate (USD) applicants
 */

export enum ApplicationType {
  LOCAL = 'local',
  EXPATRIATE = 'expatriate',
}

// Fee structure for CPD accreditation
// Fees are based on training mode and elements selected
export const CPD_BASE_FEES = {
  LOCAL: {
    currency: 'ZWL',
    baseApplicationFee: 500, // Base application processing fee
    trainingModeMultiplier: {
      sandwich: 0.5, // 50% multiplier for sandwich programs
      undergraduate: 0.75, // 75% multiplier for undergraduate
      postgraduate: 1.0, // 100% multiplier for postgraduate
    },
    trainingElementFees: {
      A: 200,
      B: 200,
      C1: 150,
      C2: 150,
      C3: 150,
      C4: 150,
      C5: 150,
      C6: 150,
      C7: 150,
      C8: 150,
      HS: 100, // Health & Safety
      CS: 100, // Communication Skills
      IAM: 100, // Information & Assessment Methods
    },
  },
  EXPATRIATE: {
    currency: 'USD',
    baseApplicationFee: 150, // Base application processing fee in USD
    trainingModeMultiplier: {
      sandwich: 0.5,
      undergraduate: 0.75,
      postgraduate: 1.0,
    },
    trainingElementFees: {
      A: 50,
      B: 50,
      C1: 40,
      C2: 40,
      C3: 40,
      C4: 40,
      C5: 40,
      C6: 40,
      C7: 40,
      C8: 40,
      HS: 30,
      CS: 30,
      IAM: 30,
    },
  },
};

export interface CpdFeeBreakdown {
  applicationType: 'local' | 'expatriate';
  currency: string;
  baseApplicationFee: number;
  trainingModeMultiplier: number;
  selectedTrainingModes: string[];
  trainingElementsFees: { [key: string]: number };
  subtotal: number;
  total: number;
}

/**
 * Calculate CPD application fee based on training mode, elements, and applicant type
 */
export function calculateCpdFee(
  trainingMode: { sandwich: boolean; undergraduate: boolean; postgraduate: boolean },
  trainingElements: { [key: string]: boolean },
  applicationType: 'local' | 'expatriate' = 'local'
): number {
  const feeConfig = applicationType === 'expatriate' ? CPD_BASE_FEES.EXPATRIATE : CPD_BASE_FEES.LOCAL;

  // Determine highest training mode multiplier (in case multiple are selected)
  let trainingModeMultiplier = 0.5; // Default to sandwich
  if (trainingMode.postgraduate) {
    trainingModeMultiplier = 1.0;
  } else if (trainingMode.undergraduate) {
    trainingModeMultiplier = 0.75;
  }

  // Calculate training mode cost
  const trainingModeCost = feeConfig.baseApplicationFee * trainingModeMultiplier;

  // Calculate training elements cost
  let elementsCost = 0;
  for (const [element, selected] of Object.entries(trainingElements)) {
    if (selected) {
      elementsCost += feeConfig.trainingElementFees[element as keyof typeof feeConfig.trainingElementFees] || 0;
    }
  }

  // Total fee
  return Math.round((trainingModeCost + elementsCost) * 100) / 100;
}

/**
 * Get detailed fee breakdown for CPD application
 */
export function getCpdFeeBreakdown(
  trainingMode: { sandwich: boolean; undergraduate: boolean; postgraduate: boolean },
  trainingElements: { [key: string]: boolean },
  applicationType: 'local' | 'expatriate' = 'local'
): CpdFeeBreakdown {
  const feeConfig = applicationType === 'expatriate' ? CPD_BASE_FEES.EXPATRIATE : CPD_BASE_FEES.LOCAL;

  // Determine training mode multiplier
  let trainingModeMultiplier = 0.5;
  const selectedTrainingModes: string[] = [];

  if (trainingMode.sandwich) selectedTrainingModes.push('Sandwich');
  if (trainingMode.undergraduate) selectedTrainingModes.push('Undergraduate');
  if (trainingMode.postgraduate) selectedTrainingModes.push('Postgraduate');

  if (trainingMode.postgraduate) {
    trainingModeMultiplier = 1.0;
  } else if (trainingMode.undergraduate) {
    trainingModeMultiplier = 0.75;
  }

  // Calculate costs
  const baseApplicationFee = feeConfig.baseApplicationFee;
  const trainingModeCost = baseApplicationFee * trainingModeMultiplier;

  const trainingElementsFees: { [key: string]: number } = {};
  let elementsCost = 0;

  for (const [element, selected] of Object.entries(trainingElements)) {
    if (selected) {
      const fee = feeConfig.trainingElementFees[element as keyof typeof feeConfig.trainingElementFees] || 0;
      trainingElementsFees[element] = fee;
      elementsCost += fee;
    }
  }

  const subtotal = trainingModeCost + elementsCost;
  const total = Math.round(subtotal * 100) / 100;

  return {
    applicationType,
    currency: feeConfig.currency,
    baseApplicationFee,
    trainingModeMultiplier,
    selectedTrainingModes,
    trainingElementsFees,
    subtotal,
    total,
  };
}

/**
 * Validate if fee calculation is reasonable
 */
export function validateFeeAmount(amount: number, applicationType: 'local' | 'expatriate'): {
  valid: boolean;
  reason?: string;
} {
  const feeConfig = applicationType === 'expatriate' ? CPD_BASE_FEES.EXPATRIATE : CPD_BASE_FEES.LOCAL;

  // Minimum fee should be base application fee
  const minFee = feeConfig.baseApplicationFee;
  // Maximum fee should be base + all elements at max multiplier
  const maxElementsCost = Object.values(feeConfig.trainingElementFees).reduce((a, b) => a + b, 0);
  const maxFee = minFee * 1.0 + maxElementsCost; // Using postgraduate multiplier (1.0)

  if (amount < minFee) {
    return {
      valid: false,
      reason: `Fee amount ${amount} is below minimum (${minFee})`,
    };
  }

  if (amount > maxFee) {
    return {
      valid: false,
      reason: `Fee amount ${amount} exceeds maximum (${maxFee})`,
    };
  }

  return { valid: true };
}

/**
 * Get currency symbol based on applicant type
 */
export function getCurrencySymbol(applicationType: 'local' | 'expatriate'): string {
  return applicationType === 'expatriate' ? '$' : 'ZWL';
}

/**
 * Format currency amount for display
 */
export function formatCpdAmount(amount: number, applicationType: 'local' | 'expatriate'): string {
  const symbol = getCurrencySymbol(applicationType);
  const feeConfig = applicationType === 'expatriate' ? CPD_BASE_FEES.EXPATRIATE : CPD_BASE_FEES.LOCAL;
  return `${symbol} ${amount.toFixed(2)}`;
}

// ============================================
// CPD DURATION-BASED FEE STRUCTURE
// ============================================

/**
 * Fee structure based on course duration
 * All base fees are in USD
 */
export const CPD_DURATION_FEES = {
  'halfDay': {
    label: 'Half day course',
    usdFee: 40.00,
  },
  'fullDay': {
    label: 'Full day course',
    usdFee: 75.00,
  },
  'twoDay': {
    label: 'Two-day course',
    usdFee: 100.00,
  },
  'threeSeven': {
    label: 'Three to seven-day course',
    usdFee: 125.00,
  },
  'moreSeven': {
    label: 'More than seven days',
    usdFee: 200.00,
  },
};

export interface CpdDurationFeeResult {
  durationCategory: string;
  durationLabel: string;
  usdCost: number;
  interbankRate: number;
  zwlCost: number;
  currencyPair: string; // e.g., "USD/ZWL"
}

/**
 * Calculate CPD fee based on course duration
 * @param durationDays - Number of days for the course
 * @returns The duration category and USD fee amount
 */
export function calculateCpdDurationFeeUsd(durationDays: number): {
  category: string;
  label: string;
  usdFee: number;
} {
  const days = parseFloat(durationDays.toString());

  if (isNaN(days) || days <= 0) {
    throw new Error('Course duration must be a positive number');
  }

  let category: string;
  let feeData;

  if (days < 1) {
    category = 'halfDay';
    feeData = CPD_DURATION_FEES.halfDay;
  } else if (days === 1) {
    category = 'fullDay';
    feeData = CPD_DURATION_FEES.fullDay;
  } else if (days === 2) {
    category = 'twoDay';
    feeData = CPD_DURATION_FEES.twoDay;
  } else if (days >= 3 && days <= 7) {
    category = 'threeSeven';
    feeData = CPD_DURATION_FEES.threeSeven;
  } else {
    category = 'moreSeven';
    feeData = CPD_DURATION_FEES.moreSeven;
  }

  return {
    category,
    label: feeData.label,
    usdFee: feeData.usdFee,
  };
}

/**
 * Convert USD cost to local currency (ZWL) using interbank rate
 * @param usdCost - Amount in USD
 * @param interbankRate - Current interbank exchange rate (ZWL per USD)
 * @returns Amount in local currency
 */
export function convertUsdToLocalCurrency(usdCost: number, interbankRate: number): number {
  if (isNaN(usdCost) || usdCost < 0) {
    throw new Error('USD cost must be a non-negative number');
  }
  if (isNaN(interbankRate) || interbankRate <= 0) {
    throw new Error('Interbank rate must be a positive number');
  }

  const localCost = usdCost * interbankRate;
  return Math.round(localCost * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate CPD fee in both USD and local currency (ZWL)
 * @param durationDays - Number of days for the course
 * @param interbankRate - Current interbank exchange rate (ZWL per USD)
 * @returns Object containing duration category, USD cost, and local currency cost
 */
export function calculateCpdDurationFeeWithConversion(
  durationDays: number,
  interbankRate: number
): CpdDurationFeeResult {
  // Calculate USD fee based on duration
  const { category, label, usdFee } = calculateCpdDurationFeeUsd(durationDays);

  // Convert to local currency
  const zwlCost = convertUsdToLocalCurrency(usdFee, interbankRate);

  return {
    durationCategory: category,
    durationLabel: label,
    usdCost: usdFee,
    interbankRate,
    zwlCost,
    currencyPair: 'USD/ZWL',
  };
}

/**
 * Get all available duration-based fee options
 * @returns Array of duration fee options with their labels and USD amounts
 */
export function getCpdDurationFeeOptions(): Array<{
  key: string;
  label: string;
  usdFee: number;
}> {
  return Object.entries(CPD_DURATION_FEES).map(([key, data]) => ({
    key,
    label: data.label,
    usdFee: data.usdFee,
  }));
}
