import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  nodeId: mongoose.Types.ObjectId;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required for bookmarking'] 
  },
  nodeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Node', 
    required: [true, 'Node ID is required for bookmarking'] 
  },
  notes: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [250, 'Bookmark notes cannot exceed 250 characters']
  }
}, { 
  timestamps: true,
  collection: 'bookmarks'
});

// --- INDEXES FOR BOOKMARKS ---
// 1. Unique compound index to prevent duplicate bookmarks of the same node by the same user
BookmarkSchema.index({ userId: 1, nodeId: 1 }, { unique: true });
// 2. Index on nodeId to count favorites/popularity of specific nodes
BookmarkSchema.index({ nodeId: 1 });

export const BookmarkModel = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
