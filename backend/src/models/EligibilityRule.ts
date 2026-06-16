import mongoose, { Schema, Document } from 'mongoose';

export enum RuleType {
  Allow = 'ALLOW',
  Block = 'BLOCK',
}

export interface IEligibilityRule extends Document {
  sourceNode: mongoose.Types.ObjectId;
  targetNode: mongoose.Types.ObjectId;
  ruleType: RuleType;
  mandatorySubjects: string[];
  preferredSubjects: string[];
  entranceExamRequirements: mongoose.Types.ObjectId[];
  minimumQualification?: mongoose.Types.ObjectId;
  exceptions: string;
  createdAt: Date;
  updatedAt: Date;
}

const EligibilityRuleSchema = new Schema<IEligibilityRule>({
  sourceNode: { 
    type: Schema.Types.ObjectId, 
    ref: 'Node', 
    required: [true, 'Source node is required'] 
  },
  targetNode: { 
    type: Schema.Types.ObjectId, 
    ref: 'Node', 
    required: [true, 'Target node is required'] 
  },
  ruleType: { 
    type: String, 
    required: [true, 'Rule type is required'],
    enum: {
      values: Object.values(RuleType),
      message: '{VALUE} is not a valid rule type'
    },
    default: RuleType.Allow
  },
  mandatorySubjects: { 
    type: [String], 
    default: [] 
  },
  preferredSubjects: { 
    type: [String], 
    default: [] 
  },
  entranceExamRequirements: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Node',
    default: []
  }],
  minimumQualification: { 
    type: Schema.Types.ObjectId, 
    ref: 'Node' 
  },
  exceptions: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true 
});

// Compound unique index to prevent duplicate rules for the same node pair
EligibilityRuleSchema.index({ sourceNode: 1, targetNode: 1 }, { unique: true });

export const EligibilityRuleModel = mongoose.model<IEligibilityRule>('EligibilityRule', EligibilityRuleSchema);
export default EligibilityRuleModel;
