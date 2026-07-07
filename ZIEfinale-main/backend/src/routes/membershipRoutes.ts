import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { MembershipGrade } from '../models/MembershipGrade';
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
      roundedExchangeRate: `1 USD = ZWG ${exchangeRate.toFixed(2)}`,
      renewalCycleDays: 365,
      remindersStartAfterDays: 325,
    });
  } catch (error) {
    console.error('Error fetching all fees:', error);
    res.status(500).json({ message: 'Failed to fetch fees' });
  }
});

/**
 * GET /api/membership/available-grades
 * Get all available membership grades in the system
 */
router.get('/available-grades', authMiddleware, async (req: Request, res: Response) => {
  try {
    const grades = await MembershipGrade.find().sort({ minYearsExperience: 1 });

    if (!grades || grades.length === 0) {
      return res.status(200).json({
        grades: [],
        message: 'No membership grades found in the system',
      });
    }

    return res.status(200).json({
      grades: grades.map((grade) => ({
        id: grade.gradeName,
        name: grade.gradeName,
        description: grade.description,
        minYearsExperience: grade.minYearsExperience,
        requiresDiploma: grade.requiresDiploma,
        requiresTechnicalReport: grade.requiresTechnicalReport,
        baseFee: grade.baseFee,
      })),
      count: grades.length,
    });
  } catch (error) {
    console.error('Error fetching available grades:', error);
    res.status(500).json({ message: 'Failed to fetch available membership grades' });
  }
});

/**
 * GET /api/membership/exchange-rate
 * Get the current USD to ZWG exchange rate
 */
router.get('/exchange-rate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rateInfo = await exchangeRateService.getExchangeRateInfo();

    return res.status(200).json({
      exchangeRate: rateInfo.rate,
      display: `1 USD = ZWG ${rateInfo.rate.toFixed(2)}`,
      source: rateInfo.source,
      isManual: rateInfo.isManual,
      lastUpdated: rateInfo.lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rate' });
  }
});

/**
 * POST /api/membership/admin/set-exchange-rate
 * Admin endpoint to manually set the exchange rate
 * Only admins and super admins can use this
 */
router.post('/admin/set-exchange-rate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);

    // Check authorization
    if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
      return res.status(403).json({ message: 'Unauthorized. Only admins can set exchange rates.' });
    }

    const { rate } = req.body;

    if (!rate || typeof rate !== 'number' || rate <= 0) {
      return res.status(400).json({
        message: 'Invalid exchange rate. Must be a positive number.',
      });
    }

    if (rate > 1000) {
      return res.status(400).json({
        message: 'Invalid exchange rate. Rate seems too high. Please verify the value.',
      });
    }

    // Set the exchange rate
    await exchangeRateService.setExchangeRate(rate, userId);

    // Get updated info
    const rateInfo = await exchangeRateService.getExchangeRateInfo();

    return res.status(200).json({
      message: 'Exchange rate updated successfully',
      exchangeRate: rateInfo.rate,
      display: `1 USD = ZWG ${rateInfo.rate.toFixed(2)}`,
      isManual: rateInfo.isManual,
      lastUpdated: rateInfo.lastUpdated,
      updatedBy: user.email,
    });
  } catch (error) {
    console.error('Error setting exchange rate:', error);
    res.status(500).json({ message: 'Failed to set exchange rate' });
  }
});

/**
 * GET /api/membership/admin/exchange-rate-info
 * Admin endpoint to get detailed exchange rate information
 */
router.get('/admin/exchange-rate-info', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);

    // Check authorization
    if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
      return res.status(403).json({ message: 'Unauthorized. Only admins can view this information.' });
    }

    const rateInfo = await exchangeRateService.getExchangeRateInfo();

    return res.status(200).json({
      exchangeRate: rateInfo.rate,
      display: `1 USD = ZWG ${rateInfo.rate.toFixed(2)}`,
      source: rateInfo.source,
      isManual: rateInfo.isManual,
      lastUpdated: rateInfo.lastUpdated,
      cachedRate: exchangeRateService.getCachedRate(),
    });
  } catch (error) {
    console.error('Error fetching exchange rate info:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rate information' });
  }
});

export default router;
