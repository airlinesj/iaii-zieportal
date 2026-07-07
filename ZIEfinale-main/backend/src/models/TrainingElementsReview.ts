import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingElementsReview extends Document {
  // Reference to CPD Application
  cpdApplicationId: mongoose.Schema.Types.ObjectId;

  // Applicant Information
  applicantName: string; // Supervisor name from CPD app
  company: string; // Company name from CPD app
  email: string; // Contact email

  // Training Elements Selected (ZIE Codes)
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

  // Course Information (for context)
  courseTitle: string;
  courseDuration: number; // in days

  // Review Status
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_clarification';

  // Admin Review
  reviewedBy?: mongoose.Schema.Types.ObjectId; // Reference to Admin user
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Metadata
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trainingElementsReviewSchema = new Schema<ITrainingElementsReview>(
  {
    // Reference to CPD Application
    cpdApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'CpdApplication',
      required: true,
      index: true
    },

    // Applicant Information
    applicantName: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    // Training Elements Selected (ZIE Codes)
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

    // Course Information (for context)
    courseTitle: { type: String, required: true, trim: true },
    courseDuration: { type: Number, required: true },

    // Review Status
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_clarification'],
      default: 'pending',
      required: true
    },

    // Admin Review
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedByName: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null },

    // Metadata
    submittedAt: { type: Date, default: Date.now, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'trainingElementsReview'
  }
);

// Create indexes for better query performance
trainingElementsReviewSchema.index({ cpdApplicationId: 1 });
trainingElementsReviewSchema.index({ reviewStatus: 1 });
trainingElementsReviewSchema.index({ submittedAt: -1 });

export const TrainingElementsReview = mongoose.model<ITrainingElementsReview>(
  'TrainingElementsReview',
  trainingElementsReviewSchema
);
