import { Response } from 'express';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { AuthRequest, generateToken } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { UserClassificationService } from '../services/UserClassificationService';
import { AuditService } from '../services/AuditService';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, country } = req.body;

    // Security: Validate role and email
    let finalRole = 'Applicant'; // Default role
    let accountType = 'applicant';
    
    if (role === 'Admin') {
      // Admin registration only allowed with @admin email
      if (!email.includes('@admin')) {
        return res.status(400).json({ 
          message: 'Admin accounts must use an email address containing @admin (e.g., admin@admin.com)' 
        });
      }
      finalRole = 'Admin';
      accountType = 'admin';
    } else if (role === 'SuperAdmin') {
      // SuperAdmin registration only allowed with @superadmin email
      if (!email.includes('@superadmin')) {
        return res.status(400).json({ 
          message: 'Super Admin accounts must use an email address containing @superadmin (e.g., superadmin@superadmin.com)' 
        });
      }
      finalRole = 'SuperAdmin';
      accountType = 'superadmin';
    } else if (role === 'Audit') {
      // Audit account registration only allowed with @admin.audit email
      if (!email.includes('@admin.audit')) {
        return res.status(400).json({ 
          message: 'Audit accounts must use an email address containing @admin.audit (e.g., auditor@admin.audit)' 
        });
      }
      finalRole = 'Admin'; // Audit accounts have Admin role
      accountType = 'audit';
    } else if (role && role !== 'Applicant') {
      // Reject any other roles
      return res.status(403).json({ 
        message: 'Invalid account type. Only applicant, admin, super admin, and audit accounts are supported.' 
      });
    }

    // Validate country for applicants only
    if (finalRole === 'Applicant' && !country) {
      console.warn('⚠ Country is required for applicant but not provided');
      return res.status(400).json({ message: 'Country is required for applicant registration' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('⚠ User already exists:', email);
      return res.status(409).json({ message: 'User already exists' });
    }

    // Create new user
    const userData: any = {
      email,
      password_hash: password,
      role: finalRole,
      accountType: accountType,
    };

    // Grant audit trail access to audit accounts by default
    if (accountType === 'audit') {
      userData.canAccessAuditTrail = true;
    }

    // Only set applicant-specific fields for applicants
    if (finalRole === 'Applicant') {
      const applicationType = country === 'Zimbabwe' ? 'local' : 'expatriate';
      userData.country = country;
      userData.applicationType = applicationType;
      console.log('✓ Setting applicant fields - country: ' + country + ', applicationType: ' + applicationType);
    }

    const user = new User(userData);

    console.log('User object before save:');
    console.log('  - email:', user.email);
    console.log('  - role:', user.role);
    console.log('  - country:', user.country);
    console.log('  - applicationType:', user.applicationType);

    // Set user classification
    if ('getClassification' in user) {
      user.userClassification = (user as any).getClassification();
      console.log('  - userClassification:', user.userClassification);
    }

    const savedUser = await user.save();
    console.log('✓ User saved to database');
    console.log('User object after save:');
    console.log('  - _id:', savedUser._id);
    console.log('  - email:', savedUser.email);
    console.log('  - role:', savedUser.role);
    console.log('  - country:', savedUser.country);
    console.log('  - applicationType:', savedUser.applicationType);
    console.log('  - userClassification:', savedUser.userClassification);

    const token = generateToken(user._id.toString(), user.role);
    const classification = UserClassificationService.classifyUser(user);
    const dashboardInfo = UserClassificationService.getDashboardInfo(classification, user);

    console.log('✓ Registration response prepared:');
    console.log('  - classification:', classification.classification);
    console.log('  - dashboard:', classification.dashboard);
    console.log('  - Response will include:');
    console.log('    - country:', savedUser.country);
    console.log('    - applicationType:', savedUser.applicationType);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        country: savedUser.country,
        applicationType: savedUser.applicationType,
        userClassification: savedUser.userClassification,
      },
      classification: classification,
      dashboard: classification.dashboard,
      dashboardInfo: dashboardInfo,
    });
    
    console.log('✓ Registration response sent\n');
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    console.log('\n=== BACKEND: login ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('📧 Login attempt for:', email);
    console.log('  - Password provided: ', !!password);
    console.log('  - Password length:', password?.length);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials'
      });
    }

    console.log('✓ User found:', email);
    console.log('  - Current applicationType:', user.applicationType);
    console.log('  - Current country:', user.country);
    console.log('  - Role:', user.role);
    console.log('  - Password hash exists:', !!user.password_hash);

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();

      // Lock account after 3 failed attempts for 5 minutes
      if (user.failedLoginAttempts >= 3) {
        user.locked = true;
        user.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await user.save();

        // Log suspicious activity for ALL account types
        await AuditService.logAction(
          user._id.toString(),
          user.email,
          'OTHER',
          'User',
          user._id.toString(),
          `Account locked due to 3 failed login attempts`,
          {
            status: 'FAILURE',
            errorMessage: 'Account locked - too many failed attempts',
            ipAddress: req.ip,
          }
        );

        return res.status(401).json({
          message: 'Account locked due to too many failed login attempts. Try again in 5 minutes.',
        });
      }

      await user.save();

      console.warn('⚠️ ❌ Invalid password for:', email);
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Check if account is locked
    if (user.locked && user.lockedUntil) {
      if (new Date() < user.lockedUntil) {
        // Calculate remaining minutes
        const remainingMs = user.lockedUntil.getTime() - new Date().getTime();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return res.status(401).json({
          message: `Account is locked. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        });
      } else {
        // Unlock account if lock time has passed
        user.locked = false;
        user.lockedUntil = undefined;
        user.failedLoginAttempts = 0;
      }
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = undefined;

    // Track if we need to save user changes
    let needsSave = false;

    // Check for accepted applications and update membership status
    if (user.role === 'Applicant') {
      const acceptedApplication = await Application.findOne({
        userId: user._id,
        status: { $in: ['Approved', 'Passed'] }
      });

      if (acceptedApplication && user.membershipStatus !== 'member') {
        console.log('✓ User has accepted application, updating to member status');
        user.membershipStatus = 'member';
        user.role = 'Member'; // Update role as well
        user.accountType = 'member';
        needsSave = true;
        console.log('  - Updated membershipStatus to: member');
        console.log('  - Updated role to: Member');
        console.log('  - Updated accountType to: member');
      }
    }

    // Ensure user has country and applicationType (migration for old accounts ONLY)
    
    // For Applicants: ensure country is set (only for old accounts without it)
    if (user.role === 'Applicant' && !user.country) {
      console.log('⚠ Old account migrated - no country found, setting to Zimbabwe');
      user.country = 'Zimbabwe';
      needsSave = true;
    }
    
    if (user.role === 'Applicant' && !user.applicationType) {
      const newType = user.country === 'Zimbabwe' ? 'local' : 'expatriate';
      console.log('⚠ Old account migrated - no applicationType found, calculating from country');
      console.log('  - Country:', user.country);
      console.log('  - Setting applicationType to:', newType);
      user.applicationType = newType;
      needsSave = true;
    }
    
    // For non-applicant accounts: ensure applicationType is undefined (not null)
    if (user.role !== 'Applicant' && user.applicationType === null) {
      console.log('⚠ Non-applicant account with null applicationType, setting to undefined');
      user.applicationType = undefined;
      needsSave = true;
    }
    
    if (needsSave) {
      await user.save(); // Save the migration
      console.log('✓ Migrated old user on login:', email);
      console.log('  - applicationType now:', user.applicationType);
      console.log('  - country now:', user.country);
    }

    // Update userClassification if needed
    const calculatedClassification = ('getClassification' in user) ? (user as any).getClassification() : 'local_applicant';
    if (user.userClassification !== calculatedClassification) {
      console.log('📝 Updating userClassification:', calculatedClassification);
      user.userClassification = calculatedClassification;
      await user.save();
    }

    const token = generateToken(user._id.toString(), user.role);
    const classification = UserClassificationService.classifyUser(user);
    const dashboardInfo = UserClassificationService.getDashboardInfo(classification, user);

    console.log('✓ Login successful for:', email);
    console.log('  - applicationType:', user.applicationType);
    console.log('  - country:', user.country);
    console.log('  - classification:', classification.classification);
    console.log('  - dashboard:', classification.dashboard);

    // Log the successful login to audit trail
    // Log ALL logins (for complete audit trail coverage)
    await AuditService.logLogin(user._id.toString(), user.email, user.email, req);

    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        country: user.country,
        applicationType: user.applicationType,
        userClassification: user.userClassification,
        canAccessAuditTrail: user.canAccessAuditTrail,
        accountType: user.accountType,
      },
      classification: classification,
      dashboard: classification.dashboard,
      dashboardInfo: dashboardInfo,
    };

    console.log('📤 Sending login response with:');
    console.log('  - country:', response.user.country);
    console.log('  - applicationType:', response.user.applicationType);
    console.log('  - classification:', response.classification?.classification);
    console.log('  - dashboard:', response.dashboard);
    console.log('=== END login ===\n');
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    console.log('\n=== BACKEND: getCurrentUser (/auth/me) ===');
    console.log('Fetching user for ID:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      console.warn('⚠ User not found for ID:', req.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✓ User found:', user.email);
    console.log('  - Current applicationType:', user.applicationType);
    console.log('  - Current country:', user.country);

    // Migration: set default country and applicationType for old accounts
    let needsSave = false;
    
    if (user.role === 'Applicant') {
      if (!user.country) {
        console.log('⚠ No country found, setting to Zimbabwe');
        user.country = 'Zimbabwe';
        needsSave = true;
      }
      if (!user.applicationType) {
        console.log('⚠ No applicationType found, calculating from country:', user.country);
        user.applicationType = user.country === 'Zimbabwe' ? 'local' : 'expatriate';
        needsSave = true;
      }
    }

    // Save if we made any migrations
    if (needsSave) {
      await user.save();
      console.log('✓ Migrated user account:', user.email, 'with applicationType:', user.applicationType);
    }

    // Update userClassification if needed
    const calculatedClassification = ('getClassification' in user) ? (user as any).getClassification() : 'local_applicant';
    if (user.userClassification !== calculatedClassification) {
      console.log('📝 Updating userClassification:', calculatedClassification);
      user.userClassification = calculatedClassification;
      await user.save();
    }

    const classification = UserClassificationService.classifyUser(user);
    const dashboardInfo = UserClassificationService.getDashboardInfo(classification, user);

    console.log('✓ Preparing response with:');
    console.log('  - applicationType:', user.applicationType);
    console.log('  - classification:', classification);
    console.log('  - dashboard:', classification.dashboard);

    // Return user data (excluding password)
    const response = {
      id: user._id,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      country: user.country,
      applicationType: user.applicationType,
      userClassification: user.userClassification,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      classification: classification,
      dashboard: classification.dashboard,
      dashboardInfo: dashboardInfo,
    };
    
    console.log('📤 Sending response with country:', response.country, 'applicationType:', response.applicationType);
    console.log('=== END getCurrentUser ===\n');
    
    res.json(response);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
