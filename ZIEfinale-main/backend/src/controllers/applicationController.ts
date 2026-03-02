import { Response } from 'express';
import { Application } from '../models/Application';
import { MembershipGrade } from '../models/MembershipGrade';
import { AuthRequest } from '../middleware/auth';
import { calculateApplicationFee } from '../middleware/feeCalculation';
import { sendSponsorAppraisalEmail, sendApplicationConfirmationEmail, sendInterviewNotificationEmail, sendStatusUpdateEmail } from '../services/emailService';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import GradingService from '../services/GradingService';
import DivisionMappingService from '../services/DivisionMappingService';
import AdminVerificationService from '../services/AdminVerificationService';
import RegistrationNumberService from '../services/RegistrationNumberService';
import { deleteUploadedFile } from '../middleware/fileUpload';
import { AuditService } from '../services/AuditService';
import { ApplicationValidationService } from '../services/ApplicationValidationService';
import { User } from '../models/User';

export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== Creating Application ===');
    console.log('User ID:', req.userId);
    console.log('Request Files:', (req.files as any)?.nationalIdCopy ? 'Yes' : 'No');
    
    // Verify user is authenticated
    if (!req.userId) {
      console.error('User ID is missing - authentication may have failed');
      return res.status(401).json({ message: 'User authentication required. Please log in again.' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle both JSON and FormData payloads
    let personalParticulars: any;
    let education: any;
    let experience: any;
    let chosenGrade: string;
    let chosenSpecialistDivision: string;
    let sponsors: any;

    // Parse FormData fields (they come as strings when sent via FormData)
    if (req.body.personalParticulars && typeof req.body.personalParticulars === 'string') {
      // FormData payload - fields are stringified JSON
      console.log('Parsing FormData payload');
      personalParticulars = JSON.parse(req.body.personalParticulars);
      education = req.body.education ? JSON.parse(req.body.education) : [];
      experience = req.body.experience ? JSON.parse(req.body.experience) : [];
      chosenGrade = req.body.chosenGrade;
      chosenSpecialistDivision = req.body.chosenSpecialistDivision;
      sponsors = req.body.referees ? JSON.parse(req.body.referees) : [];
    } else {
      // Regular JSON payload
      console.log('Parsing JSON payload');
      personalParticulars = req.body.personalParticulars;
      education = req.body.education;
      experience = req.body.experience;
      chosenGrade = req.body.chosenGrade;
      chosenSpecialistDivision = req.body.chosenSpecialistDivision;
      sponsors = req.body.referees || req.body.sponsors;
    }

    console.log('Parsed Data:', { personalParticulars, chosenGrade, sponsorsCount: sponsors?.length });

    // Check for duplicate submission - prevent users from submitting same form twice
    const duplicateCheck = await ApplicationValidationService.checkForDuplicateSubmission(
      req.userId as string,
      chosenGrade,
      req.body.applicationType || 'local'
    );

    if (duplicateCheck.hasDuplicate) {
      console.warn('⚠️  Duplicate application attempted:', duplicateCheck.message);
      return res.status(409).json({ 
        message: duplicateCheck.message,
        existingApplicationId: duplicateCheck.existingApplication?.id,
        statusSuggestion: 'Please update your existing application or contact support if you need to apply for a different grade'
      });
    }

    // Validate required fields before processing
    if (!personalParticulars || !personalParticulars.firstName || !personalParticulars.lastName) {
      return res.status(400).json({ message: 'Personal particulars (first name and last name) are required' });
    }
    if (!personalParticulars.email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!personalParticulars.phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!personalParticulars.nationalId) {
      return res.status(400).json({ message: 'National ID is required' });
    }
    if (!personalParticulars.dateOfBirth) {
      return res.status(400).json({ message: 'Date of birth is required' });
    }
    if (!personalParticulars.nationality) {
      return res.status(400).json({ message: 'Nationality is required' });
    }
    if (!chosenGrade) {
      return res.status(400).json({ message: 'Membership grade is required' });
    }
    if (!chosenSpecialistDivision) {
      return res.status(400).json({ message: 'Specialist division is required' });
    }

    // Get membership grade to verify requirements
    const grade = await MembershipGrade.findOne({ gradeName: chosenGrade });
    if (!grade) {
      return res.status(400).json({ message: 'Invalid membership grade' });
    }

    // Calculate application fee
    const exchangeRate = parseFloat(process.env.EXCHANGE_RATE || '0.015');
    const applicationFee = calculateApplicationFee(grade.baseFee, exchangeRate);

    // Create sponsors with tokens
    console.log('📧 [SPONSOR DATA] Received sponsors from request:');
    console.log('   Raw sponsors:', JSON.stringify(sponsors));
    
    const processedSponsors = sponsors.map((sponsor: any) => ({
      sponsorName: sponsor.name || sponsor.sponsorName,
      sponsorEmail: sponsor.email || sponsor.sponsorEmail,
      appraisalToken: crypto.randomBytes(32).toString('hex'),
      isConfidential: true,
    }));

    console.log('📧 [SPONSOR DATA] Processed sponsors:');
    processedSponsors.forEach((s: any, i: number) => {
      console.log(`   Sponsor ${i + 1}: "${s.sponsorName}" <${s.sponsorEmail}>`);
    });

    // Create application
    const application = new Application({
      userId: req.userId,
      personalParticulars,
      education: education || [],
      experience: experience || [],
      chosenGrade,
      chosenSpecialistDivision,
      applicationFee,
      documents: {},
      sponsors: processedSponsors,
      uploadedFiles: {
        nationalIdPath: (req.files as any)?.nationalIdCopy?.[0]?.filename || '',
        certificatePaths: (req.files as any)?.certificateFiles?.map((f: any) => f.filename) || [],
        technicalReportPath: (req.files as any)?.technicalReport?.[0]?.filename || '',
      },
      userSummary: `Ready for Review: ${personalParticulars.firstName} ${personalParticulars.lastName} applied for ${chosenGrade}`,
    });

    // Auto-evaluate grade and division using services
    application.suggestedGrade = GradingService.evaluateGrade(application);
    application.suggestedDivision = DivisionMappingService.assignDivision(
      education && education[0]?.qualification ? education[0].qualification : chosenSpecialistDivision
    );

    await application.save();

    // Update status to Submitted
    application.status = 'Submitted';
    await application.save();

    // RETURN RESPONSE IMMEDIATELY - Don't wait for email sending
    res.status(201).json({
      message: 'Application created successfully',
      application: {
        id: application._id,
        status: application.status,
        applicationFee,
      },
    });

    // Send emails asynchronously in the background (don't block the response)
    setImmediate(async () => {
      try {
        console.log('📧 [ASYNC EMAIL] Starting background email processes...');
        
        // Send confirmation email to applicant
        try {
          await sendApplicationConfirmationEmail(
            personalParticulars.email,
            `${personalParticulars.firstName} ${personalParticulars.lastName}`,
            application._id.toString()
          );
          console.log('✓ Confirmation email sent to applicant');
        } catch (error) {
          console.error('❌ Failed to send applicant confirmation email:', error);
        }

        // Send appraisal emails to sponsors
        console.log('📧 [ASYNC EMAIL] Starting sponsor email send process...');
        console.log('   Total sponsors to email:', processedSponsors.length);
        
        for (const sponsor of processedSponsors) {
          try {
            console.log(`📧 [ASYNC EMAIL] Sending to: "${sponsor.sponsorName}" <${sponsor.sponsorEmail}>`);
            const result = await sendSponsorAppraisalEmail({
              applicantName: `${personalParticulars.firstName} ${personalParticulars.lastName}`,
              applicantEmail: personalParticulars.email,
              sponsorName: sponsor.sponsorName,
              sponsorEmail: sponsor.sponsorEmail,
              applicationId: application._id.toString(),
              sponsorToken: sponsor.appraisalToken,
            });
            console.log(`📧 [ASYNC EMAIL] Result for ${sponsor.sponsorEmail}:`, result.success ? '✓ SUCCESS' : '✗ FAILED');
          } catch (error) {
            console.error(`❌ [ASYNC EMAIL] Exception sending to ${sponsor.sponsorEmail}:`, error);
          }
        }
        
        // Send admin notification email
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@zie.org.zw';
        try {
          await sendApplicationConfirmationEmail(
            adminEmail,
            'Admin',
            application._id.toString()
          );
          console.log('✓ Admin notification email sent');
        } catch (error) {
          console.error('❌ Failed to send admin notification:', error);
        }
        
        console.log('📧 [ASYNC EMAIL] All background emails completed');
      } catch (error) {
        console.error('⚠️ Error in background email process:', error);
        // Errors here don't affect the user since they already got the success response
      }
    });
  } catch (error: any) {
    console.error('=== Error creating application ===');
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error:', error);
    
    // Clean up uploaded files if application creation fails
    if ((req.files as any)?.nationalIdCopy?.[0]?.filename) {
      deleteUploadedFile((req.files as any).nationalIdCopy[0].filename);
    }
    if ((req.files as any)?.certificateFiles) {
      (req.files as any).certificateFiles.forEach((file: any) => {
        deleteUploadedFile(file.filename);
      });
    }
    if ((req.files as any)?.technicalReport?.[0]?.filename) {
      deleteUploadedFile((req.files as any).technicalReport[0].filename);
    }
    
    // Return error response with safe, serializable data
    const errorResponse = {
      message: error?.message || 'Failed to create application',
      error: error?.message || 'Unknown error',
    };
    
    res.status(500).json(errorResponse);
  }
};

export const createExpatriateApplication = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== Creating Expatriate Application ===');
    console.log('User ID:', req.userId);
    
    // Verify user is authenticated
    if (!req.userId) {
      console.error('User ID is missing - authentication may have failed');
      return res.status(401).json({ message: 'User authentication required. Please log in.' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Parse FormData fields
    let personalParticulars: any;
    let education: any;
    let experience: any;
    let membershipGrade: string;
    let chosenSpecialistDivision: string;
    let companyRecommendation: any;
    let apprenticeReferee: any;

    if (req.body.personalParticulars && typeof req.body.personalParticulars === 'string') {
      // FormData payload
      console.log('Parsing expatriate FormData payload');
      personalParticulars = JSON.parse(req.body.personalParticulars);
      education = req.body.education ? JSON.parse(req.body.education) : [];
      experience = req.body.experience ? JSON.parse(req.body.experience) : [];
      membershipGrade = req.body.membershipGrade;
      chosenSpecialistDivision = req.body.chosenSpecialistDivision;
      companyRecommendation = req.body.companyRecommendation ? JSON.parse(req.body.companyRecommendation) : {};
      apprenticeReferee = req.body.apprenticeReferee ? JSON.parse(req.body.apprenticeReferee) : {};
    } else {
      // Regular JSON payload
      console.log('Parsing expatriate JSON payload');
      personalParticulars = req.body.personalParticulars;
      education = req.body.education || [];
      experience = req.body.experience || [];
      membershipGrade = req.body.membershipGrade;
      chosenSpecialistDivision = req.body.chosenSpecialistDivision;
      companyRecommendation = req.body.companyRecommendation || {};
      apprenticeReferee = req.body.apprenticeReferee || {};
    }

    console.log('Parsed Expatriate Data:', { 
      firstName: personalParticulars?.firstName,
      lastName: personalParticulars?.lastName,
      phoneNumber: personalParticulars?.phoneNumber,
      idNumber: personalParticulars?.idNumber,
      dateOfBirth: personalParticulars?.dateOfBirth,
      membershipGrade,
      chosenSpecialistDivision,
      companyName: companyRecommendation?.companyName
    });

    // Check for duplicate submission - prevent users from submitting same form twice
    const duplicateCheck = await ApplicationValidationService.checkForDuplicateSubmission(
      req.userId as string,
      membershipGrade,
      'expatriate'
    );

    if (duplicateCheck.hasDuplicate) {
      console.warn('⚠️  Duplicate expatriate application attempted:', duplicateCheck.message);
      return res.status(409).json({ 
        message: duplicateCheck.message,
        existingApplicationId: duplicateCheck.existingApplication?.id,
        statusSuggestion: 'Please update your existing application or contact support if you need to apply for a different grade'
      });
    }

    // Validate required fields before processing
    if (!personalParticulars || !personalParticulars.firstName || !personalParticulars.lastName) {
      return res.status(400).json({ message: 'Personal particulars (first name and last name) are required' });
    }
    if (!personalParticulars.email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!personalParticulars.phoneNumber && personalParticulars.phoneNumber !== 0) {
      console.error('🔴 Phone number missing! Available fields:', Object.keys(personalParticulars));
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!personalParticulars.idNumber && personalParticulars.idNumber !== 0) {
      console.error('🔴 ID number missing! Available fields:', Object.keys(personalParticulars));
      return res.status(400).json({ message: 'Passport/National ID is required' });
    }
    if (!personalParticulars.dateOfBirth) {
      return res.status(400).json({ message: 'Date of birth is required' });
    }
    if (!personalParticulars.country) {
      return res.status(400).json({ message: 'Country is required' });
    }
    if (!personalParticulars.nationality) {
      return res.status(400).json({ message: 'Nationality is required' });
    }
    if (!membershipGrade) {
      return res.status(400).json({ message: 'Membership grade is required' });
    }
    // Specialist division is now optional for expatriate applications
    // if (!chosenSpecialistDivision) {
    //   return res.status(400).json({ message: 'Specialist division is required' });
    // }
    if (!companyRecommendation || !companyRecommendation.companyName) {
      return res.status(400).json({ message: 'Company recommendation details required' });
    }
    
    // Apprentice referee is now optional - validation commented out
    // console.log('🔍 Apprentice Referee Validation:');
    // console.log('  - apprenticeReferee:', apprenticeReferee);
    // console.log('  - refereeEmail:', apprenticeReferee?.refereeEmail);
    // console.log('  - refereeName:', apprenticeReferee?.refereeName);
    // console.log('  - Full object:', JSON.stringify(apprenticeReferee, null, 2));
    // 
    // if (!apprenticeReferee || !apprenticeReferee.refereeEmail) {
    //   console.error('❌ Missing apprentice referee email!');
    //   console.error('  - Full object:', JSON.stringify(apprenticeReferee, null, 2));
    //   return res.status(400).json({ 
    //     message: 'Apprentice referee email is required',
    //     receivedData: apprenticeReferee
    //   });
    // }
    // if (!apprenticeReferee.refereeName) {
    //   console.error('❌ Missing apprentice referee name!');
    //   return res.status(400).json({ message: 'Apprentice referee name is required' });
    // }

    // Get uploaded letter file (if any)
    const letterFile = (req.files as any)?.letterFile?.[0];

    // Get membership grade to verify it exists
    const grade = await MembershipGrade.findOne({ gradeName: membershipGrade });
    if (!grade) {
      return res.status(400).json({ message: 'Invalid membership grade' });
    }

    // Calculate application fee
    const exchangeRate = parseFloat(process.env.EXCHANGE_RATE || '0.015');
    const applicationFee = calculateApplicationFee(grade.baseFee, exchangeRate);

    // Map field names to schema expectations (phoneNumber -> phone, idNumber -> nationalId)
    const mappedPersonalParticulars = {
      firstName: personalParticulars.firstName,
      lastName: personalParticulars.lastName,
      email: personalParticulars.email,
      phone: personalParticulars.phoneNumber, // Map phoneNumber to phone
      nationalId: personalParticulars.idNumber, // Map idNumber to nationalId
      dateOfBirth: personalParticulars.dateOfBirth,
      nationality: personalParticulars.nationality,
      professionalNumber: personalParticulars.professionalNumber,
    };
    
    console.log('=== DEBUGGING MAPPED DATA ===');
    console.log('Mapped personalParticulars.phone:', mappedPersonalParticulars.phone);
    console.log('Mapped personalParticulars.nationalId:', mappedPersonalParticulars.nationalId);
    console.log('chosenSpecialistDivision:', chosenSpecialistDivision);
    console.log('Full mappedPersonalParticulars:', JSON.stringify(mappedPersonalParticulars));

    // Ensure education and experience are arrays
    const educationArray = Array.isArray(education) ? education : (education ? [education] : []);
    const experienceArray = Array.isArray(experience) ? experience : (experience ? [experience] : []);

    // Create expatriate application (no sponsors/referees)
    const application = new Application({
      userId: req.userId,
      personalParticulars: mappedPersonalParticulars,
      education: educationArray,
      experience: experienceArray,
      chosenGrade: membershipGrade,
      applicationFee,
      applicationType: 'expatriate',
      status: 'Draft',
      paymentStatus: 'pending',
      documents: {
        companyRecommendationLetterPath: letterFile?.filename || '',
      },
      uploadedFiles: {
        companyRecommendationLetterPath: letterFile?.filename || '',
      },
      companyRecommendation: {
        companyName: companyRecommendation.companyName,
        contactPerson: companyRecommendation.contactPerson,
        letterPath: letterFile?.filename || '',
      },
      sponsors: [], // No sponsors for expatriates
      apprenticeReferee: {
        refereeName: apprenticeReferee.refereeName,
        refereeEmail: apprenticeReferee.refereeEmail,
        refereeRelationship: apprenticeReferee.refereeRelationship,
        appraisalToken: crypto.randomBytes(32).toString('hex'),
      },
      adminApprovals: [],
      adminChecklist: {
        photo: false,
        m1Form: false,
        signature: false,
        trainingReport: false,
        projectReport: false,
        organogram: false,
        sponsorships: false,
        certificates: false,
      },
      adminNotes: '',
      confidentialFlag: false,
      userSummary: `Expatriate Application: ${personalParticulars.firstName} ${personalParticulars.lastName} applied for ${membershipGrade}`,
    });

    // Auto-evaluate grade and division using services
    application.suggestedGrade = GradingService.evaluateGrade(application);
    application.suggestedDivision = DivisionMappingService.assignDivision(
      education?.fieldOfEngineering || 'General'
    );

    // Save initial draft
    await application.save();
    console.log('✓ Expatriate application saved (Draft):', application._id);

    // Update status to Submitted
    application.status = 'Submitted';
    await application.save();
    console.log('✓ Expatriate application status updated to Submitted:', application._id);

    // RETURN RESPONSE IMMEDIATELY - Don't wait for email sending
    res.status(201).json({
      message: 'Expatriate application created successfully',
      id: application._id,
      application: {
        id: application._id,
        status: application.status,
        applicationFee,
        applicationType: 'expatriate',
      },
    });

    // Send emails asynchronously in the background (don't block the response)
    setImmediate(async () => {
      try {
        console.log('📧 [ASYNC EMAIL] Starting background email processes for expatriate...');
        
        // Send confirmation email to applicant
        try {
          await sendApplicationConfirmationEmail(
            mappedPersonalParticulars.email,
            `${mappedPersonalParticulars.firstName} ${mappedPersonalParticulars.lastName}`,
            application._id.toString()
          );
          console.log('✓ [ASYNC EMAIL] Confirmation email sent to applicant');
        } catch (error) {
          console.error('❌ [ASYNC EMAIL] Failed to send applicant confirmation email:', error);
        }

        // Send appraisal email to apprentice referee (if provided)
        if (apprenticeReferee && apprenticeReferee.refereeEmail) {
          try {
            console.log('📧 [ASYNC EMAIL] Sending appraisal email to apprentice referee:', apprenticeReferee.refereeEmail);
            const refereeToken = crypto.randomBytes(32).toString('hex');
            // Update the token in the application
            application.apprenticeReferee!.appraisalToken = refereeToken;
            await sendSponsorAppraisalEmail({
              applicantName: `${mappedPersonalParticulars.firstName} ${mappedPersonalParticulars.lastName}`,
              applicantEmail: mappedPersonalParticulars.email,
              sponsorName: apprenticeReferee.refereeName,
              sponsorEmail: apprenticeReferee.refereeEmail,
              applicationId: application._id.toString(),
              sponsorToken: refereeToken,
            });
            console.log('✓ [ASYNC EMAIL] Appraisal email sent to apprentice referee');
          } catch (emailError) {
            console.error('❌ [ASYNC EMAIL] Failed to send appraisal email to referee:', emailError);
          }
        } else {
          console.log('ℹ️  [ASYNC EMAIL] No apprentice referee provided - skipping appraisal email');
        }
        
        console.log('📧 [ASYNC EMAIL] All background emails completed for expatriate application');
      } catch (error) {
        console.error('⚠️ [ASYNC EMAIL] Error in background email process:', error);
      }
    });
  } catch (error: any) {
    console.error('=== Error creating expatriate application ===');
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error:', error);
    
    // Clean up uploaded files if application creation fails
    if ((req.files as any)?.letterFile?.[0]?.filename) {
      deleteUploadedFile((req.files as any).letterFile[0].filename);
    }
    
    const errorResponse = {
      message: error?.message || 'Failed to create expatriate application',
      error: error?.message || 'Unknown error',
    };
    
    res.status(500).json(errorResponse);
  }
};

export const getApplicationByUser = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await Application.find({ userId: req.userId });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns the application or is admin
    if (application.userId.toString() !== req.userId && req.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Hide sponsor responses from applicant view
    if (req.userRole !== 'Admin') {
      application.sponsors = application.sponsors.map((sponsor: any) => ({
        sponsorName: sponsor.sponsorName,
        sponsorEmail: sponsor.sponsorEmail,
        appraisalToken: sponsor.appraisalToken,
        isConfidential: sponsor.isConfidential,
      }));
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Validate status transition
    if (!AdminVerificationService.isValidStatusTransition(application.status, status, application)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${application.status} to ${status}`,
        reason: status === 'Approved' && !AdminVerificationService.canApprove(application) 
          ? 'All checklist items must be verified before approval'
          : application.status === 'Rejected' && status === 'Submitted'
          ? 'The 48-hour editing window for this application has expired'
          : 'Invalid status transition'
      });
    }

    const oldStatus = application.status;
    const admin = await User.findById(req.userId);
    application.status = status;

    // If rejecting, set rejection info with 48-hour edit window
    if (status === 'Rejected') {
      const now = new Date();
      const allowEditUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
      
      application.rejectionInfo = {
        rejectionTimestamp: now,
        rejectionReason: rejectionReason || 'Application not meeting requirements',
        rejectedBy: req.userId as any,
        rejectedByEmail: admin?.email || '',
        rejectedByName: admin?.email || 'Admin',
        allowEditUntil: allowEditUntil,
      };

      // Log rejection to audit trail
      await AuditService.logRejection(
        req.userId as string,
        admin?.email || '',
        admin?.email,
        id,
        application.personalParticulars.email,
        rejectionReason || 'Application not meeting requirements',
        req
      );
    }

    // Log approval to audit trail
    if (oldStatus !== 'Approved' && status === 'Approved') {
      await AuditService.logApproval(
        req.userId as string,
        admin?.email || '',
        admin?.email,
        id,
        application.personalParticulars.email,
        req
      );
    }

    // If re-submitting after rejection, clear rejection info
    if (oldStatus === 'Rejected' && status === 'Submitted') {
      application.rejectionInfo = undefined;
    }

    await application.save();

    // Send status update email to applicant
    try {
      let customMessage;
      if (status === 'Rejected') {
        customMessage = `Your application has been rejected. Reason: ${application.rejectionInfo?.rejectionReason}. You have 48 hours to make corrections and re-submit your application.`;
      } else if (oldStatus === 'Rejected' && status === 'Submitted') {
        customMessage = 'Your updated application has been received and will be reviewed by the admin team.';
      }
      
      await sendStatusUpdateEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        status,
        customMessage
      );
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the request if email fails
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await Application.find().populate('userId', 'email');
    
    console.log('📋 getAllApplications called - Filtering for super admin:');
    console.log(`   Total applications in system: ${applications.length}`);
    
    // Enhance response with verification progress and ensure admissionUpdate is included
    const applicationsWithProgress = applications.map(app => {
      const appObj = app.toObject();
      
      // Debug logging for applications in 'Passed' status
      if (appObj.status === 'Passed') {
        console.log(`   ✓ Passed app: ${appObj.personalParticulars.firstName} ${appObj.personalParticulars.lastName}`);
        console.log(`     - admissionUpdate: ${appObj.admissionUpdate ? JSON.stringify(appObj.admissionUpdate.status) : 'UNDEFINED'}`);
        console.log(`     - registrationNumber: ${appObj.registrationNumber}`);
      }
      
      return {
        ...appObj,
        verificationProgress: AdminVerificationService.getVerificationProgress(app),
        canApprove: AdminVerificationService.canApprove(app),
      };
    });

    // Count applications by status
    const statusCounts = {
      submitted: applications.filter(a => a.status === 'Submitted').length,
      approved: applications.filter(a => a.status === 'Approved').length,
      passed: applications.filter(a => a.status === 'Passed').length,
      awaitingSuperAdmin: applications.filter(
        a => a.status === 'Passed' && a.admissionUpdate?.status !== 'admitted'
      ).length,
      admitted: applications.filter(a => a.admissionUpdate?.status === 'admitted').length,
    };
    
    console.log('   Status breakdown:', statusCounts);

    res.json(applicationsWithProgress);
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * Get applications awaiting super admin approval (certificate approval)
 * Returns applications with status 'Passed' and admissionUpdate.status != 'admitted'
 */
export const getApplicationsAwaitingApproval = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== Getting applications awaiting super admin approval ===');
    
    // Find all applications with status 'Passed' and admissionUpdate.status != 'admitted'
    const awaitingApprovalApps = await Application.find({
      status: 'Passed',
      $or: [
        { admissionUpdate: { $exists: false } },
        { 'admissionUpdate.status': { $ne: 'admitted' } }
      ]
    }).populate('userId', 'email').sort({ updatedAt: -1 });

    console.log(`Found ${awaitingApprovalApps.length} applications awaiting super admin approval`);
    
    // Enhance with detailed info for each application
    const enhancedApps = awaitingApprovalApps.map(app => {
      const appObj = app.toObject();
      return {
        ...appObj,
        admissionStatus: appObj.admissionUpdate?.status || 'pending',
        readyForApproval: !appObj.admissionUpdate || appObj.admissionUpdate.status !== 'admitted',
        verificationProgress: AdminVerificationService.getVerificationProgress(app),
      };
    });

    console.log('Response includes:', enhancedApps.length, 'applications');
    if (enhancedApps.length > 0) {
      console.log('First app details:', {
        name: enhancedApps[0].personalParticulars?.firstName,
        status: enhancedApps[0].status,
        admissionStatus: enhancedApps[0].admissionStatus,
        registrationNumber: enhancedApps[0].registrationNumber
      });
    }

    res.json(enhancedApps);
  } catch (error) {
    console.error('Error in getApplicationsAwaitingApproval:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * Update admin checklist for an application
 * Only admins can update the checklist
 */
export const updateApplicationChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { photo, m1Form, signature, trainingReport, projectReport, organogram, sponsorships, certificates, adminNotes } = req.body;

    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update checklist items if provided
    if (photo !== undefined) application.adminChecklist.photo = photo;
    if (m1Form !== undefined) application.adminChecklist.m1Form = m1Form;
    if (signature !== undefined) application.adminChecklist.signature = signature;
    if (trainingReport !== undefined) application.adminChecklist.trainingReport = trainingReport;
    if (projectReport !== undefined) application.adminChecklist.projectReport = projectReport;
    if (organogram !== undefined) application.adminChecklist.organogram = organogram;
    if (sponsorships !== undefined) application.adminChecklist.sponsorships = sponsorships;
    if (certificates !== undefined) application.adminChecklist.certificates = certificates;
    if (adminNotes !== undefined) application.adminNotes = adminNotes;

    await application.save();

    const progress = AdminVerificationService.getVerificationProgress(application);
    const report = AdminVerificationService.generateVerificationReport(application);

    res.json({
      message: 'Checklist updated successfully',
      application,
      progress,
      report,
      canApprove: AdminVerificationService.canApprove(application),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * Get detailed verification report for an application
 */
export const getVerificationReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const report = AdminVerificationService.generateVerificationReport(application);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * Get application preview for admin with userSummary and PDF links
 */
export const getApplicationPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Build file URLs
    let nationalIdUrl = null;
    let certificateUrls: string[] = [];

    if (application.uploadedFiles?.nationalIdPath) {
      nationalIdUrl = `/api/uploads/${application.uploadedFiles.nationalIdPath}`;
    }

    if (application.uploadedFiles?.certificatePaths) {
      certificateUrls = application.uploadedFiles.certificatePaths.map(
        (path: string) => `/api/uploads/${path}`
      );
    }

    res.json({
      id: application._id,
      userSummary: application.userSummary || 'No summary available',
      personalInfo: {
        firstName: application.personalParticulars?.firstName,
        lastName: application.personalParticulars?.lastName,
        email: application.personalParticulars?.email,
      },
      grade: application.chosenGrade,
      division: application.chosenSpecialistDivision,
      applicationFee: application.applicationFee,
      status: application.status,
      uploadedDocuments: {
        nationalId: nationalIdUrl,
        certificates: certificateUrls,
      },
      adminChecklist: application.adminChecklist,
      adminNotes: application.adminNotes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * Upload payment proof for an application
 */
export const uploadPaymentProof = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 [PAYMENT PROOF] File upload attempt');
    console.log('   Files received:', req.file ? 'Yes' : 'No');
    console.log('   File details:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : 'None');
    
    const { id } = req.params;

    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns the application
    if (application.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Get the uploaded file from req.file (single file upload)
    const paymentProofFile = req.file;
    
    if (!paymentProofFile) {
      console.error('❌ [PAYMENT PROOF] No file provided in request');
      return res.status(400).json({ message: 'No payment proof file provided' });
    }

    // Update payment proof in application
    application.paymentProof = {
      filePath: paymentProofFile.filename,
      uploadedAt: new Date(),
      verificationStatus: 'pending',
    };

    await application.save();
    console.log('✓ [PAYMENT PROOF] Upload successful:', paymentProofFile.filename);

    res.json({
      message: 'Payment proof uploaded successfully',
      paymentProof: {
        filePath: paymentProofFile.filename,
        uploadedAt: application.paymentProof.uploadedAt,
        verificationStatus: 'pending',
      }
    });
  } catch (error: any) {
    console.error('❌ [PAYMENT PROOF] Upload error:', error?.message || error);
    res.status(500).json({ message: 'Server error', error: error?.message });
  }
};

/**
 * Verify payment proof (admin only)
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verified, rejectionReason } = req.body;

    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!application.paymentProof) {
      return res.status(400).json({ message: 'No payment proof found for this application' });
    }

    // Update payment verification status
    application.paymentProof.verificationStatus = verified ? 'verified' : 'rejected';
    application.paymentProof.verifiedAt = new Date();
    application.paymentProof.verifiedBy = req.userId;
    
    if (!verified && rejectionReason) {
      application.paymentProof.rejectionReason = rejectionReason;
    }

    await application.save();

    // Send email notification to applicant
    if (verified) {
      await sendApplicationConfirmationEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        application._id.toString()
      );
    } else {
      await sendApplicationConfirmationEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        application._id.toString()
      );
    }

    res.json({
      message: verified ? 'Payment verified successfully' : 'Payment verification rejected',
      paymentProof: application.paymentProof
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Process payment (dummy payment)
export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body; // dummy payment method

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify applicant is the owner
    if (application.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Process dummy payment (always succeeds)
    application.paymentStatus = 'completed';
    application.paymentDate = new Date();
    application.status = 'Submitted'; // Move to Submitted status after payment
    await application.save();

    res.json({
      message: 'Payment processed successfully',
      paymentStatus: application.paymentStatus,
      paymentDate: application.paymentDate,
      applicationId: application._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Set manual grade and division by admin
export const setManualGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, division, notes } = req.body;

    console.log('setManualGrade called with ID:', id);
    console.log('User role:', req.userRole);

    // Verify admin user
    if (req.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can set manual grades' });
    }

    // Get admin info
    const admin = await User.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const application = await Application.findById(id);
    console.log('Application found:', !!application);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Set manual grade
    application.manualGrade = {
      grade,
      division,
      setBy: req.userId as any,
      setByEmail: admin.email,
      setByName: admin.email,
      setAt: new Date(),
      notes,
    };

    await application.save();

    // Log grade assignment to audit trail
    await AuditService.logGradeAssignment(
      req.userId as string,
      admin.email,
      admin.email,
      application.userId?.toString() || '',
      grade,
      division,
      req
    );

    res.json({
      message: 'Manual grade set successfully',
      manualGrade: application.manualGrade,
    });
  } catch (error) {
    console.error('Error in setManualGrade:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add admin approval for interview
export const addAdminApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify admin user
    if (req.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can approve interviews' });
    }

    // Get admin info
    const { User } = require('../models/User');
    const admin = await User.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if admin already approved
    const alreadyApproved = application.adminApprovals.some(
      (approval: any) => approval.adminId.toString() === req.userId
    );

    if (alreadyApproved) {
      return res.status(400).json({ message: 'Admin has already approved this application' });
    }

    // Add approval
    application.adminApprovals.push({
      adminId: req.userId as any,
      adminEmail: admin.email,
      adminName: admin.username,
      approvedAt: new Date(),
    });

    // If 3 approvals reached, set status to Interview Required and send email
    if (application.adminApprovals.length >= 3) {
      application.status = 'Interview Required';
      
      // Send interview invitation email
      await sendApplicationConfirmationEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        application._id.toString()
      );
    }

    await application.save();

    res.json({
      message: 'Approval added successfully',
      approvalsCount: application.adminApprovals.length,
      status: application.status,
      adminApprovals: application.adminApprovals,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Send interview notification to applicant
export const sendInterviewNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message: notificationMessage } = req.body;

    // Verify admin user
    if (req.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can send interview notifications' });
    }

    // Get admin info
    const { User } = require('../models/User');
    const admin = await User.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Set interview notification
    application.interviewNotification = {
      sentAt: new Date(),
      sentBy: req.userId as any,
      sentByEmail: admin.email,
      sentByName: admin.username,
      message: notificationMessage,
    };

    await application.save();

    // Send email to applicant with proper interview notification template
    try {
      await sendInterviewNotificationEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        notificationMessage
      );
    } catch (emailError) {
      console.error('Failed to send interview notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Interview notification sent successfully',
      interviewNotification: application.interviewNotification,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update sponsors and send emails
export const updateReferees = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sponsors } = req.body;

    if (!sponsors || !Array.isArray(sponsors)) {
      return res.status(400).json({ message: 'Sponsors must be an array' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the user owns this application
    if (application.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to update this application' });
    }

    // Create sponsors with tokens
    const processedSponsors = sponsors.map((sponsor: any) => ({
      sponsorName: sponsor.name || sponsor.sponsorName,
      sponsorEmail: sponsor.email || sponsor.sponsorEmail,
      appraisalToken: crypto.randomBytes(32).toString('hex'),
      isConfidential: true,
    }));

    // Update sponsors
    application.sponsors = processedSponsors;
    await application.save();

    // Send appraisal emails to new sponsors
    for (const sponsor of processedSponsors) {
      try {
        await sendSponsorAppraisalEmail({
          applicantName: `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
          applicantEmail: application.personalParticulars.email,
          sponsorName: sponsor.sponsorName,
          sponsorEmail: sponsor.sponsorEmail,
          applicationId: application._id.toString(),
          sponsorToken: sponsor.appraisalToken,
        });
      } catch (error) {
        console.error(`Error sending sponsor email to ${sponsor.sponsorEmail}:`, error);
        // Don't fail the update if sponsor email fails
      }
    }

    res.json({
      message: 'Sponsors updated and notifications sent successfully',
      sponsors: processedSponsors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get certificate data for passed interview applicant
export const getCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user owns this application or is admin
    if (application.userId.toString() !== req.userId && req.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if interview has been passed and registration number exists
    if (application.status !== 'Passed' || !application.registrationNumber) {
      return res.status(400).json({ 
        message: 'Certificate is only available after passing the interview' 
      });
    }

    const certificateData = {
      name: `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
      registrationNumber: application.registrationNumber,
      grade: application.chosenGrade,
      division: application.chosenSpecialistDivision,
      interviewPassedDate: application.interviewPassedDate,
      issuedDate: new Date(),
    };

    res.json(certificateData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update status to "Passed" and generate registration number
export const passInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('=== Pass Interview Request ===');
    console.log('Application ID:', id);
    console.log('User Role:', req.userRole);
    console.log('User ID:', req.userId);

    // Verify admin user
    if (req.userRole !== 'Admin') {
      console.error('Non-admin user attempted to pass interview:', req.userRole);
      return res.status(403).json({ message: 'Only admins can mark interviews as passed' });
    }

    const application = await Application.findById(id);
    if (!application) {
      console.error('Application not found:', id);
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('Current status:', application.status);
    console.log('Current registration number:', application.registrationNumber);

    // Check if not already passed
    if (application.status === 'Passed') {
      console.warn('Interview already marked as passed');
      return res.status(400).json({ message: 'Interview already marked as passed' });
    }

    // Generate registration number if not already generated
    if (!application.registrationNumber) {
      console.log('Generating registration number...');
      const newRegNumber = await RegistrationNumberService.generateZIERegistrationNumber();
      console.log('Generated registration number:', newRegNumber);
      application.registrationNumber = newRegNumber;
    }

    application.status = 'Passed';
    application.interviewPassedDate = new Date();

    // Get admin user info for tracking
    const { User } = require('../models/User');
    const admin = await User.findById(req.userId);
    
    // Set up certificate approval workflow (same as expatriates)
    // Status 'pending' indicates certificate awaiting super admin approval
    application.admissionUpdate = {
      status: 'pending',
      message: `Interview passed on ${new Date().toLocaleDateString()}. Awaiting certificate approval.`,
      confirmedAt: new Date(),
      confirmedByEmail: admin?.email || '',
      confirmedByName: admin?.username || 'Admin',
      confirmedBy: req.userId as any,
    };

    console.log('Saving application with status=Passed and registrationNumber=' + application.registrationNumber);
    await application.save();
    console.log('Application saved successfully');

    // Send email to applicant about passing interview
    try {
      console.log('Sending email to:', application.personalParticulars.email);
      const emailMessage = `Congratulations! You have passed your interview and will be registered as ZIE Professional Member with Registration Number: ${application.registrationNumber}. Your certificate is being prepared and will be available shortly.`;
      await sendStatusUpdateEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        'Passed',
        emailMessage
      );
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Failed to send interview pass email:', emailError);
    }

    console.log('Returning response with:', {
      status: application.status,
      registrationNumber: application.registrationNumber,
      interviewPassedDate: application.interviewPassedDate,
    });

    res.json({
      message: 'Interview marked as passed successfully',
      application: {
        _id: application._id,
        status: application.status,
        registrationNumber: application.registrationNumber,
        interviewPassedDate: application.interviewPassedDate,
      },
    });
  } catch (error) {
    console.error('Error in passInterview:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Confirm certificate assignment for passed applicants (admin only)
// Works for both expatriates and local applicants who passed interviews
export const confirmExpatriateAdmission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    console.log('=== Confirm Certificate Assignment Request ===');
    console.log('Application ID:', id);
    console.log('Status:', status);
    console.log('User Role:', req.userRole);
    console.log('User ID:', req.userId);

    // Verify admin or super admin user
    if (req.userRole !== 'Admin' && req.userRole !== 'SuperAdmin') {
      console.error('Non-admin user attempted to confirm admission:', req.userRole);
      return res.status(403).json({ message: 'Only admins can confirm certificates' });
    }

    // Validate status
    if (!['admitted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either "admitted" or "rejected"' });
    }

    const application = await Application.findById(id);
    if (!application) {
      console.error('Application not found:', id);
      return res.status(404).json({ message: 'Application not found' });
    }

    // Get admin user info
    const { User } = require('../models/User');
    const admin = await User.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    console.log('Updating certificate assignment status...');
    console.log('Admin selected status:', status);
    console.log('Caller role:', req.userRole);

    // For expatriates: Set status to 'Passed' to trigger super admin processing
    // (This marks that the admin has reviewed and approved for super admin consideration)
    if (application.applicationType === 'expatriate' && application.status !== 'Passed') {
      application.status = 'Passed';
      console.log('Setting expatriate application status to Passed for super admin review');
    }

    // Determine the actual admissionUpdate status based on caller role:
    // - If ADMIN confirms 'admitted': set to 'pending' (waiting for super admin to issue certificate)
    // - If SUPER ADMIN confirms 'admitted': set to 'admitted' (certificate approved)
    // - If anyone confirms 'rejected': set to 'rejected' (application rejected)
    let admissionUpdateStatus = status;
    if (status === 'admitted' && req.userRole !== 'SuperAdmin') {
      admissionUpdateStatus = 'pending'; // Admin is preparing for super admin review
      console.log('Admin confirmed - setting admissionUpdate.status to "pending" for super admin review');
    } else if (status === 'admitted' && req.userRole === 'SuperAdmin') {
      admissionUpdateStatus = 'admitted'; // Super admin is finalizing
      console.log('Super Admin approved - setting admissionUpdate.status to "admitted"');
    }

    // Generate registration number if not already generated and being admitted by super admin
    if (!application.registrationNumber && status === 'admitted' && req.userRole === 'SuperAdmin') {
      console.log('Generating registration number for super admin approved expatriate...');
      const RegistrationNumberService = require('../services/RegistrationNumberService');
      const newRegNumber = await RegistrationNumberService.generateZIERegistrationNumber();
      console.log('Generated registration number:', newRegNumber);
      application.registrationNumber = newRegNumber;
    }

    // Update admission/certificate status
    application.admissionUpdate = {
      status: admissionUpdateStatus,
      message: message || '',
      confirmedAt: new Date(),
      confirmedByEmail: admin.email,
      confirmedByName: admin.username,
      confirmedBy: req.userId as any,
    };

    // If rejected, revert status for reinterview
    if (status === 'rejected') {
      application.status = 'Rejected';
      // Log rejection to audit trail
      await AuditService.logRejection(
        req.userId as string,
        admin?.email || '',
        admin?.username,
        id,
        application.personalParticulars.email,
        message || 'Expatriate application rejected',
        req
      );
    }

    // Log admission/approval to audit trail
    if (status === 'admitted') {
      const actionType = req.userRole === 'SuperAdmin' ? 'CERTIFICATE_APPROVED' : 'CERTIFICATE_PREPARED';
      const actionDescription = req.userRole === 'SuperAdmin' 
        ? `Certificate approved for expatriate ${application.personalParticulars.email}. Registration Number: ${application.registrationNumber}`
        : `Expatriate application prepared for super admin approval: ${application.personalParticulars.email}`;
      
      await AuditService.logAction(
        req.userId as string,
        admin?.email || '',
        actionType as any,
        'Application',
        id,
        actionDescription,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          adminName: admin?.username,
        }
      );
    }

    await application.save();
    console.log('Certificate assignment status saved successfully');

    // Send status email to applicant
    try {
      const emailSubject = status === 'admitted' ? 'Certificate Ready' : 'Application Status Update';
      const emailMessage = status === 'admitted' 
        ? `Your certificate has been approved and is ready for collection. Your Registration Number is: ${application.registrationNumber}. ${message ? '\n\n' + message : ''}`
        : `Your application status has been updated. ${message ? '\n\n' + message : 'Please contact the administrator for more details.'}`;

      await sendStatusUpdateEmail(
        application.personalParticulars.email,
        `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
        emailSubject,
        emailMessage
      );
      console.log('Status email sent successfully');
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('Returning response with certificate assignment update');

    res.json({
      message: `Certificate assignment ${status} successfully`,
      application: {
        _id: application._id,
        status: application.status,
        registrationNumber: application.registrationNumber,
        admissionUpdate: application.admissionUpdate,
      },
    });
  } catch (error) {
    console.error('Error in confirmExpatriateAdmission:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * Send apprentice appraisal form to apprentice/trainee reference for expatriate applications
 */
export const sendApprenticeAppraisalForm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { apprenticeName, apprenticeEmail, applicantName, relationship } = req.body;

    console.log('=== Sending Apprentice Appraisal Form ===');
    console.log('Application ID:', id);
    console.log('Apprentice Email:', apprenticeEmail);
    console.log('Applicant Name:', applicantName);

    const application = await Application.findById(id);
    if (!application) {
      console.error('Application not found:', id);
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!application.apprenticeReferee) {
      return res.status(400).json({ message: 'No apprentice reference found for this application' });
    }

    // Generate token for form access if not already generated
    if (!application.apprenticeReferee.appraisalToken) {
      const crypto = require('crypto');
      application.apprenticeReferee.appraisalToken = crypto.randomBytes(32).toString('hex');
    }

    // Record that form was sent
    application.apprenticeReferee.formSentAt = new Date();
    await application.save();

    // Send email with appraisal form link (in real implementation, this would be a form link)
    try {
      const { sendSponsorAppraisalEmail } = require('../services/emailService');
      await sendSponsorAppraisalEmail({
        applicantName: applicantName,
        applicantEmail: application.personalParticulars.email,
        sponsorName: apprenticeName,
        sponsorEmail: apprenticeEmail,
        applicationId: application._id.toString(),
        sponsorToken: application.apprenticeReferee.appraisalToken,
        isApprenticeAppraisal: true,
      });
      console.log('✓ Apprentice appraisal form sent to:', apprenticeEmail);
    } catch (emailError) {
      console.error('Failed to send apprentice appraisal email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Appraisal form sent successfully',
      apprenticeEmail: apprenticeEmail,
      sentAt: new Date(),
    });
  } catch (error) {
    console.error('Error in sendApprenticeAppraisalForm:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
