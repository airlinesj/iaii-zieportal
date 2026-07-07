/**
 * Frontend CPD Fee Service
 * Mirrors backend CpdPaymentService for fee calculations on the client side
 */

export enum ApplicationType {
  LOCAL = 'local',
  EXPATRIATE = 'expatriate',
}

// Fee structure for CPD accreditation
export const CPD_BASE_FEES = {
  LOCAL: {
    currency: 'ZWL',
    baseApplicationFee: 500,
    trainingModeMultiplier: {
      sandwich: 0.5,
      undergraduate: 0.75,
      postgraduate: 1.0,
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
      HS: 100,
      CS: 100,
      IAM: 100,
    },
  },
  EXPATRIATE: {
    currency: 'USD',
    baseApplicationFee: 150,
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

  // Determine highest training mode multiplier
  let trainingModeMultiplier = 0.5;
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
  zwlCost?: number;
  interbankRate?: number;
  currencyPair?: string;
}

/**
 * Calculate CPD fee based on course duration
 * @param durationDays - Number of days for the course
 * @returns The duration category, label, and USD fee amount
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
    zwlCost,
    interbankRate,
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
  return `${symbol} ${amount.toFixed(2)}`;
}

/**
 * Get payment status badge
 */
export function getPaymentStatusBadge(paymentStatus: string): { text: string; class: string } {
  const statusMap: Record<string, { text: string; class: string }> = {
    pending: { text: 'Pending Payment', class: 'status-pending' },
    initiated: { text: 'Payment In Progress', class: 'status-initiated' },
    completed: { text: 'Payment Completed', class: 'status-completed' },
    failed: { text: 'Payment Failed', class: 'status-failed' },
    cancelled: { text: 'Payment Cancelled', class: 'status-cancelled' },
  };
  return statusMap[paymentStatus] || { text: 'Unknown', class: 'status-unknown' };
}

/**
 * Get approval status badge
 */
export function getApprovalStatusBadge(approvalStatus: string): { text: string; class: string } {
  const statusMap: Record<string, { text: string; class: string }> = {
    pending: { text: 'Awaiting Review', class: 'status-pending' },
    approved: { text: 'Approved', class: 'status-approved' },
    rejected: { text: 'Rejected', class: 'status-rejected' },
  };
  return statusMap[approvalStatus] || { text: 'Unknown', class: 'status-unknown' };
}
