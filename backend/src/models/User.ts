import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  Student = 'STUDENT',
  Counselor = 'COUNSELOR',
  Admin = 'ADMIN',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string; // Storing hashed password in production
  role: UserRole;
  profile: {
    currentQualification?: mongoose.Types.ObjectId;
    targetOccupation?: mongoose.Types.ObjectId;
    completedSkills: mongoose.Types.ObjectId[];
    preferredBoard?: mongoose.Types.ObjectId;
    interests: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: [true, 'User name is required'], 
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email address is required'], 
    unique: true, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please fill a valid email address'
    }
  },
  passwordHash: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [60, 'Password hash length is invalid'] // Hashed using bcrypt or similar resulting in length ~60
  },
  role: { 
    type: String, 
    required: [true, 'User role is required'],
    enum: {
      values: Object.values(UserRole),
      message: '{VALUE} is not a valid user role'
    },
    default: UserRole.Student
  },
  profile: {
    currentQualification: { 
      type: Schema.Types.ObjectId, 
      ref: 'Node' 
    },
    targetOccupation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Node' 
    },
    completedSkills: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Node' 
    }],
    preferredBoard: { 
      type: Schema.Types.ObjectId, 
      ref: 'Node' 
    },
    interests: {
      type: [String],
      default: []
    }
  }
}, { 
  timestamps: true,
  collection: 'users'
});

// --- INDEXES FOR USERS ---
// 1. Unique email index (crucial for auth lookup speed)
UserSchema.index({ email: 1 }, { unique: true });
// 2. Index on targetOccupation to optimize career statistics query
UserSchema.index({ 'profile.targetOccupation': 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
