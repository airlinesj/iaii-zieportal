import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { cpdController } from '../controllers/cpdController';
import { authMiddleware } from '../middleware/auth';

const router: Router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/cpd');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

// Public routes
// POST: Submit CPD Application (public endpoint)
router.post(
  '/applications',
  upload.fields([
    { name: 'curriculum', maxCount: 1 },
    { name: 'profiles', maxCount: 1 },
    { name: 'payment', maxCount: 1 }
  ]),
  cpdController.createApplication
);

// Admin routes (protected)
// GET: Fetch all CPD applications
router.get(
  '/applications',
  authMiddleware,
  cpdController.getApplications
);

// GET: Fetch single CPD application
router.get(
  '/applications/:id',
  authMiddleware,
  cpdController.getApplication
);

// PUT: Update CPD application (Admin only)
router.put(
  '/applications/:id',
  authMiddleware,
  cpdController.updateApplication
);

// POST: Assess CPD application (Admin only)
router.post(
  '/applications/:id/assess',
  authMiddleware,
  cpdController.assessApplication
);

// DELETE: Delete CPD application (Admin only)
router.delete(
  '/applications/:id',
  authMiddleware,
  cpdController.deleteApplication
);

// GET: Download file
router.get(
  '/applications/:id/files/:fileType',
  authMiddleware,
  cpdController.downloadFile
);

// ===== PAYMENT & APPROVAL ROUTES =====

// POST: Approve CPD application for payment (Admin only)
router.post(
  '/applications/:id/approve',
  authMiddleware,
  cpdController.approveApplication
);

// POST: Reject CPD application (Admin only)
router.post(
  '/applications/:id/reject',
  authMiddleware,
  cpdController.rejectApplication
);

// POST: Upload payment proof
router.post(
  '/applications/:id/payment-proof',
  authMiddleware,
  upload.single('paymentProof'),
  cpdController.uploadPaymentProof
);

// POST: Initiate payment
router.post(
  '/applications/:id/initiate-payment',
  authMiddleware,
  cpdController.initiatePayment
);

// POST: Complete payment
router.post(
  '/applications/:id/complete-payment',
  authMiddleware,
  cpdController.completePayment
);

// PUT: Verify payment (Admin only)
router.put(
  '/applications/:id/verify-payment',
  authMiddleware,
  cpdController.verifyPayment
);

// GET: Fetch pending approvals (Admin only)
router.get(
  '/admin/pending-approvals',
  authMiddleware,
  cpdController.getPendingApprovals
);

// GET: Fetch pending payments (Admin only)
router.get(
  '/admin/pending-payments',
  authMiddleware,
  cpdController.getPendingPayments
);

// GET: Fetch user's CPD applications
router.get(
  '/my-applications',
  authMiddleware,
  cpdController.getUserApplications
);

// ===== CPD DURATION FEE CALCULATION ROUTES =====

// POST: Calculate CPD fee based on course duration (Public endpoint)
router.post(
  '/calculate-fee',
  cpdController.calculateDurationFee
);

// GET: Get available CPD duration fee options (Public endpoint)
router.get(
  '/fee-options',
  cpdController.getDurationFeeOptions
);

// ===== TRAINING ELEMENTS REVIEW ROUTES (Admin only) =====

// GET: Fetch all Training Elements Reviews
router.get(
  '/admin/training-elements-reviews',
  authMiddleware,
  cpdController.getTrainingElementsReviews
);

// GET: Fetch single Training Elements Review
router.get(
  '/admin/training-elements-reviews/:id',
  authMiddleware,
  cpdController.getTrainingElementsReview
);

// POST: Approve Training Elements Review
router.post(
  '/admin/training-elements-reviews/:id/approve',
  authMiddleware,
  cpdController.approveTrainingElementsReview
);

// POST: Reject Training Elements Review
router.post(
  '/admin/training-elements-reviews/:id/reject',
  authMiddleware,
  cpdController.rejectTrainingElementsReview
);

// POST: Request Clarification on Training Elements
router.post(
  '/admin/training-elements-reviews/:id/request-clarification',
  authMiddleware,
  cpdController.requestClarificationTrainingElements
);

export default router;
