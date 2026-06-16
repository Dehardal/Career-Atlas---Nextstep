import mongoose from 'mongoose';
import { getOrCreateSharedNodes, ensureConnection, ISharedNodes } from './seed-helper';
import { 
  ExamNodeModel, 
  DegreeNodeModel,
  OccupationNodeModel, 
  SkillNodeModel, 
  InstituteNodeModel, 
  NodeType
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

export const seedGovernment = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Government Pathway...');

  // 1. Exams
  const upsc = await ExamNodeModel.findOneAndUpdate(
    { name: 'UPSC Civil Services Exam', type: NodeType.Exam },
    { 
      conductingBody: 'Union Public Service Commission', 
      website: 'https://upsc.gov.in', 
      frequency: 'ANNUAL',
      description: 'Nationwide competitive exam conducted for recruitment to civil services (IAS, IPS, IFS)' 
    },
    { upsert: true, new: true }
  );

  const sscCgl = await ExamNodeModel.findOneAndUpdate(
    { name: 'SSC CGL', type: NodeType.Exam },
    { 
      conductingBody: 'Staff Selection Commission', 
      website: 'https://ssc.gov.in', 
      frequency: 'ANNUAL',
      description: 'Combined Graduate Level examination for recruitment in Group B and C government departments' 
    },
    { upsert: true, new: true }
  );

  // 2. Occupations
  const iasOfficer = await OccupationNodeModel.findOneAndUpdate(
    { name: 'IAS Officer (Indian Administrative Service)', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 700000, max: 2000000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Public Administration',
      description: 'Senior bureaucrat executing government policies, heading departments, and maintaining law & order' 
    },
    { upsert: true, new: true }
  );

  const itInspector = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Income Tax Inspector', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 600000, max: 1500000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Public Administration',
      description: 'Government officer responsible for assessing and auditing tax returns' 
    },
    { upsert: true, new: true }
  );

  // Link Exams to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: upsc._id, toNode: iasOfficer._id, type: RelationshipType.LeadsTo },
    { metadata: { description: 'Requires clearing UPSC Preliminary, Mains, and Interview phases' } },
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: sscCgl._id, toNode: itInspector._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // Link all undergraduate degrees to UPSC and SSC CGL
  const degrees = await DegreeNodeModel.find({});
  for (const degree of degrees) {
    await RelationshipModel.findOneAndUpdate(
      { fromNode: degree._id, toNode: upsc._id, type: RelationshipType.EligibleFor },
      { metadata: { description: 'Graduation from a recognized university' } },
      { upsert: true }
    );
    await RelationshipModel.findOneAndUpdate(
      { fromNode: degree._id, toNode: sscCgl._id, type: RelationshipType.EligibleFor },
      { metadata: { description: 'Graduation from a recognized university' } },
      { upsert: true }
    );
  }

  // 3. Skills
  const governance = await SkillNodeModel.findOneAndUpdate(
    { name: 'Public Administration & Policy Analysis', type: NodeType.Skill },
    { category: 'DOMAIN_SPECIFIC', description: 'Understanding structure of administrative laws, fiscal policy, and governance structures' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: iasOfficer._id, toNode: governance._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 4. Training Institutes
  const lbsnaa = await InstituteNodeModel.findOneAndUpdate(
    { name: 'Lal Bahadur Shastri National Academy of Administration', type: NodeType.Institute },
    { 
      location: { city: 'Mussoorie', state: 'Uttarakhand' },
      ownership: 'GOVERNMENT',
      description: 'Premier training institute for civil services in India' 
    },
    { upsert: true, new: true }
  );

  // Link Institute to the occupation (cops/officers trained there)
  await RelationshipModel.findOneAndUpdate(
    { fromNode: lbsnaa._id, toNode: iasOfficer._id, type: RelationshipType.Offers },
    { metadata: { description: 'Provides foundation and professional course training to recruits' } },
    { upsert: true }
  );

  console.log('Government Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedGovernment(shared);
      await mongoose.connection.close();
      console.log('Standalone Government Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Government Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
