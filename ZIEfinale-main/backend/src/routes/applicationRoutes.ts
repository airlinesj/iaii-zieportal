import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import {
  createApplication,
  createExpatriateApplication,
  getApplicationByUser,
  getApplicationById,
  updateApplicationStatus,
  getAllApplications,
  getApplicationsAwaitingApproval,
  updateApplicationChecklist,
  getVerificationReport,
  getApplicationPreview,
  uploadPaymentProof,
  verifyPayment,
  processPayment,
  setManualGrade,
  addAdminApproval,
  sendInterviewNotification,
  updateReferees,
  getCertificate,
  passInterview,
  confirmExpatriateAdmission,
  sendApprenticeAppraisalForm,
} from '../controllers/applicationController';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { multipleUploadPDF, uploadPaymentProofPDF } from '../middleware/fileUpload';
import { parseFormDataFields } from '../middleware/parseFormDataFields';
import { registerFileUpload } from '../middleware/fileAccessControl';
import { sendRefereeAppraisalEmail, sendSponsorAppraisalEmail } from '../services/emailService';

const router = Router();

// Validation rules
const applicationValidation = [
  body('personalParticulars').notEmpty(),
  body('chosenGrade').isIn(['Student', 'Graduate', 'Technician', 'Technologist', 'Member', 'Fellow']),
  body('chosenSpecialistDivision').notEmpty(),
  body('referees').isArray(),
];

// Routes
// Specific routes first
// DEBUG: Check SMTP configuration
router.get('/admin/debug/smtp-config', (req: Request, res: Response) => {
  res.json({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? '***configured***' : 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
});

// TEST: Send test email to verify email service is working
router.post('/admin/debug/test-email', async (req: Request, res: Response) => {
  try {
    const { toEmail, sponsorName, applicantName } = req.body;
    
    if (!toEmail) {
      return res.status(400).json({ error: 'toEmail required' });
    }

    console.log('🧪 [TEST EMAIL] Sending test email to:', toEmail);
    
    const result = await sendSponsorAppraisalEmail({
      applicantName: applicantName || 'Test Applicant',
      applicantEmail: 'test@example.com',
      sponsorName: sponsorName || 'Test Sponsor',
      sponsorEmail: toEmail,
      applicationId: 'test-app-id',
      sponsorToken: 'test-token-12345',
    });

    console.log('🧪 [TEST EMAIL] Result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${toEmail}`,
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        message: `Failed to send test email to ${toEmail}`
      });
    }
  } catch (error: any) {
    console.error('🧪 [TEST EMAIL] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.get('/admin/all', authMiddleware, adminMiddleware, getAllApplications);
router.get('/admin/awaiting-approval', authMiddleware, adminMiddleware, getApplicationsAwaitingApproval);

// POST routes with IDs
router.post('/:id/payment-proof', authMiddleware, uploadPaymentProofPDF, registerFileUpload, uploadPaymentProof);
router.post('/:id/process-payment', authMiddleware, processPayment);
router.post('/:id/manual-grade', authMiddleware, adminMiddleware, setManualGrade);
router.post('/:id/approve-interview', authMiddleware, adminMiddleware, addAdminApproval);
router.post('/:id/send-interview-notification', authMiddleware, adminMiddleware, sendInterviewNotification);
router.post('/:id/pass-interview', authMiddleware, adminMiddleware, passInterview);
router.post('/:id/expatriate-admission', authMiddleware, adminMiddleware, confirmExpatriateAdmission);
router.post('/:id/send-apprentice-appraisal', authMiddleware, adminMiddleware, sendApprenticeAppraisalForm);

// PUT routes with IDs
router.put('/:id/status', authMiddleware, adminMiddleware, updateApplicationStatus);
router.put('/:id/checklist', authMiddleware, adminMiddleware, updateApplicationChecklist);
router.put('/:id/referees', authMiddleware, updateReferees);
router.put('/:id/verify-payment', authMiddleware, adminMiddleware, verifyPayment);

// GET routes with IDs
router.get('/:id/preview', authMiddleware, adminMiddleware, getApplicationPreview);
router.get('/:id/verification-report', authMiddleware, adminMiddleware, getVerificationReport);
router.get('/:id/certificate', authMiddleware, getCertificate);

// Root routes (must be last to avoid catching ID routes)
// Specific POST route for expatriate applications (must come before generic POST)
router.post('/expatriate', authMiddleware, multipleUploadPDF, registerFileUpload, parseFormDataFields, createExpatriateApplication);
// Generic POST route for local applications
router.post('/', authMiddleware, multipleUploadPDF, registerFileUpload, parseFormDataFields, applicationValidation, createApplication);
router.get('/', authMiddleware, getApplicationByUser);
router.get('/:id', authMiddleware, getApplicationById);

export default router;
