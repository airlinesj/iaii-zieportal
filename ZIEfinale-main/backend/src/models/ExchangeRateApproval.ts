import mongoose, { Schema, Document } from 'mongoose';

export interface IExchangeRateApproval extends Document {
  requestedBy: mongoose.Types.ObjectId; // Admin who requested
  requestedRate: number; // The new rate proposed
  currentRate: number; // The rate at time of request
  reason: string; // Why the rate needs to be updated
  status: 'pending' | 'approved' | 'rejected'; // Approval status
  approvedBy?: mongoose.Types.ObjectId; // SuperAdmin who approved/rejected
  approvalComment?: string; // Approval notes
  approvalDate?: Date; // When it was approved/rejected
  appliedDate?: Date; // When it was applied to system
  createdAt: Date;
  updatedAt: Date;
}

const exchangeRateApprovalSchema = new Schema<IExchangeRateApproval>(
  {
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      description: 'Admin who requested the exchange rate update',
    },
    requestedRate: {
      type: Number,
      required: true,
      min: 0,
      description: 'The new exchange rate being proposed',
    },
    currentRate: {
      type: Number,
      required: true,
      description: 'The exchange rate at time of request',
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
      description: 'Reason for the rate update request',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      description: 'Current approval status',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      description: 'SuperAdmin who approved/rejected the request',
    },
    approvalComment: {
      type: String,
      maxlength: 500,
      description: 'Notes from the approver',
    },
    approvalDate: {
      type: Date,
      description: 'When the request was approved/rejected',
    },
    appliedDate: {
      type: Date,
      description: 'When the approved rate was applied to the system',
    },
  },
  {
    timestamps: true,
    collection: 'exchange_rate_approvals',
  }
);

// Index for queries
exchangeRateApprovalSchema.index({ status: 1, createdAt: -1 });
exchangeRateApprovalSchema.index({ requestedBy: 1 });
exchangeRateApprovalSchema.index({ approvedBy: 1 });

export default mongoose.model<IExchangeRateApproval>('ExchangeRateApproval', exchangeRateApprovalSchema);
