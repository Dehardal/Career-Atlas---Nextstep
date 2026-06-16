import mongoose, { Schema, Document } from 'mongoose';

export enum NodeType {
  Qualification = 'QUALIFICATION',
  Board = 'BOARD',
  Stream = 'STREAM',
  SubjectCombination = 'SUBJECT_COMBINATION',
  Exam = 'EXAM',
  Degree = 'DEGREE',
  Occupation = 'OCCUPATION',
  Skill = 'SKILL',
  Institute = 'INSTITUTE',
}

// Custom URL Validation Regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

// Base Interface
export interface INode extends Document {
  name: string;
  type: NodeType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base Schema
const BaseNodeSchema = new Schema<INode>({
  name: { 
    type: String, 
    required: [true, 'Node name is required'], 
    trim: true,
    minlength: [2, 'Node name must be at least 2 characters'],
    maxlength: [150, 'Node name cannot exceed 150 characters']
  },
  type: { 
    type: String, 
    required: [true, 'Node type is required'], 
    enum: {
      values: Object.values(NodeType),
      message: '{VALUE} is not a valid node type'
    }
  },
  description: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
}, { 
  discriminatorKey: 'type', 
  timestamps: true 
});

// INDEXES for BaseNode
// 1. Text index for full-text search across nodes
BaseNodeSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 2 } });
// 2. Index on type to optimize type-specific queries
BaseNodeSchema.index({ type: 1 });

export const NodeModel = mongoose.model<INode>('Node', BaseNodeSchema);

// --- DISCRIMINATOR SCHEMAS & MODELS ---

// 1. Qualification Node
export interface IQualificationNode extends INode {
  level: number;
}
export const QualificationNodeModel = NodeModel.discriminator<IQualificationNode>(
  NodeType.Qualification,
  new Schema({
    level: { 
      type: Number, 
      required: [true, 'Qualification level is required'],
      min: [1, 'Level cannot be less than 1'],
      max: [20, 'Level cannot exceed 20']
    }
  })
);

// 2. Board Node
export interface IBoardNode extends INode {
  acronym: string;
  region: 'NATIONAL' | 'STATE' | 'INTERNATIONAL';
}
export const BoardNodeModel = NodeModel.discriminator<IBoardNode>(
  NodeType.Board,
  new Schema({
    acronym: { 
      type: String, 
      required: [true, 'Board acronym is required'], 
      trim: true,
      uppercase: true,
      minlength: [2, 'Acronym must be at least 2 characters'],
      maxlength: [15, 'Acronym cannot exceed 15 characters']
    },
    region: { 
      type: String, 
      required: [true, 'Board region is required'], 
      enum: {
        values: ['NATIONAL', 'STATE', 'INTERNATIONAL'],
        message: '{VALUE} is not a valid board region'
      }
    }
  })
);

// 3. Stream Node
export interface IStreamNode extends INode {}
export const StreamNodeModel = NodeModel.discriminator<IStreamNode>(
  NodeType.Stream,
  new Schema({})
);

// 4. Subject Combination Node
export interface ISubjectCombinationNode extends INode {
  subjects: string[];
}
export const SubjectCombinationNodeModel = NodeModel.discriminator<ISubjectCombinationNode>(
  NodeType.SubjectCombination,
  new Schema({
    subjects: { 
      type: [String], 
      required: [true, 'Subjects list is required'],
      validate: {
        validator: function(v: string[]) {
          return Array.isArray(v) && v.length > 0 && v.every(s => s.trim().length > 0);
        },
        message: 'Subject combination must contain at least one valid subject name'
      }
    }
  })
);

// 5. Exam Node (replaces EntranceExam)
export interface IExamNode extends INode {
  conductingBody: string;
  website?: string;
  frequency: 'ANNUAL' | 'BI_ANNUAL' | 'ON_DEMAND' | 'OTHER';
  eligibilityDescription?: string;
  streamRequirements?: string[];
  subjectRequirements?: string[];
  ageMin?: number;
  ageMax?: number;
  maxAttempts?: number;
}
export const ExamNodeModel = NodeModel.discriminator<IExamNode>(
  NodeType.Exam,
  new Schema({
    conductingBody: { 
      type: String, 
      required: [true, 'Conducting body is required'],
      trim: true,
      minlength: [2, 'Conducting body name must be at least 2 characters'],
      maxlength: [100, 'Conducting body name cannot exceed 100 characters']
    },
    website: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v?: string) {
          if (!v) return true;
          return URL_REGEX.test(v);
        },
        message: 'Please provide a valid website URL'
      }
    },
    frequency: { 
      type: String, 
      default: 'ANNUAL',
      enum: {
        values: ['ANNUAL', 'BI_ANNUAL', 'ON_DEMAND', 'OTHER'],
        message: '{VALUE} is not a valid exam frequency'
      }
    },
    eligibilityDescription: {
      type: String,
      trim: true,
      default: ''
    },
    streamRequirements: {
      type: [String],
      default: []
    },
    subjectRequirements: {
      type: [String],
      default: []
    },
    ageMin: {
      type: Number,
      min: [0, 'Minimum age cannot be negative']
    },
    ageMax: {
      type: Number,
      min: [0, 'Maximum age cannot be negative']
    },
    maxAttempts: {
      type: Number,
      min: [1, 'Minimum attempts must be at least 1']
    }
  })
);

// 6. Degree Node
export interface IDegreeNode extends INode {
  durationYears: number;
  level: 'UG' | 'PG' | 'DIPLOMA' | 'DOCTORATE' | 'CERTIFICATE';
}
export const DegreeNodeModel = NodeModel.discriminator<IDegreeNode>(
  NodeType.Degree,
  new Schema({
    durationYears: { 
      type: Number, 
      required: [true, 'Degree duration is required'],
      min: [0.5, 'Duration cannot be less than 0.5 years'],
      max: [8, 'Duration cannot exceed 8 years']
    },
    level: { 
      type: String, 
      required: [true, 'Degree level is required'], 
      enum: {
        values: ['UG', 'PG', 'DIPLOMA', 'DOCTORATE', 'CERTIFICATE'],
        message: '{VALUE} is not a valid degree level'
      }
    }
  })
);

// 7. Occupation Node
export interface IOccupationNode extends INode {
  averageSalaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  growthRate: 'HIGH' | 'MEDIUM' | 'LOW';
  sector: string;
}
const OccupationSchema = new Schema({
  averageSalaryRange: {
    min: { 
      type: Number, 
      required: [true, 'Minimum salary is required'], 
      min: [0, 'Salary cannot be negative'] 
    },
    max: { 
      type: Number, 
      required: [true, 'Maximum salary is required'],
      validate: {
        validator: function(this: any, val: number) {
          const minVal = this.get ? this.get('averageSalaryRange.min') : this.averageSalaryRange?.min;
          return minVal === undefined || val >= minVal;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: { 
      type: String, 
      default: 'INR', 
      trim: true, 
      uppercase: true,
      minlength: 3,
      maxlength: 3
    }
  },
  growthRate: { 
    type: String, 
    required: [true, 'Growth rate is required'], 
    enum: {
      values: ['HIGH', 'MEDIUM', 'LOW'],
      message: '{VALUE} is not a valid growth rate'
    }
  },
  sector: { 
    type: String, 
    required: [true, 'Industry sector is required'], 
    trim: true,
    minlength: [2, 'Sector name must be at least 2 characters'],
    maxlength: [100, 'Sector name cannot exceed 100 characters']
  }
});
export const OccupationNodeModel = NodeModel.discriminator<IOccupationNode>(
  NodeType.Occupation,
  OccupationSchema
);

// 8. Skill Node
export interface ISkillNode extends INode {
  category: 'TECHNICAL' | 'SOFT' | 'DOMAIN_SPECIFIC';
}
export const SkillNodeModel = NodeModel.discriminator<ISkillNode>(
  NodeType.Skill,
  new Schema({
    category: { 
      type: String, 
      required: [true, 'Skill category is required'], 
      enum: {
        values: ['TECHNICAL', 'SOFT', 'DOMAIN_SPECIFIC'],
        message: '{VALUE} is not a valid skill category'
      }
    }
  })
);

// 9. Institute Node
export interface IInstituteNode extends INode {
  location: {
    city: string;
    state: string;
  };
  nirfRanking?: number;
  ownership: 'GOVERNMENT' | 'PRIVATE' | 'SEMI_GOVERNMENT';
  category?: string;
}
export const InstituteNodeModel = NodeModel.discriminator<IInstituteNode>(
  NodeType.Institute,
  new Schema({
    location: {
      city: { 
        type: String, 
        required: [true, 'City is required'], 
        trim: true,
        minlength: [2, 'City name must be at least 2 characters']
      },
      state: { 
        type: String, 
        required: [true, 'State is required'], 
        trim: true,
        minlength: [2, 'State name must be at least 2 characters']
      }
    },
    nirfRanking: { 
      type: Number,
      min: [1, 'NIRF Ranking must be at least 1'],
      max: [1000, 'NIRF Ranking cannot exceed 1000']
    },
    ownership: { 
      type: String, 
      required: [true, 'Ownership classification is required'], 
      enum: {
        values: ['GOVERNMENT', 'PRIVATE', 'SEMI_GOVERNMENT'],
        message: '{VALUE} is not a valid ownership category'
      }
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    }
  })
);
