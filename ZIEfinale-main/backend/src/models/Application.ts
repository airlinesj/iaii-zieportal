import mongoose, { Schema, Document } from 'mongoose';

export interface AdminChecklist {
  photo: boolean;
  m1Form: boolean;
  signature: boolean;
  trainingReport: boolean;
  projectReport: boolean;
  organogram: boolean;
  sponsorships: boolean;
  certificates: boolean;
}

export interface SponsorAppraisal {
  sponsorEmail: string;
  sponsorName: string;
  appraisalToken: string;
  responses?: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
    question8: string;
  };
  submittedAt?: Date;
  isConfidential: boolean;
}

export interface ApprenticeRefereeAppraisal {
  refereeEmail: string;
  refereeName: string;
  refereeRelationship: string;
  appraisalToken: string;
  formSentAt?: Date;
  responses?: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
    question8: string;
  };
  submittedAt?: Date;
}

export interface AdminApproval {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName: string;
  approvedAt: Date;
}

export interface RejectionInfo {
  rejectionTimestamp: Date;
  rejectionReason: string;
  rejectedBy: mongoose.Types.ObjectId;
  rejectedByEmail: string;
  rejectedByName: string;
  allowEditUntil: Date;  // 48 hours from rejection
}

export interface ManualGrade {
  grade: 'Student' | 'Graduate' | 'Technician' | 'Technologist' | 'Member' | 'Fellow';
  division: string;
  setBy: mongoose.Types.ObjectId;
  setByEmail: string;
  setByName: string;
  setAt: Date;
  notes?: string;
}

export interface InterviewNotification {
  sentAt: Date;
  sentBy: mongoose.Types.ObjectId;
  sentByEmail: string;
  sentByName: string;
  message?: string;
}

export interface AdmissionUpdate {
  status: 'pending' | 'admitted' | 'rejected';
  message?: string;
  confirmedAt: Date;
  confirmedBy: mongoose.Types.ObjectId;
  confirmedByEmail: string;
  confirmedByName: string;
  digitalSignatureAssignedAt?: Date;
  digitalSignatureAssignedBy?: mongoose.Types.ObjectId;
}

export interface IEducation {
  institution: string;
  qualification: string;
  year: number;
  major?: string;
}

export interface IExperience {
  company: string;
  position: string;
  startYear: number;
  endYear: number;
  description: string;
}

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  userSummary: string;
  applicationType: 'local' | 'expatriate';
  personalParticulars: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationalId: string;
    dateOfBirth: Date;
    nationality: string;
    professionalNumber?: string;
  };
  education: IEducation[];
  experience: IExperience[];
  chosenGrade: 'Student' | 'Graduate' | 'Technician' | 'Technologist' | 'Member' | 'Fellow';
  suggestedGrade: 'Student' | 'Graduate' | 'Technician' | 'Technologist' | 'Member' | 'Fellow';
  chosenSpecialistDivision: string;
  suggestedDivision: string;
  applicationFee: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Pending' | 'Interview Required' | 'Rejected' | 'Approved with Conditions' | 'Passed';
  registrationNumber?: string;      // ZIE Professional Registration Number (YYYY+4digit)
  interviewPassedDate?: Date;       // Date when interview was passed
  documents: {
    nationalIdCopy: string;
    certificates: string[];
    technicalReport?: string;
    organogram?: string;
  };
  uploadedFiles: {
    nationalIdPath?: string;         // Path to uploaded National ID PDF
    certificatePaths: string[];      // Paths to uploaded Certificate PDFs
    technicalReportPath?: string;    // Path to uploaded Technical Report PDF
    companyRecommendationLetterPath?: string;  // Path to company recommendation letter (expatriates only)
  };
  companyRecommendationLetter?: {
    filePath?: string;               // Path to uploaded company recommendation letter
    uploadedAt?: Date;               // When the letter was uploaded
  };
  paymentProof?: {
    filePath?: string;               // Path to uploaded payment proof file
    uploadedAt?: Date;               // When the proof was uploaded
    verificationStatus?: 'pending' | 'verified' | 'rejected';  // Admin verification status
    verifiedAt?: Date;               // When admin verified the payment
    verifiedBy?: string;             // Admin user who verified
    rejectionReason?: string;        // Reason for rejection if applicable
  };
  paymentStatus: 'pending' | 'completed' | 'failed';  // Payment status
  paymentDate?: Date;               // When payment was completed
  manualGrade?: ManualGrade;         // Admin manual grading
  adminApprovals: AdminApproval[];   // Array of approvals from different admins (need 3)
  interviewNotification?: InterviewNotification;  // Interview notification from admin
  admissionUpdate?: AdmissionUpdate;              // Expatriate admission status and message
  rejectionInfo?: RejectionInfo;     // Track rejection with 48-hour edit window
  sponsors: SponsorAppraisal[];
  apprenticeReferee?: ApprenticeRefereeAppraisal;  // Apprentice referee for expatriates
  adminChecklist: AdminChecklist;
  adminNotes: string;
  confidentialFlag: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userSummary: {
      type: String,
      default: '',
    },
    applicationType: {
      type: String,
      enum: ['local', 'expatriate'],
      required: true,
      default: 'local',
    },
    personalParticulars: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      nationalId: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      nationality: { type: String, required: true },
      professionalNumber: { type: String },
    },
    education: [
      {
        institution: String,
        qualification: String,
        year: Number,
        major: String,
      },
    ],
    experience: [
      {
        company: String,
        position: String,
        startYear: Number,
        endYear: Number,
        description: String,
      },
    ],
    chosenGrade: {
      type: String,
      enum: ['Student', 'Graduate', 'Technician', 'Technologist', 'Member', 'Fellow'],
      required: true,
    },
    suggestedGrade: {
      type: String,
      enum: ['Student', 'Graduate', 'Technician', 'Technologist', 'Member', 'Fellow'],
      default: 'Graduate',
    },
    chosenSpecialistDivision: {
      type: String,
      default: null,
    },
    suggestedDivision: {
      type: String,
      default: '',
    },
    applicationFee: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Pending', 'Interview Required', 'Rejected', 'Approved with Conditions', 'Passed'],
      default: 'Draft',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentDate: { type: Date },
    documents: {
      nationalIdCopy: String,
      certificates: [String],
      technicalReport: String,
      organogram: String,
    },
    uploadedFiles: {
      nationalIdPath: { type: String },
      certificatePaths: { type: [String], default: [] },
      technicalReportPath: { type: String },
      companyRecommendationLetterPath: { type: String },
    },
    companyRecommendationLetter: {
      filePath: { type: String },
      uploadedAt: { type: Date },
    },
    paymentProof: {
      filePath: { type: String },
      uploadedAt: { type: Date },
      verificationStatus: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      verifiedAt: { type: Date },
      verifiedBy: { type: String },
      rejectionReason: { type: String },
    },
    manualGrade: {
      grade: {
        type: String,
        enum: ['Student', 'Graduate', 'Technician', 'Technologist', 'Member', 'Fellow'],
      },
      division: String,
      setBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      setByEmail: String,
      setByName: String,
      setAt: Date,
      notes: String,
    },
    adminApprovals: [
      {
        adminId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        adminEmail: String,
        adminName: String,
        approvedAt: { type: Date, default: Date.now },
      },
    ],
    interviewNotification: {
      sentAt: Date,
      sentBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sentByEmail: String,
      sentByName: String,
      message: String,
    },
    admissionUpdate: {
      status: {
        type: String,
        enum: ['pending', 'admitted', 'rejected'],
        default: 'pending'
      },
      message: String,
      confirmedAt: Date,
      confirmedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      confirmedByEmail: String,
      confirmedByName: String,
      digitalSignatureAssignedAt: Date,
      digitalSignatureAssignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    sponsors: [
      {
        sponsorEmail: String,
        sponsorName: String,
        appraisalToken: String,
        responses: {
          question1: String,
          question2: String,
          question3: String,
          question4: String,
          question5: String,
          question6: String,
          question7: String,
          question8: String,
        },
        submittedAt: Date,
        isConfidential: { type: Boolean, default: true },
      },
    ],
    apprenticeReferee: {
      refereeEmail: String,
      refereeName: String,
      refereeRelationship: String,
      appraisalToken: String,
      responses: {
        question1: String,
        question2: String,
        question3: String,
        question4: String,
        question5: String,
        question6: String,
        question7: String,
        question8: String,
      },
      submittedAt: Date,
    },
    adminChecklist: {
      photo: { type: Boolean, default: false },
      m1Form: { type: Boolean, default: false },
      signature: { type: Boolean, default: false },
      trainingReport: { type: Boolean, default: false },
      projectReport: { type: Boolean, default: false },
      organogram: { type: Boolean, default: false },
      sponsorships: { type: Boolean, default: false },
      certificates: { type: Boolean, default: false },
    },
    rejectionInfo: {
      rejectionTimestamp: { type: Date },
      rejectionReason: { type: String },
      rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectedByEmail: { type: String },
      rejectedByName: { type: String },
      allowEditUntil: { type: Date },  // 48 hours from rejection
    },
    adminNotes: { type: String, default: '' },
    confidentialFlag: { type: Boolean, default: false },
    registrationNumber: { type: String, sparse: true, unique: true },  // Unique registration number
    interviewPassedDate: { type: Date },  // Date when interview was passed
  },
  { timestamps: true }
);

// Pre-save middleware to generate user summary
applicationSchema.pre('save', function (next) {
  if (this.personalParticulars && this.chosenGrade && this.chosenSpecialistDivision) {
    const { firstName, lastName } = this.personalParticulars;
    this.userSummary = `${firstName} ${lastName} - Applicant for ${this.chosenGrade} Grade in ${this.chosenSpecialistDivision} Division`;
  }
  next();
});

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
