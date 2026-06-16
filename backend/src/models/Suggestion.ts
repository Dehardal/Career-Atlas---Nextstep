import mongoose, { Schema, Document } from 'mongoose';

export enum SuggestionType {
  Qualification = 'QUALIFICATION',
  Stream = 'STREAM',
  SubjectCombination = 'SUBJECT_COMBINATION',
  Degree = 'DEGREE',
  Occupation = 'OCCUPATION',
  Exam = 'EXAM',
  Institute = 'INSTITUTE',
  Other = 'OTHER',
}

export enum SuggestionStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

export interface ISuggestion extends Document {
  visitorName: string;
  visitorEmail: string;
  type: SuggestionType;
  title: string;
  description: string;
  status: SuggestionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    visitorEmail: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please fill a valid email address',
      },
    },
    type: {
      type: String,
      required: [true, 'Opportunity type is required'],
      enum: {
        values: Object.values(SuggestionType),
        message: '{VALUE} is not a valid opportunity type',
      },
      default: SuggestionType.Other,
    },
    title: {
      type: String,
      required: [true, 'Opportunity title/name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description/details of the opportunity are required'],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(SuggestionStatus),
        message: '{VALUE} is not a valid status',
      },
      default: SuggestionStatus.Pending,
    },
  },
  {
    timestamps: true,
    collection: 'suggestions',
  }
);

// Indexes
SuggestionSchema.index({ status: 1 });
SuggestionSchema.index({ createdAt: -1 });

export const SuggestionModel = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
export default SuggestionModel;
