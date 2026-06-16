import mongoose, { Schema, Document } from 'mongoose';

export interface IInstituteCourseMapping extends Document {
  institute: mongoose.Types.ObjectId;
  degree: mongoose.Types.ObjectId;
  entranceExam?: mongoose.Types.ObjectId;
  specialization: string;
  fees?: number;
  seats?: number;
  placementStats?: {
    averageSalary?: number;
    placementRate?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const InstituteCourseMappingSchema = new Schema<IInstituteCourseMapping>({
  institute: {
    type: Schema.Types.ObjectId,
    ref: 'Node',
    required: [true, 'Institute node reference is required']
  },
  degree: {
    type: Schema.Types.ObjectId,
    ref: 'Node',
    required: [true, 'Degree node reference is required']
  },
  entranceExam: {
    type: Schema.Types.ObjectId,
    ref: 'Node',
    default: undefined
  },
  specialization: {
    type: String,
    required: [true, 'Specialization name is required'],
    trim: true,
    maxlength: [150, 'Specialization name cannot exceed 150 characters']
  },
  fees: {
    type: Number,
    min: [0, 'Estimated annual fees cannot be negative']
  },
  seats: {
    type: Number,
    min: [0, 'Available seats cannot be negative']
  },
  placementStats: {
    averageSalary: {
      type: Number,
      min: [0, 'Average salary package cannot be negative']
    },
    placementRate: {
      type: Number,
      min: [0, 'Placement rate percentage cannot be less than 0'],
      max: [100, 'Placement rate percentage cannot exceed 100']
    }
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate course mappings (same degree + specialization per institute)
InstituteCourseMappingSchema.index({ institute: 1, degree: 1, specialization: 1 }, { unique: true });

// Individual field indexes for fast search filtering
InstituteCourseMappingSchema.index({ degree: 1 });
InstituteCourseMappingSchema.index({ institute: 1 });
InstituteCourseMappingSchema.index({ entranceExam: 1 });

export const InstituteCourseMappingModel = mongoose.model<IInstituteCourseMapping>('InstituteCourseMapping', InstituteCourseMappingSchema);
export default InstituteCourseMappingModel;
