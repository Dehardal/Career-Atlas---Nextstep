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

export const seedArts = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Arts Pathway...');

  // 1. Subject Combinations
  const humanitiesCore = await SubjectCombinationNodeModel.findOneAndUpdate(
    { name: 'History, Political Science, and English', type: NodeType.SubjectCombination },
    { 
      description: 'Core arts subjects for administrative services, journalism, and academic study',
      subjects: ['History', 'Political Science', 'English Literature'] 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.artsStream._id, toNode: humanitiesCore._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  // 2. Exams
  const cuetArts = await ExamNodeModel.findOneAndUpdate(
    { name: 'CUET UG (Arts & Humanities)', type: NodeType.Exam },
    { 
      conductingBody: 'NTA', 
      website: 'https://cuet.samarth.ac.in', 
      frequency: 'ANNUAL',
      description: 'Common entrance exam for undergraduate admission to liberal arts and humanities programs' 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: humanitiesCore._id, toNode: cuetArts._id, type: RelationshipType.EligibleFor },
    {},
    { upsert: true }
  );

  // 3. Degrees
  const baEnglish = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.A. (Hons) in English', type: NodeType.Degree },
    { 
      durationYears: 3, 
      level: 'UG',
      description: 'Bachelor of Arts in English Literature focusing on critical reading, theory, and writing skills' 
    },
    { upsert: true, new: true }
  );

  const baHistory = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.A. (Hons) in History', type: NodeType.Degree },
    { 
      durationYears: 3, 
      level: 'UG',
      description: 'Bachelor of Arts in History covering world history, archaeology, and historiography' 
    },
    { upsert: true, new: true }
  );

  const baPolSci = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.A. (Hons) in Political Science', type: NodeType.Degree },
    { 
      durationYears: 3, 
      level: 'UG',
      description: 'Bachelor of Arts in Political Science covering political theory, international relations, and public policy' 
    },
    { upsert: true, new: true }
  );

  // Link Exams to Degrees
  await RelationshipModel.findOneAndUpdate(
    { fromNode: cuetArts._id, toNode: baEnglish._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: cuetArts._id, toNode: baHistory._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: cuetArts._id, toNode: baPolSci._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 4. Occupations
  const writer = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Content Writer / Editor', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 400000, max: 1200000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Media & Communications',
      description: 'Create engaging copies, write articles, check drafts, and manage content platforms' 
    },
    { upsert: true, new: true }
  );

  const historian = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Historian / Research Analyst', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 400000, max: 1200000, currency: 'INR' },
      growthRate: 'LOW',
      sector: 'Education & Research',
      description: 'Academic researcher specializing in historical archives and history analysis' 
    },
    { upsert: true, new: true }
  );

  const polAnalyst = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Political Analyst', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 500000, max: 1600000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Media & Research',
      description: 'Specialist analyzing political systems, election trends, and public policy parameters' 
    },
    { upsert: true, new: true }
  );

  // Link Degrees to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: baEnglish._id, toNode: writer._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: baHistory._id, toNode: historian._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: baPolSci._id, toNode: polAnalyst._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 5. Skills
  const copyWriting = await SkillNodeModel.findOneAndUpdate(
    { name: 'Creative Writing & Copyediting', type: NodeType.Skill },
    { category: 'SOFT', description: 'Grammar review, storytelling, search engine optimization writing style' },
    { upsert: true, new: true }
  );

  const historyResearch = await SkillNodeModel.findOneAndUpdate(
    { name: 'Historical Research & Archival Analysis', type: NodeType.Skill },
    { category: 'DOMAIN_SPECIFIC', description: 'Analyzing primary historical sources, archival research, and qualitative analysis' },
    { upsert: true, new: true }
  );

  const policyAnalysis = await SkillNodeModel.findOneAndUpdate(
    { name: 'Policy Analysis & Psephology', type: NodeType.Skill },
    { category: 'TECHNICAL', description: 'Analyzing political manifestos, public policy impact, and election trends' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: writer._id, toNode: copyWriting._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: historian._id, toNode: historyResearch._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: polAnalyst._id, toNode: policyAnalysis._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 6. Institutes
  const stStephens = await InstituteNodeModel.findOneAndUpdate(
    { name: "St. Stephen's College Delhi", type: NodeType.Institute },
    { 
      location: { city: 'Delhi', state: 'Delhi' },
      ownership: 'GOVERNMENT',
      description: 'Premier constituent college of Delhi University renowned for humanities education' 
    },
    { upsert: true, new: true }
  );

  // Link Institutes to degrees they offer
  await RelationshipModel.findOneAndUpdate(
    { fromNode: stStephens._id, toNode: baEnglish._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: stStephens._id, toNode: baHistory._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: stStephens._id, toNode: baPolSci._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: stStephens._id, toNode: cuetArts._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  console.log('Arts Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedArts(shared);
      await mongoose.connection.close();
      console.log('Standalone Arts Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Arts Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
