import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  exchangeRateUSDToZWG: number;
  exchangeRateLastUpdatedAt: Date;
  exchangeRateLastUpdatedBy: mongoose.Types.ObjectId;
  isManuallySet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    exchangeRateUSDToZWG: {
      type: Number,
      default: 26.5,
      required: true,
      min: 0,
      description: 'Current USD to ZWG exchange rate',
    },
    exchangeRateLastUpdatedAt: {
      type: Date,
      default: new Date(),
    },
    exchangeRateLastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      description: 'Admin who last updated the exchange rate',
    },
    isManuallySet: {
      type: Boolean,
      default: false,
      description: 'Whether the current rate was manually set by admin',
    },
  },
  {
    timestamps: true,
    collection: 'system_settings',
  }
);

export default mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
