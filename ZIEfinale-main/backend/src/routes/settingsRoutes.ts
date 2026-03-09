import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import ExchangeRateApprovalService from '../services/ExchangeRateApprovalService';
import { ExchangeRateService } from '../services/ExchangeRateService';

const router = Router();

/**
 * EXCHANGE RATE APPROVAL ENDPOINTS
 */

/**
 * Get current exchange rate
 * GET /api/settings/exchange-rate
 * Access: All authenticated users
 */
router.get('/exchange-rate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exchangeRateService = ExchangeRateService.getInstance();
    const rate = await exchangeRateService.getExchangeRate();

    res.json({
      success: true,
      rate,
      currency: 'USD to ZWL',
    });
  } catch (error: any) {
    console.error('Error fetching exchange rate:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rate',
      error: error.message,
    });
  }
});

/**
 * Request exchange rate update
 * POST /api/settings/exchange-rate/request
 * Access: Admin only
 * Body: { newRate: number, reason: string }
 */
router.post('/exchange-rate/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { newRate, reason } = req.body;

    // Check if user is an admin
    const user = await User.findById(userId);
    if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can request exchange rate updates',
      });
    }

    // Validate input
    if (!newRate || typeof newRate !== 'number' || newRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exchange rate provided',
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    // Create approval request
    const approvalService = ExchangeRateApprovalService.getInstance();
    const approval = await approvalService.requestRateUpdate(userId, newRate, reason);

    res.status(201).json({
      success: true,
      message: 'Exchange rate update request submitted for approval',
      approval,
    });
  } catch (error: any) {
    console.error('Error requesting exchange rate update:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to request exchange rate update',
      error: error.message,
    });
  }
});

/**
 * Get pending exchange rate approvals (for superadmin dashboard)
 * GET /api/settings/exchange-rate/pending
 * Access: SuperAdmin only
 */
router.get('/exchange-rate/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Check if user is a superadmin
    const user = await User.findById(userId);
    if (!user || user.role !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can access pending approvals',
      });
    }

    // Get pending approvals
    const approvalService = ExchangeRateApprovalService.getInstance();
    const approvals = await approvalService.getPendingApprovals();

    res.json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message,
    });
  }
});

/**
 * Get exchange rate approval history with filters
 * GET /api/settings/exchange-rate/history?status=approved&limit=50&skip=0
 * Access: SuperAdmin or Audit admin
 */
router.get('/exchange-rate/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { status, limit, skip } = req.query;

    // Check if user is a superadmin or audit admin
    const user = await User.findById(userId);
    if (!user || (user.role !== 'SuperAdmin' && user.accountType !== 'audit')) {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins or auditors can access approval history',
      });
    }

    // Get approval history
    const approvalService = ExchangeRateApprovalService.getInstance();
    const { approvals, total } = await approvalService.getApprovalHistory({
      status: status as string,
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.json({
      success: true,
      count: approvals.length,
      total,
      approvals,
    });
  } catch (error: any) {
    console.error('Error fetching approval history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval history',
      error: error.message,
    });
  }
});

/**
 * Approve exchange rate update
 * POST /api/settings/exchange-rate/:approvalId/approve
 * Access: SuperAdmin only
 * Body: { comment?: string }
 */
router.post('/exchange-rate/:approvalId/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { approvalId } = req.params;
    const { comment } = req.body;

    // Check if user is a superadmin
    const user = await User.findById(userId);
    if (!user || user.role !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can approve exchange rate updates',
      });
    }

    // Approve the request
    const approvalService = ExchangeRateApprovalService.getInstance();
    const approval = await approvalService.approveRateUpdate(approvalId, userId, comment);

    res.json({
      success: true,
      message: 'Exchange rate update approved and applied',
      approval,
    });
  } catch (error: any) {
    console.error('Error approving exchange rate update:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve exchange rate update',
      error: error.message,
    });
  }
});

/**
 * Reject exchange rate update
 * POST /api/settings/exchange-rate/:approvalId/reject
 * Access: SuperAdmin only
 * Body: { comment?: string }
 */
router.post('/exchange-rate/:approvalId/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { approvalId } = req.params;
    const { comment } = req.body;

    // Check if user is a superadmin
    const user = await User.findById(userId);
    if (!user || user.role !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can reject exchange rate updates',
      });
    }

    // Reject the request
    const approvalService = ExchangeRateApprovalService.getInstance();
    const approval = await approvalService.rejectRateUpdate(approvalId, userId, comment);

    res.json({
      success: true,
      message: 'Exchange rate update rejected',
      approval,
    });
  } catch (error: any) {
    console.error('Error rejecting exchange rate update:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reject exchange rate update',
      error: error.message,
    });
  }
});

export default router;
