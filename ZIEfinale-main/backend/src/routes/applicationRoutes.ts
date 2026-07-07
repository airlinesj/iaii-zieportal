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
import { sendRefereeAppraisalEmail, sendSponsorAppraisalEmail, testSMTPConnection, sendTestEmail } from '../services/emailService';

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

// Admin routes (require authentication)
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

// Email testing routes (admin only, for debugging)
router.get('/test/smtp-connection', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await testSMTPConnection();
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/test/send-email', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { toEmail } = req.body;
    
    if (!toEmail || !toEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid email address required in body: { toEmail: "test@example.com" }' 
      });
    }
    
    console.log('📧 Admin requested test email to:', toEmail);
    const result = await sendTestEmail(toEmail);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root routes (must be last to avoid catching ID routes)
// Specific POST route for expatriate applications (must come before generic POST)
router.post('/expatriate', authMiddleware, multipleUploadPDF, registerFileUpload, parseFormDataFields, createExpatriateApplication);
// Generic POST route for local applications
router.post('/', authMiddleware, multipleUploadPDF, registerFileUpload, parseFormDataFields, applicationValidation, createApplication);
router.get('/', authMiddleware, getApplicationByUser);
router.get('/:id', authMiddleware, getApplicationById);

export default router;
