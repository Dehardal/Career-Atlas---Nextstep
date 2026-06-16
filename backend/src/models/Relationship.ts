import mongoose, { Schema, Document } from 'mongoose';

export enum RelationshipType {
  CanChoose = 'CAN_CHOOSE',
  EligibleFor = 'ELIGIBLE_FOR',
  Requires = 'REQUIRES',
  LeadsTo = 'LEADS_TO',
  Offers = 'OFFERS',
  RelatedTo = 'RELATED_TO',
}

export interface IRelationship extends Document {
  fromNode: mongoose.Types.ObjectId;
  toNode: mongoose.Types.ObjectId;
  type: RelationshipType;
  metadata: {
    minimumPercentage?: number;
    mandatorySubjects?: string[];
    feesEstimated?: number;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RelationshipSchema = new Schema<IRelationship>({
  fromNode: { 
    type: Schema.Types.ObjectId, 
    ref: 'Node', 
    required: [true, 'Source node (fromNode) is required'] 
  },
  toNode: { 
    type: Schema.Types.ObjectId, 
    ref: 'Node', 
    required: [true, 'Destination node (toNode) is required'] 
  },
  type: { 
    type: String, 
    required: [true, 'Relationship type is required'], 
    enum: {
      values: Object.values(RelationshipType),
      message: '{VALUE} is not a valid relationship type'
    }
  },
  metadata: {
    minimumPercentage: { 
      type: Number,
      min: [0, 'Percentage cannot be less than 0'],
      max: [100, 'Percentage cannot exceed 100']
    },
    mandatorySubjects: { 
      type: [String],
      default: undefined
    },
    feesEstimated: { 
      type: Number,
      min: [0, 'Estimated fees cannot be negative']
    },
    description: { 
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  }
}, { 
  timestamps: true,
  collection: 'relationships' // Explicitly sets the collection name
});

// --- CRITICAL GRAPH TRAVERSAL INDEXES ---
// 1. Compound index for outgoing traversals: fromNode -> next node
RelationshipSchema.index({ fromNode: 1, type: 1 });
// 2. Compound index for incoming traversals: toNode -> previous node
RelationshipSchema.index({ toNode: 1, type: 1 });
// 3. Unique constraint to ensure relationship uniqueness between two specific nodes
RelationshipSchema.index({ fromNode: 1, toNode: 1, type: 1 }, { unique: true });

export const RelationshipModel = mongoose.model<IRelationship>('Relationship', RelationshipSchema);
