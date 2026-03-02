import mongoose, { Schema, Document } from 'mongoose';

export interface IMembershipGrade extends Document {
  gradeName: 'Student' | 'Graduate' | 'Technician' | 'Technologist' | 'Member' | 'Fellow';
  minYearsExperience: number;
  requiresDiploma: boolean;
  requiresTechnicalReport: boolean;
  description: string;
  baseFee: number;
}

const membershipGradeSchema = new Schema<IMembershipGrade>(
  {
    gradeName: {
      type: String,
      enum: ['Student', 'Graduate', 'Technician', 'Technologist', 'Member', 'Fellow'],
      unique: true,
      required: true,
    },
    minYearsExperience: {
      type: Number,
      default: 0,
    },
    requiresDiploma: {
      type: Boolean,
      default: false,
    },
    requiresTechnicalReport: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
    baseFee: {
      type: Number,
      required: true,
    },
  }
);

// Initialize default grades
const defaultGrades = [
  {
    gradeName: 'Student',
    minYearsExperience: 0,
    requiresDiploma: false,
    requiresTechnicalReport: false,
    description: 'Student member of ZIE',
    baseFee: 45,
  },
  {
    gradeName: 'Graduate',
    minYearsExperience: 0,
    requiresDiploma: false,
    requiresTechnicalReport: false,
    description: 'Graduate engineer',
    baseFee: 50,
  },
  {
    gradeName: 'Technician',
    minYearsExperience: 3,
    requiresDiploma: true,
    requiresTechnicalReport: false,
    description: 'Engineering technician',
    baseFee: 45,
  },
  {
    gradeName: 'Technologist',
    minYearsExperience: 3,
    requiresDiploma: true,
    requiresTechnicalReport: false,
    description: 'Engineering technologist',
    baseFee: 50,
  },
  {
    gradeName: 'Member',
    minYearsExperience: 5,
    requiresDiploma: false,
    requiresTechnicalReport: true,
    description: 'Full member of ZIE',
    baseFee: 60,
  },
  {
    gradeName: 'Fellow',
    minYearsExperience: 10,
    requiresDiploma: false,
    requiresTechnicalReport: true,
    description: 'Fellow of ZIE',
    baseFee: 60,
  },
];

export const MembershipGrade = mongoose.model<IMembershipGrade>('MembershipGrade', membershipGradeSchema);

export async function initializeDefaultGrades() {
  try {
    for (const grade of defaultGrades) {
      await MembershipGrade.findOneAndUpdate({ gradeName: grade.gradeName }, grade, {
        upsert: true,
      });
    }
  } catch (error) {
    console.error('Error initializing membership grades:', error);
  }
}
