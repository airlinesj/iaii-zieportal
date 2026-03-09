/**
 * ExchangeRateApprovalService
 * Manages the approval workflow for admin exchange rate update requests
 */

import ExchangeRateApproval, { IExchangeRateApproval } from '../models/ExchangeRateApproval';
import SystemSettings from '../models/SystemSettings';
import { User } from '../models/User';
import { sendExchangeRateApprovalEmail, sendExchangeRateApprovedEmail, sendExchangeRateRejectedEmail } from './emailService';

export class ExchangeRateApprovalService {
  private static instance: ExchangeRateApprovalService;

  private constructor() {}

  static getInstance(): ExchangeRateApprovalService {
    if (!ExchangeRateApprovalService.instance) {
      ExchangeRateApprovalService.instance = new ExchangeRateApprovalService();
    }
    return ExchangeRateApprovalService.instance;
  }

  /**
   * Admin requests a new exchange rate update
   */
  async requestRateUpdate(adminId: string, newRate: number, reason: string): Promise<IExchangeRateApproval> {
    try {
      // Get current exchange rate
      const settings = await SystemSettings.findOne();
      const currentRate = settings?.exchangeRateUSDToZWG || 26.5;

      // Validate the new rate
      if (newRate <= 0) {
        throw new Error('Exchange rate must be greater than 0');
      }

      if (newRate === currentRate) {
        throw new Error('New rate must be different from current rate');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Reason is required');
      }

      // Create approval request
      const approval = new ExchangeRateApproval({
        requestedBy: adminId,
        requestedRate: newRate,
        currentRate: currentRate,
        reason: reason.trim(),
        status: 'pending',
      });

      await approval.save();

      // Notify all superadmins
      await this.notifySuperAdminsOfRequest(approval);

      console.log(`✓ Exchange rate update request created by admin ${adminId}`, {
        newRate,
        currentRate,
        reason,
      });

      return approval;
    } catch (error: any) {
      console.error('❌ Error requesting rate update:', error.message);
      throw error;
    }
  }

  /**
   * SuperAdmin approves an exchange rate update
   */
  async approveRateUpdate(
    approvalId: string,
    superAdminId: string,
    comment?: string
  ): Promise<IExchangeRateApproval> {
    try {
      const approval = await ExchangeRateApproval.findById(approvalId).populate('requestedBy approvedBy');

      if (!approval) {
        throw new Error('Approval request not found');
      }

      if (approval.status !== 'pending') {
        throw new Error(`Cannot approve a ${approval.status} request`);
      }

      // Update approval status
      approval.status = 'approved';
      approval.approvedBy = new (require('mongoose').Types.ObjectId)(superAdminId);
      approval.approvalComment = comment;
      approval.approvalDate = new Date();

      // Apply the new rate to system settings
      const settings = await SystemSettings.findOne();
      if (settings) {
        settings.exchangeRateUSDToZWG = approval.requestedRate;
        settings.exchangeRateLastUpdatedAt = new Date();
        settings.exchangeRateLastUpdatedBy = new (require('mongoose').Types.ObjectId)(superAdminId);
        settings.isManuallySet = true;
        await settings.save();

        // Set applied date
        approval.appliedDate = new Date();
      }

      await approval.save();

      // Send notifications
      const admin = await User.findById(approval.requestedBy);
      if (admin) {
        await sendExchangeRateApprovedEmail({
          adminName: admin.firstName + ' ' + admin.lastName,
          adminEmail: admin.email,
          oldRate: approval.currentRate,
          newRate: approval.requestedRate,
          approvalComment: comment || 'Rate update approved',
        });
      }

      console.log(`✓ Exchange rate update approved by superadmin ${superAdminId}`, {
        newRate: approval.requestedRate,
        approvalId,
      });

      return approval;
    } catch (error: any) {
      console.error('❌ Error approving rate update:', error.message);
      throw error;
    }
  }

  /**
   * SuperAdmin rejects an exchange rate update
   */
  async rejectRateUpdate(
    approvalId: string,
    superAdminId: string,
    comment?: string
  ): Promise<IExchangeRateApproval> {
    try {
      const approval = await ExchangeRateApproval.findById(approvalId).populate('requestedBy');

      if (!approval) {
        throw new Error('Approval request not found');
      }

      if (approval.status !== 'pending') {
        throw new Error(`Cannot reject a ${approval.status} request`);
      }

      // Update approval status
      approval.status = 'rejected';
      approval.approvedBy = new (require('mongoose').Types.ObjectId)(superAdminId);
      approval.approvalComment = comment;
      approval.approvalDate = new Date();

      await approval.save();

      // Send rejection notification
      const admin = await User.findById(approval.requestedBy);
      if (admin) {
        await sendExchangeRateRejectedEmail({
          adminName: admin.firstName + ' ' + admin.lastName,
          adminEmail: admin.email,
          requestedRate: approval.requestedRate,
          currentRate: approval.currentRate,
          rejectionReason: comment || 'Rate update rejected',
        });
      }

      console.log(`✓ Exchange rate update rejected by superadmin ${superAdminId}`, {
        rejectionReason: comment,
        approvalId,
      });

      return approval;
    } catch (error: any) {
      console.error('❌ Error rejecting rate update:', error.message);
      throw error;
    }
  }

  /**
   * Get all pending approval requests for superadmin dashboard
   */
  async getPendingApprovals(): Promise<IExchangeRateApproval[]> {
    try {
      const approvals = await ExchangeRateApproval.find({ status: 'pending' })
        .populate('requestedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return approvals;
    } catch (error: any) {
      console.error('❌ Error fetching pending approvals:', error.message);
      throw error;
    }
  }

  /**
   * Get all approval requests with filters
   */
  async getApprovalHistory(filters?: {
    status?: string;
    requestedBy?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ approvals: IExchangeRateApproval[]; total: number }> {
    try {
      const query: any = {};

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.requestedBy) {
        query.requestedBy = filters.requestedBy;
      }

      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const [approvals, total] = await Promise.all([
        ExchangeRateApproval.find(query)
          .populate('requestedBy', 'firstName lastName email')
          .populate('approvedBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip),
        ExchangeRateApproval.countDocuments(query),
      ]);

      return { approvals, total };
    } catch (error: any) {
      console.error('❌ Error fetching approval history:', error.message);
      throw error;
    }
  }

  /**
   * Send notification emails to all superadmins
   */
  private async notifySuperAdminsOfRequest(approval: IExchangeRateApproval): Promise<void> {
    try {
      const superAdmins = await User.find({ role: 'SuperAdmin', email: { $regex: '@superadmin', $options: 'i' } });

      if (superAdmins.length === 0) {
        console.warn('⚠️ No superadmins found to notify');
        return;
      }

      const admin = await User.findById(approval.requestedBy);
      if (!admin) {
        console.error('❌ Admin not found for notification');
        return;
      }

      // Send email to each superadmin
      for (const superAdmin of superAdmins) {
        try {
          await sendExchangeRateApprovalEmail({
            superAdminName: superAdmin.firstName + ' ' + superAdmin.lastName,
            superAdminEmail: superAdmin.email,
            adminName: admin.firstName + ' ' + admin.lastName,
            adminEmail: admin.email,
            currentRate: approval.currentRate,
            requestedRate: approval.requestedRate,
            reason: approval.reason,
            approvalId: approval._id.toString(),
          });
        } catch (err) {
          console.error(`Failed to notify superadmin ${superAdmin.email}:`, err);
        }
      }

      console.log(`✓ Notifications sent to ${superAdmins.length} superadmins`);
    } catch (error: any) {
      console.error('❌ Error notifying superadmins:', error.message);
    }
  }
}

export default ExchangeRateApprovalService;
