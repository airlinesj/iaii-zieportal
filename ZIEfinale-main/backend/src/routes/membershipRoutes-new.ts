import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { getAnnualFeeStatus, getAnnualFeeAmount } from '../services/AnnualMembershipFeeService';
import { exchangeRateService } from '../services/ExchangeRateService';

const router = Router();

/**
 * GET /api/membership/annual-fee-status
 * Get the current annual fee status for the logged-in member in both USD and ZWL
 */
router.get('/annual-fee-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a member with a membership grade
    if (!user.membershipStatus || user.membershipStatus !== 'member' || !user.currentMembershipGrade) {
      return res.status(200).json({
        hasMembership: false,
        message: 'You are not currently an active member. Annual fees only apply to active members.',
      });
    }

    // Get current exchange rate
    const exchangeRate = await exchangeRateService.getExchangeRate();

    // Get the annual fee status in both currencies
    const feeStatus = getAnnualFeeStatus(
      user.currentMembershipGrade,
      user.lastAnnualFeeRenewalAt,
      exchangeRate
    );

    if (!feeStatus) {
      return res.status(200).json({
        hasMembership: false,
        message: 'Unable to calculate annual fee for your membership grade.',
      });
    }

    return res.status(200).json({
      hasMembership: true,
      feeStatus,
      exchangeRate,
      userInfo: {
        email: user.email,
        grade: user.currentMembershipGrade,
        division: user.currentMembershipDivision,
        applicationType: user.applicationType,
      },
    });
  } catch (error) {
    console.error('Error fetching annual fee status:', error);
    res.status(500).json({ message: 'Failed to fetch annual fee status' });
  }
});

/**
 * GET /api/membership/fee-amount/:grade
 * Get the annual fee amount for a specific membership grade in both USD and ZWL
 */
router.get('/fee-amount/:grade', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grade } = req.params;
    const userId = (req as any).userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current exchange rate
    const exchangeRate = await exchangeRateService.getExchangeRate();
    const feeAmount = getAnnualFeeAmount(grade, exchangeRate);

    if (!feeAmount) {
      return res.status(400).json({
        message: `No annual fee defined for grade: ${grade}`,
      });
    }

    return res.status(200).json(feeAmount);
  } catch (error) {
    console.error('Error fetching fee amount:', error);
    res.status(500).json({ message: 'Failed to fetch fee amount' });
  }
});

/**
 * GET /api/membership/all-fees
 * Get all annual fee amounts for all membership grades in both USD and ZWL
 */
router.get('/all-fees', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current exchange rate
    const exchangeRate = await exchangeRateService.getExchangeRate();

    const grades = ['Technician', 'Technologist', 'Member', 'Fellow'];
    const feesData = grades
      .map((grade) => getAnnualFeeAmount(grade, exchangeRate))
      .filter((fee) => fee !== null);

    return res.status(200).json({
      fees: feesData,
      exchangeRate,
      roundedExchangeRate: `1 USD = ZWL ${exchangeRate.toFixed(2)}`,
      renewalCycleDays: 365,
      remindersStartAfterDays: 325,
    });
  } catch (error) {
    console.error('Error fetching all fees:', error);
    res.status(500).json({ message: 'Failed to fetch fees' });
  }
});

/**
 * GET /api/membership/exchange-rate
 * Get the current USD to ZWL exchange rate
 */
router.get('/exchange-rate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const exchangeRate = await exchangeRateService.getExchangeRate();

    return res.status(200).json({
      exchangeRate,
      display: `1 USD = ZWL ${exchangeRate.toFixed(2)}`,
      source: 'Zimbabwe Reserve Bank',
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rate' });
  }
});

export default router;
