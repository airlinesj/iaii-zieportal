import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

// Custom validator for admin/superadmin email
const adminEmailValidator = (value: string, { req }: any) => {
  if (req.body.role === 'Admin' && !value.includes('@admin')) {
    throw new Error('Admin email must contain @admin');
  }
  if (req.body.role === 'SuperAdmin' && !value.includes('@superadmin')) {
    throw new Error('Super Admin email must contain @superadmin');
  }
  if (req.body.role === 'Audit' && !value.includes('@admin.audit')) {
    throw new Error('Audit account email must contain @admin.audit');
  }
  return true;
};

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .custom(adminEmailValidator),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain lowercase letters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase letters')
    .matches(/[0-9]/)
    .withMessage('Password must contain numbers')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain special characters (@$!%*?&)'),
  body('role').optional().isIn(['Applicant', 'Admin', 'SuperAdmin', 'Audit']),
  body('country')
    .custom((value, { req }) => {
      // Country is required only for applicants
      if (req.body.role === 'Applicant' || !req.body.role) {
        if (!value || value.trim() === '') {
          throw new Error('Country is required for applicants');
        }
      }
      return true;
    }),
];

const loginValidation = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
