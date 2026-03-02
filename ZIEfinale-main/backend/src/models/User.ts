import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  role: 'Applicant' | 'Admin' | 'SuperAdmin';
  accountType: 'applicant' | 'admin' | 'audit' | 'superadmin';
  country: string;
  applicationType: 'local' | 'expatriate';
  userClassification: 'local_applicant' | 'expatriate_applicant' | 'admin' | 'superadmin' | 'audit';
  canAccessAuditTrail: boolean;
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  locked: boolean;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  getClassification(): string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Applicant', 'Admin', 'SuperAdmin'],
      default: 'Applicant',
    },
    country: {
      type: String,
      sparse: true,
    },
    applicationType: {
      type: String,
      enum: ['local', 'expatriate'],
      sparse: true,
    },
    userClassification: {
      type: String,
      enum: ['local_applicant', 'expatriate_applicant', 'admin', 'superadmin'],
      required: true,
      default: 'local_applicant',
    },
    canAccessAuditTrail: {
      type: Boolean,
      default: false,
      description: 'Whether this admin can access the audit trail and analytics',
    },
    accountType: {
      type: String,
      enum: ['applicant', 'admin', 'audit', 'superadmin'],
      default: 'applicant',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: {
      type: Date,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    lockedUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

// Method to get user classification
userSchema.methods.getClassification = function (): string {
  if (this.role === 'SuperAdmin') return 'superadmin';
  if (this.role === 'Admin') return 'admin';
  if (this.applicationType === 'expatriate') return 'expatriate_applicant';
  return 'local_applicant';
};

export const User = mongoose.model<IUser>('User', userSchema);
