import { Request, Response } from 'express';
import { CpdApplication } from '../models/CpdApplication';
import { TrainingElementsReview } from '../models/TrainingElementsReview';
import { AuditService } from '../services/AuditService';
import {
  calculateCpdFee,
  getCpdFeeBreakdown,
  calculateCpdDurationFeeUsd,
  calculateCpdDurationFeeWithConversion,
  getCpdDurationFeeOptions,
  CPD_DURATION_FEES
} from '../services/CpdPaymentService';
import CpdNotificationService from '../services/CpdNotificationService';
import { ExchangeRateService } from '../services/ExchangeRateService';
import path from 'path';
import fs from 'fs/promises';
import { User } from '../models/User';

export const cpdController = {
  // Create CPD Application
  createApplication: async (req: Request, res: Response) => {
    try {
      const {
        companyName,
        physicalAddress,
        phoneNumber,
        email,
        natureOfBusiness,
        supervisorName,
        supervisorEmail,
        supervisorCell,
        supervisorJobTitle,
        supervisorQualifications,
        courseTitle,
        courseOverview,
        courseDuration,
        targetedParticipantsCount,
        targetedParticipantsDescription,
        careerPlan,
        internalAssessmentMethods,
        feedbackMechanisms,
        trainers,
        trainingMode,
        trainingElements,
        estimatedFee,
        paymentCurrency
      } = req.body;

      // Validate required fields
      if (!companyName || !email || !courseTitle || !supervisorName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate paymentCurrency
      if (!paymentCurrency || !['ZWL', 'USD'].includes(paymentCurrency)) {
        return res.status(400).json({ message: 'Please select a valid payment currency (ZWL or USD)' });
      }

      // Check if files are uploaded
      const filesDict = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!filesDict || !filesDict['curriculum'] || !filesDict['profiles'] || !filesDict['payment']) {
        return res.status(400).json({ message: 'All three files (curriculum, profiles, payment) are required' });
      }

      const files = filesDict;

      const cpdApplication = new CpdApplication({
        companyName,
        physicalAddress,
        phoneNumber,
        email,
        natureOfBusiness,
        supervisorName,
        supervisorEmail,
        supervisorCell,
        supervisorJobTitle,
        supervisorQualifications,
        courseTitle,
        courseOverview,
        courseDuration: parseFloat(courseDuration),
        targetedParticipantsCount: parseInt(targetedParticipantsCount),
        targetedParticipantsDescription,
        careerPlan,
        internalAssessmentMethods,
        feedbackMechanisms,
        trainers: typeof trainers === 'string' ? JSON.parse(trainers) : trainers,
        trainingMode: typeof trainingMode === 'string' ? JSON.parse(trainingMode) : trainingMode,
        trainingElements: typeof trainingElements === 'string' ? JSON.parse(trainingElements) : trainingElements,
        estimatedFee: parseFloat(estimatedFee),
        applicationType: 'local',
        paymentCurrency: paymentCurrency,
        status: 'Pending',
        curriculumFile: {
          filename: files['curriculum'][0].filename,
          path: files['curriculum'][0].path,
          uploadedAt: new Date()
        },
        profilesFile: {
          filename: files['profiles'][0].filename,
          path: files['profiles'][0].path,
          uploadedAt: new Date()
        },
        paymentFile: {
          filename: files['payment'][0].filename,
          path: files['payment'][0].path,
          uploadedAt: new Date()
        }
      });

      const savedApplication = await cpdApplication.save();

      // Create a separate TrainingElementsReview card for admin review
      const trainingElementsReview = new TrainingElementsReview({
        cpdApplicationId: savedApplication._id,
        applicantName: supervisorName,
        company: companyName,
        email: supervisorEmail || email,
        trainingElements: typeof trainingElements === 'string' ? JSON.parse(trainingElements) : trainingElements,
        courseTitle,
        courseDuration: parseFloat(courseDuration),
        reviewStatus: 'pending',
        submittedAt: new Date()
      });

      await trainingElementsReview.save();

      // Log to audit trail
      await AuditService.logAction(
        'system',
        'system@zie.co.zw',
        'OTHER',
        'CpdApplication',
        savedApplication._id.toString(),
        `CPD Application submitted for course: ${courseTitle}`
      );

      res.status(201).json({
        message: 'CPD application submitted successfully',
        applicationId: savedApplication._id,
        trainingElementsReviewId: trainingElementsReview._id,
        application: savedApplication
      });
    } catch (error: any) {
      console.error('Error creating CPD application:', error);
      res.status(500).json({ message: 'Error submitting CPD application', error: error.message });
    }
  },

  // Get all CPD applications (Admin only)
  getApplications: async (req: Request, res: Response) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      
      let filter: any = {};
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { companyName: { $regex: search, $options: 'i' } },
          { courseTitle: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const applications = await CpdApplication.find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .select('-curriculumFile.path -profilesFile.path -paymentFile.path'); // Hide file paths for security

      const total = await CpdApplication.countDocuments(filter);

      res.json({
        applications,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      });
    } catch (error: any) {
      console.error('Error fetching CPD applications:', error);
      res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
  },

  // Get single CPD application
  getApplication: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      res.json(application);
    } catch (error: any) {
      console.error('Error fetching CPD application:', error);
      res.status(500).json({ message: 'Error fetching application', error: error.message });
    }
  },

  // Update CPD application status (Admin only)
  updateApplication: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const application = await CpdApplication.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        (req as any).user?.email || 'system@zie.co.zw',
        'OTHER',
        'CpdApplication',
        id,
        `CPD Application status updated to: ${status}`
      );

      res.json({
        message: 'CPD application updated successfully',
        application
      });
    } catch (error: any) {
      console.error('Error updating CPD application:', error);
      res.status(500).json({ message: 'Error updating application', error: error.message });
    }
  },

  // Assess CPD application (Admin only)
  assessApplication: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { assessmentDecision, assessmentNotes, ceoSignature, chairpersonSignature } = req.body;

      const application = await CpdApplication.findByIdAndUpdate(
        id,
        {
          status: assessmentDecision === 'approved' ? 'Approved' : 'Rejected',
          officialUseOnly: {
            assessmentDecision,
            assessmentNotes,
            ceoSignature,
            chairpersonSignature,
            approvalDate: new Date(),
            assessedBy: (req as any).user?.id
          }
        },
        { new: true }
      );

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        (req as any).user?.email || 'system@zie.co.zw',
        'OTHER',
        'CpdApplication',
        id,
        `CPD Application assessed - Decision: ${assessmentDecision}`
      );

      res.json({
        message: 'CPD application assessment completed',
        application
      });
    } catch (error: any) {
      console.error('Error assessing CPD application:', error);
      res.status(500).json({ message: 'Error assessing application', error: error.message });
    }
  },

  // Download file
  downloadFile: async (req: Request, res: Response) => {
    try {
      const { id, fileType } = req.params;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      let fileInfo;
      if (fileType === 'curriculum') fileInfo = application.curriculumFile;
      else if (fileType === 'profiles') fileInfo = application.profilesFile;
      else if (fileType === 'payment') fileInfo = application.paymentFile;

      if (!fileInfo) {
        return res.status(404).json({ message: 'File not found' });
      }

      const filePath = fileInfo.path;
      
      // Verify file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: 'File not found on server' });
      }

      res.download(filePath, fileInfo.filename);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
  },

  // Delete CPD application (Admin only)
  deleteApplication: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const application = await CpdApplication.findByIdAndDelete(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      // Delete files if they exist
      const filesToDelete = [
        application.curriculumFile?.path,
        application.profilesFile?.path,
        application.paymentFile?.path
      ].filter(Boolean);

      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath as string);
        } catch (err) {
          console.warn(`Could not delete file: ${filePath}`);
        }
      }

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        (req as any).user?.email || 'system@zie.co.zw',
        'OTHER',
        'CpdApplication',
        id,
        'CPD Application deleted'
      );

      res.json({ message: 'CPD application deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting CPD application:', error);
      res.status(500).json({ message: 'Error deleting application', error: error.message });
    }
  },

  // Approve CPD application for payment (Admin only)
  approveApplication: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      // Get admin info
      const admin = await User.findById((req as any).user?.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      // Calculate payment amount based on training mode and elements
      const applicationType = application.applicationType || 'local';
      const paymentAmount = calculateCpdFee(
        application.trainingMode,
        application.trainingElements,
        applicationType as any
      );

      // Update application with approval and payment details
      application.adminApproval = {
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: (req as any).user?.id,
        approvedByEmail: admin.email,
        approvedByName: admin.email,
      };

      application.paymentDetails = {
        amount: paymentAmount,
        currency: applicationType === 'expatriate' ? 'USD' : 'ZWL',
        paymentStatus: 'pending',
      };

      application.status = 'Payment Pending';

      await application.save();

      // Send approval email to applicant with payment details
      await CpdNotificationService.sendApprovalNotification(
        application.email,
        application.companyName,
        application.courseTitle,
        paymentAmount,
        applicationType === 'expatriate' ? 'USD' : 'ZWL',
        application._id.toString()
      );

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        admin.email,
        'OTHER',
        'CpdApplication',
        id,
        `CPD Application approved. Payment of ${applicationType === 'expatriate' ? 'USD' : 'ZWL'} ${paymentAmount} required. ${notes ? `Notes: ${notes}` : ''}`
      );

      res.json({
        message: 'CPD application approved successfully. Applicant notified.',
        application,
        paymentDetails: {
          amount: paymentAmount,
          currency: applicationType === 'expatriate' ? 'USD' : 'ZWL'
        }
      });
    } catch (error: any) {
      console.error('Error approving CPD application:', error);
      res.status(500).json({ message: 'Error approving application', error: error.message });
    }
  },

  // Reject CPD application (Admin only)
  rejectApplication: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      // Get admin info
      const admin = await User.findById((req as any).user?.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      // Update application with rejection
      application.adminApproval = {
        approvalStatus: 'rejected',
        approvedAt: new Date(),
        approvedBy: (req as any).user?.id,
        approvedByEmail: admin.email,
        approvedByName: admin.email,
        rejectionReason: rejectionReason,
      };

      application.status = 'Rejected';

      await application.save();

      // Send rejection email
      await CpdNotificationService.sendRejectionNotification(
        application.email,
        application.companyName,
        application.courseTitle,
        rejectionReason,
        application._id.toString()
      );

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        admin.email,
        'OTHER',
        'CpdApplication',
        id,
        `CPD Application rejected. Reason: ${rejectionReason}`
      );

      res.json({
        message: 'CPD application rejected. Applicant notified.',
        application
      });
    } catch (error: any) {
      console.error('Error rejecting CPD application:', error);
      res.status(500).json({ message: 'Error rejecting application', error: error.message });
    }
  },

  // Upload payment proof
  uploadPaymentProof: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      // Verify ownership
      if (application.email !== (req as any).user?.email && (req as any).user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
      }

      const paymentProofFile = req.file;

      if (!paymentProofFile) {
        return res.status(400).json({ message: 'No payment proof file provided' });
      }

      // Initialize payment details if not exists
      if (!application.paymentDetails) {
        application.paymentDetails = {
          amount: application.estimatedFee,
          currency: application.applicationType === 'expatriate' ? 'USD' : 'ZWL',
          paymentStatus: 'initiated',
        };
      }

      application.paymentDetails.paymentProof = {
        filePath: paymentProofFile.filename,
        uploadedAt: new Date(),
        verificationStatus: 'pending',
      };

      await application.save();

      res.json({
        message: 'Payment proof uploaded successfully',
        paymentProof: application.paymentDetails.paymentProof
      });
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      res.status(500).json({ message: 'Error uploading payment proof', error: error.message });
    }
  },

  // Process payment (initiate payment)
  initiatePayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      if (!application.paymentDetails) {
        return res.status(400).json({ message: 'Payment details not found. Application may not be approved yet.' });
      }

      if (application.paymentDetails.paymentStatus !== 'pending') {
        return res.status(400).json({ message: 'Payment has already been processed for this application' });
      }

      // Generate transaction ID
      const transactionId = `CPD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Update payment status to initiated
      application.paymentDetails.paymentStatus = 'initiated';
      application.paymentDetails.paymentMethod = paymentMethod || 'gateway';
      application.paymentDetails.transactionId = transactionId;

      await application.save();

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        (req as any).user?.email || application.email,
        'OTHER',
        'CpdApplication',
        id,
        `Payment initiated. Transaction ID: ${transactionId}`
      );

      res.json({
        message: 'Payment initiated successfully',
        transactionId,
        paymentDetails: {
          amount: application.paymentDetails.amount,
          currency: application.paymentDetails.currency,
          transactionId
        }
      });
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      res.status(500).json({ message: 'Error initiating payment', error: error.message });
    }
  },

  // Complete payment
  completePayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { transactionId, paymentProof } = req.body;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      if (!application.paymentDetails) {
        return res.status(400).json({ message: 'Payment details not found' });
      }

      // Verify transaction ID matches
      if (application.paymentDetails.transactionId !== transactionId) {
        return res.status(400).json({ message: 'Transaction ID does not match' });
      }

      // Mark payment as completed
      application.paymentDetails.paymentStatus = 'completed';
      application.paymentDetails.paidAt = new Date();
      application.status = 'Payment Completed';

      await application.save();

      // Send payment confirmation email
      await CpdNotificationService.sendPaymentConfirmation(
        application.email,
        application.companyName,
        application.courseTitle,
        application.paymentDetails.amount,
        application.paymentDetails.currency,
        transactionId,
        application._id.toString()
      );

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        (req as any).user?.email || application.email,
        'OTHER',
        'CpdApplication',
        id,
        `Payment completed successfully. Transaction ID: ${transactionId}`
      );

      res.json({
        message: 'Payment completed successfully. Confirmation email sent.',
        application,
        transactionId
      });
    } catch (error: any) {
      console.error('Error completing payment:', error);
      res.status(500).json({ message: 'Error completing payment', error: error.message });
    }
  },

  // Get pending approvals (Admin only)
  getPendingApprovals: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const applications = await CpdApplication.find({
        'adminApproval.approvalStatus': 'pending'
      })
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      const total = await CpdApplication.countDocuments({
        'adminApproval.approvalStatus': 'pending'
      });

      res.json({
        applications,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      });
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
    }
  },

  // Get applications pending payment
  getPendingPayments: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const applications = await CpdApplication.find({
        status: 'Payment Pending',
        'paymentDetails.paymentStatus': { $in: ['pending', 'initiated'] }
      })
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      const total = await CpdApplication.countDocuments({
        status: 'Payment Pending',
        'paymentDetails.paymentStatus': { $in: ['pending', 'initiated'] }
      });

      res.json({
        applications,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      });
    } catch (error: any) {
      console.error('Error fetching pending payments:', error);
      res.status(500).json({ message: 'Error fetching pending payments', error: error.message });
    }
  },

  // Get user's CPD applications
  getUserApplications: async (req: Request, res: Response) => {
    try {
      const userEmail = (req as any).user?.email;

      if (!userEmail) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const applications = await CpdApplication.find({ email: userEmail })
        .sort({ createdAt: -1 })
        .select('-curriculumFile.path -profilesFile.path -paymentFile.path');

      res.json({
        applications
      });
    } catch (error: any) {
      console.error('Error fetching user applications:', error);
      res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
  },

  // Verify and approve payment (Admin only)
  verifyPayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { verified, notes } = req.body;

      const application = await CpdApplication.findById(id);

      if (!application) {
        return res.status(404).json({ message: 'CPD application not found' });
      }

      if (!application.paymentDetails?.paymentProof) {
        return res.status(400).json({ message: 'No payment proof found' });
      }

      // Get admin info
      const admin = await User.findById((req as any).user?.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      // Update verification status
      if (application.paymentDetails.paymentProof) {
        application.paymentDetails.paymentProof.verificationStatus = verified ? 'verified' : 'rejected';
        application.paymentDetails.paymentProof.verifiedAt = new Date();
        application.paymentDetails.paymentProof.verifiedBy = (req as any).user?.id;
      }

      if (verified) {
        application.paymentDetails.paymentStatus = 'completed';
        application.status = 'Payment Completed';
      }

      await application.save();

      // Log to audit trail
      await AuditService.logAction(
        (req as any).user?.id || 'system',
        admin.email,
        'OTHER',
        'CpdApplication',
        id,
        `Payment proof ${verified ? 'verified' : 'rejected'}. ${notes ? `Notes: ${notes}` : ''}`
      );

      res.json({
        message: `Payment ${verified ? 'verified' : 'rejected'} successfully`,
        application
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
  },

  // Calculate CPD fee based on course duration
  calculateDurationFee: async (req: Request, res: Response) => {
    try {
      const { courseDuration, interbankRate } = req.body;

      // Validate required fields
      if (courseDuration === undefined || courseDuration === null) {
        return res.status(400).json({ message: 'Course duration is required' });
      }

      const durationDays = parseFloat(courseDuration.toString());

      // Validate course duration
      if (isNaN(durationDays) || durationDays < 0.5) {
        return res.status(400).json({ message: 'Course duration must be a positive number (minimum 0.5 for half-day)' });
      }

      try {
        // Get the fee structure based on duration
        const feeStructure = calculateCpdDurationFeeUsd(durationDays);

        // Get current interbank rate if not provided
        let rate = interbankRate;
        if (!rate || isNaN(rate) || rate <= 0) {
          const exchangeRateService = ExchangeRateService.getInstance();
          rate = await exchangeRateService.getExchangeRate();
        }

        // Validate interbank rate
        if (isNaN(rate) || rate <= 0) {
          return res.status(400).json({
            message: 'Invalid interbank rate',
            rate
          });
        }

        // Calculate fees in both currencies
        const feeResult = calculateCpdDurationFeeWithConversion(durationDays, rate);

        res.json({
          success: true,
          message: 'CPD fee calculated successfully',
          data: {
            courseDuration: durationDays,
            durationCategory: feeResult.durationCategory,
            durationLabel: feeResult.durationLabel,
            usdCost: feeResult.usdCost,
            interbankRate: feeResult.interbankRate,
            zwlCost: feeResult.zwlCost,
            currencyPair: feeResult.currencyPair,
            displayFormat: {
              usd: `$${feeResult.usdCost.toFixed(2)}`,
              zwl: `ZWL ${feeResult.zwlCost.toFixed(2)}`
            }
          }
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          message: error.message || 'Error calculating CPD fee'
        });
      }
    } catch (error: any) {
      console.error('Error calculating CPD duration fee:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating CPD fee',
        error: error.message
      });
    }
  },

  // Get available CPD duration fee options
  getDurationFeeOptions: async (req: Request, res: Response) => {
    try {
      const options = getCpdDurationFeeOptions();

      // Get current exchange rate
      const exchangeRateService = ExchangeRateService.getInstance();
      const interbankRate = await exchangeRateService.getExchangeRate();

      // Convert each option to local currency
      const optionsWithConversion = options.map(option => ({
        ...option,
        zwlFee: parseFloat((option.usdFee * interbankRate).toFixed(2)),
        displayFormat: {
          usd: `$${option.usdFee.toFixed(2)}`,
          zwl: `ZWL ${(option.usdFee * interbankRate).toFixed(2)}`
        }
      }));

      res.json({
        success: true,
        message: 'CPD duration fee options retrieved successfully',
        interbankRate,
        currencyPair: 'USD/ZWL',
        options: optionsWithConversion
      });
    } catch (error: any) {
      console.error('Error retrieving CPD duration fee options:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving fee options',
        error: error.message
      });
    }
  },

  // Get all Training Elements Reviews (Admin only)
  getTrainingElementsReviews: async (req: Request, res: Response) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;

      let filter: any = {};
      if (status) filter.reviewStatus = status;
      if (search) {
        filter.$or = [
          { applicantName: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { courseTitle: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const reviews = await TrainingElementsReview.find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ submittedAt: -1 })
        .lean();

      const total = await TrainingElementsReview.countDocuments(filter);

      res.json({
        reviews,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      });
    } catch (error: any) {
      console.error('Error fetching training elements reviews:', error);
      res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
  },

  // Get single Training Elements Review
  getTrainingElementsReview: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const review = await TrainingElementsReview.findById(id).lean();

      if (!review) {
        return res.status(404).json({ message: 'Training elements review not found' });
      }

      res.json(review);
    } catch (error: any) {
      console.error('Error fetching training elements review:', error);
      res.status(500).json({ message: 'Error fetching review', error: error.message });
    }
  },

  // Approve Training Elements Review (Admin only)
  approveTrainingElementsReview: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const adminId = (req as any).userId; // From auth middleware
      const adminName = (req as any).userName || 'Admin';

      const review = await TrainingElementsReview.findByIdAndUpdate(
        id,
        {
          reviewStatus: 'approved',
          reviewedBy: adminId,
          reviewedByName: adminName,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || ''
        },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ message: 'Training elements review not found' });
      }

      // Log to audit trail
      await AuditService.logAction(
        adminId,
        adminName,
        'UPDATE_APPLICATION',
        'TrainingElementsReview',
        review._id.toString(),
        `Training elements review approved for ${review.applicantName} from ${review.company}`
      );

      res.json({
        message: 'Training elements review approved successfully',
        review
      });
    } catch (error: any) {
      console.error('Error approving training elements review:', error);
      res.status(500).json({ message: 'Error approving review', error: error.message });
    }
  },

  // Reject Training Elements Review (Admin only)
  rejectTrainingElementsReview: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const adminId = (req as any).userId; // From auth middleware
      const adminName = (req as any).userName || 'Admin';

      if (!reviewNotes) {
        return res.status(400).json({ message: 'Review notes are required for rejection' });
      }

      const review = await TrainingElementsReview.findByIdAndUpdate(
        id,
        {
          reviewStatus: 'rejected',
          reviewedBy: adminId,
          reviewedByName: adminName,
          reviewedAt: new Date(),
          reviewNotes
        },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ message: 'Training elements review not found' });
      }

      // Log to audit trail
      await AuditService.logAction(
        adminId,
        adminName,
        'UPDATE_APPLICATION',
        'TrainingElementsReview',
        review._id.toString(),
        `Training elements review rejected for ${review.applicantName} from ${review.company}: ${reviewNotes}`
      );

      res.json({
        message: 'Training elements review rejected successfully',
        review
      });
    } catch (error: any) {
      console.error('Error rejecting training elements review:', error);
      res.status(500).json({ message: 'Error rejecting review', error: error.message });
    }
  },

  // Request Clarification on Training Elements Review (Admin only)
  requestClarificationTrainingElements: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const adminId = (req as any).userId; // From auth middleware
      const adminName = (req as any).userName || 'Admin';

      if (!reviewNotes) {
        return res.status(400).json({ message: 'Clarification notes are required' });
      }

      const review = await TrainingElementsReview.findByIdAndUpdate(
        id,
        {
          reviewStatus: 'needs_clarification',
          reviewedBy: adminId,
          reviewedByName: adminName,
          reviewedAt: new Date(),
          reviewNotes
        },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ message: 'Training elements review not found' });
      }

      // Log to audit trail
      await AuditService.logAction(
        adminId,
        adminName,
        'OTHER',
        'TrainingElementsReview',
        review._id.toString(),
        `Clarification requested for training elements review - ${review.applicantName} from ${review.company}: ${reviewNotes}`
      );

      res.json({
        message: 'Clarification request sent successfully',
        review
      });
    } catch (error: any) {
      console.error('Error requesting clarification:', error);
      res.status(500).json({ message: 'Error requesting clarification', error: error.message });
    }
  }
};
