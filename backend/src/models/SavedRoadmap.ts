import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedRoadmap extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  nodeSequence: mongoose.Types.ObjectId[];
  relationshipSequence: mongoose.Types.ObjectId[];
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedRoadmapSchema = new Schema<ISavedRoadmap>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required for a saved roadmap'] 
  },
  title: { 
    type: String, 
    required: [true, 'Roadmap title is required'], 
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  nodeSequence: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Node' }],
    required: [true, 'Node sequence is required'],
    validate: {
      validator: function(v: mongoose.Types.ObjectId[]) {
        return Array.isArray(v) && v.length >= 2;
      },
      message: 'A saved roadmap must contain a path of at least 2 nodes'
    }
  },
  relationshipSequence: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Relationship' }],
    required: [true, 'Relationship sequence is required'],
    validate: {
      validator: function(this: ISavedRoadmap, v: mongoose.Types.ObjectId[]) {
        // A sequence of N nodes is connected by N-1 relationships
        return Array.isArray(v) && v.length === this.nodeSequence.length - 1;
      },
      message: 'Relationship sequence length must be exactly nodes count minus one'
    }
  },
  isCustom: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true,
  collection: 'savedRoadmaps'
});

// --- INDEXES FOR SAVED ROADMAPS ---
// 1. Index on userId to retrieve a user's roadmaps quickly
SavedRoadmapSchema.index({ userId: 1 });

export const SavedRoadmapModel = mongoose.model<ISavedRoadmap>('SavedRoadmap', SavedRoadmapSchema);
