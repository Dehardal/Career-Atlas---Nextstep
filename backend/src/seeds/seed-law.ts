import mongoose from 'mongoose';
import { getOrCreateSharedNodes, ensureConnection, ISharedNodes } from './seed-helper';
import { 
  SubjectCombinationNodeModel, 
  ExamNodeModel, 
  DegreeNodeModel, 
  OccupationNodeModel, 
  SkillNodeModel, 
  InstituteNodeModel, 
  NodeType
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

export const seedLaw = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Law Pathway...');

  // 1. Link Class 10 to Arts Stream
  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class10._id, toNode: shared.artsStream._id, type: RelationshipType.CanChoose },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.artsStream._id, toNode: shared.class12._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 2. Subject Combinations
  const humanitiesLegal = await SubjectCombinationNodeModel.findOneAndUpdate(
    { name: 'Humanities with Legal Studies', type: NodeType.SubjectCombination },
    { 
      description: 'History, Political Science, Legal Studies, and Economics combination',
      subjects: ['History', 'Political Science', 'Legal Studies', 'Economics'] 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.artsStream._id, toNode: humanitiesLegal._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  // 3. Exams
  const clat = await ExamNodeModel.findOneAndUpdate(
    { name: 'CLAT UG', type: NodeType.Exam },
    { 
      conductingBody: 'Consortium of National Law Universities', 
      website: 'https://consortiumofnlus.ac.in', 
      frequency: 'ANNUAL',
      description: 'Common Law Admission Test for undergraduate programs in national law universities' 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: humanitiesLegal._id, toNode: clat._id, type: RelationshipType.EligibleFor },
    {},
    { upsert: true }
  );

  // 4. Degrees
  const ballb = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.A. LLB (Hons)', type: NodeType.Degree },
    { 
      durationYears: 5, 
      level: 'UG',
      description: 'Five-year integrated dual degree in Bachelor of Arts and Bachelor of Laws' 
    },
    { upsert: true, new: true }
  );

  // Link Exams to Degrees
  await RelationshipModel.findOneAndUpdate(
    { fromNode: clat._id, toNode: ballb._id, type: RelationshipType.LeadsTo },
    { metadata: { description: 'Requires clearing CLAT UG cutoff ranking' } },
    { upsert: true }
  );

  // 5. Occupations
  const corporateLawyer = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Corporate Lawyer', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 800000, max: 2400000, currency: 'INR' },
      growthRate: 'HIGH',
      sector: 'Legal Services',
      description: 'Counsel corporations on legal rights, obligations, and corporate governance structures' 
    },
    { upsert: true, new: true }
  );

  // Link Degrees to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: ballb._id, toNode: corporateLawyer._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 6. Skills
  const legalReasoning = await SkillNodeModel.findOneAndUpdate(
    { name: 'Legal Reasoning & Drafting', type: NodeType.Skill },
    { category: 'TECHNICAL', description: 'Analyzing legal principles and drafting briefs, contracts, and deeds' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: corporateLawyer._id, toNode: legalReasoning._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 7. Institutes
  const nlsiu = await InstituteNodeModel.findOneAndUpdate(
    { name: 'National Law School of India University Bangalore', type: NodeType.Institute },
    { 
      location: { city: 'Bengaluru', state: 'Karnataka' },
      nirfRanking: 1, // NLSIU consistently ranks #1 in NIRF Law listings
      ownership: 'GOVERNMENT',
      description: 'Premier national law university in Bangalore' 
    },
    { upsert: true, new: true }
  );

  // Link Institutes to degrees they offer
  await RelationshipModel.findOneAndUpdate(
    { fromNode: nlsiu._id, toNode: ballb._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  console.log('Law Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedLaw(shared);
      await mongoose.connection.close();
      console.log('Standalone Law Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Law Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
