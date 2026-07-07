import mongoose, { Schema, Document } from 'mongoose';

export interface AdminApprovalInfo {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedByEmail?: string;
  approvedByName?: string;
  rejectionReason?: string;
}

export interface PaymentDetails {
  amount: number;
  currency: string; // 'ZWL' for locals, 'USD' for expatriates
  paymentStatus: 'pending' | 'initiated' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  paymentMethod?: string; // 'stripe', 'paypal', etc.
  paidAt?: Date;
  paymentProof?: {
    filePath: string;
    uploadedAt: Date;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verifiedAt?: Date;
    verifiedBy?: mongoose.Types.ObjectId;
  };
}

export interface ICpdApplication extends Document {
  // Organization Details
  companyName: string;
  physicalAddress: string;
  phoneNumber: string;
  email: string;
  natureOfBusiness: string;

  // Supervisor Details
  supervisorName: string;
  supervisorEmail: string;
  supervisorCell: string;
  supervisorJobTitle: string;
  supervisorQualifications: string;

  // Course Information
  courseTitle: string;
  courseOverview: string;
  courseDuration: number; // in days
  targetedParticipantsCount: number;
  targetedParticipantsDescription: string;
  careerPlan: string;
  internalAssessmentMethods: string;
  feedbackMechanisms: string;

  // Training Facilitators
  trainers: Array<{
    name: string;
    qualifications: string;
    position: string;
  }>;

  // Training Mode
  trainingMode: {
    sandwich: boolean;
    undergraduate: boolean;
    postgraduate: boolean;
  };

  // Training Elements (ZIE Codes)
  trainingElements: {
    A: boolean;
    B: boolean;
    C1: boolean;
    C2: boolean;
    C3: boolean;
    C4: boolean;
    C5: boolean;
    C6: boolean;
    C7: boolean;
    C8: boolean;
    HS: boolean;
    CS: boolean;
    IAM: boolean;
  };

  // File References
  curriculumFile?: {
    filename: string;
    path: string;
    uploadedAt: Date;
  };
  profilesFile?: {
    filename: string;
    path: string;
    uploadedAt: Date;
  };
  paymentFile?: {
    filename: string;
    path: string;
    uploadedAt: Date;
  };

  // Estimated Fee
  estimatedFee: number;

  // Application Status & Admin Fields
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Resubmission Required' | 'Payment Pending' | 'Payment Completed';
  
  // Admin Approval & Payment Fields
  adminApproval?: AdminApprovalInfo;
  paymentDetails?: PaymentDetails;

  // Official Use Only (Admin Only Fields)
  officialUseOnly?: {
    assessmentDecision?: string;
    assessmentNotes?: string;
    ceoSignature?: string;
    chairpersonSignature?: string;
    approvalDate?: Date;
    assessedBy?: mongoose.Schema.Types.ObjectId; // Reference to Admin user
  };

  // User Classification for fee calculation
  applicationType?: 'local' | 'expatriate';

  // Payment Currency Selection
  paymentCurrency?: 'ZWL' | 'USD';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

const cpdApplicationSchema = new Schema<ICpdApplication>(
  {
    // Organization Details
    companyName: { type: String, required: true, trim: true },
    physicalAddress: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    natureOfBusiness: { type: String, required: true },

    // Supervisor Details
    supervisorName: { type: String, required: true, trim: true },
    supervisorEmail: { type: String, required: true, lowercase: true, trim: true },
    supervisorCell: { type: String, required: true },
    supervisorJobTitle: { type: String, required: true, trim: true },
    supervisorQualifications: { type: String, required: true },

    // Course Information
    courseTitle: { type: String, required: true, trim: true },
    courseOverview: { type: String, required: true },
    courseDuration: { type: Number, required: true, min: 0 },
    targetedParticipantsCount: { type: Number, required: true, min: 1 },
    targetedParticipantsDescription: { type: String, required: true },
    careerPlan: { type: String, required: true },
    internalAssessmentMethods: { type: String, required: true },
    feedbackMechanisms: { type: String, required: true },

    // Training Facilitators
    trainers: [
      {
        name: { type: String, required: true, trim: true },
        qualifications: { type: String, required: true },
        position: { type: String, required: true, trim: true }
      }
    ],

    // Training Mode
    trainingMode: {
      sandwich: { type: Boolean, default: false },
      undergraduate: { type: Boolean, default: false },
      postgraduate: { type: Boolean, default: false }
    },

    // Training Elements (ZIE Codes)
    trainingElements: {
      A: { type: Boolean, default: false },
      B: { type: Boolean, default: false },
      C1: { type: Boolean, default: false },
      C2: { type: Boolean, default: false },
      C3: { type: Boolean, default: false },
      C4: { type: Boolean, default: false },
      C5: { type: Boolean, default: false },
      C6: { type: Boolean, default: false },
      C7: { type: Boolean, default: false },
      C8: { type: Boolean, default: false },
      HS: { type: Boolean, default: false },
      CS: { type: Boolean, default: false },
      IAM: { type: Boolean, default: false }
    },

    // File References
    curriculumFile: {
      filename: { type: String },
      path: { type: String },
      uploadedAt: { type: Date }
    },
    profilesFile: {
      filename: { type: String },
      path: { type: String },
      uploadedAt: { type: Date }
    },
    paymentFile: {
      filename: { type: String },
      path: { type: String },
      uploadedAt: { type: Date }
    },

    // Estimated Fee
    estimatedFee: { type: Number, required: true, default: 0 },

    // Application Status
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Resubmission Required', 'Payment Pending', 'Payment Completed'],
      default: 'Pending'
    },

    // Admin Approval Fields
    adminApproval: {
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedAt: { type: Date },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedByEmail: { type: String },
      approvedByName: { type: String },
      rejectionReason: { type: String }
    },

    // Payment Details
    paymentDetails: {
      amount: { type: Number },
      currency: { type: String, enum: ['ZWL', 'USD'], default: 'ZWL' },
      paymentStatus: {
        type: String,
        enum: ['pending', 'initiated', 'completed', 'failed', 'cancelled'],
        default: 'pending'
      },
      transactionId: { type: String },
      paymentMethod: { type: String },
      paidAt: { type: Date },
      paymentProof: {
        filePath: { type: String },
        uploadedAt: { type: Date },
        verificationStatus: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending'
        },
        verifiedAt: { type: Date },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    },

    // User Classification for fee calculation
    applicationType: {
      type: String,
      enum: ['local', 'expatriate'],
      sparse: true
    },

    // Payment Currency Selection
    paymentCurrency: {
      type: String,
      enum: ['ZWL', 'USD'],
      default: 'ZWL'
    },

    // Official Use Only (Admin Only Fields)
    officialUseOnly: {
      assessmentDecision: { type: String },
      assessmentNotes: { type: String },
      ceoSignature: { type: String },
      chairpersonSignature: { type: String },
      approvalDate: { type: Date },
      assessedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },

    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster looking up applications
cpdApplicationSchema.index({ email: 1 });
cpdApplicationSchema.index({ status: 1 });
cpdApplicationSchema.index({ 'adminApproval.approvalStatus': 1 });
cpdApplicationSchema.index({ 'paymentDetails.paymentStatus': 1 });
cpdApplicationSchema.index({ createdAt: -1 });
cpdApplicationSchema.index({ companyName: 'text', courseTitle: 'text' });

export const CpdApplication = mongoose.model<ICpdApplication>('CpdApplication', cpdApplicationSchema);
