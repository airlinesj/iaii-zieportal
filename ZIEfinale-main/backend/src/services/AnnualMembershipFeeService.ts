/**
 * AnnualMembershipFeeService
 * Manages annual membership fee tracking and renewal calculations
 * Members must renew their membership annually (365 days) with reminders after 325 days
 * Fees are available in both USD and ZWG for all member types
 */

export enum MembershipGrade {
  TECHNICIAN = 'Technician',
  TECHNOLOGIST = 'Technologist',
  MEMBER = 'Member',
  FELLOW = 'Fellow',
}

/**
 * Base annual membership renewal fees (USD)
 * These are the primary fees; ZWL equivalents are calculated using current exchange rate
 */
export const BASE_ANNUAL_FEES_USD: Record<string, { name: string; fee: number }> = {
  [MembershipGrade.TECHNICIAN]: {
    name: 'Engineering Technician',
    fee: 200, // USD
  },
  [MembershipGrade.TECHNOLOGIST]: {
    name: 'Engineering Technologist',
    fee: 300, // USD
  },
  [MembershipGrade.MEMBER]: {
    name: 'Full Member / Chartered Engineer',
    fee: 500, // USD
  },
  [MembershipGrade.FELLOW]: {
    name: 'Fellow',
    fee: 750, // USD
  },
};

/**
 * Annual membership renewal fees (ZWG) - calculated from USD with ZRB exchange rate
 * Structure: { grade: { name, usdFee, zwgFee (calculated), exchangeRate } }
 */
export interface IAnnualFeeWithBothCurrencies {
  name: string;
  usdFee: number;
  zwgFee: number;
  exchangeRate: number;
}

/**
 * Get annual fees in both currencies for a specific grade
 */
export function getAnnualFeeBothCurrencies(
  grade: string,
  exchangeRate: number
): { name: string; usd: number; zwl: number; exchangeRate: number } | null {
  const baseUSD = BASE_ANNUAL_FEES_USD[grade];
  if (!baseUSD) {
    return null;
  }

  const zwlFee = Math.round(baseUSD.fee * exchangeRate * 100) / 100; // Round to 2 decimals

  return {
    name: baseUSD.name,
    usd: baseUSD.fee,
    zwl: zwlFee,
    exchangeRate,
  };
}

export interface IAnnualFeeStatus {
  isRenewalDue: boolean;
  daysUntilDue: number;
  daysOverdue: number;
  nextDueDate: Date;
  amountUSD: number;
  amountZWL: number;
  exchangeRate: number;
  grade: string;
  gradeName: string;
  message: string;
}

export interface IAnnualFeeAmount {
  grade: string;
  gradeName: string;
  amountUSD: number;
  amountZWL: number;
  exchangeRate: number;
  renewalFrequencyDays: number;
}

/**
 * Calculate the annual fee status for a member
 * Returns information about when their renewal is due in both currencies
 */
export function getAnnualFeeStatus(
  currentGrade: string | undefined,
  lastRenewalDate: Date | undefined,
  currentExchangeRate: number
): IAnnualFeeStatus | null {
  if (!currentGrade || !lastRenewalDate) {
    return null; // No fee due yet if no grade or no renewal date
  }

  const now = new Date();
  const renewalFrequencyDays = 365;
  const earlyReminderDays = 325;

  // Calculate next due date (365 days from last renewal)
  const nextDueDate = new Date(lastRenewalDate);
  nextDueDate.setDate(nextDueDate.getDate() + renewalFrequencyDays);

  // Check if overdue (past the nextDueDate)
  const isOverdue = now > nextDueDate;

  // Check if in reminder window (325-365 days)
  const daysIntoRenewalCycle = Math.floor(
    (now.getTime() - lastRenewalDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isRenewalDue = daysIntoRenewalCycle >= earlyReminderDays;

  // Get fee info in both currencies
  const feeInfo = getAnnualFeeBothCurrencies(currentGrade, currentExchangeRate);
  if (!feeInfo) {
    return null;
  }

  const daysUntilDue = Math.max(
    0,
    Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysOverdue = isOverdue
    ? Math.floor((now.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  let message = '';
  if (isOverdue) {
    message = `Your membership renewal is ${daysOverdue} days overdue. Please renew immediately to maintain your membership status.`;
  } else if (isRenewalDue) {
    message = `Your membership renewal is due in ${daysUntilDue} days. Plan your payment accordingly.`;
  }

  return {
    isRenewalDue,
    daysUntilDue,
    daysOverdue,
    nextDueDate,
    amountUSD: feeInfo.usd,
    amountZWL: feeInfo.zwl,
    exchangeRate: currentExchangeRate,
    grade: currentGrade,
    gradeName: feeInfo.name,
    message,
  };
}

/**
 * Get the annual fee amount for a specific grade in both currencies
 */
export function getAnnualFeeAmount(
  grade: string,
  currentExchangeRate: number
): IAnnualFeeAmount | null {
  const feeInfo = getAnnualFeeBothCurrencies(grade, currentExchangeRate);
  if (!feeInfo) {
    return null;
  }

  return {
    grade,
    gradeName: feeInfo.name,
    amountUSD: feeInfo.usd,
    amountZWL: feeInfo.zwl,
    exchangeRate: currentExchangeRate,
    renewalFrequencyDays: 365,
  };
}

/**
 * Calculate when the next renewal is due based on a payment date
 * Used when recording a payment or grade change
 */
export function calculateNextRenewalDate(fromDate: Date): Date {
  const nextRenewal = new Date(fromDate);
  nextRenewal.setDate(nextRenewal.getDate() + 365);
  return nextRenewal;
}

/**
 * Reset the renewal date when a grade change occurs
 * The new annual fee will be calculated based on the new grade
 * and the renewal date is set from the change date
 */
export function resetRenewalDateForGradeChange(
  changeDate: Date
): { nextRenewalDate: Date; message: string } {
  const nextRenewalDate = calculateNextRenewalDate(changeDate);
  const message =
    'Your membership grade has changed. A new annual renewal cycle has been initiated.';

  return {
    nextRenewalDate,
    message,
  };
}
