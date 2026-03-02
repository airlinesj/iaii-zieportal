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
  body('password').isLength({ min: 6 }),
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

// DEBUG ENDPOINT - Check database users (remove in production)
router.get('/debug/users', async (req, res) => {
  try {
    console.log('\n=== DEBUG: Checking users in database ===');
    const users = await User.find({}, { email: 1, role: 1, country: 1, applicationType: 1, password_hash: 1 });
    console.log(`Found ${users.length} users in database`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Role: ${user.role}, Password hash exists: ${!!user.password_hash}`);
    });
    
    res.json({
      message: `Found ${users.length} users in database`,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        country: u.country,
        applicationType: u.applicationType,
        passwordHashExists: !!u.password_hash,
        passwordHashLength: u.password_hash?.length || 0
      }))
    });
  } catch (error) {
    console.error('DEBUG Error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
