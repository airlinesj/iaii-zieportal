/**
 * Example Backend Route Handler
 * Shows how to use MembershipFeeService in controllers/routes
 * Add this to your authRoutes.ts or create a new feesRoutes.ts
 */

import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  MembershipGrade,
  validateGradeProgression,
  getFeeBreakdown,
  canApplyForGrade,
  getAvailableGrades,
} from '../services/MembershipFeeService';
import { User } from '../models/User';

const router = Router();

/**
 * POST /fees/validate-grade-change
 * Validates if a user can apply for a specific grade
 * Request body: { targetGrade: string }
 * Returns: { valid: boolean, reason?: string, currentGrade: string }
 */
export const validateGradeChange = async (req: AuthRequest, res: Response) => {
  try {
    const { targetGrade } = req.body;

    if (!targetGrade) {
      return res
        .status(400)
        .json({ message: 'Target grade is required', valid: false });
    }

    // Get current user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentGrade =
      user.userClassification || user.applicationType || null;
    
    console.log('\n=== Validate Grade Change Endpoint ===');
    console.log('User:', user.email);
    console.log('Current Grade/Classification:', currentGrade);
    console.log('Target Grade:', targetGrade);

    // Validate the progression
    const validationResult = validateGradeProgression(
      currentGrade,
      targetGrade
    );

    if (!validationResult.valid) {
      console.warn('❌ Grade change invalid:', validationResult.reason);
      return res.status(400).json({
        valid: false,
        reason: validationResult.reason,
        currentGrade,
        targetGrade,
      });
    }

    console.log('✓ Grade change valid');
    res.json({
      valid: true,
      message: 'Grade change is allowed',
      currentGrade,
      targetGrade,
    });
  } catch (error) {
    console.error('Error validating grade change:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * GET /fees/breakdown/:grade
 * Gets fee breakdown for expatriate applicants
 * Params: grade (membership grade)
 * Returns: { isExpatriate: boolean, grade, fees: {...}, total, currency }
 */
export const getFeeBreakdownEndpoint = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { grade } = req.params;

    // Get current user to check if expatriate
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const applicationType = user.applicationType || 'local';

    console.log('\n=== Fee Breakdown Endpoint ===');
    console.log('User:', user.email);
    console.log('Application Type:', applicationType);
    console.log('Requested Grade:', grade);

    const breakdown = getFeeBreakdown(grade, applicationType);

    if (!breakdown && applicationType === 'expatriate') {
      // Expatriate but grade not found
      return res.status(404).json({
        message: `No fee information for grade: ${grade}`,
        grade,
        applicationType,
      });
    }

    res.json({
      breakdown,
      applicationType,
      message: applicationType === 'local'
        ? 'Local applicants do not have itemized USD fees'
        : 'Expatriate fee breakdown',
    });
  } catch (error) {
    console.error('Error getting fee breakdown:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * GET /fees/available-grades
 * Returns list of all available membership grades
 */
export const getAvailableGradesEndpoint = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const grades = getAvailableGrades();

    console.log('✓ Available grades retrieved');
    res.json({
      grades,
      count: grades.length,
    });
  } catch (error) {
    console.error('Error getting available grades:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * Example routes to add to your routes file:
 * 
 * import { 
 *   validateGradeChange, 
 *   getFeeBreakdownEndpoint, 
 *   getAvailableGradesEndpoint 
 * } from '../controllers/feeController';
 * import { authMiddleware } from '../middleware/auth';
 * 
 * router.post('/fees/validate-grade-change', authMiddleware, validateGradeChange);
 * router.get('/fees/breakdown/:grade', authMiddleware, getFeeBreakdownEndpoint);
 * router.get('/fees/available-grades', authMiddleware, getAvailableGradesEndpoint);
 */

export default router;
