import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName?: string;
  action: 'LOGIN' | 'LOGOUT' | 'APPROVE_APPLICATION' | 'REJECT_APPLICATION' | 'ASSIGN_GRADE' | 'UPDATE_APPLICATION' | 'VIEW_APPLICANT' | 'GENERATE_CERTIFICATE' | 'EXCHANGE_RATE_UPDATE' | 'MEMBERSHIP_FEE_UPDATED' | 'ANNUAL_FEE_CYCLE_COMPLETED' | 'OTHER';
  resourceType: string; // 'Application', 'User', 'Certificate', 'ExchangeRate', etc.
  resourceId: mongoose.Types.ObjectId | string;
  description: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  createdAt: Date;
  timestamp?: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      index: true,
    },
    adminName: {
      type: String,
    },
    action: {
      type: String,
      enum: [
        'LOGIN',
        'LOGOUT',
        'APPROVE_APPLICATION',
        'REJECT_APPLICATION',
        'ASSIGN_GRADE',
        'UPDATE_APPLICATION',
        'VIEW_APPLICANT',
        'GENERATE_CERTIFICATE',
        'EXCHANGE_RATE_UPDATE',
        'MEMBERSHIP_FEE_UPDATED',
        'ANNUAL_FEE_CYCLE_COMPLETED',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create index for queries by date
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
